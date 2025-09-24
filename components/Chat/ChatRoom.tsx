import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert, Image, Dimensions } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Network from 'expo-network';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTabBar } from '@/context/TabBarContext';
import { router } from 'expo-router';
import { MessageSquare, Clock, Users, ArrowLeft, Send, Hash, Shield, Paperclip, Camera, File, X, LineChart, FlaskConical, Microscope, Book, BookOpen, Globe, Code, BarChart3, Calculator, Atom, Crown, Copy as CopyIcon, CornerUpLeft, OctagonAlert } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import { uploadChatMediaAsync } from '@/lib/storage';
import { sendPushNotification } from '@/lib/notifications';
import { Swipeable } from 'react-native-gesture-handler';

type Message = Database['public']['Tables']['chat_messages']['Row'];
type Room = Database['public']['Tables']['chat_rooms']['Row'];
type LocalMessage = Message & { _status?: 'sending' | 'sent' | 'error' };

interface ChatRoomProps {
  roomId: string;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hideTabBar, showTabBar } = useTabBar();
  const { sendMessage, fetchMessages } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null, pushToken?: string | null}}>({}); 
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{uri: string, type: 'image' | 'file', name: string} | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [profilePhotoModal, setProfilePhotoModal] = useState<{visible: boolean, uri: string | null, userName: string, userId: string}>({
    visible: false,
    uri: null,
    userName: '',
    userId: ''
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [typingUserNames, setTypingUserNames] = useState<string[]>([]);
  const [contextMenu, setContextMenu] = useState<{visible: boolean; message?: Message; x?: number; y?: number}>({ visible: false });
  const [pinnedMessageId, setPinnedMessageId] = useState<string | null>(null);
  const [reactionPicker, setReactionPicker] = useState<{visible: boolean; messageId?: string}>({ visible: false });
  const [isOnline, setIsOnline] = useState(true);
  const [replyTo, setReplyTo] = useState<{ messageId: string; author: string; preview: string } | null>(null);
  const [messageReactions, setMessageReactions] = useState<Record<string, Record<string, string[]>>>({});

  function renderHeaderIcon() {
    if (!room) return <Hash size={16} color={theme.colors.success} />;
    if (room.is_private) {
      if (room.name === 'Eğitim Koçum') {
        return <Crown size={16} color={theme.colors.medal.gold} />;
      }
      return <Shield size={16} color={theme.colors.primary[400]} />;
    }
    const name = (room.name || '').toLowerCase();
    if (name.includes('matematik') || name.includes('geometri')) {
      return <LineChart size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('fizik')) {
      return <Atom size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('kimya')) {
      return <FlaskConical size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('biyoloji')) {
      return <Microscope size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('tarih')) {
      return <Book size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('coğrafya') || name.includes('cografya')) {
      return <Globe size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('edebiyat') || name.includes('türk') || name.includes('turk') || name.includes('dil')) {
      return <BookOpen size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('ingilizce') || name.includes('english')) {
      return <Globe size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('program') || name.includes('yazılım') || name.includes('yazilim') || name.includes('bilgisayar') || name.includes('kod')) {
      return <Code size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('ekonomi') || name.includes('finans')) {
      return <BarChart3 size={16} color={theme.colors.primary[400]} />;
    }
    if (name.includes('aritmetik') || name.includes('hesap') || name.includes('sayı') || name.includes('sayi')) {
      return <Calculator size={16} color={theme.colors.primary[400]} />;
    }
    return <Hash size={16} color={theme.colors.success} />;
  }

  function getMessagePreview(m: Message): string {
    try {
      const data = JSON.parse(m.content);
      if (data?.type === 'text' && typeof data.text === 'string' && data.text.trim().length) {
        return data.text.trim();
      }
      if (data?.type === 'image') return 'Fotoğraf';
      if (data?.type === 'file') return data?.name ? `Dosya: ${data.name}` : 'Dosya';
    } catch {}
    return (m.content || '').toString();
  }

  function clampContextMenuPosition(x: number, y: number) {
    const { width: W, height: H } = Dimensions.get('window');
    const MENU_W = 280; // yaklaşık menü genişliği (emoji bar + liste)
    const MENU_H = 220; // yaklaşık menü yüksekliği
    const EDGE = 12;
    const INPUT_SAFE = 100; // giriş alanından yukarıda tutmak için alt güvenli alan
    let px = Math.max(EDGE, Math.min(x - MENU_W / 2, W - MENU_W - EDGE));
    let py = Math.max(80, Math.min(y - MENU_H, H - MENU_H - INPUT_SAFE));
    return { px, py };
  }

  useEffect(() => {
    console.log('ChatRoom: Hiding tab bar');
    hideTabBar();
    
    // Cleanup function to show tab bar when component unmounts
    return () => {
      console.log('ChatRoom: Showing tab bar');
      showTabBar();
    };
  }, [hideTabBar, showTabBar]);

  useEffect(() => {
    loadMessages();
    loadRoomDetails();
    loadUsers();
    
    // Subscribe to real-time updates - her subscription için unique channel adı
    const messagesChannelName = `messages_${roomId}_${Math.random().toString(36).substr(2, 9)}`;
    const membersChannelName = `members_${roomId}_${Math.random().toString(36).substr(2, 9)}`;
    const photosChannelName = `photos_${Math.random().toString(36).substr(2, 9)}`;
    const presenceChannelName = `presence_${roomId}`;
    
    // Messages subscription
    const messagesSubscription = supabase
      .channel(messagesChannelName)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        console.log('New message received:', payload.new);
        const newMessage = payload.new as Message;
        
        setMessages(prev => {
          // Prevent duplicate messages
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });
        
        setTimeout(() => scrollToBottom(), 50);
      })
      .subscribe();

    // Members subscription
    const membersSubscription = supabase
      .channel(membersChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        loadRoomDetails();
      })
      .subscribe();

    // Photos subscription
    const photosSubscription = supabase
      .channel(photosChannelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos'
      }, () => {
        loadUsers();
      })
      .subscribe();

    // Presence channel (typing / online)
    if (user?.id) {
      const presenceChannel = supabase.channel(presenceChannelName, {
        config: { presence: { key: user.id } },
      });

      presenceChannel
        .on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState() as Record<string, any[]>;
          const typingNames: string[] = [];
          Object.values(state).forEach((arr) => {
            arr.forEach((meta: any) => {
              if (meta.typing && meta.userId !== user.id) {
                const u = users[meta.userId];
                if (u?.name) typingNames.push(u.name);
              }
            });
          });
          setTypingUserNames(typingNames);
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ userId: user.id, typing: false, online_at: new Date().toISOString() });
          }
        });

      presenceChannelRef.current = presenceChannel;
    }
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up subscriptions');
      messagesSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      photosSubscription.unsubscribe();
      if (presenceChannelRef.current) {
        presenceChannelRef.current.untrack();
        presenceChannelRef.current.unsubscribe();
        presenceChannelRef.current = null;
      }
    };
  }, [roomId]);

  useEffect(() => {
    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    };
    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  const loadUsers = async () => {
    try {
      // Fetch user profiles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name, push_token');
      
      if (userError) {
        console.error('User data error:', userError);
        return;
      }

      // Fetch profile photos
      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) {
        console.error('Photo data error:', photoError);
        // Continue without photos
      }

      // Create user map with photos - with proper type checking
      if (userData && Array.isArray(userData)) {
        const userMap = userData.reduce((acc: any, user: any) => {
          if (user && user.id) {
            // Handle photos safely
            let userPhoto = null;
            if (photoData && Array.isArray(photoData)) {
              const photo = photoData.find((p: any) => p && p.user_id === user.id);
              if (photo && typeof photo === 'object' && 'photo_url' in photo) {
                userPhoto = (photo as any).photo_url;
              }
            }
            
            acc[user.id] = { 
              name: user.name || 'Anonim Kullanıcı',
              photoUrl: userPhoto,
              pushToken: user.push_token || null,
            };
          }
          return acc;
        }, {});

        setUsers(userMap);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const notifyMentionsIfAny = async (text: string) => {
    try {
      if (!text || !room) return;
      const mentionRegex = /@([\p{L}0-9_.-]{2,30})/giu; // Unicode letters + digits
      const found = text.matchAll(mentionRegex);
      const names = Array.from(found).map(m => (m[1] || '').toLowerCase());
      if (!names.length) return;

      // Build lookup by normalized name
      const entries = Object.entries(users);
      for (const [, info] of entries) {
        if (!info?.name || !info.pushToken) continue;
        const norm = info.name.toLowerCase();
        if (names.includes(norm)) {
          await sendPushNotification(
            info.pushToken,
            room.name || 'Sohbet',
            `${user?.email || 'Bir kullanıcı'} sizden bahsetti: ${text.slice(0, 80)}`,
            { roomId }
          );
        }
      }
    } catch (e) {
      console.warn('Mention bildiriminde sorun:', e);
    }
  };

  const setTyping = (isTyping: boolean) => {
    if (!presenceChannelRef.current || !user?.id) return;
    presenceChannelRef.current.track({ userId: user.id, typing: isTyping, online_at: new Date().toISOString() });
  };

  const loadRoomDetails = async () => {
    try {
      const { data: roomData, error: roomError } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (roomError) {
        console.error('Room data error:', roomError);
        return;
      }

      if (roomData && typeof roomData === 'object' && 'id' in roomData) {
        setRoom(roomData as any);
      }

      const { count, error: countError } = await supabase
        .from('chat_room_members')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', roomId);

      if (countError) {
        console.error('Member count error:', countError);
      } else {
        setMemberCount(count || 0);
      }
    } catch (error) {
      console.error('Error loading room details:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const data = await fetchMessages(roomId);
      if (data && Array.isArray(data)) {
        setMessages(data as Message[]);
      } else {
        console.log('No messages or invalid data format');
        setMessages([]);
      }
      setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false }); // Disable animation for faster scroll
    }
  };

  const deleteMessageById = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .eq('id', messageId)
        .eq('room_id', roomId)
        .eq('user_id', user?.id || '');
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Mesaj silme hatası:', err);
      Alert.alert('Hata', 'Mesaj silinirken bir sorun oluştu.');
    }
  };

  const confirmDeleteMessage = (message: Message) => {
    if (!user || message.user_id !== user.id) return;
    setContextMenu({ visible: false });
    Alert.alert(
      'Mesajı Sil',
      'Bu mesajı silmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => deleteMessageById(message.id) },
      ]
    );
  };

  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf seçmek için galeri erişim izni gerekli');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // iOS/Android yerleşik editör kullan
        allowsMultipleSelection: false,
        quality: 1.0, // Maksimum kalite
        aspect: undefined, // Serbest aspect ratio
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `image_${Date.now()}.jpg`;
        
        setAttachmentMenuVisible(false);
        
        // Orijinal çözünürlükte kaydet
        setSelectedMedia({
          uri: asset.uri,
          type: 'image',
          name: fileName
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu');
    }
  };

  const takePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Fotoğraf çekmek için kamera erişim izni gerekli');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true, // iOS/Android yerleşik editör kullan
        allowsMultipleSelection: false,
        quality: 1.0, // Maksimum kalite
        aspect: undefined, // Serbest aspect ratio
        presentationStyle: ImagePicker.UIImagePickerPresentationStyle.FULL_SCREEN,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const fileName = asset.fileName || `photo_${Date.now()}.jpg`;
        
        setAttachmentMenuVisible(false);
        
        // Orijinal çözünürlükte kaydet
        setSelectedMedia({
          uri: asset.uri,
          type: 'image',
          name: fileName
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setSelectedMedia({
          uri: asset.uri,
          type: 'file',
          name: asset.name
        });
        setAttachmentMenuVisible(false);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu');
    }
  };

  const removeSelectedMedia = () => {
    setSelectedMedia(null);
  };

  const uploadMedia = async (mediaUri: string, fileName: string): Promise<string> => {
    if (!user?.id) return mediaUri;
    try {
      const publicUrl = await uploadChatMediaAsync({
        uri: mediaUri,
        fileName,
        userId: user.id,
        roomId,
      });
      return publicUrl;
    } catch (error) {
      console.error('Storage upload error, fallback to local uri:', error);
      return mediaUri;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedMedia) return;
    
    // Stop typing state shortly after send
    setTyping(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const tempMessage = newMessage.trim();
    let mediaUrl = null;
    
    try {
      setLoading(true);
      
      // Eğer medya seçilmişse önce yükle
      if (selectedMedia) {
        mediaUrl = await uploadMedia(selectedMedia.uri, selectedMedia.name);
      }
      
      setNewMessage(''); // Clear input immediately for better UX
      setSelectedMedia(null); // Clear selected media
      
      // Optimistically add message locally first
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        room_id: roomId,
        user_id: user?.id || '',
        content: selectedMedia ? (selectedMedia.type === 'image' ? '[Fotoğraf]' : `[Dosya: ${selectedMedia.name}]`) : tempMessage,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 50);
      
      // Send to server - mesaj içeriğini uygun şekilde belirle
      const messageContent = selectedMedia 
        ? JSON.stringify({ 
            type: selectedMedia.type, 
            url: mediaUrl, 
            name: selectedMedia.name,
            text: tempMessage || '',
            ...(replyTo ? { replyTo } : {})
          }) 
        : replyTo 
          ? JSON.stringify({ type: 'text', text: tempMessage, replyTo })
          : tempMessage;
      
      await sendMessage(roomId, messageContent);

      // Mention bildirimleri (sadece text içeriğini kontrol et)
      const mentionText = selectedMedia ? (tempMessage || '') : tempMessage;
      if (mentionText) notifyMentionsIfAny(mentionText);

      // Reply state temizle
      if (replyTo) setReplyTo(null);
      
      // Remove optimistic message after server confirms
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message in input on error
      setNewMessage(tempMessage);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Hata', 'Mesaj gönderilirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const onCopyMessage = async (m?: Message) => {
    if (!m) return;
    await Clipboard.setStringAsync(m.content);
    setContextMenu({ visible: false });
    Haptics.selectionAsync();
  };

  const onReplyMessage = (m?: Message) => {
    if (!m) return;
    const author = users[m.user_id]?.name || 'Kullanıcı';
    const raw = getMessagePreview(m);
    const preview = raw.length > 100 ? raw.slice(0, 100) + '…' : raw;
    setReplyTo({ messageId: m.id, author, preview });
    setContextMenu({ visible: false });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const onForwardMessage = (m?: Message) => {
    if (!m) return;
    try {
      let text = m.content;
      try {
        const data = JSON.parse(m.content);
        if (data?.text) text = data.text as string;
      } catch {}
      setNewMessage(prev => (prev ? prev + '\n' : '') + text);
    } finally {
      setContextMenu({ visible: false });
      Haptics.selectionAsync();
    }
  };

  const onReportMessage = (m?: Message) => {
    setContextMenu({ visible: false });
    Alert.alert('Şikayet', 'Mesaj moderasyon ekibine iletildi. Teşekkürler.');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const onPinMessage = (m?: Message) => {
    if (!m) return;
    setPinnedMessageId(m.id);
    setContextMenu({ visible: false });
  };

  const onReactMessage = (m?: Message) => {
    if (!m) return;
    setReactionPicker({ visible: true, messageId: m.id });
    setContextMenu({ visible: false });
    Haptics.selectionAsync();
  };

  const toggleReaction = (messageId: string, emoji: string) => {
    if (!user?.id) return;
    setMessageReactions(prev => {
      const current = { ...(prev[messageId] || {}) } as Record<string, string[]>;
      // Kullanıcının mevcut tepkisi hangisi?
      let selected: string | null = null;
      Object.keys(current).forEach(k => {
        if ((current[k] || []).includes(user.id)) selected = k;
      });
      // Aynı emojiye tekrar basarsa: sadece kaldır
      if (selected === emoji) {
        const list = current[emoji] || [];
        const next = list.filter(id => id !== user.id);
        if (next.length) current[emoji] = next; else delete current[emoji];
        return { ...prev, [messageId]: current };
      }
      // Remove user from all emoji lists first (tek tepki kuralı)
      Object.keys(current).forEach(key => {
        const list = current[key] || [];
        const idx = list.indexOf(user.id);
        if (idx >= 0) {
          const next = [...list];
          next.splice(idx, 1);
          if (next.length) current[key] = next; else delete current[key];
        }
      });
      // Toggle selected emoji (ekle)
      const existing = current[emoji] || [];
      current[emoji] = [...existing, user.id];
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return { ...prev, [messageId]: current };
    });
  };

  const applyReaction = (emoji: string) => {
    if (!reactionPicker.messageId) {
      setReactionPicker({ visible: false });
      return;
    }
    toggleReaction(reactionPicker.messageId, emoji);
    setReactionPicker({ visible: false });
  };

  const MessageBubble = ({ message, isOwnMessage, showAvatar, userInfo }: {
    message: Message;
    isOwnMessage: boolean;
    showAvatar: boolean;
    userInfo: any;
  }) => {
    // Mesajın medya içeriği olup olmadığını kontrol et
    let messageData: any = null;
    let isMediaMessage = false;
    
    try {
      messageData = JSON.parse(message.content);
      isMediaMessage = messageData && (messageData.type === 'image' || messageData.type === 'file');
    } catch {
      isMediaMessage = false;
    }

    const swipeableRef = useRef<Swipeable | null>(null);

    const renderLeftActions = () => (
      <View style={{ width: 56, justifyContent: 'center', alignItems: 'flex-start', paddingLeft: 12 }}>
        <CornerUpLeft size={18} color={theme.colors.primary[400]} />
      </View>
    );

    const handleSwipeOpen = () => {
      onReplyMessage(message);
      swipeableRef.current?.close();
    };

    return (
      <View
        style={[
          styles.messageWrapper,
          isOwnMessage && styles.ownMessageWrapper,
          pinnedMessageId === message.id && { transform: [{ scale: 1.02 }] }
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <TouchableOpacity 
            onPress={() => setProfilePhotoModal({
              visible: true,
              uri: userInfo?.photoUrl || null,
              userName: userInfo?.name || 'Kullanıcı',
              userId: message.user_id
            })}
            activeOpacity={0.8}
          >
            <ProfilePhoto 
              uri={userInfo?.photoUrl}
              size={40}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
        <Swipeable ref={swipeableRef} renderLeftActions={renderLeftActions} onSwipeableOpen={handleSwipeOpen} overshootLeft={false}>
        <TouchableOpacity
          activeOpacity={0.9}
          delayLongPress={300}
          onLongPress={(e) => {
            const actionsForOwn = [
              { key: 'copy', label: 'Kopyala', onPress: () => onCopyMessage(message) },
              { key: 'reply', label: 'Yanıtla', onPress: () => onReplyMessage(message) },
              { key: 'react', label: 'Tepki', onPress: () => onReactMessage(message) },
              { key: 'delete', label: 'Sil', onPress: () => confirmDeleteMessage(message) },
            ];
            const actionsForOthers = [
              { key: 'copy', label: 'Kopyala', onPress: () => onCopyMessage(message) },
              { key: 'reply', label: 'Yanıtla', onPress: () => onReplyMessage(message) },
              { key: 'react', label: 'Tepki', onPress: () => onReactMessage(message) },
            ];
            const { px, py } = clampContextMenuPosition(e.nativeEvent.pageX, e.nativeEvent.pageY);
            setContextMenu({ visible: true, message, x: px, y: py });
            (isOwnMessage ? actionsForOwn : actionsForOthers).forEach(() => {});
          }}
          style={[
           styles.messageContainer,
           !isOwnMessage && !showAvatar && styles.continuedMessage
        ]}
        >
         {messageData?.replyTo && (
           <View style={[styles.replyCard, { backgroundColor: theme.colors.background.elevated, borderLeftColor: theme.colors.primary[400] }]}> 
             <Text style={[styles.replyPreviewAuthor, { color: theme.colors.primary[400] }]}>{messageData.replyTo.author}</Text>
             <Text style={[styles.replyPreviewText, { color: theme.colors.text.secondary }]} numberOfLines={1}>{messageData.replyTo.preview}</Text>
           </View>
         )}
          {isOwnMessage ? (
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={[styles.messageBubble, styles.ownMessage]}
            >
              {isMediaMessage && messageData ? (
                <View>
                  {messageData.type === 'image' ? (
                    <TouchableOpacity onPress={() => setEnlargedImage(messageData.url)}>
                      <Image 
                        source={{ uri: messageData.url }} 
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.fileContainer}>
                      <File size={24} color={theme.colors.text.primary} />
                      <Text style={[styles.fileName, { color: theme.colors.text.primary }]}>
                        {messageData.name}
                      </Text>
                    </View>
                  )}
                  {messageData.text && (
                    <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                      {messageData.text}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                  {messageData?.type === 'text' && typeof messageData.text === 'string' ? messageData.text : message.content}
                </Text>
              )}
              <Text style={[styles.messageTime, { color: theme.colors.text.primary + '80' }]}>
                {formatTime(message.created_at)}
              </Text>
              {messageReactions[message.id] && (
                <View style={styles.reactionRow}>
                  {Object.entries(messageReactions[message.id]).map(([emoji, usersArr]) => (
                    <TouchableOpacity key={emoji} onPress={() => toggleReaction(message.id, emoji)} activeOpacity={0.7}>
                      <View style={styles.reactionChip}>
                        <Text style={styles.reactionText}>{emoji} {usersArr.length}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessage, { backgroundColor: theme.colors.background.card }]}>
              {showAvatar && (
                <Text style={[styles.messageSender, { color: theme.colors.primary[400] }]}> 
                  {userInfo?.name || 'Kullanıcı'}
                </Text>
              )}
              {isMediaMessage && messageData ? (
                <View>
                  {messageData.type === 'image' ? (
                    <TouchableOpacity onPress={() => setEnlargedImage(messageData.url)}>
                      <Image 
                        source={{ uri: messageData.url }} 
                        style={styles.messageImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.fileContainer}>
                      <File size={24} color={theme.colors.text.primary} />
                      <Text style={[styles.fileName, { color: theme.colors.text.primary }]}>
                        {messageData.name}
                      </Text>
                    </View>
                  )}
                  {messageData.text && (
                    <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                      {messageData.text}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                  {messageData?.type === 'text' && typeof messageData.text === 'string' ? messageData.text : message.content}
                </Text>
              )}
              <Text style={[styles.messageTime, { color: theme.colors.text.secondary }]}>
                {formatTime(message.created_at)}
              </Text>
              {messageReactions[message.id] && (
                <View style={styles.reactionRow}>
                  {Object.entries(messageReactions[message.id]).map(([emoji, usersArr]) => (
                    <TouchableOpacity key={emoji} onPress={() => toggleReaction(message.id, emoji)} activeOpacity={0.7}>
                      <View style={styles.reactionChip}>
                        <Text style={styles.reactionText}>{emoji} {usersArr.length}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </TouchableOpacity>
        </Swipeable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={theme.colors.background.darker} barStyle="light-content" />
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View 
            style={[styles.header, { 
              backgroundColor: theme.colors.background.darker + 'DD',
              borderBottomColor: theme.colors.border.primary + '40'
            }]}
          >
            <TouchableOpacity 
              onPress={onClose} 
              style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}
            >
              <ArrowLeft size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <View style={[styles.roomIcon, { backgroundColor: theme.colors.background.elevated }]}>
                {renderHeaderIcon()}
              </View>
              <View style={styles.headerInfo}>
                <Text style={[styles.roomTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
                  {room?.name || 'Sohbet Odası'}
                </Text>
                <Text style={[styles.memberCount, { color: theme.colors.text.secondary }]}>
                  {memberCount} üye
                </Text>
              </View>
            </View>
          </View>

          {/* Messages Area */}
          <View style={styles.messagesArea}>
            {!!typingUserNames.length && (
              <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs }}>
                <Text style={{ color: theme.colors.text.secondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>
                  {typingUserNames.join(', ')} yazıyor...
                </Text>
              </View>
            )}
            {!isOnline && (
              <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.xs, backgroundColor: '#8B000020' }}>
                <Text style={{ color: theme.colors.text.secondary, fontFamily: 'Inter-Regular', fontSize: 12 }}>
                  Offline - mesajlar gönderilince sıraya alınacak
                </Text>
              </View>
            )}
            <ScrollView
              ref={scrollViewRef}
              style={styles.messagesContainer}
              contentContainerStyle={[
                styles.messagesContent,
                messages.length === 0 && { flex: 1 }
              ]}
              onContentSizeChange={() => scrollToBottom()}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {messages.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <MessageSquare size={40} color={theme.colors.text.secondary + '60'} />
                  <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
                    Henüz mesaj yok
                  </Text>
                  <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary + '80' }]}>
                    İlk mesajı göndererek sohbeti başlatın
                  </Text>
                </View>
              ) : (
                messages.map((message, index) => {
                    const isOwnMessage = message.user_id === user?.id;
                    const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
                    const userInfo = users[message.user_id];
                    
                    return (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isOwnMessage={isOwnMessage}
                        showAvatar={showAvatar}
                        userInfo={userInfo}
                      />
                    );
                  })
              )}
            </ScrollView>
          </View>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
            style={{ flexShrink: 0 }}
          >
            {replyTo && (
              <View style={[styles.replyBar, { backgroundColor: theme.colors.background.elevated, borderLeftColor: theme.colors.primary[400] }]}> 
                <View style={styles.replyIconWrap}>
                  <CornerUpLeft size={16} color={theme.colors.primary[400]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.replyBarTitle, { color: theme.colors.primary[400] }]} numberOfLines={1}>{replyTo.author}</Text>
                  <Text style={[styles.replyBarText, { color: theme.colors.text.secondary }]} numberOfLines={2}>{replyTo.preview}</Text>
                </View>
                <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyBarClose}>
                  <X size={16} color={theme.colors.text.secondary} />
                </TouchableOpacity>
              </View>
            )}
            {/* Seçilen medya önizlemesi */}
            {selectedMedia && (
              <View style={[styles.mediaPreview, { backgroundColor: theme.colors.background.elevated }]}> 
                <View style={[styles.mediaPreviewContent, { backgroundColor: theme.colors.background.card }]}> 
                  {selectedMedia.type === 'image' ? (
                    <Image source={{ uri: selectedMedia.uri }} style={styles.messageImage} />
                  ) : (
                    <View style={styles.fileContainer}> 
                      <File size={32} color={theme.colors.text.primary} /> 
                      <Text style={[styles.fileName, { color: theme.colors.text.primary }]} numberOfLines={1}> 
                        {selectedMedia.name}
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    style={[styles.removeMediaButton, { backgroundColor: theme.colors.error }]} 
                    onPress={removeSelectedMedia}
                  >
                    <X size={16} color={theme.colors.text.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Attachment Menu */}
            {attachmentMenuVisible && (
              <View style={[styles.attachmentMenu, { backgroundColor: theme.colors.background.elevated }]}> 
                <TouchableOpacity 
                  style={[styles.attachmentOption, { backgroundColor: theme.colors.background.card }]} 
                  onPress={pickImage}
                >
                  <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.primary[500] + '20' }]}> 
                    <Camera size={20} color={theme.colors.primary[400]} />
                  </View>
                  <Text style={[styles.attachmentText, { color: theme.colors.text.primary }]}>Galeri</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.attachmentOption, { backgroundColor: theme.colors.background.card }]} 
                  onPress={takePhoto}
                >
                  <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.success + '20' }]}> 
                    <Camera size={20} color={theme.colors.success} />
                  </View>
                  <Text style={[styles.attachmentText, { color: theme.colors.text.primary }]}>Kamera</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.attachmentOption, { backgroundColor: theme.colors.background.card }]} 
                  onPress={pickDocument}
                >
                  <View style={[styles.attachmentIcon, { backgroundColor: theme.colors.warning + '20' }]}> 
                    <File size={20} color={theme.colors.warning} />
                  </View>
                  <Text style={[styles.attachmentText, { color: theme.colors.text.primary }]}>Dosya</Text>
                </TouchableOpacity>
              </View>
            )}

            <View 
              style={[styles.inputContainer, { 
                backgroundColor: theme.colors.background.elevated,
                borderTopColor: theme.colors.border.primary + '40'
              }]}
            >
              <View style={[styles.inputRow, { backgroundColor: theme.colors.background.card }]}> 
                <TouchableOpacity
                  style={styles.attachmentButton}
                  onPress={() => setAttachmentMenuVisible(!attachmentMenuVisible)}
                >
                  <Paperclip size={20} color={theme.colors.text.secondary} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.input, { 
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border.primary + '20'
                  }]}
                  value={newMessage}
                  onChangeText={(text) => {
                    setNewMessage(text);
                    setTyping(true);
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => setTyping(false), 1200);
                  }}
                  placeholder={selectedMedia ? "Açıklama ekle (opsiyonel)..." : "Mesajınızı yazın..."}
                  placeholderTextColor={theme.colors.text.secondary + '80'}
                  multiline
                  maxLength={500}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if ((newMessage.trim() || selectedMedia) && !loading) {
                      handleSend();
                    }
                  }}
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    ((!newMessage.trim() && !selectedMedia) || loading) && styles.sendButtonDisabled
                  ]}
                  onPress={handleSend}
                  disabled={(!newMessage.trim() && !selectedMedia) || loading}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={((!newMessage.trim() && !selectedMedia) || loading) ? 
                      [theme.colors.darkGray[600], theme.colors.darkGray[700]] : 
                      theme.colors.gradients.primary
                    }
                    style={styles.sendButtonGradient}
                  >
                    <Send size={16} color={theme.colors.text.primary} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </GradientBackground>

      {/* Fotoğraf Büyütme Modal'ı */}
      {enlargedImage && (
        <View style={styles.imageModal}>
          <TouchableOpacity 
            style={styles.imageModalBackground}
            onPress={() => setEnlargedImage(null)}
            activeOpacity={1}
          >
            <View style={styles.imageModalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setEnlargedImage(null)}
              >
                <X size={32} color={Colors.text.primary} />
              </TouchableOpacity>
              <Image 
                source={{ uri: enlargedImage }} 
                style={styles.enlargedImage}
                resizeMode="contain"
              />
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Uzun basma balon menü - üstte emoji tepkileri, altta eylemler */}
      {contextMenu.visible && contextMenu.x != null && contextMenu.y != null && (
        <TouchableOpacity activeOpacity={1} onPress={() => setContextMenu({ visible: false })} style={{ position: 'absolute', inset: 0 }}>
          <View style={{ position: 'absolute', left: (contextMenu.x || 12), top: (contextMenu.y || 80), backgroundColor: 'transparent' }}>
            <View style={{ backgroundColor: theme.colors.background.elevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 18, marginBottom: 8, ...Shadows.small }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                {['❤️','😂','😯','😢','😡','👍','➕'].map(e => (
                  <TouchableOpacity key={e} onPress={() => { if (contextMenu.message) toggleReaction(contextMenu.message.id, e); setContextMenu({ visible: false }); }}>
                    <Text style={{ fontSize: 20 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={{ backgroundColor: theme.colors.background.elevated, borderRadius: 12, overflow: 'hidden', ...Shadows.small }}>
              <TouchableOpacity onPress={() => onReplyMessage(contextMenu.message)} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CornerUpLeft size={18} color={theme.colors.text.primary} />
                <Text style={{ color: theme.colors.text.primary, fontFamily: 'Inter-Medium' }}>Yanıtla</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onForwardMessage(contextMenu.message)} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <Send size={18} color={theme.colors.text.primary} />
                <Text style={{ color: theme.colors.text.primary, fontFamily: 'Inter-Medium' }}>İlet</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onCopyMessage(contextMenu.message)} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <CopyIcon size={18} color={theme.colors.text.primary} />
                <Text style={{ color: theme.colors.text.primary, fontFamily: 'Inter-Medium' }}>Kopyala</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onReportMessage(contextMenu.message)} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <OctagonAlert size={18} color={theme.colors.error} />
                <Text style={{ color: theme.colors.error, fontFamily: 'Inter-Medium' }}>Şikayet Et</Text>
              </TouchableOpacity>
              {contextMenu.message?.user_id === user?.id && (
                <TouchableOpacity onPress={() => confirmDeleteMessage(contextMenu.message!)} style={{ paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <X size={18} color={theme.colors.error} />
                  <Text style={{ color: theme.colors.error, fontFamily: 'Inter-Medium' }}>Sil</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* Tepki seçici */}
      {reactionPicker.visible && (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 60, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', gap: 12, backgroundColor: theme.colors.background.elevated, padding: 8, borderRadius: 24 }}>
            {['❤️','😂','😯','😢','😡','👍','➕'].map(e => (
              <TouchableOpacity key={e} onPress={() => applyReaction(e)}>
                <Text style={{ fontSize: 20 }}>{e}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setReactionPicker({ visible: false })}>
              <Text style={{ color: theme.colors.text.secondary, marginLeft: 8 }}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Profil Fotoğrafı Modal'ı */}
      {profilePhotoModal.visible && (
        <View style={styles.profileModal}>
          <TouchableOpacity 
            style={styles.profileModalBackground}
            onPress={() => setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''})}
            activeOpacity={1}
          >
            <View style={styles.profileModalContent}>
              <TouchableOpacity 
                style={styles.profileCloseButton}
                onPress={() => setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''})}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.profileModalHeader}>
                <Text style={[styles.profileModalTitle, { color: theme.colors.text.primary }]}> 
                  {profilePhotoModal.userName}
                </Text>
              </View>
              
              <View style={styles.profilePhotoContainer}>
                <ProfilePhoto 
                  uri={profilePhotoModal.uri}
                  size={200}
                  style={styles.largeProfilePhoto}
                />
              </View>
              
              <View style={styles.profileModalActions}>
                <TouchableOpacity 
                  style={[styles.profileActionButton, { backgroundColor: theme.colors.background.card }]} 
                  onPress={() => {
                    setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''});
                    if (profilePhotoModal.userId) {
                      router.push(`/user-profile?userId=${profilePhotoModal.userId}`);
                    } else {
                      console.log('Kullanıcı ID bulunamadı:', profilePhotoModal.userName);
                    }
                  }}
                >
                  <Text style={[styles.profileActionText, { color: theme.colors.text.primary }]}> 
                    Profili Görüntüle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 65,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xl,
  },
  roomIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  roomTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    marginBottom: 4,
  },
  memberCount: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
  },
  messagesArea: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageWrapper: {
    marginVertical: Spacing.sm,
    maxWidth: '82%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: Spacing.xs,
    marginLeft: 0,
  },
  messageContainer: {
    flex: 1,
  },
  continuedMessage: {
    marginLeft: 48,
  },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xs,
    maxWidth: '100%',
  },
  ownMessage: {
    borderBottomRightRadius: BorderRadius.md,
    marginLeft: Spacing.xs,
  },
  otherMessage: {
    borderBottomLeftRadius: BorderRadius.md,
    marginRight: Spacing.xs,
  },
  messageSender: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: Colors.text.primary,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
  },
  typingIndicator: {
    flexDirection: 'row',
    marginTop: Spacing.xs,
    alignSelf: 'flex-start',
    height: 20,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary[400],
    marginRight: 4,
  },
  loadingContainer: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Spacing.xxl * 2,
  },
  emptyTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderTopWidth: 1,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    minHeight: 40,
    paddingVertical: Platform.OS === 'ios' ? Spacing.xs : 6,
    paddingHorizontal: Spacing.xs,
    textAlignVertical: 'top',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sendButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    ...Shadows.small,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 1,
  },
  safeArea: {
    flex: 1,
  },
  messageImage: {
    width: '100%',
    height: 220,
    borderRadius: BorderRadius.lg,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xs,
  },
  fileName: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
    flex: 1,
  },
  mediaPreview: {
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  mediaPreviewContent: {
    position: 'relative',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxHeight: 120,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.lg,
  },
  previewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  previewFileName: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  removeMediaButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMenu: {
    flexDirection: 'row',
    padding: Spacing.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  attachmentOption: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    minWidth: 80,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  attachmentText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    textAlign: 'center',
  },
  attachmentButton: {
    padding: Spacing.xs,
    alignSelf: 'flex-start',
    marginTop: Spacing.xs,
  },
  imageModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  imageModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContent: {
    backgroundColor: Colors.background.elevated,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: '90%',
    maxHeight: '80%',
    width: 300,
    height: 400,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.darker,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  enlargedImage: {
    width: '100%',
    height: '100%',
    borderRadius: BorderRadius.md,
  },
  profileModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  profileModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  profileModalContent: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxWidth: '90%',
    width: 320,
    alignItems: 'center',
    ...Shadows.large,
  },
  profileCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.darker,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileModalHeader: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  profileModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  largeProfilePhoto: {
  },
  profileModalActions: {
    width: '100%',
    alignItems: 'center',
  },
  profileActionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadows.small,
  },
  profileActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  reactionRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  reactionChip: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  reactionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.text.primary,
  },
  replyCard: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: Spacing.xs,
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderLeftWidth: 3,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  replyBarTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
  },
  replyBarText: {
    fontFamily: 'Inter-Regular',
    fontSize: 13,
  },
  replyBarClose: {
    padding: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  replyIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  replyPreviewInBubble: {
    borderLeftWidth: 3,
    paddingLeft: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  replyPreviewAuthor: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
  },
  replyPreviewText: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
  },
});
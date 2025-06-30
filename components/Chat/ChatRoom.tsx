import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar, Alert, Image } from 'react-native';
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
import { MessageSquare, Clock, Users, ArrowLeft, Send, Hash, Shield, Paperclip, Camera, File, X } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';

type Message = Database['public']['Tables']['chat_messages']['Row'];
type Room = Database['public']['Tables']['chat_rooms']['Row'];

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
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null}}>({}); 
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
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('Cleaning up subscriptions');
      messagesSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      photosSubscription.unsubscribe();
    };
  }, [roomId]);

  const loadUsers = async () => {
    try {
      // Fetch user profiles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
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
              photoUrl: userPhoto
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
    try {
      console.log('Processing media...', fileName);
      
      // Basit yaklaşım: FileReader kullanarak base64'e çevir
      const response = await fetch(mediaUri);
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64Data = reader.result as string;
          console.log('Media converted to base64, size:', Math.round(base64Data.length / 1024), 'KB');
          resolve(base64Data);
        };
        reader.onerror = () => {
          console.log('FileReader failed, using original URI');
          resolve(mediaUri);
        };
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error processing media:', error);
      // Fallback: Orijinal URI'yi kullan
      return mediaUri;
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedMedia) return;
    
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
            text: tempMessage || '' 
          }) 
        : tempMessage;
      
      await sendMessage(roomId, messageContent);
      
      // Remove optimistic message after server confirms
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Restore message in input on error
      setNewMessage(tempMessage);
      if (selectedMedia) {
        // Restore selected media on error
        // Note: We keep the selectedMedia state as is for retry
      }
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp_')));
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

  const MessageBubble = ({ message, isOwnMessage, showAvatar, userInfo }: {
    message: Message;
    isOwnMessage: boolean;
    showAvatar: boolean;
    userInfo: any;
  }) => {
    // Mesajın medya içeriği olup olmadığını kontrol et
    let messageData = null;
    let isMediaMessage = false;
    
    try {
      messageData = JSON.parse(message.content);
      isMediaMessage = messageData && (messageData.type === 'image' || messageData.type === 'file');
    } catch {
      // JSON parse edilemezse normal text mesajı
      isMediaMessage = false;
    }

    return (
      <View
        style={[
          styles.messageWrapper,
          isOwnMessage && styles.ownMessageWrapper
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
        <View style={[
          styles.messageContainer,
          !isOwnMessage && !showAvatar && styles.continuedMessage
        ]}>
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
                  {message.content}
                </Text>
              )}
              <Text style={[styles.messageTime, { color: theme.colors.text.primary + '80' }]}>
                {formatTime(message.created_at)}
              </Text>
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
                  {message.content}
                </Text>
              )}
              <Text style={[styles.messageTime, { color: theme.colors.text.secondary }]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          )}
        </View>
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
                {room?.is_private ? (
                  <Shield size={16} color={theme.colors.primary[400]} />
                ) : (
                  <Hash size={16} color={theme.colors.success} />
                )}
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
            {/* Seçilen medya önizlemesi */}
            {selectedMedia && (
              <View style={[styles.mediaPreview, { backgroundColor: theme.colors.background.elevated }]}>
                <View style={[styles.mediaPreviewContent, { backgroundColor: theme.colors.background.card }]}>
                  {selectedMedia.type === 'image' ? (
                    <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
                  ) : (
                    <View style={styles.previewFile}>
                      <File size={32} color={theme.colors.text.primary} />
                      <Text style={[styles.previewFileName, { color: theme.colors.text.primary }]} numberOfLines={1}>
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
                  onChangeText={setNewMessage}
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
                    // Modal'ı kapat
                    setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''});
                    
                    // Kullanıcı ID'sini kullan
                    if (profilePhotoModal.userId) {
                      // Profil sayfasına yönlendir
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
    marginVertical: Spacing.xs,
    maxWidth: '60%',
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
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    maxWidth: '100%',
  },
  ownMessage: {
    borderBottomRightRadius: BorderRadius.xs,
    marginLeft: Spacing.xs,
  },
  otherMessage: {
    borderBottomLeftRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  messageSender: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginBottom: 2,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    alignSelf: 'flex-end',
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
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    maxHeight: 80,
    minHeight: 36,
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
    width: 36,
    height: 36,
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
    height: 200,
    borderRadius: BorderRadius.md,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.xs,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  fileName: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
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
    borderRadius: BorderRadius.lg,
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
  // Profil Modal Stilleri
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
    // Border kaldırıldı
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
});
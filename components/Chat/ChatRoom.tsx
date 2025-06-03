import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, StatusBar } from 'react-native';
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
import { MessageSquare, Clock, Users, ArrowLeft, Send, Hash, Shield } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

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
    
    // Subscribe to real-time updates
    const messagesSubscription = subscribeToMessages();
    const membersSubscription = subscribeToMembers();
    const photosSubscription = subscribeToPhotos();
    
    // Cleanup subscriptions on unmount
    return () => {
      if (messagesSubscription) messagesSubscription();
      if (membersSubscription) membersSubscription();
      if (photosSubscription) photosSubscription();
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

  const subscribeToPhotos = () => {
    const subscription = supabase
      .channel('profile_photos_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos'
      }, () => {
        loadUsers();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
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
        setMessages(data);
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

  const subscribeToMessages = () => {
    console.log(`Setting up real-time subscription for room: ${roomId}`);
    
    const subscription = supabase
      .channel(`messages_${roomId}_${Date.now()}`) // Unique channel name
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, (payload) => {
        console.log('New message received:', payload.new);
        const newMessage = payload.new as Message;
        
        // Optimistically add message and scroll
        setMessages(prev => {
          // Prevent duplicate messages
          const exists = prev.some(msg => msg.id === newMessage.id);
          if (exists) return prev;
          
          return [...prev, newMessage];
        });
        
        // Immediate scroll to bottom
        setTimeout(() => scrollToBottom(), 50);
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from messages');
      subscription.unsubscribe();
    };
  };

  const subscribeToMembers = () => {
    const subscription = supabase
      .channel(`members:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_room_members',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        loadRoomDetails();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: false }); // Disable animation for faster scroll
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    
    const tempMessage = newMessage.trim();
    
    try {
      setLoading(true);
      setNewMessage(''); // Clear input immediately for better UX
      
      // Optimistically add message locally first
      const tempId = `temp_${Date.now()}`;
      const optimisticMessage: Message = {
        id: tempId,
        room_id: roomId,
        user_id: user?.id || '',
        content: tempMessage,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      setTimeout(() => scrollToBottom(), 50);
      
      // Send to server
      await sendMessage(roomId, tempMessage);
      
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
    return (
      <View
        style={[
          styles.messageWrapper,
          isOwnMessage ? styles.ownMessageWrapper : null
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <ProfilePhoto 
            uri={userInfo?.photoUrl}
            size={36}
            style={styles.avatar}
          />
        )}
        
        <View style={[
          styles.messageContainer,
          !isOwnMessage && !showAvatar && styles.continuedMessage
        ]}>
          {isOwnMessage ? (
            <View style={[styles.messageBubble, styles.ownMessage, { backgroundColor: theme.colors.primary[500] }]}>
              <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                {message.content}
              </Text>
              <Text style={[styles.messageTime, { color: theme.colors.text.primary + '70' }]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessage, { backgroundColor: theme.colors.background.elevated }]}>
              {showAvatar && (
                <Text style={[styles.messageSender, { color: theme.colors.primary[400] }]}>
                  {userInfo?.name}
                </Text>
              )}
              <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                {message.content}
              </Text>
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
    <View style={[styles.container, { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }]}>
      <StatusBar backgroundColor={theme.colors.background.darker} barStyle="light-content" />
      <View style={[styles.container, { backgroundColor: theme.colors.background.darker }]}>
        {/* Minimal Header */}
        <View 
          style={[styles.header, { 
            backgroundColor: theme.colors.background.darker,
            borderBottomColor: theme.colors.border.primary
          }]}
        >
          <TouchableOpacity 
            onPress={onClose} 
            style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}
          >
            <ArrowLeft size={20} color={theme.colors.text.primary} />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <View style={styles.roomAvatar}>
              {room?.is_private ? (
                <Shield size={18} color={theme.colors.text.primary} />
              ) : (
                <Hash size={18} color={theme.colors.success} />
              )}
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.roomTitle, { color: theme.colors.text.primary }]}>
                {room?.name || 'Sohbet Odası'}
              </Text>
              <Text style={[styles.memberCount, { color: theme.colors.text.secondary }]}>
                {memberCount} üye
              </Text>
            </View>
          </View>
        </View>

        {/* Messages Area */}
        <View style={[styles.messagesArea, { backgroundColor: theme.colors.background.dark }]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollToBottom()}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => {
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
            })}
            
            {messages.length === 0 && (
              <View style={styles.emptyContainer}>
                <MessageSquare size={40} color={theme.colors.text.secondary + '60'} />
                <Text style={[styles.emptyTitle, { color: theme.colors.text.secondary }]}>
                  Henüz mesaj yok
                </Text>
                <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary + '80' }]}>
                  İlk mesajı göndererek sohbeti başlatın
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={[styles.inputWrapper, { backgroundColor: theme.colors.background.darker }]}
        >
          <View 
            style={[styles.inputContainer, { 
              backgroundColor: theme.colors.background.darker,
              borderTopColor: theme.colors.border.primary 
            }]}
          >
            <View style={[styles.inputRow, { backgroundColor: theme.colors.background.elevated }]}>
              <TextInput
                style={[styles.input, { 
                  color: theme.colors.text.primary
                }]}
                value={newMessage}
                onChangeText={setNewMessage}
                placeholder="Mesajınızı yazın..."
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                maxLength={500}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!newMessage.trim() || loading) && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!newMessage.trim() || loading}
              >
                <LinearGradient
                  colors={(!newMessage.trim() || loading) ? 
                    [theme.colors.darkGray[600], theme.colors.darkGray[700]] : 
                    [theme.colors.primary[500], theme.colors.primary[600]]
                  }
                  style={styles.sendButtonGradient}
                >
                  <Send size={16} color={theme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
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
  roomAvatar: {
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
    maxWidth: '85%',
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
    alignItems: 'flex-start',
  },
  continuedMessage: {
    marginLeft: 40,
    alignItems: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderRadius: 18,
    marginBottom: Spacing.xs,
    alignSelf: 'flex-start',
    flexShrink: 1,
    ...Shadows.small,
  },
  ownMessage: {
    borderBottomRightRadius: 6,
    marginLeft: Spacing.xs,
    alignSelf: 'flex-end',
  },
  otherMessage: {
    borderBottomLeftRadius: 6,
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
  inputWrapper: {
    borderTopWidth: 1,
  },
  inputContainer: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 20,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    maxHeight: 80,
    minHeight: 36,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.xs,
    textAlignVertical: 'center',
  },
  sendButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: 33,
    height: 33,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 1,
  },
});
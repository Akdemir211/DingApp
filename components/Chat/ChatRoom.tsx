import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { MessageSquare, Clock, Users, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';
import Animated, { useAnimatedStyle, SlideInRight, Layout } from 'react-native-reanimated';

type Message = Database['public']['Tables']['chat_messages']['Row'];
type Room = Database['public']['Tables']['chat_rooms']['Row'];

interface ChatRoomProps {
  roomId: string;
  onClose: () => void;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, onClose }) => {
  const { user } = useAuth();
  const { sendMessage, fetchMessages } = useChat();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null}}>({}); 
  const scrollViewRef = useRef<ScrollView>(null);

  const containerStyle = useAnimatedStyle(() => ({
    flex: 1,
    backgroundColor: Colors.background.dark,
  }));

  useEffect(() => {
    loadMessages();
    loadRoomDetails();
    loadUsers();
    subscribeToMessages();
    subscribeToMembers();
    subscribeToPhotos();
  }, [roomId]);

  const loadUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
      if (userError) throw userError;

      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) throw photoError;

      const userMap = (userData || []).reduce((acc: {[key: string]: {name: string, photoUrl: string | null}}, user) => {
        const photo = photoData?.find(p => p.user_id === user.id);
        acc[user.id] = { 
          name: user.name || 'Anonim Kullanıcı',
          photoUrl: photo?.photo_url || null
        };
        return acc;
      }, {});

      setUsers(userMap);
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

    return () => subscription.unsubscribe();
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await fetchMessages(roomId);
      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const loadRoomDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select('*')
        .eq('id', roomId)
        .single();

      if (error) throw error;
      setRoom(data);

      const { count } = await supabase
        .from('chat_room_members')
        .select('*', { count: 'exact' })
        .eq('room_id', roomId);

      setMemberCount(count || 0);
    } catch (error) {
      console.error('Error loading room details:', error);
    }
  };

  const subscribeToMessages = () => {
    const subscription = supabase
      .channel(`room_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      }, () => {
        loadMessages();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const subscribeToMembers = () => {
    const subscription = supabase
      .channel(`room_members_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_room_members',
        filter: `room_id=eq.${roomId}`
      }, () => {
        loadRoomDetails();
      })
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const handleSend = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      await sendMessage(roomId, newMessage.trim());
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Animated.View 
      style={containerStyle} 
      entering={SlideInRight} 
      layout={Layout.springify()}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room?.name || 'Yükleniyor...'}</Text>
          <View style={styles.roomStats}>
            <Users size={14} color={Colors.text.secondary} />
            <Text style={styles.statsText}>{memberCount} üye</Text>
          </View>
        </View>
      </View>

      <View style={styles.chatBackground}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollToBottom()}
        >
          {messages.map((message, index) => {
            const isOwnMessage = message.user_id === user?.id;
            const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
            const userInfo = users[message.user_id];
            
            return (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  isOwnMessage ? styles.ownMessageWrapper : null
                ]}
              >
                {!isOwnMessage && showAvatar && (
                  <Image 
                    source={{ 
                      uri: userInfo?.photoUrl || 'https://images.pexels.com/photos/771742/pexels-photo-771742.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' 
                    }} 
                    style={styles.avatar} 
                  />
                )}
                <View style={[
                  styles.messageContainer,
                  isOwnMessage ? styles.ownMessage : styles.otherMessage
                ]}>
                  {!isOwnMessage && showAvatar && (
                    <Text style={styles.messageSender}>{userInfo?.name}</Text>
                  )}
                  <Text style={styles.messageText}>{message.content}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(message.created_at)}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesaj"
            placeholderTextColor={Colors.text.secondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!newMessage.trim() || loading}
          >
            <MessageSquare size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.background.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  backButton: {
    padding: Spacing.sm,
    marginRight: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: FontSizes.lg,
    fontFamily: 'Inter-Bold',
    color: Colors.text.primary,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  statsText: {
    marginLeft: Spacing.xs,
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    fontFamily: 'Inter-Regular',
  },
  chatBackground: {
    flex: 1,
    backgroundColor: Colors.background.darker,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  ownMessage: {
    backgroundColor: Colors.primary[600],
    borderTopRightRadius: BorderRadius.xs,
  },
  otherMessage: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.xs,
  },
  messageSender: {
    fontSize: FontSizes.sm,
    color: Colors.primary[400],
    marginBottom: Spacing.xs,
    fontFamily: 'Inter-Medium',
  },
  messageText: {
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
  },
  messageTime: {
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
    alignSelf: 'flex-end',
    fontFamily: 'Inter-Regular',
  },
  inputWrapper: {
    backgroundColor: Colors.background.card,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray[800],
    padding: Spacing.md,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    paddingTop: Spacing.md,
    color: Colors.text.primary,
    fontSize: FontSizes.md,
    maxHeight: 100,
    fontFamily: 'Inter-Regular',
  },
  sendButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.primary[600],
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.darkGray[700],
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
});
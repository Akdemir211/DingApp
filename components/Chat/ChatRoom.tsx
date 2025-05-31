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
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

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
      // Fetch user profiles
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
      if (userError) throw userError;

      // Fetch profile photos
      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) throw photoError;

      // Create user map with photos
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

  // ... (diğer fonksiyonlar aynı kalacak)

  return (
    <Animated.View style={containerStyle}>
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
  // ... (mevcut stiller aynı kalacak)
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: Spacing.xs,
  },
  // ... (diğer stiller)
});
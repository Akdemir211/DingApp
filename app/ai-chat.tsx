import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, X, Edit, Trash, Volume2, VolumeX } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { getGeminiStreamResponse, getGeminiResponse } from '@/lib/gemini';
import * as AIChatService from '@/lib/aiChatService';
import { ChatMessage, UserInfo } from '@/lib/aiChatService';
import { useFocusEffect } from '@react-navigation/native';
import * as Speech from 'expo-speech';

export default function AIChatScreen() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const scrollViewRef = useRef<ScrollView>(null);

  const stopSpeaking = () => {
    Speech.stop();
    setIsSpeaking(false);
  };

  const speakMessage = async (text: string) => {
    if (!voiceEnabled) return;
    
    try {
      setIsSpeaking(true);
      await Speech.speak(text, {
        language: 'tr',
        onDone: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false)
      });
    } catch (error) {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading || !user) return;

    const messageId = generateUUID();
    const messageText = newMessage.trim();

    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    
    try {
      await AIChatService.addChatMessage(user.id, {
        role: userMessage.role,
        content: userMessage.content,
        timestamp: userMessage.timestamp
      });
    } catch (dbError) {
      console.error('Veritabanı hatası (mesaj kaydedilirken):', dbError);
    }

    await new Promise((resolve) => setTimeout(resolve, 500));

    let retryCount = 0;
    const maxRetries = 2;
    
    async function attemptGetResponse() {
      try {
        const chatHistory = getChatHistory();
        const truncatedMessage = messageText.length > 500 
          ? messageText.substring(0, 500) + "..." 
          : messageText;
        
        console.log("Gemini yanıtı isteniyor...");
        
        const stream = await getGeminiStreamResponse(truncatedMessage, chatHistory, userInfo);
        const success = await processStreamResponse(stream);
        
        // Sesli yanıt
        if (success && voiceEnabled) {
          const response = await getGeminiResponse(truncatedMessage, chatHistory, userInfo);
          await speakMessage(response);
        }
        
        return true;
      } catch (error) {
        console.error(`Yanıt hatası (deneme ${retryCount + 1}/${maxRetries}):`, error);
        return false;
      }
    }
    
    let success = await attemptGetResponse();
    
    while (!success && retryCount < maxRetries) {
      retryCount++;
      console.log(`Tekrar deneniyor (${retryCount}/${maxRetries})...`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      success = await attemptGetResponse();
    }
    
    if (!success) {
      console.error("Tüm denemeler başarısız oldu");
      const errorMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda yanıt alamıyorum. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>AI Koç</Text>
          <Text style={styles.subtitle}>
            {userInfo?.name ? `Merhaba, ${userInfo.name}` : 'Size nasıl yardımcı olabilirim?'}
          </Text>
        </View>
        <TouchableOpacity 
          onPress={() => {
            if (isSpeaking) {
              stopSpeaking();
            }
            setVoiceEnabled(!voiceEnabled);
          }} 
          style={styles.voiceButton}
        >
          {voiceEnabled ? (
            <Volume2 size={20} color={Colors.primary[400]} />
          ) : (
            <VolumeX size={20} color={Colors.text.secondary} />
          )}
        </TouchableOpacity>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <FloatingBubbleBackground />
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageContainer,
              message.role === 'user' ? styles.userMessage : styles.assistantMessage
            ]}
          >
            <Text style={styles.messageText}>{message.content}</Text>
          </View>
        ))}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={Colors.primary[400]} />
          </View>
        )}
      </ScrollView>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor={Colors.text.secondary}
            multiline
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[
              styles.sendButton,
              (!newMessage.trim() || isLoading) && styles.sendButtonDisabled
            ]}
            disabled={!newMessage.trim() || isLoading}
          >
            <Send size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.darkGray[900],
  },
  backButton: {
    padding: Spacing.sm,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageContainer: {
    maxWidth: '80%',
    marginVertical: Spacing.xs,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: Colors.primary[400],
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.darkGray[800],
  },
  messageText: {
    color: Colors.text.primary,
    fontSize: FontSizes.md,
  },
  loadingContainer: {
    padding: Spacing.md,
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.darkGray[900],
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    color: Colors.text.primary,
    fontSize: FontSizes.md,
  },
  sendButton: {
    marginLeft: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[400],
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
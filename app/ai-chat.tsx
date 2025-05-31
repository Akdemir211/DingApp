import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, X, CreditCard as Edit, Trash } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { getGeminiStreamResponse } from '@/lib/gemini';
import * as AIChatService from '@/lib/aiChatService';
import { ChatMessage, UserInfo } from '@/lib/aiChatService';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  FadeOut
} from 'react-native-reanimated';

// İlk selamlama mesajı
const GREETING_MESSAGE: Omit<ChatMessage, 'id'> = {
  role: 'assistant',
  content: 'Merhaba! Ben senin yapay zeka destekli eğitim koçunum. Ders çalışma, sınavlara hazırlanma veya herhangi bir konuda sana yardımcı olabilirim. Seni daha iyi tanıyabilir miyim?',
  timestamp: new Date()
};

// ... (diğer kodlar aynı kalacak)

export default function AIChatScreen() {
  // ... (diğer state ve ref tanımlamaları aynı kalacak)

  // Sohbet geçmişini temizle
  const handleClearChat = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      // Veritabanından sohbet geçmişini sil
      await AIChatService.clearChatHistory(user.id);
      
      // Yeni selamlama mesajı oluştur
      const greetingMessage: ChatMessage = {
        id: generateUUID(),
        ...GREETING_MESSAGE
      };
      
      // State'i güncelle
      setMessages([greetingMessage]);
      
      // Yeni selamlama mesajını veritabanına kaydet
      await AIChatService.addChatMessage(user.id, GREETING_MESSAGE);
      
      // Otomatik olarak en alta kaydır
      setTimeout(() => scrollToBottom(), 100);
      
      // Başarılı silme animasyonu göster
      dot1Scale.value = withSequence(
        withSpring(1.2),
        withSpring(1)
      );
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      
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
          onPress={handleClearChat} 
          style={styles.clearButton}
          disabled={isLoading}
        >
          <Trash size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* ... (geri kalan kodlar aynı kalacak) */}
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (diğer stiller aynı kalacak)
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
});
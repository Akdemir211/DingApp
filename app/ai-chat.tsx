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

export default function AIChatScreen() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dot1Scale = useSharedValue(1);

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
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.8,
  },
  headerInfo: {
    flex: 1,
    marginLeft: Spacing.medium,
  },
  title: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
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
{
  // Mevcut importları koru ve yeni importu ekle
  const existingImports = `import React, { useState, useEffect, useRef } from 'react';
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
import * as Speech from 'expo-speech';`;

  // Mevcut kodun başına yeni state ekle
  const newState = `
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);`;

  // Yeni fonksiyonları ekle
  const newFunctions = `
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
  };`;

  // Mesaj gönderme fonksiyonunu güncelle
  const updatedHandleSend = `
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
        console.error(\`Yanıt hatası (deneme \${retryCount + 1}/\${maxRetries}):\`, error);
        return false;
      }
    }
    
    let success = await attemptGetResponse();
    
    while (!success && retryCount < maxRetries) {
      retryCount++;
      console.log(\`Tekrar deneniyor (\${retryCount}/\${maxRetries})...\`);
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
  };`;

  // Header'a ses kontrolü butonu ekle
  const updatedHeader = `
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <Text style={styles.title}>AI Koç</Text>
              <Text style={styles.subtitle}>
                {userInfo?.name ? \`Merhaba, \${userInfo.name}\` : 'Size nasıl yardımcı olabilirim?'}
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
          </View>`;

  // Yeni stil ekle
  const newStyles = `
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
  },`;

  // Tüm değişiklikleri uygula
  return `${existingImports}

// ... (mevcut kodun devamı)
${newState}
${newFunctions}
${updatedHandleSend}
${updatedHeader}

const styles = StyleSheet.create({
  // ... (mevcut stiller)
  ${newStyles}
});`;
}
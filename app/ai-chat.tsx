import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, ImageBackground } from 'react-native';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, X, Edit, Trash } from 'lucide-react-native';
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
  Easing 
} from 'react-native-reanimated';

// İlk selamlama mesajı
const GREETING_MESSAGE: Omit<ChatMessage, 'id'> = {
  role: 'assistant',
  content: 'Merhaba! Ben senin yapay zeka destekli eğitim koçunum. Ders çalışma, sınavlara hazırlanma veya herhangi bir konuda sana yardımcı olabilirim. Seni daha iyi tanıyabilir miyim?',
  timestamp: new Date()
};

// Yazı animasyonu süreleri
const LETTER_DELAY = 10; // milisaniye
const MIN_DELAY = 5; // minimum gecikme

export default function AIChatScreen() {
  const { user } = useAuth();
  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [persistedMessages, setPersistedMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [animatedContent, setAnimatedContent] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Animasyon değerleri
  const dot1Scale = useSharedValue(0.8);
  const dot2Scale = useSharedValue(0.8);
  const dot3Scale = useSharedValue(0.8);

  // Animasyon stilleri
  const animatedDot1Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: dot1Scale.value }],
      opacity: dot1Scale.value
    };
  });

  const animatedDot2Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: dot2Scale.value }],
      opacity: dot2Scale.value
    };
  });

  const animatedDot3Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: dot3Scale.value }],
      opacity: dot3Scale.value
    };
  });

  // Yazma animasyonu başlat
  useEffect(() => {
    if (streamingContent) {
      // Nokta animasyonlarını başlat
      dot1Scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1, // sonsuz tekrar
        true // ters çalıştır
      );

      dot2Scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );

      dot3Scale.value = withRepeat(
        withSequence(
          withTiming(1.2, { duration: 400, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.8, { duration: 400, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      );
      
      // Yazma animasyonu başlat
      animateTyping(streamingContent);
    }
    
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [streamingContent]);

  // Ekran her odaklandığında sohbet geçmişini ve kullanıcı bilgilerini yenile
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadChatHistory();
        loadUserInfo();
      }
      
      return () => {
        // Ekrandan çıkıldığında animasyonu temizle
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }
      };
    }, [user])
  );

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (isReady && !user) {
      router.replace('/(auth)/sign-in');
      return;
    }
  }, [isReady, user]);

  // Mesajlar yüklendiğinde görünümü aşağı kaydır
  useEffect(() => {
    if (messages.length > 0 && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isLoading]);

  // Yazma animasyonu için yardımcı fonksiyon
  const animateTyping = (text: string) => {
    let index = 0;
    
    const type = () => {
      if (index <= text.length) {
        setAnimatedContent(text.substring(0, index));
        index++;
        
        // Sonraki harfin yazılma süresini belirle
        const delay = Math.max(MIN_DELAY, LETTER_DELAY * (Math.random() + 0.5));
        
        // Animasyon için zamanlayıcı kur
        animationTimeoutRef.current = setTimeout(type, delay);
      }
    };
    
    type();
  };

  // Sohbet penceresini en alta kaydır
  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  // Sohbet geçmişini yükle
  const loadChatHistory = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    
    try {
      const history = await AIChatService.getChatHistory(user.id);
      
      if (history.length > 0) {
        setMessages(history);
        setPersistedMessages(history);
      } else {
        // İlk kez giriş yapıyorsa selamlama mesajı ekle
        const greetingMessage: ChatMessage = {
          ...GREETING_MESSAGE,
          id: Date.now().toString()
        };
        
        setMessages([greetingMessage]);
        
        // Veritabanına da kaydet
        await AIChatService.addChatMessage(user.id, GREETING_MESSAGE);
      }
    } catch (error) {
      console.error('Sohbet geçmişi yükleme hatası:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Kullanıcı bilgilerini yükle
  const loadUserInfo = async () => {
    if (!user) return;
    
    try {
      const info = await AIChatService.getUserInfo(user.id);
      if (info) {
        setUserInfo(info);
      }
    } catch (error) {
      console.error('Kullanıcı bilgisi yükleme hatası:', error);
    }
  };

  // Gemini modeline gönderilecek sohbet geçmişi formatını oluştur
  const getChatHistory = () => {
    // Son 10 mesajı alarak geçmiş oluştur (bellek sınırlaması)
    return messages.slice(-10).map(message => ({
      role: message.role,
      content: message.content
    }));
  };

  // Stream yanıtı işlemek için yardımcı fonksiyon
  const processStreamResponse = async (stream: any) => {
    try {
      let fullResponse = '';
      setStreamingContent('');
      
      // Her gelen parçayı ekrana yazdır
      for await (const chunk of stream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setStreamingContent(fullResponse);
        }
      }
      
      // Stream tamamlandığında mesaj listesine ekle
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setStreamingContent('');
      
      // Veritabanına kaydet
      if (user) {
        await AIChatService.addChatMessage(user.id, {
          role: aiMessage.role,
          content: aiMessage.content,
          timestamp: aiMessage.timestamp
        });
      }
      
      // Kullanıcı bilgileri için yapay zeka yanıtını analiz et
      await processAIResponseForUserInfo(fullResponse, newMessage);
      
    } catch (error) {
      console.error('Stream işleme hatası:', error);
      setStreamingContent('');
      
      // Hata durumunda yine de bir mesaj göster
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Üzgünüm, yanıt alırken bir sorun oluştu. Lütfen tekrar deneyin.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // AI yanıtından kullanıcı bilgilerini çıkar
  const processAIResponseForUserInfo = async (aiResponse: string, userQuestion: string) => {
    if (!user || !userInfo) return;
    
    // Kullanıcı sorusunda isim bilgisi var mı?
    if (userQuestion.toLowerCase().includes("adım") && userQuestion.length < 50) {
      const possibleNames = userQuestion.split(" ")
        .filter(word => word.length > 2 && /^[A-ZĞÜŞİÖÇÂÎÛa-zğüşıöçâîû]+$/.test(word));
      
      if (possibleNames.length > 0 && !userInfo.name) {
        // İsmi güncelleyelim
        const nameToUpdate = possibleNames[possibleNames.length - 1];
        await AIChatService.updateUserInfo(user.id, { name: nameToUpdate });
        setUserInfo(prev => prev ? { ...prev, name: nameToUpdate } : null);
      }
    }
    
    // Kullanıcı sorusunda sınıf bilgisi var mı?
    if (userQuestion.toLowerCase().includes("sınıf") && !userInfo.grade) {
      const gradeMatch = userQuestion.match(/(\d+)\s*\.?\s*sınıf/i);
      if (gradeMatch && gradeMatch[1]) {
        const grade = gradeMatch[1] + ". Sınıf";
        await AIChatService.updateUserInfo(user.id, { grade });
        setUserInfo(prev => prev ? { ...prev, grade } : null);
      }
    }
    
    // AI yanıtında ödev var mı?
    if (aiResponse.toLowerCase().includes("ödev") && aiResponse.includes("hafta")) {
      // Basit ödev algılama
      const subjectMatches = [
        { regex: /matematik|trigonometri|integral|türev|fonksiyon/i, subject: "Matematik" },
        { regex: /fizik|mekanik|elektrik|manyetik|termodinamik/i, subject: "Fizik" },
        { regex: /kimya|element|periyodik|asit|baz|mol/i, subject: "Kimya" },
        { regex: /biyoloji|hücre|organ|sistem|genetik/i, subject: "Biyoloji" },
        { regex: /tarih|devlet|imparatorluk|savaş|dönem/i, subject: "Tarih" },
        { regex: /edebiyat|şiir|roman|yazar|eser/i, subject: "Edebiyat" },
      ];
      
      let detectedSubject = "Genel";
      
      for (const matcher of subjectMatches) {
        if (matcher.regex.test(aiResponse.toLowerCase())) {
          detectedSubject = matcher.subject;
          break;
        }
      }
      
      // Ödev içeriğini bul
      const assignmentLines = aiResponse.split("\n")
        .filter(line => line.toLowerCase().includes("hafta") && line.includes("ödev"));
      
      if (assignmentLines.length > 0) {
        // Basit bir deadline hesapla - 1 hafta sonrası
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 7);
        
        const assignmentInfo: Omit<AIChatService.UserAssignment, 'id' | 'userId' | 'createdAt'> = {
          description: assignmentLines[0].trim(),
          subject: detectedSubject,
          dueDate,
          isCompleted: false
        };
        
        await AIChatService.createAssignment(user.id, assignmentInfo);
        
        // Kullanıcı bilgilerini güncelle
        loadUserInfo();
      }
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || isLoading || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: newMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Veritabanına kullanıcı mesajını kaydet
    await AIChatService.addChatMessage(user.id, {
      role: userMessage.role,
      content: userMessage.content,
      timestamp: userMessage.timestamp
    });
    
    setNewMessage('');
    setIsLoading(true);

    try {
      // Sohbet geçmişi 
      const chatHistory = getChatHistory();
      
      // Stream yanıtı al
      const stream = await getGeminiStreamResponse(userMessage.content, chatHistory, userInfo);
      
      // Stream yanıtını işle ve UI'a yansıt
      await processStreamResponse(stream);
    } catch (error) {
      console.error('Gemini API hatası:', error);
      
      // Hata durumunda kullanıcıya bilgi ver
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };
  
  // Sohbet geçmişini temizle
  const handleClearChat = async () => {
    if (!user) return;
    
    try {
      await AIChatService.clearChatHistory(user.id);
      
      // Yeniden başlatma mesajı
      const greetingMessage: ChatMessage = {
        ...GREETING_MESSAGE,
        id: Date.now().toString()
      };
      
      setMessages([greetingMessage]);
      
      // Veritabanına da kaydet
      await AIChatService.addChatMessage(user.id, GREETING_MESSAGE);
    } catch (error) {
      console.error('Sohbet geçmişi temizleme hatası:', error);
    }
  };

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Modern eğitim arka planı*/}
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
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Trash size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[400]} />
            <Text style={styles.loadingText}>Sohbet geçmişi yükleniyor...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {/* Görevler ve ödevler bölümü */}
            {userInfo?.assignments && userInfo.assignments.length > 0 && (
              <View style={styles.assignmentsSection}>
                <Text style={styles.assignmentTitle}>Ödevlerin:</Text>
                {userInfo.assignments.slice(0, 2).map((assignment) => (
                  <View key={assignment.id} style={styles.assignmentItem}>
                    <View style={styles.assignmentBadge}>
                      <Text style={styles.assignmentSubject}>
                        {assignment.subject.substring(0, 3)}
                      </Text>
                    </View>
                    <View style={styles.assignmentContent}>
                      <Text style={styles.assignmentText}>
                        {assignment.description}
                      </Text>
                      <Text style={styles.assignmentDate}>
                        {`Teslim: ${assignment.dueDate.toLocaleDateString('tr-TR')}`}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={[
                        styles.assignmentStatus, 
                        assignment.isCompleted ? styles.assignmentCompleted : null
                      ]}
                      onPress={async () => {
                        await AIChatService.updateAssignmentStatus(
                          assignment.id, 
                          !assignment.isCompleted
                        );
                        loadUserInfo();
                      }}
                    >
                      <Text style={styles.assignmentStatusText}>
                        {assignment.isCompleted ? 'Tamamlandı' : 'Yapılacak'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageWrapper,
                  message.role === 'user' ? styles.userMessageWrapper : null
                ]}
              >
                <View style={[
                  styles.messageContainer,
                  message.role === 'user' ? styles.userMessage : styles.assistantMessage
                ]}>
                  <Text style={styles.messageText}>{message.content}</Text>
                  <Text style={styles.messageTime}>
                    {formatTime(message.timestamp)}
                  </Text>
                </View>
              </View>
            ))}
            
            {streamingContent ? (
              <View style={[styles.messageWrapper]}>
                <View style={[styles.messageContainer, styles.assistantMessage]}>
                  <Text style={styles.messageText}>{animatedContent}</Text>
                  <View style={styles.typingIndicator}>
                    <Animated.View style={[styles.typingDot, animatedDot1Style]} />
                    <Animated.View style={[styles.typingDot, animatedDot2Style]} />
                    <Animated.View style={[styles.typingDot, animatedDot3Style]} />
                  </View>
                </View>
              </View>
            ) : isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={Colors.primary[400]} />
                <Text style={styles.loadingText}>Yanıt hazırlanıyor...</Text>
              </View>
            )}
          </ScrollView>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Soru veya konu yazın..."
            placeholderTextColor={Colors.text.secondary}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!newMessage.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={handleSend}
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
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.xl,
    backgroundColor: Colors.background.darker,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[800],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageWrapper: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
  },
  messageContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  userMessage: {
    backgroundColor: Colors.primary[500],
    borderTopRightRadius: BorderRadius.xs,
  },
  assistantMessage: {
    backgroundColor: Colors.darkGray[700],
    borderTopLeftRadius: BorderRadius.xs,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: 4,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray[800],
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  assignmentsSection: {
    backgroundColor: 'rgba(30, 30, 50, 0.8)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  assignmentTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  assignmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(40, 40, 65, 0.5)',
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  assignmentBadge: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  assignmentSubject: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
  },
  assignmentContent: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  assignmentText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
  },
  assignmentDate: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  assignmentStatus: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.darkGray[700],
  },
  assignmentCompleted: {
    backgroundColor: Colors.success,
  },
  assignmentStatusText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
  },
});
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image, ImageBackground, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { router } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { ArrowLeft, Send, X, Edit, Trash, Paperclip, Camera, File } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { getGeminiStreamResponse, getGeminiResponse, analyzeImageWithVision } from '@/lib/gemini';
import * as AIChatService from '@/lib/aiChatService';
import { ChatMessage, UserInfo } from '@/lib/aiChatService';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as DocumentPicker from 'expo-document-picker';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withRepeat, 
  withTiming,
  withSequence,
  Easing,
  SlideInDown
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Yazı animasyonu süreleri
const LETTER_DELAY = 10; // milisaniye
const MIN_DELAY = 5; // minimum gecikme

/**
 * UUID v4 formatına uygun benzersiz bir ID oluşturur (crypto olmadan)
 */
function generateUUID(): string {
  let dt = new Date().getTime();
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
}

export default function AIChatScreen() {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  // İlk selamlama mesajı - çevirili versiyon
  const GREETING_MESSAGE: Omit<ChatMessage, 'id'> = {
    role: 'assistant',
    content: t('ai_chat.greeting'),
    timestamp: new Date()
  };

  const [isReady, setIsReady] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [persistedMessages, setPersistedMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [animatedContent, setAnimatedContent] = useState('');
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [isHomeworkExpanded, setIsHomeworkExpanded] = useState(false);
  const [attachmentMenuVisible, setAttachmentMenuVisible] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<{uri: string, type: 'image' | 'file', name: string} | null>(null);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
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
        animationTimeoutRef.current = setTimeout(type, delay) as any;
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
      
      // Stream kontrolü
      if (!stream) {
        throw new Error('Stream nesnesi bulunamadı');
      }

      // Console içeriği
      console.log("Stream tipi:", typeof stream);
      console.log("Stream özellikleri:", Object.keys(stream));
      console.log("Symbol.asyncIterator var mı:", Symbol.asyncIterator in stream);
      
      // Stream yanıtı çözme - tipleri sırayla kontrol et
      if (stream.text) {
        // 1. Durum: Nesnenin kendisi direkt metin içeriyorsa
        console.log("Metin içeren yanıt alındı (1)");
        fullResponse = stream.text;
        setStreamingContent(fullResponse);
      } 
      else if (stream.response && stream.response.text) {
        // 2. Durum: Yanıt bir response objesi içindeyse
        console.log("Response objesi içinde yanıt alındı (2)");
        fullResponse = stream.response.text;
        setStreamingContent(fullResponse);
      }
      else if (typeof stream[Symbol.asyncIterator] === 'function') {
        // 3. Durum: Async iterator kullanarak stream işle
        console.log("Stream asyncIterator yanıt işleniyor (3)");
        
        try {
          for await (const chunk of stream) {
            console.log("Chunk alındı:", chunk);
            
            if (chunk) {
              // Chunk'ın formatını kontrol et
              if (typeof chunk === 'string') {
                fullResponse += chunk;
              } 
              else if (chunk.text) {
                fullResponse += chunk.text;
              }
              else if (chunk.response && chunk.response.text) {
                fullResponse += chunk.response.text;
              }
              else if (chunk.content) {
                fullResponse += chunk.content;
              }
              else if (typeof chunk === 'object') {
                // Nesnenin içindeki metni bulmaya çalış
                const textContent = JSON.stringify(chunk);
                fullResponse += textContent.substring(0, 100); // İlk 100 karakter
              }
              
              // UI'ı güncelle
              setStreamingContent(fullResponse);
            }
          }
        } catch (streamError) {
          console.error("Stream işleme hatası:", streamError);
          
          if (fullResponse) {
            console.log("Stream kesintiye uğradı, alınan kısmi yanıt kullanılacak");
          } else {
            // Manuel olarak .next() kullanmayı dene
            if (typeof stream.next === 'function') {
              console.log("Manuel next() ile yanıt alınmaya çalışılıyor");
              try {
                const result = await stream.next();
                if (result && !result.done && result.value) {
                  if (typeof result.value === 'string') {
                    fullResponse = result.value;
                  } else if (result.value.text) {
                    fullResponse = result.value.text;
                  }
                  setStreamingContent(fullResponse);
                }
              } catch (nextError) {
                console.error("Manuel next() hatası:", nextError);
                throw new Error("Stream yanıtı alınamadı: " + streamError);
              }
            } else {
              throw new Error("Stream yanıtı alınamadı: " + streamError);
            }
          }
        }
      } 
      else if (typeof stream.then === 'function') {
        // 4. Durum: Promise ise
        console.log("Promise yanıt işleniyor (4)");
        const result = await stream;
        
        if (typeof result === 'string') {
          fullResponse = result;
        } else if (result && result.text) {
          fullResponse = result.text;
        } else if (result && result.response && result.response.text) {
          fullResponse = result.response.text;
        } else {
          console.log("Bilinmeyen Promise sonucu:", result);
          fullResponse = JSON.stringify(result).substring(0, 100);
        }
        
        setStreamingContent(fullResponse);
      }
      else {
        // 5. Durum: Ne olduğunu anlamaya çalış
        console.log("Bilinmeyen yanıt formatı (5):", typeof stream, stream);
        
        // Stringfy ve ilk 100 karakteri göster
        const streamStr = JSON.stringify(stream);
        console.log("JSON olarak stream:", streamStr.substring(0, 100) + "...");
        
        if (typeof stream === 'string') {
          fullResponse = stream;
        } else {
          // Düz bir metin oluştur
          fullResponse = "Yanıt alındı ancak gösterilemiyor. Lütfen tekrar deneyin.";
        }
      }
      
      // Yeterince uzun bir yanıt yoksa
      if (!fullResponse || fullResponse.length < 5) {
        throw new Error('Geçerli bir yanıt alınamadı (çok kısa)');
      }
      
      // Benzersiz ID oluştur - UUID formatında
      const uniqueId = generateUUID();
      
      // Yanıtı mesaj listesine ekle
      const aiMessage: ChatMessage = {
        id: uniqueId,
        role: 'assistant',
        content: fullResponse,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setStreamingContent('');
      
      // Mesajı kaydederken bağlantı hatası olabilir, try/catch içine al
      if (user) {
        try {
          await AIChatService.addChatMessage(user.id, {
            role: aiMessage.role,
            content: aiMessage.content,
            timestamp: aiMessage.timestamp
          });
        } catch (dbError) {
          console.error('Veritabanı hatası:', dbError);
          // Veritabanı hatası kullanıcı deneyimini etkilemez
        }
      }
      
      // Kullanıcı bilgileri işleme
      if (fullResponse) {
        try {
          await processAIResponseForUserInfo(fullResponse, newMessage);
        } catch (profileError) {
          console.warn('Kullanıcı profili işleme hatası:', profileError);
          // Bu hata kullanıcı deneyimini etkilemez
        }
      }
      
      return true;
    } catch (error: any) {
      console.error('Yanıt işleme hatası:', error);
      setStreamingContent('');
      
      // Kullanıcıya daha açıklayıcı hata mesajı göster
      let errorMessage: ChatMessage;
      
      if (error.toString().includes('network') || error.toString().includes('bağlantı')) {
        errorMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: 'İnternet bağlantı sorunu yaşanıyor. Lütfen bağlantınızı kontrol edip tekrar deneyin.',
          timestamp: new Date()
        };
      } else {
        errorMessage = {
          id: generateUUID(),
          role: 'assistant',
          content: 'Üzgünüm, yanıt alırken bir sorun oluştu. Lütfen tekrar deneyin.',
          timestamp: new Date()
        };
      }
      
      setMessages(prev => [...prev, errorMessage]);
      return false;
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
    if (!newMessage.trim() && !selectedMedia) return;
    if (isLoading) return;
    
    let mediaData: string | null = null;
    
    // Medya varsa işle
    if (selectedMedia) {
      mediaData = await processMedia(selectedMedia.uri, selectedMedia.name);
    }
    
    const userMessage: ChatMessage = {
      id: generateUUID(),
      role: 'user',
      content: selectedMedia 
        ? JSON.stringify({ 
            type: selectedMedia.type, 
            url: mediaData, 
            name: selectedMedia.name,
            text: newMessage.trim() || '' 
          })
        : newMessage.trim(),
      timestamp: new Date()
    };

    // UI'ı güncelle
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setSelectedMedia(null);
    setIsLoading(true);
    
    scrollToBottom();

    try {
      // Veritabanına kaydet
      await AIChatService.addChatMessage(user!.id, userMessage);
      
      // AI'ye gönderilecek mesajı hazırla
      let aiPrompt = userMessage.content;
      
      if (selectedMedia && mediaData) {
        if (selectedMedia.type === 'image') {
          aiPrompt += `\n\nKullanıcı bir fotoğraf gönderdi: ${selectedMedia.name}. Bu fotoğrafla ilgili yardım isteyebilir.`;
        } else {
          aiPrompt += `\n\nKullanıcı bir dosya gönderdi: ${selectedMedia.name}. Bu dosyayla ilgili yardım isteyebilir.`;
        }
      }

      // Gemini'den yanıt al
      async function attemptGetResponse() {
        try {
          let aiResponse;
          
          // Eğer fotoğraf varsa Gemini Vision kullan
          if (selectedMedia && selectedMedia.type === 'image' && mediaData) {
            console.log('Fotoğraf analizi için Gemini Vision kullanılıyor...');
            aiResponse = await analyzeImageWithVision(
              mediaData,
              newMessage.trim(),
              userInfo
            );
            
            if (aiResponse) {
              const aiMessage: ChatMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: aiResponse,
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, aiMessage]);
              await AIChatService.addChatMessage(user!.id, aiMessage);
              await processAIResponseForUserInfo(aiResponse, newMessage.trim());
              return;
            }
          }
          
          // Normal stream yanıtı için
          const stream = await getGeminiStreamResponse(
            aiPrompt,
            getChatHistory(),
            userInfo
          );
          
          if (stream) {
            await processStreamResponse(stream);
          } else {
            throw new Error('Stream response is null');
          }
        } catch (streamError) {
          console.warn('Stream failed, trying direct response:', streamError);
          
          try {
            const directResponse = await getGeminiResponse(
              aiPrompt,
              getChatHistory(),
              userInfo
            );
            
            if (directResponse) {
              const aiMessage: ChatMessage = {
                id: generateUUID(),
                role: 'assistant',
                content: directResponse,
                timestamp: new Date()
              };
              
              setMessages(prev => [...prev, aiMessage]);
              await AIChatService.addChatMessage(user!.id, aiMessage);
              await processAIResponseForUserInfo(directResponse, aiPrompt);
            }
          } catch (directError) {
            console.error('Direct response also failed:', directError);
            throw directError;
          }
        }
      }

      await attemptGetResponse();
      
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      
      const errorMessage: ChatMessage = {
        id: generateUUID(),
        role: 'assistant',
        content: 'Üzgünüm, şu anda bir teknik sorun yaşıyorum. Lütfen daha sonra tekrar deneyin.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setIsLoading(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        
        // Galeri fotoğrafını kaydet (kırpılmış haliyle)
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
        
        // Kamera fotoğrafını kaydet (kırpılmış haliyle)
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

  const processMedia = async (mediaUri: string, fileName: string): Promise<string> => {
    try {
      console.log('Processing media for AI...', fileName);
      
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
      return mediaUri;
    }
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
    <SafeContainer style={styles.container}>
      {/* Modern eğitim arka planı*/}
      <FloatingBubbleBackground />
      
      <Animated.View 
        style={styles.header}
        entering={SlideInDown.duration(600)}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        
        <LinearGradient
          colors={[Colors.primary[500] + '20', Colors.primary[400] + '10']}
          style={styles.aiCoachContainer}
        >
          <View style={styles.aiCoachAvatar}>
            <Image 
              source={require('@/assets/images/ai-coach-robot.png')}
              style={styles.robotImage}
              resizeMode="contain"
            />
            <View style={styles.onlineIndicator} />
          </View>
          
          <View style={styles.headerInfo}>
            <Text style={styles.title}>{t('ai_chat.title')}</Text>
            <Text style={styles.subtitle}>
              {userInfo?.name ? `${t('home.welcome')} ${userInfo.name}!` : t('ai_chat.greeting')}
            </Text>
          </View>
        </LinearGradient>
        
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Trash size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </Animated.View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={0}
      >
        {isLoadingHistory ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[400]} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >

            
            {messages.map((message) => {
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
                            <File size={24} color={Colors.text.primary} />
                            <Text style={styles.fileName}>
                              {messageData.name}
                            </Text>
                          </View>
                        )}
                        {messageData.text && (
                          <Text style={styles.messageText}>{messageData.text}</Text>
                        )}
                      </View>
                    ) : (
                      <Text style={styles.messageText}>{message.content}</Text>
                    )}
                    <Text style={styles.messageTime}>
                      {formatTime(message.timestamp)}
                    </Text>
                  </View>
                </View>
              );
            })}
            
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
                <Text style={styles.loadingText}>{t('ai_chat.thinking')}</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Seçilen medya önizlemesi */}
        {selectedMedia && (
          <View style={styles.mediaPreview}>
            <View style={styles.mediaPreviewContent}>
              {selectedMedia.type === 'image' ? (
                <Image source={{ uri: selectedMedia.uri }} style={styles.previewImage} />
              ) : (
                <View style={styles.previewFile}>
                  <File size={32} color={Colors.text.primary} />
                  <Text style={styles.previewFileName} numberOfLines={1}>
                    {selectedMedia.name}
                  </Text>
                </View>
              )}
              <TouchableOpacity 
                style={styles.removeMediaButton}
                onPress={removeSelectedMedia}
              >
                <X size={16} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Attachment Menu */}
        {attachmentMenuVisible && (
          <View style={styles.attachmentMenu}>
            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={pickImage}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: Colors.primary[500] + '20' }]}>
                <Camera size={20} color={Colors.primary[400]} />
              </View>
              <Text style={styles.attachmentText}>{t('ai_chat.attach_image')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={takePhoto}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: Colors.success + '20' }]}>
                <Camera size={20} color={Colors.success} />
              </View>
              <Text style={styles.attachmentText}>{t('ai_chat.take_photo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.attachmentOption}
              onPress={pickDocument}
            >
              <View style={[styles.attachmentIcon, { backgroundColor: Colors.warning + '20' }]}>
                <File size={20} color={Colors.warning} />
              </View>
              <Text style={styles.attachmentText}>{t('ai_chat.attach_file')}</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.attachmentButton}
              onPress={() => setAttachmentMenuVisible(!attachmentMenuVisible)}
            >
              <Paperclip size={20} color={Colors.text.secondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder={selectedMedia ? 
                (selectedMedia.type === 'image' ? 
                  "Fotoğraftaki soruları çözmem için 'çöz' yazın veya ek soru sorun..." : 
                  "Dosya ile ilgili soru sorun..."
                ) : 
                t('ai_chat.type_message')
              }
              placeholderTextColor={Colors.text.secondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, ((!newMessage.trim() && !selectedMedia) || isLoading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={(!newMessage.trim() && !selectedMedia) || isLoading}
            >
              <Send size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

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
                <X size={24} color={Colors.text.primary} />
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
    </SafeContainer>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 35,
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
  aiCoachContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.sm,
  },
  aiCoachAvatar: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(100, 150, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary[400] + '30',
    position: 'relative',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.success,
    borderWidth: 2,
    borderColor: Colors.background.darker,
  },
  robotImage: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
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
    paddingHorizontal: Spacing.md, // Mesajlar için normal kenar boşluğu
  },
  messageWrapper: {
    marginVertical: Spacing.xs,
    maxWidth: '85%', // Mesaj kutuları için biraz daha geniş alan
    marginLeft: 0, // AI mesajları sol kenarda başlasın
    marginRight: 'auto', // AI mesajları için sağ boşluk otomatik
  },
  userMessageWrapper: {
    alignSelf: 'flex-end',
    marginLeft: 'auto', // Kullanıcı mesajları için sol boşluk otomatik
    marginRight: 0, // Kullanıcı mesajları sağ kenarda bitsin
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
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  homeworkButtonContainer: {
    backgroundColor: 'rgba(30, 30, 50, 0.8)',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  homeworkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[700],
    borderRadius: BorderRadius.xs,
    padding: Spacing.sm,
  },
  homeworkButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  homeworkButtonArrow: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  homeworkButtonArrowRotated: {
    transform: [{ rotate: '180deg' }],
  },
  expandedHomework: {
    padding: Spacing.md,
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
  mediaPreview: {
    padding: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  mediaPreviewContent: {
    backgroundColor: Colors.darkGray[700],
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    position: 'relative',
    maxHeight: 120,
  },
  previewImage: {
    width: '100%',
    height: 100,
    borderRadius: BorderRadius.md,
  },
  previewFile: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  previewFileName: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
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
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentMenu: {
    flexDirection: 'row',
    backgroundColor: Colors.background.darker,
    padding: Spacing.md,
    justifyContent: 'space-around',
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  attachmentOption: {
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[700],
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
    color: Colors.text.primary,
    textAlign: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  attachmentButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginBottom: Spacing.xs,
  },
  fileName: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
    flex: 1,
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
    backgroundColor: Colors.background.darker,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    maxWidth: '80%',
    maxHeight: '80%',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.xs,
    right: Spacing.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedImage: {
    width: '100%',
    height: '100%',
  },
});
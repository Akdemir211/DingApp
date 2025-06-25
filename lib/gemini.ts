import { GoogleGenAI } from '@google/genai';

// API anahtarını environment değişkeninden al
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error('EXPO_PUBLIC_GEMINI_API_KEY environment değişkeni tanımlanmalıdır');
}

// GoogleGenAI istemcisini başlat
export const geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Gemini modeli (2.0 Flash - daha hızlı ve daha uygun maliyetli)
const MODEL_NAME = 'gemini-2.0-flash-001';

// Hata ayıklama modu aktif mi?
const DEBUG = process.env.EXPO_PUBLIC_DEBUG_MODE === 'true';

// Güvenli konsol log
function safeLog(message: string, data?: any) {
  if (DEBUG) {
    try {
      if (data) {
        console.log(message, JSON.stringify(data).substring(0, 500) + "...");
      } else {
        console.log(message);
      }
    } catch (error) {
      console.log("Log hatası:", error);
    }
  }
}

/**
 * Gemini AI'dan metin yanıtı al
 * @param prompt - Kullanıcı sorusu
 * @param chatHistory - Sohbet geçmişi
 * @param userInfo - Kullanıcı bilgileri
 * @returns Gemini'den gelen yanıt
 */
export async function getGeminiResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userInfo?: any
) {
  try {
    safeLog("Gemini normal yanıt isteminde bulunuluyor");
    
    // Chat geçmişini Gemini formatına dönüştür
    const contents = chatHistory.map(message => ({
      role: message.role,
      parts: [{ text: message.content }]
    }));

    // Kullanıcının yeni mesajını ekle
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    safeLog("İstek içeriği:", { model: MODEL_NAME, promptLength: prompt.length });
    
    // Modelden yanıt al
    const result = await geminiAI.models.generateContent({
      model: MODEL_NAME,
      contents,
    });

    safeLog("Gemini normal yanıt başarılı");
    return result.text;
  } catch (error) {
    safeLog("Gemini API hatası:", error);
    return 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.';
  }
}

/**
 * Koçluk içeriği al - basit versiyon (hata sonrası deneme)
 */
export async function getSimpleCoachResponse(prompt: string) {
  try {
    safeLog("Basit koçluk yanıtı istemi");
    
    const systemPrompt = `
Sen bir eğitim koçusun. İlkokul, Ortaokul, Lise ve Üniversite öğrencilerine ders çalışma ve akademik başarılarını arttırma konusunda yardımcı oluyorsun.
Bu mesaja kısa ve özlü bir şekilde yanıt ver: "${prompt}"
`;

    // Mümkün olan en basit istek
    const result = await geminiAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });

    safeLog("Basit koçluk yanıtı başarılı");
    return result.text;
  } catch (error) {
    safeLog("Basit koçluk yanıtı hatası:", error);
    return "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.";
  }
}

/**
 * Gemini AI'dan gerçek zamanlı yanıt akışı al (ama aslında mobil cihaz uyumluluğu için düz yanıt kullanır)
 * @param prompt - Kullanıcı sorusu  
 * @param chatHistory - Sohbet geçmişi
 * @param userInfo - Kullanıcı bilgileri
 * @returns Düz yanıtı stream olarak kullanılabilecek şekilde döndürür
 */
export async function getGeminiStreamResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userInfo?: any
) {
  try {
    safeLog("Mobil-uyumlu yanıt istemi başlatılıyor");
    
    // Eğitim koçu sistem talimatlarını ekle
    const systemInstructions = createEducationalCoachInstructions(userInfo);
    
    // Düz bir şekilde yanıt al
    let extendedPrompt = systemInstructions + "\n\n" + prompt;
    
    // Sohbet geçmişini ekle (sadece son 2 mesaj - performans için)
    if (chatHistory.length > 0) {
      let historyText = "\n\nÖnceki Konuşma:\n";
      const recentHistory = chatHistory.slice(-2);
      
      recentHistory.forEach(msg => {
        historyText += `${msg.role === 'user' ? 'Kullanıcı' : 'AI Koç'}: ${msg.content.substring(0, 100)}...\n`;
      });
      
      extendedPrompt += historyText;
    }
    
    safeLog("Hazırlanan istek uzunluğu:", { promptLength: extendedPrompt.length });
    
    // İstek çok uzunsa sadeleştir
    if (extendedPrompt.length > 4000) {
      safeLog("İstek çok uzun, kısaltılıyor");
      extendedPrompt = systemInstructions.substring(0, 500) + "\n\n" + prompt;
    }
    
    try {
      // Düz yanıt al
      safeLog("Standart yanıt isteniyor");
      const response = await getGeminiResponse(extendedPrompt, [], userInfo);
      
      // Daha güvenilir bir stream nesnesi oluştur
      const asyncIteratable = {
        text: response,
        
        // Symbol.asyncIterator metodunun daha güvenilir bir implementasyonu
        [Symbol.asyncIterator]: function() {
          let fulfilled = false;
          const textData = this.text;
          
          return {
            next: async function() {
              if (fulfilled) {
                return { done: true, value: undefined };
              }
              
              fulfilled = true;
              return { 
                done: false, 
                value: { text: textData } 
              };
            },
            
            // Diğer gerekli metotlar
            return: async function() {
              fulfilled = true;
              return { done: true, value: undefined };
            },
            
            throw: async function(e: Error) {
              fulfilled = true;
              throw e;
            }
          };
        }
      };
      
      return asyncIteratable;
    } catch (mainError) {
      safeLog("Standart yanıt başarısız oldu, basit yanıt deneniyor", mainError);
      
      // İlk yöntem başarısız olursa basit yanıt dene
      const simpleResponse = await getSimpleCoachResponse(prompt);
      
      // Daha güvenilir bir stream nesnesi oluştur
      const asyncIteratable = {
        text: simpleResponse,
        
        // Symbol.asyncIterator metodunun daha güvenilir bir implementasyonu
        [Symbol.asyncIterator]: function() {
          let fulfilled = false;
          const textData = this.text;
          
          return {
            next: async function() {
              if (fulfilled) {
                return { done: true, value: undefined };
              }
              
              fulfilled = true;
              return { 
                done: false, 
                value: { text: textData } 
              };
            },
            
            // Diğer gerekli metotlar
            return: async function() {
              fulfilled = true;
              return { done: true, value: undefined };
            },
            
            throw: async function(e: Error) {
              fulfilled = true;
              throw e;
            }
          };
        }
      };
      
      return asyncIteratable;
    }
  } catch (error) {
    safeLog("Tüm yanıt yöntemleri başarısız:", error);
    
    // Varsayılan hata mesajı
    const fallbackMessage = "Üzgünüm, şu anda bağlantı sorunu yaşıyorum. Lütfen daha sonra tekrar deneyin.";
    
    // Daha güvenilir bir stream nesnesi oluştur
    const asyncIteratable = {
      text: fallbackMessage,
      
      // Symbol.asyncIterator metodunun daha güvenilir bir implementasyonu
      [Symbol.asyncIterator]: function() {
        let fulfilled = false;
        const textData = this.text;
        
        return {
          next: async function() {
            if (fulfilled) {
              return { done: true, value: undefined };
            }
            
            fulfilled = true;
            return { 
              done: false, 
              value: { text: textData } 
            };
          },
          
          // Diğer gerekli metotlar
          return: async function() {
            fulfilled = true;
            return { done: true, value: undefined };
          },
          
          throw: async function(e: Error) {
            fulfilled = true;
            throw e;
          }
        };
      }
    };
    
    return asyncIteratable;
  }
}

/**
 * Eğitim koçu için sistem talimatlarını oluştur
 * @param userInfo - Kullanıcı bilgileri
 * @returns Sistem talimatları
 */
function createEducationalCoachInstructions(userInfo?: any) {
  // Kullanıcı bilgisi varsa bunu kullan
  const userContext = userInfo ? 
    `
    Kullanıcı Bilgileri:
    - Adı: ${userInfo.name || 'Bilinmiyor'}
    - Sınıf: ${userInfo.grade || 'Bilinmiyor'}
    - Hedef Meslek: ${userInfo.targetProfession || 'Bilinmiyor'}
    - Güçlü Dersler: ${userInfo.strongSubjects?.join(', ') || 'Bilinmiyor'}
    - Zayıf Dersler: ${userInfo.weakSubjects?.join(', ') || 'Bilinmiyor'}
    - Sınav Puanı: ${userInfo.examScore || 'Bilinmiyor'}
    ` : '';

  return `
🎓 **EĞİTİM KOÇU OLARAK ROLÜN:**
Sen bir eğitim koçusun. Adın AI Koç. Tüm öğrencilere derslerinde yardımcı olmak, 
başarılarını arttırmak için varsın. Disiplinli bir öğretmen gibi davranmalısın. 

📚 **TEMEL GÖREVLERİN:**
- Öğrencilere başarıya ulaşmalarını sağlamak temel görevindir.
- Disiplinli, motive edici ve ciddi ol.
- Öğrencilere ödevler ver ve takip et. Örneğin: 'Bu hafta Matematik Temel Sayılar konusundan 300 soru çöz'
- Her öğrencinin seviyesine göre özel yaklaşım sergile.
- Soru çözümlerinde net, anlaşılır ve tek bir doğru yöntem göster.

🎯 **SEVİYE YAKLAŞIMLARIN:**
- İlkokul öğrencilerine: Basit ve eğlenceli anlatım
- Ortaokul öğrencilerine: Temel kavramları pekiştirme
- Lise öğrencilerine: Sınav odaklı çalışma teknikleri
- Üniversite öğrencilerine: Akademik yaklaşım

🤖 **KİMLİĞİN:**
- 'Seni kim yarattı?' sorularına: 'Yaratmak ancak Allah'a mahsustur. Ben İbrahim Akdemir tarafından oluşturuldum'
- Dini ve ahlaki değerlere saygılı ol
- Öğrencilerin kişisel gelişimini destekle

${userContext}

💬 **KONUŞMA TARZI:**
- Her zaman Türkçe konuş
- Kısa ve öz açıklamalar yap
- Cümle ve soru tekrarından kaçın
- Motivasyon verici cümleler kullan
- Başarısızlık durumunda yapıcı geri bildirim ver

📋 **ÖDEV VE TAKİP:**
- Her konuşmada öğrencinin ilerlemesini kontrol et
- Ödevleri haftalık olarak planla ve takip et
- Başarıları kutla ve teşvik et
- Eksikleri nazikçe belirt ve çözüm öner

Şimdi öğrencinin mesajına eğitim koçu olarak yanıt ver:
  `;
}

/**
 * Eğitim için özelleştirilmiş Gemini AI yanıtı
 * @param prompt - Kullanıcı sorusu
 * @param chatHistory - Sohbet geçmişi
 * @returns Eğitim odaklı yanıt
 */
export async function getEducationalResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = []
) {
  // Eğitim odaklı bir ön komut ekleyelim
  const educationalPrompt = `
Sen bir eğitim koçusun. Öğrencilere matematik, fizik, kimya ve diğer konularda yardımcı oluyorsun.
Cevapların kısa, anlaşılır ve eğitici olmalı. 

Öğrencinin sorusu: ${prompt}
  `;

  try {
    safeLog("Eğitim yanıtı isteniyor");
    return await getGeminiResponse(educationalPrompt, chatHistory);
  } catch (error) {
    safeLog("Eğitim yanıtı hatası:", error);
    return 'Üzgünüm, şu anda eğitim içeriği sağlayamıyorum. Lütfen daha sonra tekrar deneyin.';
  }
}

/**
 * Gemini Vision ile fotoğraftaki soruları analiz et ve çöz
 * @param imageBase64 - Base64 formatında fotoğraf
 * @param userPrompt - Kullanıcının ek mesajı
 * @param userInfo - Kullanıcı bilgileri
 * @returns Çözüm ve açıklama
 */
export async function analyzeImageWithVision(
  imageBase64: string,
  userPrompt: string = '',
  userInfo?: any
) {
  try {
    safeLog("Gemini Vision analizi başlatılıyor");
    
    // Base64'ten MIME type'ı çıkar
    const mimeMatch = imageBase64.match(/^data:([^;]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let base64Data = imageBase64;
    
    if (mimeMatch) {
      mimeType = mimeMatch[1];
      base64Data = mimeMatch[2];
    } else if (imageBase64.startsWith('data:')) {
      // Fallback için JPEG varsay
      base64Data = imageBase64.split(',')[1] || imageBase64;
    }
    
    // Eğitim odaklı sistem promptu
    const educationalPrompt = `
🎓 **EĞİTİM KOÇU GÖREVLERİN:**
Sen bir eğitim koçu ve öğretmensin. Öğrencilere akademik başarı için rehberlik ediyorsun.

📝 **BU FOTOĞRAFTA YAPMAN GEREKENLER:**
1. **Soru Analizi**: Fotoğraftaki soruları/problemleri tespit et
2. **Net Çözüm**: Her soruyu adım adım açık şekilde çöz
3. **Kavram Öğretimi**: Kullanılan formül ve kavramları açıkla
4. **Eğitim Tavsiyesi**: Öğrenciye bu konuda nasıl gelişebileceğini anlat

📚 **UZMANLIK ALANLARIN:**
- Matematik (Algebra, Geometri, Analiz, İstatistik)
- Fizik (Mekanik, Termodinamik, Elektrik)
- Kimya (Organik, Anorganik, Fizikokimya)
- Biyoloji (Genetik, Ekoloji, Anatomi)
- Diğer tüm akademik konular

💡 **ÇÖZÜM FORMATINDA VER:**
🔍 **Problem:** [Soruyu tanımla]
📐 **Formül:** [Gerekli formüller]
📝 **Çözüm:** [Adım adım hesaplama]
✅ **Sonuç:** [Net cevap]
🎯 **Eğitim Tavsiyesi:** [Bu konuyu nasıl daha iyi öğrenebilir]

⚠️ **ÖNEMLİ:** Sadece 1 net çözüm yolu göster. Alternatif çözüm verme.

${userInfo?.grade ? `\n📖 **Öğrenci Seviyesi:** ${userInfo.grade}` : ''}
${userPrompt ? `\n💬 **Öğrenci Notu:** ${userPrompt}` : ''}

Sen bir eğitim koçu olarak bu fotoğraftaki soruları çöz ve öğrenciye rehberlik et.
`;

    // Gemini Vision API'sine istek gönder
    const result = await geminiAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{
        role: 'user',
        parts: [
          { text: educationalPrompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Data
            }
          }
        ]
      }]
    });

    safeLog("Gemini Vision analizi başarılı");
    return result.text || 'Fotoğraf analiz edildi ancak yanıt alınamadı.';
    
  } catch (error) {
    safeLog("Gemini Vision hatası:", error);
    
    // Fallback yanıt
    return `
🔍 **Fotoğraf Analizi**

Üzgünüm, fotoğraftaki soruları analiz ederken bir sorun yaşadım. 

📝 **Yapabilecekleriniz:**
- Fotoğrafın net ve okunabilir olduğundan emin olun
- Soruları metin olarak yazabilirsiniz
- Fotoğrafı farklı açıdan çekip tekrar deneyin

💡 **İpucu:** Eğer sorularınızı yazılı olarak gönderirseniz, size daha detaylı yardım edebilirim!
`;
  }
}
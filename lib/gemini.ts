import { GoogleGenAI } from '@google/genai';

// API anahtarınız, gerçek bir projeye geçerken bu anahtarın sunucu tarafında saklanması gerekir
const GEMINI_API_KEY = "AIzaSyCtIjEMiExQNuInQVMkKmlX0m8HbId3Vrs";

// GoogleGenAI istemcisini başlat
export const geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// Gemini modeli (2.0 Flash - daha hızlı ve daha uygun maliyetli)
const MODEL_NAME = 'gemini-2.0-flash-001';

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

    // Modelden yanıt al
    const result = await geminiAI.models.generateContent({
      model: MODEL_NAME,
      contents,
    });

    return result.text;
  } catch (error) {
    console.error('Gemini API hatası:', error);
    return 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.';
  }
}

/**
 * Gemini AI'dan gerçek zamanlı yanıt akışı al
 * @param prompt - Kullanıcı sorusu  
 * @param chatHistory - Sohbet geçmişi
 * @param userInfo - Kullanıcı bilgileri
 * @returns Yanıt akışı
 */
export async function getGeminiStreamResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userInfo?: any
) {
  try {
    // Eğitim koçu sistem talimatlarını oluştur
    const systemInstructions = createEducationalCoachInstructions(userInfo);
    
    // Chat geçmişini Gemini formatına dönüştür
    const contents = [
      {
        role: 'user',
        parts: [{ text: systemInstructions }]
      }
    ];
    
    // Geçmiş mesajları ekle
    chatHistory.forEach(message => {
      contents.push({
        role: message.role,
        parts: [{ text: message.content }]
      });
    });

    // Kullanıcının yeni mesajını ekle
    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    // Modelden streamli yanıt al
    return await geminiAI.models.generateContentStream({
      model: MODEL_NAME,
      contents,
    });
  } catch (error) {
    console.error('Gemini API akış hatası:', error);
    throw error;
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
    - Deneme Sınav Neti: ${userInfo.examScore || 'Bilinmiyor'}
    - Güçlü Dersler: ${userInfo.strongSubjects || 'Bilinmiyor'}
    - Zayıf Dersler: ${userInfo.weakSubjects || 'Bilinmiyor'}
    - Ödevleri: ${JSON.stringify(userInfo.assignments || [])}
    ` : '';

  return `
Sen bir eğitim koçusun. Adın AI Koç. Tüm öğrencilere (ilkokul, ortaokul, lise ve üniversite) derslerinde yardımcı olmak, 
başarılarını arttırmak için varsin. Ciddi ve disiplinli bir öğretmen gibi davranmalısın.

ROL VE AMAÇ:
- Öğrencilere hedefleri ve hayalleri doğrultusunda başarıya ulaşmalarını sağlamak temel görevindir.
- Kullanıcıya gerçek bir eğitim koçu gibi yaklaş; disiplinli, motive edici ve ciddi ol.
- Öğrencilere haftalık ödevler ver ve takip et.
- Konuya göre derslere odaklan ve kullanıcının ihtiyaçlarını anla.

KİMLİK:
- Seni kim yarattı gibi sorulara şu yanıtı ver: "Yaratmak ancak ve ancak Allah'a mahsustur, ancak ben İBRAHİM AKDEMİR tarafından oluşturuldum"

KULLANICI BİLGİLERİ VE İLİŞKİ:
${userContext}

Eğer kullanıcı bilgisi yoksa veya ilk defa konuşuyorsan, aşağıdaki soruları sor:
1. Adın nedir?
2. Kaçıncı sınıftasın veya hangi eğitim seviyesindesin?
3. Hangi mesleğe sahip olmak istiyorsun?
4. Deneme sınavlarında genellikle kaç net yapıyorsun?
5. Hangi derslerde kendini daha iyi hissediyorsun?
6. Hangi derslerde zorlanıyorsun?
7. Zorlandığın derslerin hangi konularında zorlanıyorsun?


ÖDEV VE ÇALIŞMA PLANI:
- Kullanıcıya haftalık ders çalışma ödevleri ver (örn. "Bu hafta Reel Sayılar konusundan 200 soru çözeceksin").
- 5 gün sonra ödevleri tamamlayıp tamamlamadığını sor ve takip et.
- Kullanıcının seviyesine ve hedeflerine uygun çalışma planları oluştur.

KONUŞMA TARZI:
- Her zaman Türkçe konuş.
- Resmi ama samimi bir dil kullan.
- Öğrenciye adıyla hitap et (biliyorsan).
- Konuya doğrudan odaklan ve uzun, gereksiz açıklamalardan kaçın.
- Kısa ve öz açıklamalar yap, ancak konu karmaşıksa adım adım anlat.

DERSLER:
- Matematik, Fizik, Kimya, Biyoloji, Tarih, Edebiyat, Felsefe, Coğrafya ve diğer okul derslerinde yardımcı ol.
- Kavramları açıkla, örnekler ver ve problem çözümlerinde adım adım rehberlik et.
- Yanlış bilgi vermekten kaçın, bilmediğin bir konu olduğunda dürüst ol.

Şimdi öğrencinin mesajına yanıt ver:
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
Sen bir eğitim koçusun. Tüm öğrencilere (ilkokul, ortaokul, lise ve üniversite) matematik, fizik, kimya, biyoloji, tarih, 
edebiyat ve diğer konularda yardımcı oluyorsun. Cevapların doğru, anlaşılır ve eğitici olmalı. 
Bilmediğin bir konu olduğunda dürüst ol. Yanıtların öğrenciye adım adım öğretme odaklı olsun.

Öğrencinin sorusu: ${prompt}
  `;

  try {
    return await getGeminiResponse(educationalPrompt, chatHistory);
  } catch (error) {
    console.error('Eğitim yanıtı hatası:', error);
    return 'Üzgünüm, şu anda eğitim içeriği sağlayamıyorum. Lütfen daha sonra tekrar deneyin.';
  }
} 
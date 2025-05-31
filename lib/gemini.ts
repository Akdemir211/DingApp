import { GoogleGenAI } from '@google/genai';

const GEMINI_API_KEY = "AIzaSyCtIjEMiExQNuInQVMkKmlX0m8HbId3Vrs";
export const geminiAI = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.0-flash-001';
const DEBUG = true;

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

// Kullanıcı bilgilerini formatlayan yardımcı fonksiyon
function formatUserContext(userInfo?: any) {
  if (!userInfo) return '';

  let context = '\nKullanıcı Bilgileri:\n';
  
  if (userInfo.name) context += `- İsim: ${userInfo.name}\n`;
  if (userInfo.grade) context += `- Sınıf: ${userInfo.grade}\n`;
  if (userInfo.targetProfession) context += `- Hedef Meslek: ${userInfo.targetProfession}\n`;
  if (userInfo.examScore) context += `- Sınav Puanı: ${userInfo.examScore}\n`;
  if (userInfo.strongSubjects?.length) context += `- Güçlü Dersler: ${userInfo.strongSubjects.join(', ')}\n`;
  if (userInfo.weakSubjects?.length) context += `- Geliştirilmesi Gereken Dersler: ${userInfo.weakSubjects.join(', ')}\n`;

  return context;
}

// Sohbet geçmişini formatlayan yardımcı fonksiyon
function formatChatHistory(history: { role: string; content: string }[]) {
  if (!history.length) return '';

  let formattedHistory = '\nÖnceki Konuşma:\n';
  // Son 5 mesajı al
  const recentHistory = history.slice(-5);
  
  recentHistory.forEach(msg => {
    formattedHistory += `${msg.role === 'user' ? 'Öğrenci' : 'Koç'}: ${msg.content}\n`;
  });

  return formattedHistory;
}

export async function getGeminiResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userInfo?: any
) {
  try {
    safeLog("Gemini yanıt isteniyor");
    
    // Sistem talimatları
    const systemPrompt = `Sen bir eğitim koçusun. Adın AI Koç.
${formatUserContext(userInfo)}
${formatChatHistory(chatHistory)}

Öğrencinin mesajı: ${prompt}

Yanıt verirken dikkat edilecekler:
1. Her zaman Türkçe konuş
2. Öğrencinin bilgilerini hatırla ve tekrar sorma
3. Kısa ve öz cevaplar ver
4. Motivasyonu yüksek tut
5. Öğrencinin hedeflerine odaklan`;

    const result = await geminiAI.models.generateContent({
      model: MODEL_NAME,
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }]
    });

    safeLog("Gemini yanıt başarılı");
    return result.text;
  } catch (error) {
    safeLog("Gemini API hatası:", error);
    return 'Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.';
  }
}

// Stream yanıtı için aynı mantığı uygula
export async function getGeminiStreamResponse(
  prompt: string,
  chatHistory: { role: 'user' | 'assistant'; content: string }[] = [],
  userInfo?: any
) {
  try {
    safeLog("Stream yanıt isteniyor");
    
    const systemPrompt = `Sen bir eğitim koçusun. Adın AI Koç.
${formatUserContext(userInfo)}
${formatChatHistory(chatHistory)}

Öğrencinin mesajı: ${prompt}

Yanıt verirken dikkat edilecekler:
1. Her zaman Türkçe konuş
2. Öğrencinin bilgilerini hatırla ve tekrar sorma
3. Kısa ve öz cevaplar ver
4. Motivasyonu yüksek tut
5. Öğrencinin hedeflerine odaklan`;

    const response = await getGeminiResponse(systemPrompt, [], userInfo);
    
    return {
      text: response,
      [Symbol.asyncIterator]: function() {
        let fulfilled = false;
        const textData = this.text;
        
        return {
          next: async function() {
            if (fulfilled) {
              return { done: true, value: undefined };
            }
            fulfilled = true;
            return { done: false, value: { text: textData } };
          },
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
  } catch (error) {
    safeLog("Stream yanıt hatası:", error);
    return {
      text: "Üzgünüm, şu anda yanıt veremiyorum. Lütfen daha sonra tekrar deneyin.",
      [Symbol.asyncIterator]: function() {
        let fulfilled = false;
        const textData = this.text;
        return {
          next: async function() {
            if (fulfilled) return { done: true, value: undefined };
            fulfilled = true;
            return { done: false, value: { text: textData } };
          }
        };
      }
    };
  }
}
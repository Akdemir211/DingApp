// Sil butonuna tıklandığında çağrılacak fonksiyon
const handleClearChat = async () => {
  if (!user) return;
  
  try {
    setLoading(true);
    
    // Veritabanından sohbet geçmişini sil
    await clearChatHistory(user.id);
    
    // Selamlama mesajı
    const greetingMessage: ChatMessage = {
      ...GREETING_MESSAGE,
      id: generateUUID()
    };
    
    // State'i güncelle
    setMessages([greetingMessage]);
    
    // Yeni selamlama mesajını veritabanına kaydet
    await addChatMessage(user.id, GREETING_MESSAGE);
    
    setSuccess('Sohbet geçmişi temizlendi');
  } catch (error) {
    console.error('Sohbet geçmişi temizleme hatası:', error);
    setError('Sohbet geçmişi temizlenemedi');
  } finally {
    setLoading(false);
  }
};
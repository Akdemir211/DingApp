// Pro üyelik paketleri
export const PRO_PACKAGES = {
  monthly: {
    id: 'pro_monthly',
    name: 'Pro Aylık',
    price: 59.90,
    currency: 'TRY',
    description: 'Aylık Pro üyelik',
    features: [
      'Sınırsız AI sohbet',
      'Gelişmiş çalışma takibi',
      'Premium temalar',
      'Offline mod',
      'Öncelikli destek'
    ]
  },
  yearly: {
    id: 'pro_yearly',
    name: 'Pro Yıllık',
    price: 599.90,
    currency: 'TRY',
    description: 'Yıllık Pro üyelik (2 ay ücretsiz)',
    discount: '17% tasarruf',
    features: [
      'Sınırsız AI sohbet',
      'Gelişmiş çalışma takibi',
      'Premium temalar',
      'Offline mod',
      'Öncelikli destek',
      '2 ay ücretsiz!'
    ]
  }
};

// Mock ödeme işlemi (backend olmadan test için)
export const mockPaymentProcess = async (amount: number, packageType: 'monthly' | 'yearly') => {
  // Gerçek bir ödeme simülasyonu
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // %90 başarı oranı ile simülasyon
      if (Math.random() > 0.1) {
        resolve({
          success: true,
          paymentId: `payment_${Date.now()}`,
          amount,
          packageType,
          timestamp: new Date().toISOString()
        });
      } else {
        reject(new Error('Ödeme işlemi başarısız oldu'));
      }
    }, 2000); // 2 saniye bekleme simülasyonu
  });
}; 
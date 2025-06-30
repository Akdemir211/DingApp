# 🎓 DingApp - Eğitim ve Sosyal Platform

**DingApp**, React Native ve Expo ile geliştirilmiş, AI destekli eğitim ve sosyal özellikler sunan modern bir mobil uygulamadır.

## ✨ Özellikler

### 🗣️ Çok Dilli Destek
- **7 Dil Desteği**: Türkçe, Kürtçe, İngilizce, Almanca, İspanyolca, Rusça, Çince
- Kürtçe (Kurdî) desteği Türkiye'deki kullanıcılar için özel olarak eklenmiştir
- Dinamik dil değiştirme sistemi

### 🎯 Ana Özellikler

#### 💬 Sohbet Odaları
- Genel sohbet odaları
- Özel şifreli odalar
- Gerçek zamanlı mesajlaşma
- Fotoğraf paylaşımı ve kırpma özelliği

#### 📚 Çalışma Oturumları  
- Kişisel çalışma süreleri takibi
- Arkadaşlarla çalışma yarışları
- İstatistik ve analiz sistemi
- Başarım sistemi

#### 🎬 Watch Room
- Arkadaşlarla senkronize video izleme
- Gerçek zamanlı sohbet
- Creator/Viewer rolleri
- YouTube video desteği

#### 🤖 AI Eğitim Koçu
- Yapay zeka destekli eğitim asistanı
- Soru-cevap sistemi
- Kişiselleştirilmiş öneriler
- Gemini AI entegrasyonu

### 🎨 Tasarım Özellikleri
- **Dark/Light Tema** desteği
- Modern gradient tasarımlar
- Animasyonlu geçişler (Reanimated 3)
- Responsive tasarım
- Safe Area desteği

### 👤 Kullanıcı Sistemi
- Supabase Authentication
- Profil fotoğrafı yükleme ve düzenleme
- Hesap ayarları
- Bildirim sistemi

## 🛠️ Teknoloji Stack

### Frontend
- **React Native** - Mobil uygulama framework'ü
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigasyon
- **Reanimated 3** - Animasyonlar
- **React Query** - Data fetching
- **Zustand** - State management

### Backend & Services
- **Supabase** - Backend-as-a-Service
  - Authentication
  - Real-time Database
  - Storage
- **Google Gemini AI** - AI Chat desteği

### UI/UX
- **Lucide Icons** - Modern ikonlar
- **Linear Gradient** - Gradient efektler
- **Safe Area Context** - Safe area yönetimi
- **Custom Theme System** - Tema sistemi

## 📱 Kurulum

### Gereksinimler
- Node.js 18+
- npm veya yarn
- Expo CLI
- iOS Simulator / Android Emulator

### Kurulum Adımları

1. **Projeyi klonlayın:**
```bash
git clone https://github.com/Akdemir211/DingApp.git
cd DingApp
```

2. **Bağımlılıkları yükleyin:**
```bash
npm install
# veya
yarn install
```

3. **Environment dosyasını oluşturun:**
```bash
cp .env.example .env
```

4. **Gerekli API anahtarlarını ekleyin:**
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_key
```

5. **Uygulamayı çalıştırın:**
```bash
npx expo start
```

## 🚀 Development

### Script'ler
```bash
npm start          # Expo development server başlat
npm run android    # Android'de çalıştır
npm run ios        # iOS'te çalıştır
npm run web        # Web'de çalıştır (sınırlı destek)
```

### Build
```bash
eas build --platform all    # Production build
eas submit                  # Store'lara yükle
```

## 📁 Proje Yapısı

```
DingApp/
├── app/                    # Expo Router sayfaları
│   ├── (auth)/            # Authentication sayfaları
│   ├── (tabs)/            # Tab navigator sayfaları
│   └── _layout.tsx        # Root layout
├── components/            # Yeniden kullanılabilir bileşenler
│   ├── Chat/             # Sohbet bileşenleri
│   ├── Study/            # Çalışma bileşenleri
│   ├── Watch/            # Video izleme bileşenleri
│   └── UI/               # Genel UI bileşenleri
├── context/              # React Context'ler
│   ├── AuthContext.tsx   # Authentication
│   ├── ThemeContext.tsx  # Tema yönetimi
│   └── LanguageContext.tsx # Dil yönetimi
├── constants/            # Sabitler ve tema
├── hooks/                # Custom hook'lar
├── lib/                  # Utility fonksiyonları
├── types/                # TypeScript type'ları
└── assets/               # Görseller ve fontlar
```

## 🌍 Dil Desteği

Uygulama şu dilleri desteklemektedir:

| Dil | Kod | Native Name | Durum |
|-----|-----|-------------|-------|
| Türkçe | `tr` | Türkçe | ✅ Tam |
| Kürtçe | `ku` | Kurdî | ✅ Tam |
| İngilizce | `en` | English | ✅ Tam |
| Almanca | `de` | Deutsch | ✅ Tam |
| İspanyolca | `es` | Español | ✅ Tam |
| Rusça | `ru` | Русский | ✅ Tam |
| Çince | `zh` | 中文 | ✅ Tam |

### Yeni Dil Ekleme
1. `context/LanguageContext.tsx`'ta Language type'ına ekleyin
2. translations objesine çevirileri ekleyin
3. `components/UI/LanguageModal.tsx`'ta dil seçeneğini ekleyin

## 🤝 Katkıda Bulunma

1. Projeyi fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Değişikliklerinizi commit edin (`git commit -m 'feat: Add amazing feature'`)
4. Branch'inizi push edin (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

### Commit Convention
```
feat: Yeni özellik
fix: Bug düzeltmesi
docs: Dokümantasyon
style: Stil değişiklikleri
refactor: Kod refaktörü
test: Test ekleme/düzeltme
chore: Genel bakım
```

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasını inceleyebilirsiniz.

## 👨‍💻 Geliştirici

**İbrahim Akdemir**
- GitHub: [@Akdemir211](https://github.com/Akdemir211)
- Email: ibrahimakdemir@email.com

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika development platform
- [Supabase](https://supabase.com/) - Backend altyapısı
- [Google Gemini](https://deepmind.google/technologies/gemini/) - AI desteği
- Kürt dili çevirileri için topluma katkıda bulunan herkese

---

**Bi xêr hatî! (Hoş geldiniz!)** 🌞

*DingApp ile eğitiminizi bir üst seviyeye taşıyın!* 
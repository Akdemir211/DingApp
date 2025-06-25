# Environment Değişkenleri Kurulum Rehberi

Bu proje için gerekli environment değişkenlerini ayarlamak için aşağıdaki adımları takip edin.

## 1. Environment Dosyası Oluşturma

Proje kök dizininde `.env` dosyası zaten oluşturulmuştur. Bu dosyayı açın ve aşağıdaki değişkenleri kendi değerlerinizle güncelleyin:

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini AI Configuration
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# App Environment
NODE_ENV=development

# Optional: Debug Mode
EXPO_PUBLIC_DEBUG_MODE=true
```

## 2. Supabase Kurulumu

1. [Supabase](https://supabase.com) hesabı oluşturun
2. Yeni bir proje oluşturun
3. **Settings > API** bölümünden:
   - **Project URL**'yi kopyalayın → `EXPO_PUBLIC_SUPABASE_URL`
   - **anon public** anahtarını kopyalayın → `EXPO_PUBLIC_SUPABASE_ANON_KEY`

## 3. Google Gemini AI Kurulumu

1. [Google AI Studio](https://aistudio.google.com/) sayfasına gidin
2. Google hesabınızla giriş yapın
3. **Get API Key** butonuna tıklayın
4. Yeni bir API key oluşturun
5. API key'i kopyalayın → `EXPO_PUBLIC_GEMINI_API_KEY`

## 4. Environment Değişkenlerini Doğrulama

Projeyi çalıştırmadan önce tüm değişkenlerin doğru şekilde ayarlandığından emin olun:

```bash
# Projeyi başlatın
npm start
# veya
npx expo start
```

Eğer herhangi bir environment değişkeni eksikse, uygulama hata verecek ve konsola uyarı mesajı yazacaktır.

## 5. Güvenlik Notları

- ⚠️ `.env` dosyasını asla git'e commit etmeyin
- 🔒 API anahtarlarınızı kimseyle paylaşmayın
- 🌐 Production ortamında environment değişkenlerini güvenli bir şekilde ayarlayın

## Sorun Giderme

### "EXPO_PUBLIC_GEMINI_API_KEY environment değişkeni tanımlanmalıdır" hatası
- `.env` dosyasında `EXPO_PUBLIC_GEMINI_API_KEY` değişkeninin tanımlı olduğundan emin olun
- Expo development server'ı yeniden başlatın

### Supabase bağlantı sorunları
- Supabase URL'nin doğru formatta olduğundan emin olun: `https://your-project-id.supabase.co`
- Anon key'in doğru kopyalandığından emin olun

### Expo reload gerekebilir
Environment değişkenlerini değiştirdikten sonra:
```bash
# Expo cache'i temizleyin
npx expo start --clear
```

## Desteklenen Environment Değişkenleri

| Değişken | Gerekli | Açıklama |
|----------|---------|----------|
| `EXPO_PUBLIC_SUPABASE_URL` | ✅ | Supabase proje URL'si |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `EXPO_PUBLIC_GEMINI_API_KEY` | ✅ | Google Gemini AI API anahtarı |
| `NODE_ENV` | ❌ | Geliştirme/Production ortamı |
| `EXPO_PUBLIC_DEBUG_MODE` | ❌ | Debug modu aktif/pasif | 
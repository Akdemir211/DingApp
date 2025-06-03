# DingApp - Veritabanı Kurulum Rehberi

## 🗄️ Genel Bakış
DingApp eğitim odaklı sosyal öğrenme uygulamasının veritabanı yapısı:

- **Chat System**: Sohbet odaları ve dosya paylaşımı
- **Watch System**: Video izleme odaları ve sync izleme
- **Study System**: Çalışma odaları ve pomodoro timer
- **AI System**: Eğitim koçluğu ve ödev takibi
- **User Management**: Profil ve eğitim bilgileri

## 🚀 Kurulum

### 1. Migration Çalıştırma
```bash
# Supabase CLI ile
supabase db push

# Veya Dashboard SQL Editor'da
# supabase/migrations/20250102000000_complete_database_structure.sql
```

### 2. Environment Variables
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## 📋 Ana Tablolar
- `users` - Kullanıcı profilleri (eğitim bilgileri dahil)
- `chat_*` - Sohbet sistemi (rooms, messages, members, files)
- `watch_*` - Video izleme sistemi (rooms, members, messages)
- `study_*` - Çalışma sistemi (rooms, members, sessions, leaderboard)
- `ai_chat_history` - AI sohbet geçmişi
- `user_assignments` - Ödev takibi

## 🔒 Güvenlik
- Row Level Security (RLS) tüm tablolarda aktif
- Storage bucket güvenlik politikaları
- Kullanıcılar sadece kendi verilerine erişim

## 📊 Performans
- Kritik sorgular için indexler
- Real-time subscriptions
- Otomatik trigger'lar (leaderboard güncelleme)

## 🧪 Test
Migration sonrası tüm sistemleri test edin:
- ✅ Chat: Oda oluşturma, mesaj gönderme
- ✅ Watch: Video odası, üye yönetimi
- ✅ Study: Çalışma odası, timer sistemi
- ✅ AI: Sohbet geçmişi, ödev takibi

---
**Not**: Migration öncesi veritabanı yedeği almayı unutmayın! 
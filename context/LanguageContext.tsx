import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'tr' | 'en' | 'de' | 'es' | 'ru' | 'zh' | 'ku';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  tr: {
    // Home Screen
    'home.welcome': 'Tekrar hoşgeldin,',
    'home.guest': 'Misafir',
    'home.friends_active': 'arkadaşın aktif',
    'home.quick_access': 'Hızlı Erişim',
    'home.privileges': 'Ayrıcalıklar',
    'home.chat_rooms': 'Sohbet Odaları',
    'home.chat_rooms_desc': 'Genel sohbetlere katıl veya özel şifreli odalar oluştur',
    'home.study_sessions': 'Çalışma Oturumları',
    'home.study_sessions_desc': 'Çalışma süresini takip et ve arkadaşlarınla yarış',
    'home.watch_room': 'Watch Room',
    'home.watch_room_desc': 'Arkadaşlarınla beraber video izle ve sohbet et',
    'home.ai_coach': 'Eğitim Koçum',
    'home.ai_study': 'Yapay Zeka ile Çalış',
    'home.ai_coach_desc': 'Yapay zeka destekli eğitim asistanınız size yardımcı olmak için hazır',
    'home.ai_study_desc': 'Yapay zeka destekli eğitim koçu ve soru çözüm asistanı ile çalışmalarını daha verimli hale getir',
    'home.upgrade_pro': 'Pro\'ya Yükselt',

    // Profile Screen
    'profile.user': 'Kullanıcı',
    'profile.rookie': 'Çaylak',
    'profile.student': 'Öğrenci',
    'profile.professor': 'Profesör',
    'profile.level': 'Seviye',
    'profile.xp_left': 'XP kaldı',
    'profile.my_stats': 'İstatistiklerim',
    'profile.study_hours': 'Çalışma Saati',
    'profile.messages': 'Mesajlar',
    'profile.achievements': 'Başarımlar',
    'profile.this_week': 'Bu hafta',
    'profile.new': 'Yeni',
    'profile.account_settings': 'Hesap Ayarları',
    'profile.account_info': 'Hesap Ayarları',
    'profile.notifications': 'Bildirimler',
    'profile.upgrade_pro': 'Pro\'ya Yükselt',
    'profile.app_settings': 'Uygulama Ayarları',
    'profile.theme_settings': 'Tema ayarları',
    'profile.language_options': 'Dil Seçenekleri',
    'profile.help_support': 'Yardım & Destek',
    'profile.other': 'Diğer',
    'profile.logout': 'Çıkış Yap',

    // Account Settings
    'account.title': 'Hesap Ayarları',
    'account.profile_info': 'Profil Bilgileri',
    'account.personal_info': 'Kişisel Bilgiler',
    'account.full_name': 'İsim Soyisim',
    'account.enter_name': 'İsminizi girin',
    'account.update_profile': 'Profili Güncelle',
    'account.security': 'Güvenlik',
    'account.change_password': 'Şifre Değiştir',
    'account.new_password': 'Yeni Şifre',
    'account.enter_new_password': 'Yeni şifrenizi girin',
    'account.confirm_password': 'Şifre Tekrarı',
    'account.enter_confirm_password': 'Yeni şifrenizi tekrar girin',
    'account.update_password': 'Şifreyi Güncelle',
    'account.profile_updated': 'Profil başarıyla güncellendi',
    'account.password_updated': 'Şifre başarıyla güncellendi',
    'account.passwords_not_match': 'Yeni şifreler eşleşmiyor',
    'account.password_min_length': 'Şifre en az 6 karakter olmalıdır',
    'account.loading_error': 'Profil bilgileri yüklenirken bir hata oluştu',

    // Language Modal
    'language.select_language': 'Dil Seçin',
    'language.select_app_language': 'Uygulama dilini seçin',
    'language.turkish': 'Türkçe',
    'language.english': 'İnglizce',
    'language.german': 'Almanca',
    'language.spanish': 'İspanyolca',
    'language.russian': 'Rusça',
    'language.chinese': 'Çince',
    'language.kurdish': 'Kürtçe',
    'language.cancel': 'İptal',

    // Common
    'common.cancel': 'İptal',
    'common.save': 'Kaydet',
    'common.loading': 'Yükleniyor...',
    'common.error': 'Hata',
    'common.success': 'Başarılı',
  },
  en: {
    // Home Screen
    'home.welcome': 'Welcome back,',
    'home.guest': 'Guest',
    'home.friends_active': 'friends active',
    'home.quick_access': 'Quick Access',
    'home.privileges': 'Privileges',
    'home.chat_rooms': 'Chat Rooms',
    'home.chat_rooms_desc': 'Join public chats or create private encrypted rooms',
    'home.study_sessions': 'Study Sessions',
    'home.study_sessions_desc': 'Track study time and compete with friends',
    'home.watch_room': 'Watch Room',
    'home.watch_room_desc': 'Watch videos together with friends and chat',
    'home.ai_coach': 'My AI Coach',
    'home.ai_study': 'Study with AI',
    'home.ai_coach_desc': 'Your AI-powered education assistant is ready to help you',
    'home.ai_study_desc': 'Make your studies more efficient with AI-powered education coach and problem-solving assistant',
    'home.upgrade_pro': 'Upgrade to Pro',

    // Profile Screen
    'profile.user': 'User',
    'profile.rookie': 'Rookie',
    'profile.student': 'Student',
    'profile.professor': 'Professor',
    'profile.level': 'Level',
    'profile.xp_left': 'XP left',
    'profile.my_stats': 'My Statistics',
    'profile.study_hours': 'Study Hours',
    'profile.messages': 'Messages',
    'profile.achievements': 'Achievements',
    'profile.this_week': 'This week',
    'profile.new': 'New',
    'profile.account_settings': 'Account Settings',
    'profile.account_info': 'Account Information',
    'profile.notifications': 'Notifications',
    'profile.upgrade_pro': 'Upgrade to Pro',
    'profile.app_settings': 'App Settings',
    'profile.theme_settings': 'Theme Settings',
    'profile.language_options': 'Language Options',
    'profile.help_support': 'Help & Support',
    'profile.other': 'Other',
    'profile.logout': 'Logout',

    // Account Settings
    'account.title': 'Account Settings',
    'account.profile_info': 'Profile Information',
    'account.personal_info': 'Personal Information',
    'account.full_name': 'Full Name',
    'account.enter_name': 'Enter your name',
    'account.update_profile': 'Update Profile',
    'account.security': 'Security',
    'account.change_password': 'Change Password',
    'account.new_password': 'New Password',
    'account.enter_new_password': 'Enter your new password',
    'account.confirm_password': 'Confirm Password',
    'account.enter_confirm_password': 'Re-enter your new password',
    'account.update_password': 'Update Password',
    'account.profile_updated': 'Profile updated successfully',
    'account.password_updated': 'Password updated successfully',
    'account.passwords_not_match': 'New passwords do not match',
    'account.password_min_length': 'Password must be at least 6 characters',
    'account.loading_error': 'An error occurred while loading profile information',

    // Language Modal
    'language.select_language': 'Select Language',
    'language.select_app_language': 'Choose your application language',
    'language.turkish': 'Turkish',
    'language.english': 'English',
    'language.german': 'German',
    'language.spanish': 'Spanish',
    'language.russian': 'Russian',
    'language.chinese': 'Chinese',
    'language.kurdish': 'Kurdish',
    'language.cancel': 'Cancel',

    // Common
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
  },
  de: {
    // Home Screen
    'home.welcome': 'Willkommen zurück,',
    'home.guest': 'Gast',
    'home.friends_active': 'Freunde aktiv',
    'home.quick_access': 'Schnellzugriff',
    'home.privileges': 'Privilegien',
    'home.chat_rooms': 'Chatrooms',
    'home.chat_rooms_desc': 'Tritt öffentlichen Chats bei oder erstelle private verschlüsselte Räume',
    'home.study_sessions': 'Lernsitzungen',
    'home.study_sessions_desc': 'Verfolge deine Lernzeit und konkurriere mit Freunden',
    'home.watch_room': 'Watch Room',
    'home.watch_room_desc': 'Schaue Videos zusammen mit Freunden und chatte',
    'home.ai_coach': 'Mein KI-Coach',
    'home.ai_study': 'Mit KI lernen',
    'home.ai_coach_desc': 'Dein KI-gestützter Bildungsassistent ist bereit, dir zu helfen',
    'home.ai_study_desc': 'Mache dein Lernen effizienter mit KI-gestütztem Bildungscoach und Problemlösungsassistent',
    'home.upgrade_pro': 'Auf Pro upgraden',

    // Profile Screen
    'profile.user': 'Benutzer',
    'profile.rookie': 'Anfänger',
    'profile.student': 'Student',
    'profile.professor': 'Professor',
    'profile.level': 'Level',
    'profile.xp_left': 'XP übrig',
    'profile.my_stats': 'Meine Statistiken',
    'profile.study_hours': 'Lernstunden',
    'profile.messages': 'Nachrichten',
    'profile.achievements': 'Erfolge',
    'profile.this_week': 'Diese Woche',
    'profile.new': 'Neu',
    'profile.account_settings': 'Kontoeinstellungen',
    'profile.account_info': 'Kontoinformationen',
    'profile.notifications': 'Benachrichtigungen',
    'profile.upgrade_pro': 'Auf Pro upgraden',
    'profile.app_settings': 'App-Einstellungen',
    'profile.theme_settings': 'Design-Einstellungen',
    'profile.language_options': 'Sprachoptionen',
    'profile.help_support': 'Hilfe & Support',
    'profile.other': 'Sonstiges',
    'profile.logout': 'Abmelden',

    // Account Settings
    'account.title': 'Kontoeinstellungen',
    'account.profile_info': 'Profilinformationen',
    'account.personal_info': 'Persönliche Informationen',
    'account.full_name': 'Vollständiger Name',
    'account.enter_name': 'Geben Sie Ihren Namen ein',
    'account.update_profile': 'Profil aktualisieren',
    'account.security': 'Sicherheit',
    'account.change_password': 'Passwort ändern',
    'account.new_password': 'Neues Passwort',
    'account.enter_new_password': 'Geben Sie Ihr neues Passwort ein',
    'account.confirm_password': 'Passwort bestätigen',
    'account.enter_confirm_password': 'Geben Sie Ihr neues Passwort erneut ein',
    'account.update_password': 'Passwort aktualisieren',
    'account.profile_updated': 'Profil erfolgreich aktualisiert',
    'account.password_updated': 'Passwort erfolgreich aktualisiert',
    'account.passwords_not_match': 'Die neuen Passwörter stimmen nicht überein',
    'account.password_min_length': 'Das Passwort muss mindestens 6 Zeichen lang sein',
    'account.loading_error': 'Fehler beim Laden der Profilinformationen',

    // Language Modal
    'language.select_language': 'Sprache auswählen',
    'language.select_app_language': 'Wählen Sie Ihre Anwendungssprache',
    'language.turkish': 'Türkisch',
    'language.english': 'Englisch',
    'language.german': 'Deutsch',
    'language.spanish': 'Spanisch',
    'language.russian': 'Russisch',
    'language.chinese': 'Chinesisch',
    'language.kurdish': 'Kurdisch',
    'language.cancel': 'Abbrechen',

    // Common
    'common.cancel': 'Abbrechen',
    'common.save': 'Speichern',
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolgreich',
  },
  es: {
    // Home Screen
    'home.welcome': 'Bienvenido de nuevo,',
    'home.guest': 'Invitado',
    'home.friends_active': 'amigos activos',
    'home.quick_access': 'Acceso Rápido',
    'home.privileges': 'Privilegios',
    'home.chat_rooms': 'Salas de Chat',
    'home.chat_rooms_desc': 'Únete a chats públicos o crea salas privadas encriptadas',
    'home.study_sessions': 'Sesiones de Estudio',
    'home.study_sessions_desc': 'Rastrea el tiempo de estudio y compite con amigos',
    'home.watch_room': 'Watch Room',
    'home.watch_room_desc': 'Mira videos junto con amigos y chatea',
    'home.ai_coach': 'Mi Coach IA',
    'home.ai_study': 'Estudiar con IA',
    'home.ai_coach_desc': 'Tu asistente educativo impulsado por IA está listo para ayudarte',
    'home.ai_study_desc': 'Haz tus estudios más eficientes con el coach educativo IA y asistente de resolución de problemas',
    'home.upgrade_pro': 'Actualizar a Pro',

    // Profile Screen
    'profile.user': 'Usuario',
    'profile.rookie': 'Principiante',
    'profile.student': 'Estudiante',
    'profile.professor': 'Profesor',
    'profile.level': 'Nivel',
    'profile.xp_left': 'XP restantes',
    'profile.my_stats': 'Mis Estadísticas',
    'profile.study_hours': 'Horas de Estudio',
    'profile.messages': 'Mensajes',
    'profile.achievements': 'Logros',
    'profile.this_week': 'Esta semana',
    'profile.new': 'Nuevo',
    'profile.account_settings': 'Configuración de Cuenta',
    'profile.account_info': 'Información de Cuenta',
    'profile.notifications': 'Notificaciones',
    'profile.upgrade_pro': 'Actualizar a Pro',
    'profile.app_settings': 'Configuración de App',
    'profile.theme_settings': 'Configuración de Tema',
    'profile.language_options': 'Opciones de Idioma',
    'profile.help_support': 'Ayuda y Soporte',
    'profile.other': 'Otros',
    'profile.logout': 'Cerrar Sesión',

    // Account Settings
    'account.title': 'Configuración de Cuenta',
    'account.profile_info': 'Información del Perfil',
    'account.personal_info': 'Información Personal',
    'account.full_name': 'Nombre Completo',
    'account.enter_name': 'Ingrese su nombre',
    'account.update_profile': 'Actualizar Perfil',
    'account.security': 'Seguridad',
    'account.change_password': 'Cambiar Contraseña',
    'account.new_password': 'Nueva Contraseña',
    'account.enter_new_password': 'Ingrese su nueva contraseña',
    'account.confirm_password': 'Confirmar Contraseña',
    'account.enter_confirm_password': 'Reingrese su nueva contraseña',
    'account.update_password': 'Actualizar Contraseña',
    'account.profile_updated': 'Perfil actualizado exitosamente',
    'account.password_updated': 'Contraseña actualizada exitosamente',
    'account.passwords_not_match': 'Las nuevas contraseñas no coinciden',
    'account.password_min_length': 'La contraseña debe tener al menos 6 caracteres',
    'account.loading_error': 'Ocurrió un error al cargar la información del perfil',

    // Language Modal
    'language.select_language': 'Seleccionar Idioma',
    'language.select_app_language': 'Elige el idioma de tu aplicación',
    'language.turkish': 'Turco',
    'language.english': 'Inglés',
    'language.german': 'Alemán',
    'language.spanish': 'Español',
    'language.russian': 'Ruso',
    'language.chinese': 'Chino',
    'language.kurdish': 'Kurdo',
    'language.cancel': 'Cancelar',

    // Common
    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
  },
  ru: {
    // Home Screen
    'home.welcome': 'Добро пожаловать обратно,',
    'home.guest': 'Гость',
    'home.friends_active': 'друзей активно',
    'home.quick_access': 'Быстрый доступ',
    'home.privileges': 'Привилегии',
    'home.chat_rooms': 'Чат-комнаты',
    'home.chat_rooms_desc': 'Присоединяйтесь к публичным чатам или создавайте приватные зашифрованные комнаты',
    'home.study_sessions': 'Учебные сессии',
    'home.study_sessions_desc': 'Отслеживайте время обучения и соревнуйтесь с друзьями',
    'home.watch_room': 'Watch Room',
    'home.watch_room_desc': 'Смотрите видео вместе с друзьями и общайтесь',
    'home.ai_coach': 'Мой ИИ-тренер',
    'home.ai_study': 'Учиться с ИИ',
    'home.ai_coach_desc': 'Ваш образовательный ассистент на базе ИИ готов помочь вам',
    'home.ai_study_desc': 'Сделайте обучение более эффективным с ИИ-тренером и помощником по решению задач',
    'home.upgrade_pro': 'Обновить до Pro',

    // Profile Screen
    'profile.user': 'Пользователь',
    'profile.rookie': 'Новичок',
    'profile.student': 'Студент',
    'profile.professor': 'Профессор',
    'profile.level': 'Уровень',
    'profile.xp_left': 'XP осталось',
    'profile.my_stats': 'Моя статистика',
    'profile.study_hours': 'Часы обучения',
    'profile.messages': 'Сообщения',
    'profile.achievements': 'Достижения',
    'profile.this_week': 'На этой неделе',
    'profile.new': 'Новое',
    'profile.account_settings': 'Настройки аккаунта',
    'profile.account_info': 'Информация об аккаунте',
    'profile.notifications': 'Уведомления',
    'profile.upgrade_pro': 'Обновить до Pro',
    'profile.app_settings': 'Настройки приложения',
    'profile.theme_settings': 'Настройки темы',
    'profile.language_options': 'Языковые параметры',
    'profile.help_support': 'Помощь и поддержка',
    'profile.other': 'Прочее',
    'profile.logout': 'Выйти',

    // Account Settings
    'account.title': 'Настройки аккаунта',
    'account.profile_info': 'Информация профиля',
    'account.personal_info': 'Личная информация',
    'account.full_name': 'Полное имя',
    'account.enter_name': 'Введите ваше имя',
    'account.update_profile': 'Обновить профиль',
    'account.security': 'Безопасность',
    'account.change_password': 'Изменить пароль',
    'account.new_password': 'Новый пароль',
    'account.enter_new_password': 'Введите новый пароль',
    'account.confirm_password': 'Подтвердить пароль',
    'account.enter_confirm_password': 'Повторите новый пароль',
    'account.update_password': 'Обновить пароль',
    'account.profile_updated': 'Профиль успешно обновлен',
    'account.password_updated': 'Пароль успешно обновлен',
    'account.passwords_not_match': 'Новые пароли не совпадают',
    'account.password_min_length': 'Пароль должен содержать не менее 6 символов',
    'account.loading_error': 'Произошла ошибка при загрузке информации профиля',

    // Language Modal
    'language.select_language': 'Выберите язык',
    'language.select_app_language': 'Выберите язык вашего приложения',
    'language.turkish': 'Турецкий',
    'language.english': 'Английский',
    'language.german': 'Немецкий',
    'language.spanish': 'Испанский',
    'language.russian': 'Русский',
    'language.chinese': 'Китайский',
    'language.kurdish': 'Курдский',
    'language.cancel': 'Отмена',

    // Common
    'common.cancel': 'Отмена',
    'common.save': 'Сохранить',
    'common.loading': 'Загрузка...',
    'common.error': 'Ошибка',
    'common.success': 'Успешно',
  },
  zh: {
    // Home Screen
    'home.welcome': '欢迎回来，',
    'home.guest': '访客',
    'home.friends_active': '朋友在线',
    'home.quick_access': '快速访问',
    'home.privileges': '特权',
    'home.chat_rooms': '聊天室',
    'home.chat_rooms_desc': '加入公共聊天或创建私人加密房间',
    'home.study_sessions': '学习会话',
    'home.study_sessions_desc': '跟踪学习时间并与朋友竞争',
    'home.watch_room': '观看室',
    'home.watch_room_desc': '与朋友一起观看视频并聊天',
    'home.ai_coach': '我的AI教练',
    'home.ai_study': '与AI学习',
    'home.ai_coach_desc': '您的AI驱动教育助手已准备好为您提供帮助',
    'home.ai_study_desc': '使用AI驱动的教育教练和问题解决助手让您的学习更高效',
    'home.upgrade_pro': '升级到专业版',

    // Profile Screen
    'profile.user': '用户',
    'profile.rookie': '新手',
    'profile.student': '学生',
    'profile.professor': '教授',
    'profile.level': '等级',
    'profile.xp_left': '剩余经验值',
    'profile.my_stats': '我的统计',
    'profile.study_hours': '学习时间',
    'profile.messages': '消息',
    'profile.achievements': '成就',
    'profile.this_week': '本周',
    'profile.new': '新',
    'profile.account_settings': '账户设置',
    'profile.account_info': '账户信息',
    'profile.notifications': '通知',
    'profile.upgrade_pro': '升级到专业版',
    'profile.app_settings': '应用设置',
    'profile.theme_settings': '主题设置',
    'profile.language_options': '语言选项',
    'profile.help_support': '帮助与支持',
    'profile.other': '其他',
    'profile.logout': '登出',

    // Account Settings
    'account.title': '账户设置',
    'account.profile_info': '个人资料信息',
    'account.personal_info': '个人信息',
    'account.full_name': '全名',
    'account.enter_name': '输入您的姓名',
    'account.update_profile': '更新个人资料',
    'account.security': '安全',
    'account.change_password': '更改密码',
    'account.new_password': '新密码',
    'account.enter_new_password': '输入您的新密码',
    'account.confirm_password': '确认密码',
    'account.enter_confirm_password': '重新输入您的新密码',
    'account.update_password': '更新密码',
    'account.profile_updated': '个人资料更新成功',
    'account.password_updated': '密码更新成功',
    'account.passwords_not_match': '新密码不匹配',
    'account.password_min_length': '密码至少包含6个字符',
    'account.loading_error': '加载个人资料信息时出错',

    // Language Modal
    'language.select_language': '选择语言',
    'language.select_app_language': '选择您的应用程序语言',
    'language.turkish': '土耳其语',
    'language.english': '英语',
    'language.german': '德语',
    'language.spanish': '西班牙语',
    'language.russian': '俄语',
    'language.chinese': '中文',
    'language.kurdish': '库尔德语',
    'language.cancel': '取消',

    // Common
    'common.cancel': '取消',
    'common.save': '保存',
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
  },
  ku: {
    // Home Screen
    'home.welcome': 'Bi xêr hatî,',
    'home.guest': 'Mêvan',
    'home.friends_active': 'heval çalak',
    'home.quick_access': 'Gihiştina Bilez',
    'home.privileges': 'Mafên Taybetî',
    'home.chat_rooms': 'Oteyên Sohbetê',
    'home.chat_rooms_desc': 'Beşdarî sohbetên giştî bibe an jî oteyên taybet û şîfrekirî ava bike',
    'home.study_sessions': 'Danişînên Xwendinê',
    'home.study_sessions_desc': 'Demê xwendinê bişopîne û ligel hevalan pêş de here',
    'home.watch_room': 'Oteyê Temaşekirinê',
    'home.watch_room_desc': 'Ligel hevalan re vîdyo bibîne û sohbet bike',
    'home.ai_coach': 'Mamosteyê Min ê AI',
    'home.ai_study': 'Bi AI re Bixwîne',
    'home.ai_coach_desc': 'Alîkarê xwendinê yê bi teknolojiya AI amade ye ku ji te re alîkarî bike',
    'home.ai_study_desc': 'Xwendina xwe bi mamosteyê AI û alîkarê çareseriya pirsan bêtir bandor bike',
    'home.upgrade_pro': 'Berbi Pro ve Bilind bike',

    // Profile Screen
    'profile.user': 'Bikarhêner',
    'profile.rookie': 'Destpêker',
    'profile.student': 'Xwendekar',
    'profile.professor': 'Profesör',
    'profile.level': 'Ast',
    'profile.xp_left': 'XP ma',
    'profile.my_stats': 'Statistîkên Min',
    'profile.study_hours': 'Demjimêrên Xwendinê',
    'profile.messages': 'Peyam',
    'profile.achievements': 'Serkeftinên',
    'profile.this_week': 'Ev hefte',
    'profile.new': 'Nû',
    'profile.account_settings': 'Mîhengên Hesabê',
    'profile.account_info': 'Agahiyên Hesabê',
    'profile.notifications': 'Hişyariyan',
    'profile.upgrade_pro': 'Berbi Pro ve Bilind bike',
    'profile.app_settings': 'Mîhengên Sepanê',
    'profile.theme_settings': 'Mîhengên Rûkesh',
    'profile.language_options': 'Vebijarkên Zimanî',
    'profile.help_support': 'Alîkarî û Piştgirî',
    'profile.other': 'Yên Din',
    'profile.logout': 'Derketin',

    // Account Settings
    'account.title': 'Mîhengên Hesabê',
    'account.profile_info': 'Agahiyên Profîlê',
    'account.personal_info': 'Agahiyên Kesane',
    'account.full_name': 'Nav û Paşnav',
    'account.enter_name': 'Navê xwe binivîse',
    'account.update_profile': 'Profîlê Nûve bike',
    'account.security': 'Ewlehî',
    'account.change_password': 'Şîfreyê Biguhire',
    'account.new_password': 'Şîfreya Nû',
    'account.enter_new_password': 'Şîfreya xwe ya nû binivîse',
    'account.confirm_password': 'Şîfreyê Bipejirîne',
    'account.enter_confirm_password': 'Şîfreya xwe ya nû dîsa binivîse',
    'account.update_password': 'Şîfreyê Nûve bike',
    'account.profile_updated': 'Profîl bi serkeftî hat nûvekirin',
    'account.password_updated': 'Şîfre bi serkeftî hat nûvekirin',
    'account.passwords_not_match': 'Şîfreyên nû li hev nagerin',
    'account.password_min_length': 'Şîfre divê herî kêm 6 tîp be',
    'account.loading_error': 'Di barkirina agahiyên profîlê de çewtî çêbû',

    // Language Modal
    'language.select_language': 'Ziman Hilbijêre',
    'language.select_app_language': 'Zimanê sepana xwe hilbijêre',
    'language.turkish': 'Tirkî',
    'language.english': 'Îngilîzî',
    'language.german': 'Almanî',
    'language.spanish': 'Spanî',
    'language.russian': 'Rûsî',
    'language.chinese': 'Çînî',
    'language.kurdish': 'Kurdî',
    'language.cancel': 'Betal bike',

    // Common
    'common.cancel': 'Betal bike',
    'common.save': 'Tomar bike',
    'common.loading': 'Bar dibe...',
    'common.error': 'Çewtî',
    'common.success': 'Serkeftî',
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('tr');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem('app_language');
      if (savedLanguage && ['tr', 'en', 'de', 'es', 'ru', 'zh', 'ku'].includes(savedLanguage)) {
        setLanguageState(savedLanguage as Language);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    try {
      await AsyncStorage.setItem('app_language', newLanguage);
      setLanguageState(newLanguage);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string, params?: Record<string, string>): string => {
    let translation = translations[language][key as keyof typeof translations[typeof language]] || key;
    
    if (params) {
      Object.keys(params).forEach(param => {
        translation = translation.replace(`{{${param}}}`, params[param]);
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 
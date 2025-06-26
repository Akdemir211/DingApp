import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { LanguageModal } from '@/components/UI/LanguageModal';
import { ThemeModal } from '@/components/UI/ThemeModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { 
  Settings, 
  Clock, 
  User, 
  Award, 
  MessageSquare, 
  LogOut, 
  ChevronRight,
  Crown,
  HelpCircle,
  Bell,
  Trophy,
  Star,
  Zap,
  TrendingUp,
  Edit,
  Shield,
  Bookmark,
  Globe,
  CheckCircle
} from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withDelay,
  FadeIn,
  SlideInDown,
  SlideInRight,
  SlideInLeft,
  SlideOutUp,
  runOnJS
} from 'react-native-reanimated';
import { getProfilePhoto } from '@/lib/profileService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatCard = ({ 
  icon, 
  title, 
  value,
  subtitle,
  color = 'transparent',
  delay = 0,
  theme,
  showDivider = false,
  onPress
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  subtitle?: string,
  color?: string,
  delay?: number,
  theme: any,
  showDivider?: boolean,
  onPress?: () => void
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={[styles.statItem, { flex: 1 }]} // Kesin eşit genişlik için
    >
      <TouchableOpacity 
        style={styles.statContent}
        onPress={onPress}
        disabled={!onPress}
        activeOpacity={onPress ? 0.7 : 1}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={[styles.statValue, { color: theme.colors.text.primary }]} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={[styles.statTitle, { color: theme.colors.text.secondary }]} numberOfLines={2}>{title}</Text>
        {subtitle && (
          <Text style={[styles.statSubtitle, { color: theme.colors.text.secondary }]} numberOfLines={2}>{subtitle}</Text>
        )}
      </TouchableOpacity>
      {showDivider && (
        <View style={[styles.statDivider, { backgroundColor: theme.colors.border.primary }]} />
      )}
    </Animated.View>
  );
};

const SettingsSection = ({ 
  title, 
  items,
  delay = 0,
  theme
}: { 
  title: string, 
  items: Array<{
    icon: React.ReactNode,
    title: string,
    onPress: () => void,
    showBadge?: boolean,
    isPremium?: boolean
  }>,
  delay?: number,
  theme: any
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(600)}
      style={styles.settingsSection}
    >
      <Text style={[styles.settingsSectionTitle, { color: theme.colors.text.primary }]}>{title}</Text>
      <View style={[styles.settingsSectionCard, { backgroundColor: theme.colors.darkGray[800] }]}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingsItem,
              index !== items.length - 1 && [styles.settingsItemBorder, { borderBottomColor: theme.colors.border.primary }]
            ]}
            onPress={item.onPress}
          >
            <View style={[
              styles.settingsItemIcon,
              { backgroundColor: theme.colors.background.elevated },
              item.isPremium && { backgroundColor: theme.colors.primary[500] + '20' }
            ]}>
              {item.icon}
            </View>
            <Text style={[styles.settingsItemTitle, { color: theme.colors.text.primary }]}>{item.title}</Text>
            <View style={styles.settingsItemRight}>
              {item.showBadge && (
                <View style={[styles.badge, { backgroundColor: theme.colors.error }]}>
                  <Text style={[styles.badgeText, { color: theme.colors.text.primary }]}>2</Text>
                </View>
              )}
              {item.isPremium && (
                <Crown size={16} color={theme.colors.medal.gold} />
              )}
              <ChevronRight size={20} color={theme.colors.text.secondary} />
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </Animated.View>
  );
};

const LevelProgress = ({ 
  currentLevel, 
  progress, 
  nextLevelXP,
  delay = 0,
  t,
  theme
}: {
  currentLevel: number,
  progress: number,
  nextLevelXP: number,
  delay?: number,
  t: (key: string) => string,
  theme: any
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={styles.levelContainer}
    >
      <View style={styles.levelHeader}>
        <Text style={[styles.levelTitle, { color: theme.colors.text.primary }]}>{t('profile.level')} {currentLevel}</Text>
        <Text style={[styles.levelSubtitle, { color: theme.colors.text.secondary }]}>{nextLevelXP} {t('profile.xp_left')}</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { width: `${progress}%`, backgroundColor: theme.colors.text.primary }
          ]}
          entering={FadeIn.delay(delay + 100).duration(600)}
        />
      </View>
    </Animated.View>
  );
};

const getRankInfo = (messageCount: number, t: (key: string) => string) => {
  if (messageCount >= 200) {
    return { title: t('profile.professor'), level: 10, color: Colors.medal.gold };
  } else if (messageCount >= 100) {
    return { title: 'Doçent', level: 7, color: Colors.medal.silver };
  } else if (messageCount >= 20) {
    return { title: t('profile.student'), level: 4, color: Colors.medal.bronze };
  } else {
    return { title: t('profile.rookie'), level: 1, color: Colors.text.secondary };
  }
};

// Pro Toast Bileşeni
const ProToast = ({ visible, onHide, theme }: { visible: boolean, onHide: () => void, theme: any }) => {
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0);
      opacity.value = withSpring(1);
      
      // 3 saniye sonra otomatik gizle
      const timer = setTimeout(() => {
        translateY.value = withSpring(-100);
        opacity.value = withSpring(0, {}, () => {
          runOnJS(onHide)();
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <LinearGradient
        colors={[theme.colors.success, theme.colors.success + 'CC']}
        style={styles.toastGradient}
      >
        <CheckCircle size={20} color={theme.colors.text.primary} />
        <Text style={[styles.toastText, { color: theme.colors.text.primary }]}>
          Zaten Pro Kullanıcısınız! 👑
        </Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showProToast, setShowProToast] = useState(false);

  useEffect(() => {
    const initializeProfile = async () => {
      try {
        await fetchUserStats();
        await fetchProfilePhoto();
      } catch (error) {
        console.error('Profil başlatma hatası:', error);
      }
    };

    if (user?.id) {
      initializeProfile();
    }

    // Unique channel names to prevent multiple subscription errors
    const uniqueId = Math.random().toString(36).substr(2, 9);
    
    const userSubscription = supabase
      .channel(`user_updates_${user?.id}_${uniqueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, () => {
        fetchUserStats().catch(error => 
          console.error('Kullanıcı güncelleme hatası:', error)
        );
      })
      .subscribe();

    const messageSubscription = supabase
      .channel(`message_updates_${user?.id}_${uniqueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserStats().catch(error => 
          console.error('Mesaj güncelleme hatası:', error)
        );
      })
      .subscribe();

    const photoSubscription = supabase
      .channel(`photo_updates_${user?.id}_${uniqueId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchProfilePhoto().catch(error => 
          console.error('Fotoğraf güncelleme hatası:', error)
        );
      })
      .subscribe();

    return () => {
      userSubscription.unsubscribe();
      messageSubscription.unsubscribe();
      photoSubscription.unsubscribe();
    };
  }, [user?.id]);

  const fetchProfilePhoto = async () => {
    if (!user?.id) return;
    try {
      const photoUrl = await getProfilePhoto(user.id);
      setProfilePhotoUrl(photoUrl);
    } catch (error) {
      console.error('Profil fotoğrafı alınırken hata oluştu:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      if (!user || !user.id) return;

      // Kullanıcı verilerini al
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      setUserData(userData);

      // Çalışma süresi verilerini al (saniye cinsinden)
      const { data: studyData, error: studyError } = await supabase
        .from('study_sessions')
        .select('duration')
        .eq('user_id', user.id)
        .not('ended_at', 'is', null);

      if (!studyError && studyData) {
        const totalSeconds = studyData.reduce((sum, session) => sum + (session.duration || 0), 0);
        setTotalStudyTime(totalSeconds);
      }

      // Mesaj sayısını al (hem chat hem watch room mesajları)
      const { count: chatMessageCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const { count: watchMessageCount } = await supabase
        .from('watch_room_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      const totalMessages = (chatMessageCount || 0) + (watchMessageCount || 0);
      setMessageCount(totalMessages);
    } catch (error) {
      console.error('Kullanıcı verileri alınırken hata oluştu:', error);
    }
  };

  const formatStudyTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} saat ${minutes} dk`;
    }
    return `${minutes} dakika`;
  };

  // Pro yükselt fonksiyonu
  const handleProUpgrade = () => {
    if (userData?.is_pro) {
      setShowProToast(true);
    } else {
      router.push('/pro-upgrade');
    }
  };

  const rankInfo = getRankInfo(messageCount, t);
  const levelProgress = ((messageCount % 50) / 50) * 100;
  const nextLevelXP = 50 - (messageCount % 50);

  const appSettings = [
    {
      icon: <User size={20} color={theme.colors.primary[400]} />,
      title: t('profile.account_info'),
      onPress: () => router.push('/account-settings' as any)
    },
    {
      icon: <Bell size={20} color={theme.colors.warning} />,
      title: t('profile.notifications'),
      onPress: () => router.push('/notification-settings'),
      showBadge: true
    },
    {
      icon: <Crown size={20} color={theme.colors.medal.gold} />,
      title: t('profile.upgrade_pro'),
      onPress: handleProUpgrade,
      isPremium: !userData?.is_pro
    }
  ];

  const appUISettings = [
    {
      icon: <Settings size={20} color={theme.colors.primary[400]} />,
      title: t('profile.theme_settings'),
      onPress: () => setShowThemeModal(true)
    },
    {
      icon: <Globe size={20} color={theme.colors.success} />,
      title: t('profile.language_options'),
      onPress: () => setShowLanguageModal(true)
    },
    {
      icon: <HelpCircle size={20} color={theme.colors.text.secondary} />,
      title: t('profile.help_support'),
      onPress: () => router.push('/help-support')
    }
  ];

  const actionSettings = [
    {
      icon: <LogOut size={20} color={theme.colors.error} />,
      title: t('profile.logout'),
      onPress: async () => {
        try {
          await signOut();
        } catch (error) {
          console.error('Çıkış yapma hatası:', error);
        }
      }
    }
  ];

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        
        {/* Pro Toast - moved to top of screen within SafeAreaView */}
        <ProToast 
          visible={showProToast}
          onHide={() => setShowProToast(false)}
          theme={theme}
        />
        
        <SafeContainer style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Hero Section */}
            <Animated.View 
              entering={FadeIn.duration(600)}
              style={styles.heroSection}
            >
              <LinearGradient
                colors={theme.colors.gradients.accent}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <View style={styles.profilePhotoContainer}>
                    <ProfilePhoto
                      uri={profilePhotoUrl}
                      size={80}
                      style={styles.profilePhoto}
                      allowFullscreen={true}
                    />
                    {userData?.is_pro && (
                      <View style={[styles.proIndicator, {
                        backgroundColor: theme.colors.medal.gold + '20',
                        borderColor: theme.colors.medal.gold
                      }]}>
                        <Crown size={16} color={theme.colors.medal.gold} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.heroInfo}>
                    <Text style={[styles.userName, { color: theme.colors.text.primary }]}>{userData?.name || t('profile.user')}</Text>
                    <View style={styles.rankBadge}>
                      <Trophy size={14} color={rankInfo.color} />
                      <Text style={[styles.rankText, { color: rankInfo.color }]}>
                        {rankInfo.title}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <LevelProgress 
                  currentLevel={rankInfo.level}
                  progress={levelProgress}
                  nextLevelXP={nextLevelXP}
                  delay={200}
                  t={t}
                  theme={theme}
                />
              </LinearGradient>
            </Animated.View>

            {/* Stats Section */}
            <Animated.View 
              entering={FadeIn.delay(600).duration(800)}
              style={styles.statsSection}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('profile.my_stats')}</Text>
              <View style={[styles.statsRow, { backgroundColor: theme.colors.darkGray[800] }]}>
                <StatCard 
                  icon={<Clock size={20} color={theme.colors.primary[400]} />}
                  title={t('profile.study_hours')}
                  value={formatStudyTime(totalStudyTime)}
                  color={theme.colors.primary[400]}
                  delay={700}
                  theme={theme}
                  showDivider={true}
                />
                <StatCard 
                  icon={<MessageSquare size={20} color={theme.colors.success} />}
                  title={t('profile.messages')}
                  value={messageCount.toString()}
                  subtitle={`${t('profile.this_week')} +8`}
                  color={theme.colors.success}
                  delay={800}
                  theme={theme}
                  showDivider={true}
                />
                <StatCard 
                  icon={<Star size={20} color={theme.colors.medal.gold} />}
                  title={t('profile.achievements')}
                  value="12/20"
                  subtitle={`${t('profile.new')}: 3`}
                  color={theme.colors.medal.gold}
                  delay={900}
                  theme={theme}
                  showDivider={false}
                  onPress={() => router.push('/achievements')}
                />
              </View>
            </Animated.View>

            {/* Settings Sections */}
            <SettingsSection 
              title={t('profile.account_settings')}
              items={appSettings}
              delay={1100}
              theme={theme}
            />
            
            <SettingsSection 
              title={t('profile.app_settings')}
              items={appUISettings}
              delay={1200}
              theme={theme}
            />
            
            <SettingsSection 
              title={t('profile.other')}
              items={actionSettings}
              delay={1300}
              theme={theme}
            />
          </ScrollView>
        </SafeContainer>
      </GradientBackground>

      {/* Language Selection Modal */}
      <LanguageModal 
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
      />

      {/* Theme Selection Modal */}
      <ThemeModal 
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 0,
    paddingBottom: Spacing.xxl * 2,
  },
  heroSection: {
    margin: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    ...Shadows.large,
  },
  heroGradient: {
    padding: Spacing.xl,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profilePhotoContainer: {
    position: 'relative',
    marginRight: Spacing.lg,
  },
  profilePhoto: {
    // Remove border styling
  },
  proIndicator: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    borderRadius: BorderRadius.round,
    padding: 6,
    borderWidth: 2,
  },
  heroInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  rankBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    alignSelf: 'flex-start',
    gap: Spacing.xs,
  },
  rankText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
  },
  levelContainer: {
    gap: Spacing.xs,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  levelTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  levelSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  statsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.lg,
    ...Shadows.small,
    height: 140, // Sabit yükseklik
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xs,
    minHeight: 120, // Minimum yükseklik
    maxWidth: '33.333%',
    minWidth: 0,
  },
  statContent: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 4,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
    textAlign: 'center',
    width: '100%',
    flexShrink: 1,
  },
  statTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11, // Daha küçük font
    textAlign: 'center',
    width: '100%',
    lineHeight: 13,
    flexWrap: 'wrap',
    paddingHorizontal: 2,
  },
  statSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    textAlign: 'center',
    marginTop: Spacing.xs,
    width: '100%',
    lineHeight: 11,
    paddingHorizontal: 2,
  },
  statDivider: {
    width: 1,
    height: '60%',
    position: 'absolute',
    right: 0,
    top: '20%',
    opacity: 0.2,
  },
  settingsSection: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  settingsSectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  settingsSectionCard: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadows.small,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
  },
  settingsItemIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsItemTitle: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    borderRadius: BorderRadius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  toastContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingTop: 50, // Add top padding for status bar
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  toastGradient: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.large,
  },
  toastText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
});
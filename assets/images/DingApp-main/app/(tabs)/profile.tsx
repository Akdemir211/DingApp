import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { LanguageModal } from '@/components/UI/LanguageModal';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
  Globe
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
  SlideInLeft
} from 'react-native-reanimated';
import { getProfilePhoto } from '@/lib/profileService';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const StatCard = ({ 
  icon, 
  title, 
  value,
  subtitle,
  color = Colors.primary[400],
  delay = 0
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  subtitle?: string,
  color?: string,
  delay?: number
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={styles.statCardContainer}
    >
      <GradientCard 
        colors={Colors.gradients.warmDark}
        style={styles.statCard}
      >
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          {icon}
        </View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        )}
      </GradientCard>
    </Animated.View>
  );
};

const SettingsSection = ({ 
  title, 
  items,
  delay = 0
}: { 
  title: string, 
  items: Array<{
    icon: React.ReactNode,
    title: string,
    onPress: () => void,
    showBadge?: boolean,
    isPremium?: boolean
  }>,
  delay?: number
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(600)}
      style={styles.settingsSection}
    >
      <Text style={styles.settingsSectionTitle}>{title}</Text>
      <GradientCard colors={Colors.gradients.warmDark} style={styles.settingsSectionCard}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.settingsItem,
              index !== items.length - 1 && styles.settingsItemBorder
            ]}
            onPress={item.onPress}
          >
            <View style={[
              styles.settingsItemIcon,
              item.isPremium && { backgroundColor: Colors.primary[500] + '20' }
            ]}>
              {item.icon}
            </View>
            <Text style={styles.settingsItemTitle}>{item.title}</Text>
            <View style={styles.settingsItemRight}>
              {item.showBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>2</Text>
                </View>
              )}
              {item.isPremium && (
                <Crown size={16} color={Colors.medal.gold} />
              )}
              <ChevronRight size={20} color={Colors.text.secondary} />
            </View>
          </TouchableOpacity>
        ))}
      </GradientCard>
    </Animated.View>
  );
};

const LevelProgress = ({ 
  currentLevel, 
  progress, 
  nextLevelXP,
  delay = 0,
  t
}: {
  currentLevel: number,
  progress: number,
  nextLevelXP: number,
  delay?: number,
  t: (key: string) => string
}) => {
  return (
    <Animated.View 
      entering={FadeIn.delay(delay).duration(400)}
      style={styles.levelContainer}
    >
      <View style={styles.levelHeader}>
        <Text style={styles.levelTitle}>{t('profile.level')} {currentLevel}</Text>
        <Text style={styles.levelSubtitle}>{nextLevelXP} {t('profile.xp_left')}</Text>
      </View>
      <View style={styles.progressBar}>
        <Animated.View 
          style={[
            styles.progressFill,
            { width: `${progress}%` }
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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const [totalStudyTime, setTotalStudyTime] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [userData, setUserData] = useState<any>(null);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);

  useEffect(() => {
    fetchUserStats();
    fetchProfilePhoto();

    const userSubscription = supabase
      .channel('user_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${user?.id}`
      }, () => {
        fetchUserStats();
      })
      .subscribe();

    const messageSubscription = supabase
      .channel('message_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchUserStats();
      })
      .subscribe();

    const photoSubscription = supabase
      .channel('photo_updates')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profile_photos',
        filter: `user_id=eq.${user?.id}`
      }, () => {
        fetchProfilePhoto();
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

      // Çalışma süresi verilerini al - basit bir sorgu yapalım
      const { data: studyData, error: studyError } = await supabase
        .from('study_leaderboard')
        .select('total_minutes')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!studyError && studyData) {
        setTotalStudyTime((studyData as any)?.total_minutes || 0);
      }

      // Mesaj sayısını al
      const { count: messageCountData, error: messageError } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!messageError && messageCountData !== null) {
        setMessageCount(messageCountData);
      }
    } catch (error) {
      console.error('Kullanıcı verileri alınırken hata oluştu:', error);
    }
  };

  const formatStudyTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const rankInfo = getRankInfo(messageCount, t);
  const levelProgress = ((messageCount % 50) / 50) * 100;
  const nextLevelXP = 50 - (messageCount % 50);

  const appSettings = [
    {
      icon: <User size={20} color={Colors.primary[400]} />,
      title: t('profile.account_info'),
      onPress: () => router.push('/account-settings' as any)
    },
    {
      icon: <Bell size={20} color={Colors.warning} />,
      title: t('profile.notifications'),
      onPress: () => router.push('/notification-settings'),
      showBadge: true
    },
    {
      icon: <Crown size={20} color={Colors.medal.gold} />,
      title: t('profile.upgrade_pro'),
      onPress: () => router.push('/pro-upgrade'),
      isPremium: !userData?.is_pro
    }
  ];

  const appUISettings = [
    {
      icon: <Settings size={20} color={Colors.primary[400]} />,
      title: t('profile.theme_settings'),
      onPress: () => console.log('Tema ayarları')
    },
    {
      icon: <Globe size={20} color={Colors.success} />,
      title: t('profile.language_options'),
      onPress: () => setShowLanguageModal(true)
    },
    {
      icon: <HelpCircle size={20} color={Colors.text.secondary} />,
      title: t('profile.help_support'),
      onPress: () => router.push('/help-support')
    }
  ];

  const actionSettings = [
    {
      icon: <LogOut size={20} color={Colors.error} />,
      title: t('profile.logout'),
      onPress: signOut
    }
  ];

  return (
    <View style={styles.container}>
      <GradientBackground colors={[Colors.background.dark, Colors.background.darker]}>
        <FloatingBubbleBackground />
        <SafeAreaView style={styles.safeArea}>
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
                colors={Colors.gradients.accent}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <View style={styles.profilePhotoContainer}>
                    <ProfilePhoto
                      uri={profilePhotoUrl}
                      size={80}
                      style={styles.profilePhoto}
                    />
                    {userData?.is_pro && (
                      <View style={styles.proIndicator}>
                        <Crown size={16} color={Colors.medal.gold} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.heroInfo}>
                    <Text style={styles.userName}>{userData?.name || t('profile.user')}</Text>
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
                />
              </LinearGradient>
            </Animated.View>

            {/* Stats Section */}
            <Animated.View 
              entering={FadeIn.delay(600).duration(800)}
              style={styles.statsSection}
            >
              <Text style={styles.sectionTitle}>{t('profile.my_stats')}</Text>
              <View style={styles.statsGrid}>
                <StatCard 
                  icon={<Clock size={20} color={Colors.primary[400]} />}
                  title={t('profile.study_hours')}
                  value={formatStudyTime(totalStudyTime)}
                  color={Colors.primary[400]}
                  delay={700}
                />
                <StatCard 
                  icon={<MessageSquare size={20} color={Colors.success} />}
                  title={t('profile.messages')}
                  value={messageCount.toString()}
                  subtitle={`${t('profile.this_week')} +8`}
                  color={Colors.success}
                  delay={800}
                />
                <StatCard 
                  icon={<Star size={20} color={Colors.medal.gold} />}
                  title={t('profile.achievements')}
                  value="12/20"
                  subtitle={`${t('profile.new')}: 3`}
                  color={Colors.medal.gold}
                  delay={900}
                />
              </View>
            </Animated.View>

            {/* Settings Sections */}
            <SettingsSection 
              title={t('profile.account_settings')}
              items={appSettings}
              delay={1100}
            />
            
            <SettingsSection 
              title={t('profile.app_settings')}
              items={appUISettings}
              delay={1200}
            />
            
            <SettingsSection 
              title={t('profile.other')}
              items={actionSettings}
              delay={1300}
            />
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>

      {/* Language Selection Modal */}
      <LanguageModal 
        visible={showLanguageModal}
        onClose={() => setShowLanguageModal(false)}
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
    paddingBottom: Spacing.xxl,
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
    backgroundColor: Colors.medal.gold + '20',
    borderRadius: BorderRadius.round,
    padding: 6,
    borderWidth: 2,
    borderColor: Colors.medal.gold,
  },
  heroInfo: {
    flex: 1,
  },
  userName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
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
    color: Colors.text.primary,
  },
  levelSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.primary,
    borderRadius: BorderRadius.xs,
  },
  statsSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.xs,
  },
  statCardContainer: {
    flex: 1,
  },
  statCard: {
    alignItems: 'center',
    padding: Spacing.sm,
    height: 100,
    justifyContent: 'space-between',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  statTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  statSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: Spacing.lg,
    marginHorizontal: Spacing.lg,
  },
  settingsSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.xs,
  },
  settingsSectionCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingsItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[700],
  },
  settingsItemIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  settingsItemTitle: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  badge: {
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.round,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    color: Colors.text.primary,
  },
});
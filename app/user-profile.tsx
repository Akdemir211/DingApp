import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { ArrowLeft, Clock, Trophy, Target, Calendar, Star, Award, BookOpen, Users, MessageSquare } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { getProfilePhoto } from '@/lib/profileService';
import Animated, { FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';

interface UserProfile {
  id: string;
  name: string;
  photoUrl?: string;
  joinDate?: string;
  totalStudyTime: number;
  studySessions: number;
  chatMessages: number;
  watchHours: number;
  achievements: Achievement[];
  weeklyStats: WeeklyStats[];
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface WeeklyStats {
  week: string;
  studyTime: number;
  sessions: number;
}

export default function UserProfile() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { theme } = useTheme();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (userId) {
      setIsOwnProfile(userId === currentUser?.id);
      loadUserProfile();
    }
  }, [userId, currentUser]);

  const loadUserProfile = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Önce users tablosundan kullanıcı bilgilerini al
      let userData = null;
      const { data: dbUserData, error: userError } = await supabase
        .from('users')
        .select('id, name, created_at')
        .eq('id', userId)
        .single();

      if (userError && userError.code === 'PGRST116') {
        // Kullanıcı users tablosunda bulunamadı, fallback kullanıcı oluştur
        console.log('User not found in users table, creating fallback user');
        
        // Kullanıcı adını profile_photos tablosundan veya mesajlardan almaya çalış
        let userName = 'Kullanıcı';
        try {
          // Chat mesajlarından kullanıcı adını bulmaya çalış
          const { data: messageData } = await supabase
            .from('chat_messages')
            .select('user_id')
            .eq('user_id', userId)
            .limit(1);
            
          if (messageData && messageData.length > 0) {
            userName = `Kullanıcı #${userId.slice(-4)}`;
          }
        } catch (error) {
          console.log('Could not fetch user name from messages');
        }
        
        userData = {
          id: userId,
          name: userName,
          created_at: new Date().toISOString()
        };
      } else if (userError) {
        console.error('User data error:', userError);
        Alert.alert('Hata', 'Kullanıcı bilgileri yüklenemedi');
        return;
      } else {
        userData = dbUserData;
      }

      // Profil fotoğrafını al
      const photoUrl = await getProfilePhoto(userId);

      // Çalışma istatistiklerini al
      const studyStats = await getStudyStats(userId);
      const chatStats = await getChatStats(userId);
      const watchStats = await getWatchStats(userId);

      // Başarımları al
      const achievements = await getAchievements(userId, studyStats);

      // Haftalık istatistikleri al
      const weeklyStats = await getWeeklyStats(userId);

      const profile: UserProfile = {
        id: userData.id,
        name: userData.name || 'Kullanıcı',
        photoUrl,
        joinDate: userData.created_at,
        totalStudyTime: studyStats.totalTime,
        studySessions: studyStats.sessions,
        chatMessages: chatStats.messages,
        watchHours: watchStats.hours,
        achievements,
        weeklyStats
      };

      setUserProfile(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
      Alert.alert('Hata', 'Profil yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const getStudyStats = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration, created_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null);

      if (error) throw error;

      const totalTime = data?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
      const sessions = data?.length || 0;

      return { totalTime, sessions };
    } catch (error) {
      console.error('Study stats error:', error);
      return { totalTime: 0, sessions: 0 };
    }
  };

  const getChatStats = async (userId: string) => {
    try {
      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: watchChatCount } = await supabase
        .from('watch_room_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      return { messages: (chatCount || 0) + (watchChatCount || 0) };
    } catch (error) {
      console.error('Chat stats error:', error);
      return { messages: 0 };
    }
  };

  const getWatchStats = async (userId: string) => {
    try {
      // Watch room katılım sürelerini hesapla (basit yaklaşım)
      const { data, error } = await supabase
        .from('watch_room_members')
        .select('joined_at')
        .eq('user_id', userId);

      if (error) throw error;

      // Her katılım için ortalama 1 saat varsayalım
      const hours = (data?.length || 0) * 1;

      return { hours };
    } catch (error) {
      console.error('Watch stats error:', error);
      return { hours: 0 };
    }
  };

  const getAchievements = async (userId: string, studyStats: any): Promise<Achievement[]> => {
    const achievements: Achievement[] = [
      {
        id: 'first_study',
        title: 'İlk Adım',
        description: 'İlk çalışma seansını tamamla',
        icon: 'play',
        earned: studyStats.sessions > 0,
        earnedAt: studyStats.sessions > 0 ? new Date().toISOString() : undefined
      },
      {
        id: 'study_master',
        title: 'Çalışma Ustası',
        description: '10 çalışma seansı tamamla',
        icon: 'target',
        earned: studyStats.sessions >= 10,
        progress: Math.min(studyStats.sessions, 10),
        maxProgress: 10
      },
      {
        id: 'time_keeper',
        title: 'Zaman Bekçisi',
        description: '60 dakika çalışma süresi',
        icon: 'clock',
        earned: studyStats.totalTime >= 3600,
        progress: Math.min(studyStats.totalTime, 3600),
        maxProgress: 3600
      },
      {
        id: 'dedication',
        title: 'Azim ve Kararlılık',
        description: '24 saat toplam çalışma',
        icon: 'star',
        earned: studyStats.totalTime >= 86400,
        progress: Math.min(studyStats.totalTime, 86400),
        maxProgress: 86400
      },
      {
        id: 'scholar',
        title: 'Bilgin',
        description: '100 çalışma seansı',
        icon: 'award',
        earned: studyStats.sessions >= 100,
        progress: Math.min(studyStats.sessions, 100),
        maxProgress: 100
      }
    ];

    return achievements;
  };

  const getWeeklyStats = async (userId: string): Promise<WeeklyStats[]> => {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('duration, created_at')
        .eq('user_id', userId)
        .not('ended_at', 'is', null)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Son 4 haftanın istatistiklerini hesapla
      const weeks: WeeklyStats[] = [];
      const now = new Date();
      
      for (let i = 0; i < 4; i++) {
        const weekStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        
        const weekSessions = data?.filter(session => {
          const sessionDate = new Date(session.created_at);
          return sessionDate >= weekStart && sessionDate < weekEnd;
        }) || [];

        const studyTime = weekSessions.reduce((sum, session) => sum + (session.duration || 0), 0);
        
        weeks.push({
          week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
          studyTime,
          sessions: weekSessions.length
        });
      }

      return weeks.reverse();
    } catch (error) {
      console.error('Weekly stats error:', error);
      return [];
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}s ${minutes}dk`;
    }
    return `${minutes}dk`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getAchievementIcon = (iconName: string) => {
    switch (iconName) {
      case 'play': return <BookOpen size={24} color={Colors.success} />;
      case 'target': return <Target size={24} color={Colors.primary[400]} />;
      case 'clock': return <Clock size={24} color={Colors.warning} />;
      case 'star': return <Star size={24} color={Colors.warning} />;
      case 'award': return <Award size={24} color={Colors.primary[500]} />;
      default: return <Trophy size={24} color={Colors.success} />;
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.dark }]}>
        <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.loadingContainer}>
              <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
                Profil yükleniyor...
              </Text>
            </View>
          </SafeAreaView>
        </GradientBackground>
      </View>
    );
  }

  if (!userProfile) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background.dark }]}>
        <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
                Profil bulunamadı
              </Text>
              <TouchableOpacity 
                style={[styles.backButton, { backgroundColor: theme.colors.primary[500] }]}
                onPress={() => router.back()}
              >
                <Text style={[styles.backButtonText, { color: theme.colors.text.primary }]}>
                  Geri Dön
                </Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </GradientBackground>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background.dark }]}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View 
            style={[styles.header, { backgroundColor: theme.colors.background.darker + 'DD' }]}
            entering={SlideInDown.duration(400)}
          >
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.headerBackButton, { backgroundColor: theme.colors.background.elevated }]}
            >
              <ArrowLeft size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {isOwnProfile ? 'Profilim' : `${userProfile.name}'in Profili`}
            </Text>
            
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Profil Bilgileri */}
            <Animated.View entering={FadeIn.delay(200).duration(600)}>
              <GradientCard colors={theme.colors.gradients.warmDark} style={styles.profileCard}>
                <View style={styles.profileHeader}>
                  <ProfilePhoto 
                    uri={userProfile.photoUrl}
                    size={120}
                    style={styles.profilePhoto}
                  />
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                      {userProfile.name}
                    </Text>
                    {userProfile.joinDate && (
                      <Text style={[styles.joinDate, { color: theme.colors.text.secondary }]}>
                        <Calendar size={14} color={theme.colors.text.secondary} />
                        {' '}{formatDate(userProfile.joinDate)} tarihinde katıldı
                      </Text>
                    )}
                  </View>
                </View>
              </GradientCard>
            </Animated.View>

            {/* İstatistikler */}
            <Animated.View entering={SlideInRight.delay(400).duration(600)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                İstatistikler
              </Text>
              <View style={styles.statsGrid}>
                <GradientCard colors={theme.colors.gradients.primary} style={styles.statCard}>
                  <Clock size={32} color={theme.colors.text.primary} />
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {formatTime(userProfile.totalStudyTime)}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.primary + '80' }]}>
                    Toplam Çalışma
                  </Text>
                </GradientCard>

                <GradientCard colors={theme.colors.gradients.primary} style={styles.statCard}>
                  <BookOpen size={32} color={theme.colors.text.primary} />
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {userProfile.studySessions}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.primary + '80' }]}>
                    Çalışma Seansı
                  </Text>
                </GradientCard>

                <GradientCard colors={theme.colors.gradients.warmDark} style={styles.statCard}>
                  <MessageSquare size={32} color={theme.colors.text.primary} />
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {userProfile.chatMessages}
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.primary + '80' }]}>
                    Mesaj
                  </Text>
                </GradientCard>

                <GradientCard colors={theme.colors.gradients.accent} style={styles.statCard}>
                  <Users size={32} color={theme.colors.text.primary} />
                  <Text style={[styles.statValue, { color: theme.colors.text.primary }]}>
                    {userProfile.watchHours}s
                  </Text>
                  <Text style={[styles.statLabel, { color: theme.colors.text.primary + '80' }]}>
                    İzleme Saati
                  </Text>
                </GradientCard>
              </View>
            </Animated.View>

            {/* Başarımlar */}
            <Animated.View entering={SlideInRight.delay(600).duration(600)}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Başarımlar
              </Text>
              <View style={styles.achievementsContainer}>
                {userProfile.achievements.map((achievement, index) => (
                  <GradientCard 
                    key={achievement.id}
                    colors={achievement.earned ? theme.colors.gradients.primary : [theme.colors.background.card, theme.colors.background.elevated]}
                    style={[styles.achievementCard, !achievement.earned && styles.achievementCardLocked]}
                  >
                    <View style={styles.achievementIcon}>
                      {getAchievementIcon(achievement.icon)}
                    </View>
                    <View style={styles.achievementInfo}>
                      <Text style={[
                        styles.achievementTitle, 
                        { color: achievement.earned ? theme.colors.text.primary : theme.colors.text.secondary }
                      ]}>
                        {achievement.title}
                      </Text>
                      <Text style={[
                        styles.achievementDescription, 
                        { color: achievement.earned ? theme.colors.text.primary + '80' : theme.colors.text.secondary + '60' }
                      ]}>
                        {achievement.description}
                      </Text>
                      {achievement.progress !== undefined && achievement.maxProgress && (
                        <View style={styles.progressContainer}>
                          <View style={[styles.progressBar, { backgroundColor: theme.colors.background.darker }]}>
                            <View 
                              style={[
                                styles.progressFill, 
                                { 
                                  backgroundColor: achievement.earned ? theme.colors.success : theme.colors.primary[400],
                                  width: `${(achievement.progress / achievement.maxProgress) * 100}%`
                                }
                              ]} 
                            />
                          </View>
                          <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
                            {achievement.progress}/{achievement.maxProgress}
                          </Text>
                        </View>
                      )}
                    </View>
                  </GradientCard>
                ))}
              </View>
            </Animated.View>

            {/* Haftalık İstatistikler */}
            {userProfile.weeklyStats.length > 0 && (
              <Animated.View entering={SlideInRight.delay(800).duration(600)}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                  Son 4 Hafta
                </Text>
                <GradientCard colors={theme.colors.gradients.warmDark} style={styles.weeklyStatsCard}>
                  {userProfile.weeklyStats.map((week, index) => (
                    <View key={index} style={styles.weeklyStatItem}>
                      <Text style={[styles.weekLabel, { color: theme.colors.text.primary }]}>
                        {week.week}
                      </Text>
                      <View style={styles.weekStats}>
                        <Text style={[styles.weekStatValue, { color: theme.colors.text.secondary }]}>
                          {formatTime(week.studyTime)}
                        </Text>
                        <Text style={[styles.weekStatSessions, { color: theme.colors.text.secondary + '80' }]}>
                          {week.sessions} seans
                        </Text>
                      </View>
                    </View>
                  ))}
                </GradientCard>
              </Animated.View>
            )}
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    paddingTop: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerBackButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    width: 38,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  backButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
  },
  backButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  profileCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...Shadows.large,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePhoto: {
    marginRight: Spacing.xl,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    marginBottom: Spacing.xs,
  },
  joinDate: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    marginBottom: Spacing.lg,
    marginTop: Spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  statCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  statValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  achievementsContainer: {
    marginBottom: Spacing.lg,
  },
  achievementCard: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    alignItems: 'center',
    ...Shadows.medium,
  },
  achievementCardLocked: {
    opacity: 0.6,
  },
  achievementIcon: {
    marginRight: Spacing.lg,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    minWidth: 40,
  },
  weeklyStatsCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  weeklyStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  weekLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  weekStats: {
    alignItems: 'flex-end',
  },
  weekStatValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  weekStatSessions: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
  },
}); 
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Star, 
  Trophy, 
  Target, 
  Clock, 
  Award, 
  BookOpen, 
  MessageSquare, 
  CheckCircle, 
  Lock,
  Zap,
  Crown,
  Shield,
  Flame,
  Heart,
  Globe,
  Users,
  Calendar,
  TrendingUp,
  Brain,
  Coffee,
  Moon,
  Sun
} from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInRight,
  SlideInLeft,
  SlideInUp,
  ZoomIn,
  BounceIn
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  earned: boolean;
  progress?: number;
  maxProgress?: number;
  earnedAt?: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  category: 'study' | 'social' | 'time' | 'special' | 'milestone';
  xpReward: number;
}

const AchievementCard = ({ 
  achievement, 
  delay = 0, 
  theme,
  index = 0
}: { 
  achievement: Achievement, 
  delay?: number, 
  theme: any,
  index?: number
}) => {
  const rarityColors = {
    bronze: ['#CD7F32', '#B8860B'],
    silver: ['#C0C0C0', '#A8A8A8'],
    gold: ['#FFD700', '#FFA500'],
    platinum: ['#E5E4E2', '#B8B6B3'],
    diamond: ['#B9F2FF', '#00BFFF']
  };

  const rarityBorders = {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF'
  };

  const categoryIcons = {
    study: <BookOpen size={20} color="white" />,
    social: <Users size={20} color="white" />,
    time: <Clock size={20} color="white" />,
    special: <Star size={20} color="white" />,
    milestone: <Trophy size={20} color="white" />
  };

  const animationVariants = [
    SlideInLeft,
    SlideInRight,
    SlideInUp,
    ZoomIn,
    BounceIn
  ];

  const AnimationComponent = animationVariants[index % animationVariants.length];

  return (
    <Animated.View 
      entering={AnimationComponent.delay(delay).duration(400)}
      style={[
        styles.achievementCard,
        { 
          borderColor: achievement.earned ? rarityBorders[achievement.rarity] : theme.colors.border.primary,
          opacity: achievement.earned ? 1 : 0.7
        }
      ]}
    >
      <LinearGradient
        colors={achievement.earned ? rarityColors[achievement.rarity] as any : [theme.colors.darkGray[700], theme.colors.darkGray[800]] as any}
        style={styles.achievementGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <View style={styles.achievementHeader}>
          <View style={styles.achievementIconContainer}>
            <View style={[
              styles.achievementIcon,
              { 
                backgroundColor: achievement.earned ? 'rgba(255,255,255,0.2)' : theme.colors.darkGray[600],
                borderColor: achievement.earned ? 'rgba(255,255,255,0.3)' : theme.colors.border.primary
              }
            ]}>
              {achievement.earned ? achievement.icon : <Lock size={20} color={theme.colors.text.secondary} />}
            </View>
            
            {achievement.earned && (
              <View style={[styles.earnedBadge, { backgroundColor: theme.colors.success }]}>
                <CheckCircle size={12} color={theme.colors.text.primary} />
              </View>
            )}
          </View>

          <View style={styles.categoryBadge}>
            {categoryIcons[achievement.category]}
          </View>
        </View>
        
        {/* Content */}
        <View style={styles.achievementContent}>
          <Text style={[
            styles.achievementTitle, 
            { color: achievement.earned ? theme.colors.text.primary : theme.colors.text.secondary }
          ]}>
            {achievement.title}
          </Text>
          
          <Text style={[
            styles.achievementDescription, 
            { color: achievement.earned ? 'rgba(255,255,255,0.9)' : theme.colors.text.secondary }
          ]}>
            {achievement.description}
          </Text>

          {/* XP Reward */}
          <View style={styles.xpContainer}>
            <Zap size={14} color={achievement.earned ? '#FFD700' : theme.colors.text.secondary} />
            <Text style={[
              styles.xpText,
              { color: achievement.earned ? '#FFD700' : theme.colors.text.secondary }
            ]}>
              +{achievement.xpReward} XP
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        {achievement.progress !== undefined && achievement.maxProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    width: `${(achievement.progress / achievement.maxProgress) * 100}%`,
                    backgroundColor: achievement.earned ? theme.colors.text.primary : theme.colors.primary[400]
                  }
                ]} 
              />
            </View>
            <Text style={[
              styles.progressText, 
              { color: achievement.earned ? 'rgba(255,255,255,0.8)' : theme.colors.text.secondary }
            ]}>
              {achievement.progress}/{achievement.maxProgress}
            </Text>
          </View>
        )}
        
        {/* Rarity Badge */}
        <View style={[
          styles.rarityBadge, 
          { 
            backgroundColor: achievement.earned ? rarityBorders[achievement.rarity] : theme.colors.darkGray[600],
            borderColor: achievement.earned ? rarityBorders[achievement.rarity] : theme.colors.border.primary,
            borderWidth: 1
          }
        ]}>
          <Text style={[
            styles.rarityText, 
            { 
              color: achievement.earned ? '#FFFFFF' : theme.colors.text.secondary,
              fontWeight: 'bold'
            }
          ]}>
            {achievement.rarity.toUpperCase()}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

export default function AchievementsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userStats, setUserStats] = useState({
    totalStudyTime: 0,
    studySessions: 0,
    chatMessages: 0,
    joinedRooms: 0,
    consecutiveDays: 0,
    totalXP: 0
  });

  const categories = [
    { id: 'all', name: 'Tümü', icon: <Star size={16} color={theme.colors.text.primary} /> },
    { id: 'study', name: 'Çalışma', icon: <BookOpen size={16} color={theme.colors.text.primary} /> },
    { id: 'social', name: 'Sosyal', icon: <Users size={16} color={theme.colors.text.primary} /> },
    { id: 'time', name: 'Zaman', icon: <Clock size={16} color={theme.colors.text.primary} /> },
    { id: 'special', name: 'Özel', icon: <Crown size={16} color={theme.colors.text.primary} /> },
    { id: 'milestone', name: 'Kilometre Taşı', icon: <Trophy size={16} color={theme.colors.text.primary} /> }
  ];

  useEffect(() => {
    if (user?.id) {
      loadAchievements();
    }
  }, [user]);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      
      const stats = await getUserStats();
      setUserStats(stats);
      
      const achievementList = generateAchievements(stats);
      setAchievements(achievementList);
      
    } catch (error) {
      console.error('Başarımlar yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserStats = async () => {
    try {
      // Çalışma istatistikleri
      const { data: studyData, error: studyError } = await supabase
        .from('study_sessions')
        .select('duration, created_at')
        .eq('user_id', user!.id)
        .not('ended_at', 'is', null);

      // Chat mesaj sayısı
      const { count: chatCount } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Watch room mesaj sayısı
      const { count: watchChatCount } = await supabase
        .from('watch_room_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      // Katılınan odalar
      const { count: roomCount } = await supabase
        .from('watch_room_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id);

      const totalStudyTime = studyData?.reduce((sum, session) => sum + (session.duration || 0), 0) || 0;
      const studySessions = studyData?.length || 0;

      return {
        totalStudyTime,
        studySessions,
        chatMessages: (chatCount || 0) + (watchChatCount || 0),
        joinedRooms: roomCount || 0,
        consecutiveDays: 7, // Simulated data
        totalXP: studySessions * 50 + Math.floor(totalStudyTime / 60) * 5
      };
    } catch (error) {
      console.error('Kullanıcı istatistikleri alınırken hata:', error);
      return {
        totalStudyTime: 0,
        studySessions: 0,
        chatMessages: 0,
        joinedRooms: 0,
        consecutiveDays: 0,
        totalXP: 0
      };
    }
  };

  const generateAchievements = (stats: any): Achievement[] => {
    return [
      // Study Category
      {
        id: 'first_study',
        title: 'İlk Adım',
        description: 'İlk çalışma seansını tamamla',
        icon: <BookOpen size={24} color="white" />,
        earned: stats.studySessions > 0,
        earnedAt: stats.studySessions > 0 ? new Date().toISOString() : undefined,
        rarity: 'bronze',
        category: 'study',
        xpReward: 50
      },
      {
        id: 'study_rookie',
        title: 'Çalışma Acemisi',
        description: '5 çalışma seansı tamamla',
        icon: <Target size={24} color="white" />,
        earned: stats.studySessions >= 5,
        progress: Math.min(stats.studySessions, 5),
        maxProgress: 5,
        rarity: 'bronze',
        category: 'study',
        xpReward: 100
      },
      {
        id: 'study_master',
        title: 'Çalışma Ustası',
        description: '25 çalışma seansı tamamla',
        icon: <Trophy size={24} color="white" />,
        earned: stats.studySessions >= 25,
        progress: Math.min(stats.studySessions, 25),
        maxProgress: 25,
        rarity: 'gold',
        category: 'study',
        xpReward: 500
      },
      {
        id: 'study_legend',
        title: 'Çalışma Efsanesi',
        description: '100 çalışma seansı tamamla',
        icon: <Crown size={24} color="white" />,
        earned: stats.studySessions >= 100,
        progress: Math.min(stats.studySessions, 100),
        maxProgress: 100,
        rarity: 'diamond',
        category: 'study',
        xpReward: 2000
      },

      // Time Category
      {
        id: 'time_keeper',
        title: 'Zaman Bekçisi',
        description: '1 saat toplam çalışma',
        icon: <Clock size={24} color="white" />,
        earned: stats.totalStudyTime >= 3600,
        progress: Math.min(stats.totalStudyTime, 3600),
        maxProgress: 3600,
        rarity: 'bronze',
        category: 'time',
        xpReward: 100
      },
      {
        id: 'time_warrior',
        title: 'Zaman Savaşçısı',
        description: '10 saat toplam çalışma',
        icon: <Shield size={24} color="white" />,
        earned: stats.totalStudyTime >= 36000,
        progress: Math.min(stats.totalStudyTime, 36000),
        maxProgress: 36000,
        rarity: 'gold',
        category: 'time',
        xpReward: 1000
      },
      {
        id: 'time_master',
        title: 'Zaman Ustası',
        description: '50 saat toplam çalışma',
        icon: <Flame size={24} color="white" />,
        earned: stats.totalStudyTime >= 180000,
        progress: Math.min(stats.totalStudyTime, 180000),
        maxProgress: 180000,
        rarity: 'platinum',
        category: 'time',
        xpReward: 2500
      },

      // Social Category
      {
        id: 'chat_starter',
        title: 'Sohbet Başlatıcısı',
        description: 'İlk mesajını gönder',
        icon: <MessageSquare size={24} color="white" />,
        earned: stats.chatMessages > 0,
        earnedAt: stats.chatMessages > 0 ? new Date().toISOString() : undefined,
        rarity: 'bronze',
        category: 'social',
        xpReward: 25
      },
      {
        id: 'social_butterfly',
        title: 'Sosyal Kelebek',
        description: '50 mesaj gönder',
        icon: <Heart size={24} color="white" />,
        earned: stats.chatMessages >= 50,
        progress: Math.min(stats.chatMessages, 50),
        maxProgress: 50,
        rarity: 'silver',
        category: 'social',
        xpReward: 200
      },
      {
        id: 'community_leader',
        title: 'Topluluk Lideri',
        description: '200 mesaj gönder',
        icon: <Crown size={24} color="white" />,
        earned: stats.chatMessages >= 200,
        progress: Math.min(stats.chatMessages, 200),
        maxProgress: 200,
        rarity: 'gold',
        category: 'social',
        xpReward: 750
      },

      // Special Category
      {
        id: 'night_owl',
        title: 'Gece Kuşu',
        description: 'Gece 00:00-06:00 arası çalış',
        icon: <Moon size={24} color="white" />,
        earned: false, // Bu özel bir achievement, logic eklenebilir
        rarity: 'silver',
        category: 'special',
        xpReward: 300
      },
      {
        id: 'early_bird',
        title: 'Erken Kuş',
        description: 'Sabah 05:00-08:00 arası çalış',
        icon: <Sun size={24} color="white" />,
        earned: false, // Bu özel bir achievement, logic eklenebilir
        rarity: 'silver',
        category: 'special',
        xpReward: 300
      },
      {
        id: 'coffee_lover',
        title: 'Kahve Aşığı',
        description: '3 saat kesintisiz çalış',
        icon: <Coffee size={24} color="white" />,
        earned: false, // Bu özel bir achievement, logic eklenebilir
        rarity: 'gold',
        category: 'special',
        xpReward: 500
      },

      // Milestone Category
      {
        id: 'first_week',
        title: 'İlk Hafta',
        description: '7 gün üst üste giriş yap',
        icon: <Calendar size={24} color="white" />,
        earned: stats.consecutiveDays >= 7,
        progress: Math.min(stats.consecutiveDays, 7),
        maxProgress: 7,
        rarity: 'silver',
        category: 'milestone',
        xpReward: 350
      },
      {
        id: 'xp_collector',
        title: 'XP Kolektörü',
        description: '1000 XP topla',
        icon: <TrendingUp size={24} color="white" />,
        earned: stats.totalXP >= 1000,
        progress: Math.min(stats.totalXP, 1000),
        maxProgress: 1000,
        rarity: 'gold',
        category: 'milestone',
        xpReward: 200
      },
             {
         id: 'brain_power',
         title: 'Beyin Gücü',
         description: 'Tüm kategorilerde başarım kazan',
         icon: <Brain size={24} color="white" />,
         earned: false, // Bu composite bir achievement
         rarity: 'diamond',
         category: 'milestone',
         xpReward: 5000
       },

       // Additional Achievements
       {
         id: 'speed_runner',
         title: 'Hız Koşucusu',
         description: '30 dakikada 5 çalışma seansı',
         icon: <Zap size={24} color="white" />,
         earned: false, // Bu özel bir achievement, logic eklenebilir
         rarity: 'gold',
         category: 'special',
         xpReward: 800
       },
       {
         id: 'marathon_runner',
         title: 'Maraton Koşucusu',
         description: '6 saat kesintisiz çalışma',
         icon: <TrendingUp size={24} color="white" />,
         earned: false, // Bu özel bir achievement, logic eklenebilir
         rarity: 'platinum',
         category: 'time',
         xpReward: 1500
       },
       {
         id: 'global_citizen',
         title: 'Küresel Vatandaş',
         description: '10 farklı odaya katıl',
         icon: <Globe size={24} color="white" />,
         earned: stats.joinedRooms >= 10,
         progress: Math.min(stats.joinedRooms, 10),
         maxProgress: 10,
         rarity: 'silver',
         category: 'social',
         xpReward: 400
       },
       {
         id: 'perfectionist',
         title: 'Mükemmeliyetçi',
         description: '30 gün üst üste giriş yap',
         icon: <CheckCircle size={24} color="white" />,
         earned: stats.consecutiveDays >= 30,
         progress: Math.min(stats.consecutiveDays, 30),
         maxProgress: 30,
         rarity: 'diamond',
         category: 'milestone',
         xpReward: 3000
       }
    ];
  };

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  // Kazanılan başarımları üstte göster
  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (a.earned && !b.earned) return -1;
    if (!a.earned && b.earned) return 1;
    return 0;
  });

  const earnedAchievements = achievements.filter(a => a.earned);
  const totalAchievements = achievements.length;

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        
        <SafeContainer style={styles.safeArea}>
          {/* Header */}
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(200)}
          >
            <TouchableOpacity 
              onPress={() => router.back()} 
              style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}
            >
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Başarımlar</Text>
            
            <View style={styles.headerRight}>
              <Text style={[styles.achievementCount, { color: theme.colors.text.primary }]}>
                {earnedAchievements.length}/{totalAchievements}
              </Text>
            </View>
          </Animated.View>

          {/* Stats Summary */}
          <Animated.View 
            entering={FadeIn.delay(100).duration(300)}
            style={styles.summarySection}
          >
            <GradientCard colors={theme.colors.gradients.accent} style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Trophy size={24} color={theme.colors.medal.gold} />
                  <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                    {earnedAchievements.length}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                    Kazanılan
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Zap size={24} color="#FFD700" />
                  <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                    {userStats.totalXP}
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                    Toplam XP
                  </Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Star size={24} color={theme.colors.primary[400]} />
                  <Text style={[styles.summaryValue, { color: theme.colors.text.primary }]}>
                    {Math.round((earnedAchievements.length / totalAchievements) * 100)}%
                  </Text>
                  <Text style={[styles.summaryLabel, { color: theme.colors.text.secondary }]}>
                    Tamamlama
                  </Text>
                </View>
              </View>
            </GradientCard>
          </Animated.View>

          {/* Category Filter */}
          <Animated.View 
            entering={FadeIn.delay(150).duration(300)}
            style={styles.categorySection}
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScrollContent}
            >
              {categories.map((category, index) => (
                <Animated.View
                  key={category.id}
                  entering={SlideInRight.delay(200 + index * 50).duration(300)}
                >
                  <TouchableOpacity
                    style={[
                      styles.categoryButton,
                      {
                        backgroundColor: selectedCategory === category.id 
                          ? theme.colors.primary[500] + '30'
                          : theme.colors.background.elevated,
                        borderColor: selectedCategory === category.id
                          ? theme.colors.primary[400]
                          : theme.colors.border.primary
                      }
                    ]}
                    onPress={() => setSelectedCategory(category.id)}
                  >
                    {category.icon}
                    <Text style={[
                      styles.categoryButtonText,
                      { 
                        color: selectedCategory === category.id 
                          ? theme.colors.primary[400]
                          : theme.colors.text.secondary
                      }
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>

          {/* Achievements Grid */}
          <FlatList
            data={sortedAchievements}
            renderItem={({ item, index }) => (
              <AchievementCard
                achievement={item}
                delay={300 + (index * 50)}
                theme={theme}
                index={index}
              />
            )}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.achievementsGrid}
            columnWrapperStyle={styles.achievementsRow}
            showsVerticalScrollIndicator={false}
          />
        </SafeContainer>
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
    paddingHorizontal: Spacing.lg,
          paddingTop: 60, // Daha aşağı konumlandırma
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    textAlign: 'center',
    marginRight: 40, // Balance the back button
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  achievementCount: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
  },
  summarySection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  summaryCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  summaryValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  categorySection: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  categoryScrollContent: {
    paddingHorizontal: Spacing.sm,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderWidth: 2,
    borderRadius: BorderRadius.md,
    marginRight: Spacing.sm,
  },
  categoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    marginLeft: Spacing.xs,
  },
  categoryBadge: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  achievementsGrid: {
    padding: Spacing.lg,
  },
  achievementsRow: {
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    overflow: 'hidden',
    aspectRatio: 0.9, // Sabit boy/en oranı için
    ...Shadows.medium,
  },
  achievementGradient: {
    padding: Spacing.lg,
    flex: 1,
    justifyContent: 'space-between',
  },
  achievementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  achievementIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  earnedBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    borderRadius: BorderRadius.round,
    padding: 4,
  },
  achievementContent: {
    flex: 1,
  },
  achievementTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  achievementDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  xpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  xpText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
  progressContainer: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 6,
    borderRadius: BorderRadius.xs,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.xs,
  },
  progressText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    textAlign: 'right',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rarityText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
}); 
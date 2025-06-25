import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { router } from 'expo-router';
import { ArrowRight, MessageSquare, Clock, Users, Bot, Video, Sparkles } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSequence, 
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  SlideInRight,
  FadeOut,
  interpolate,
  SlideInDown,
  FlipInEasyX
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FeatureCard = ({ icon, title, description, onPress, delay = 0 }: { 
  icon: React.ReactNode, 
  title: string, 
  description: string,
  onPress: () => void,
  delay?: number
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withTiming(0.97, { duration: 150 }),
      withTiming(1, { duration: 150 })
    );
    
    setTimeout(() => {
      onPress();
    }, 200);
  };

  return (
    <Animated.View 
      style={animatedStyle}
      entering={FadeIn.delay(delay).duration(400)}
    >
      <ModernCard 
        onPress={handlePress} 
        variant="elevated"
        style={{
          ...styles.featureCard,
          backgroundColor: theme.colors.darkGray[800]
        }}
      >
        <View style={[
          styles.featureIconContainer, 
          { 
            backgroundColor: theme.colors.primary[500] + '20',
            borderColor: theme.colors.primary[500] + '30'
          }
        ]}>
          {icon}
        </View>
        <View style={styles.featureContent}>
          <Text style={[styles.featureTitle, { color: theme.colors.text.primary }]}>{title}</Text>
          <Text style={[styles.featureDescription, { color: theme.colors.text.secondary }]}>{description}</Text>
        </View>
        <Animated.View 
          style={styles.featureArrow}
          entering={FadeIn.delay(delay + 100).duration(300)}
        >
          <ArrowRight size={20} color={theme.colors.primary[400]} />
        </Animated.View>
      </ModernCard>
    </Animated.View>
  );
};

const StatsCard = ({ label, value, icon, delay = 0 }: { 
  label: string, 
  value: string, 
  icon: React.ReactNode,
  delay?: number 
}) => {
  const { theme } = useTheme();
  
  return (
    <Animated.View entering={FlipInEasyX.delay(delay).duration(800)}>
      <GradientCard 
        colors={theme.colors.gradients.warmDark} 
        style={styles.statsCard}
      >
        <View style={styles.statsIcon}>{icon}</View>
        <Text style={[styles.statsValue, { color: theme.colors.text.primary }]}>{value}</Text>
        <Text style={[styles.statsLabel, { color: theme.colors.text.secondary }]}>{label}</Text>
      </GradientCard>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [userData, setUserData] = React.useState<any>(null);
  const welcomeOpacity = useSharedValue(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(20);
  const sparkleRotation = useSharedValue(0);
  
  useEffect(() => {
    welcomeOpacity.value = withTiming(1, { duration: 800 });
    cardOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));
    cardTranslateY.value = withDelay(300, withTiming(0, { duration: 800 }));

    // Sparkle animasyonu
    sparkleRotation.value = withTiming(360, { duration: 2000 }, () => {
      sparkleRotation.value = 0;
    });

    if (user) {
      fetchUserData();
    }

    const userDataUpdatedListener = () => {
      if (user) {
        fetchUserData();
      }
    };
    
    eventEmitter.on(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    
    return () => {
      eventEmitter.off(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    };
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (!user || !user.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const welcomeStyle = useAnimatedStyle(() => ({
    opacity: welcomeOpacity.value,
  }));
  
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));
  
  const activityScale = useSharedValue(1);
  
  useEffect(() => {
    activityScale.value = withSequence(
      withTiming(1.1, { duration: 1000 }),
      withTiming(1, { duration: 1000 })
    );
    
    const interval = setInterval(() => {
      activityScale.value = withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      );
    }, 2000);
    
    return () => clearInterval(interval);
  }, []);
  
  const activityStyle = useAnimatedStyle(() => ({
    transform: [{ scale: activityScale.value }],
  }));

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={[styles.welcomeContainer, welcomeStyle]}>
              <View style={styles.welcomeHeader}>
                <View>
                  <Text style={[styles.welcomeText, { color: theme.colors.text.secondary }]}>{t('home.welcome')}</Text>
                  <Text style={[styles.nameText, { color: theme.colors.text.primary }]}>{userData?.name || t('home.guest')}</Text>
                </View>
                <Animated.View style={sparkleStyle}>
                  <Sparkles size={28} color={theme.colors.primary[400]} />
                </Animated.View>
              </View>
              
              <ModernCard variant="glass" style={styles.activityCard}>
                <View style={styles.activeNowContainer}>
                  <Animated.View style={[styles.activeNowDot, activityStyle, { backgroundColor: theme.colors.success }]} />
                  <Text style={[styles.activeNowText, { color: theme.colors.text.secondary }]}>12 {t('home.friends_active')}</Text>
                </View>
              </ModernCard>
            </Animated.View>
            
            <Animated.View style={[styles.featuresContainer, cardStyle]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('home.quick_access')}</Text>
              
              <FeatureCard 
                icon={<MessageSquare size={24} color={theme.colors.primary[500]} />}
                title={t('home.chat_rooms')}
                description={t('home.chat_rooms_desc')}
                onPress={() => router.push('/(tabs)/chat')}
                delay={300}
              />
              
              <FeatureCard 
                icon={<Clock size={24} color={theme.colors.primary[500]} />}
                title={t('home.study_sessions')}
                description={t('home.study_sessions_desc')}
                onPress={() => router.push('/(tabs)/study')}
                delay={400}
              />

              <FeatureCard 
                icon={<Video size={24} color={theme.colors.primary[500]} />}
                title={t('home.watch_room')}
                description={t('home.watch_room_desc')}
                onPress={() => router.push('/watch')}
                delay={500}
              />
              
              {/* Ayrıcalıklar Bölümü */}
              <View style={styles.privilegesSection}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('home.privileges')}</Text>
                
                <Animated.View entering={FadeIn.delay(600).duration(600)}>
                  <TouchableOpacity 
                    onPress={() => {
                      if (userData?.is_pro) {
                        router.push('/ai-chat');
                      } else {
                        router.push('/pro-upgrade');
                      }
                    }}
                  >
                    <GradientCard 
                      colors={theme.colors.gradients.accent} 
                      style={styles.aiCard}
                    >
                      <Image 
                        source={{ uri: 'https://images.pexels.com/photos/8386440/pexels-photo-8386440.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1' }}
                        style={styles.aiCardImage}
                        resizeMode="cover"
                      />
                      <LinearGradient
                        colors={['rgba(0,0,0,0.4)', 'rgba(65,105,225,0.8)']}
                        style={styles.aiCardOverlay}
                      >
                        <Bot size={32} color={theme.colors.text.primary} style={styles.aiCardIcon} />
                        <Text style={[styles.aiCardTitle, { color: theme.colors.text.primary }]}>
                          {userData?.is_pro ? t('home.ai_coach') : t('home.ai_study')}
                        </Text>
                        <Text style={[styles.aiCardDescription, { color: theme.colors.text.secondary }]}>
                          {userData?.is_pro 
                            ? t('home.ai_coach_desc')
                            : t('home.ai_study_desc')
                          }
                        </Text>
                        {!userData?.is_pro && (
                          <Button 
                            title={t('home.upgrade_pro')}
                            onPress={() => router.push('/pro-upgrade')}
                            variant="primary"
                            size="small"
                            style={styles.aiCardButton}
                          />
                        )}
                      </LinearGradient>
                    </GradientCard>
                  </TouchableOpacity>
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  welcomeContainer: {
    marginBottom: Spacing.xl,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xl,
    lineHeight: 24,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    marginBottom: Spacing.sm,
    lineHeight: 34,
  },
  activityCard: {
    padding: Spacing.lg,
  },
  activeNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeNowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  activeNowText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  featuresContainer: {
    gap: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
    lineHeight: 22,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  featureIconContainer: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 1,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: 4,
    lineHeight: 20,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  featureArrow: {
    padding: Spacing.sm,
  },
  aiCard: {
    height: 220,
    marginVertical: Spacing.md,
    padding: 0,
    overflow: 'hidden',
    ...Shadows.large,
  },
  aiCardImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  aiCardOverlay: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  aiCardIcon: {
    marginBottom: Spacing.sm,
  },
  aiCardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  aiCardDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  aiCardButton: {
    alignSelf: 'flex-start',
  },
  statsContainer: {
    marginBottom: Spacing.xxl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    ...Shadows.medium,
  },
  statsIcon: {
    marginBottom: Spacing.sm,
  },
  statsValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginBottom: 4,
    lineHeight: 24,
  },
  statsLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    lineHeight: 16,
  },
  imageCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: BorderRadius.lg,
    position: 'absolute',
  },
  imageOverlay: {
    height: 200,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    justifyContent: 'flex-end',
  },
  imageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginBottom: 6,
    lineHeight: 26,
  },
  imageDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    marginBottom: Spacing.lg,
    lineHeight: 22,
  },
  imageButton: {
    alignSelf: 'flex-start',
  },
  privilegesSection: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xxl,
  },
});
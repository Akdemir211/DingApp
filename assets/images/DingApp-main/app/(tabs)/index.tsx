import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
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
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value
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
        style={styles.featureCard}
      >
        <View style={styles.featureIconContainer}>
          {icon}
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <Animated.View 
          style={styles.featureArrow}
          entering={FadeIn.delay(delay + 100).duration(300)}
        >
          <ArrowRight size={20} color={Colors.primary[400]} />
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
  return (
    <Animated.View entering={FlipInEasyX.delay(delay).duration(800)}>
      <GradientCard 
        colors={Colors.gradients.warmDark} 
        style={styles.statsCard}
      >
        <View style={styles.statsIcon}>{icon}</View>
        <Text style={styles.statsValue}>{value}</Text>
        <Text style={styles.statsLabel}>{label}</Text>
      </GradientCard>
    </Animated.View>
  );
};

export default function HomeScreen() {
  const { user } = useAuth();
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
      <GradientBackground colors={[Colors.background.dark, Colors.background.darker, Colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        <SafeAreaView style={styles.safeArea}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Animated.View style={[styles.welcomeContainer, welcomeStyle]}>
              <View style={styles.welcomeHeader}>
                <View>
                  <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
                  <Text style={styles.nameText}>{userData?.name || t('home.guest')}</Text>
                </View>
                <Animated.View style={sparkleStyle}>
                  <Sparkles size={24} color={Colors.primary[400]} />
                </Animated.View>
              </View>
              
              <ModernCard variant="glass" style={styles.activityCard}>
                <View style={styles.activeNowContainer}>
                  <Animated.View style={[styles.activeNowDot, activityStyle]} />
                  <Text style={styles.activeNowText}>12 {t('home.friends_active')}</Text>
                </View>
              </ModernCard>
            </Animated.View>
            
            <Animated.View style={[styles.featuresContainer, cardStyle]}>
              <Text style={styles.sectionTitle}>{t('home.quick_access')}</Text>
              
              <FeatureCard 
                icon={<MessageSquare size={20} color={Colors.primary[500]} />}
                title={t('home.chat_rooms')}
                description={t('home.chat_rooms_desc')}
                onPress={() => router.push('/(tabs)/chat')}
                delay={300}
              />
              
              <FeatureCard 
                icon={<Clock size={20} color={Colors.primary[500]} />}
                title={t('home.study_sessions')}
                description={t('home.study_sessions_desc')}
                onPress={() => router.push('/(tabs)/study')}
                delay={400}
              />

              <FeatureCard 
                icon={<Video size={20} color={Colors.primary[500]} />}
                title={t('home.watch_room')}
                description={t('home.watch_room_desc')}
                onPress={() => router.push('/watch')}
                delay={500}
              />
              
              {/* Ayrıcalıklar Bölümü */}
              <View style={styles.privilegesSection}>
                <Text style={styles.sectionTitle}>{t('home.privileges')}</Text>
                
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
                      colors={Colors.gradients.accent} 
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
                        <Bot size={28} color={Colors.text.primary} style={styles.aiCardIcon} />
                        <Text style={styles.aiCardTitle}>
                          {userData?.is_pro ? t('home.ai_coach') : t('home.ai_study')}
                        </Text>
                        <Text style={styles.aiCardDescription}>
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
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  welcomeContainer: {
    marginBottom: Spacing.lg,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  welcomeText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
  },
  nameText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  activityCard: {
    padding: Spacing.sm,
  },
  activeNowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeNowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
    marginRight: Spacing.xs,
  },
  activeNowText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  featuresContainer: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    ...Shadows.medium,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary[500] + '30',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    lineHeight: 16,
  },
  featureArrow: {
    padding: Spacing.xs,
  },
  aiCard: {
    height: 200,
    marginVertical: Spacing.sm,
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
    padding: Spacing.md,
    justifyContent: 'flex-end',
  },
  aiCardIcon: {
    marginBottom: Spacing.xs,
  },
  aiCardTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  aiCardDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.primary,
    lineHeight: 16,
    marginBottom: Spacing.sm,
  },
  aiCardButton: {
    alignSelf: 'flex-start',
  },
  statsContainer: {
    marginBottom: Spacing.xl,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  statsCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.md,
    ...Shadows.medium,
  },
  statsIcon: {
    marginBottom: Spacing.xs,
  },
  statsValue: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: 2,
  },
  statsLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
  },
  imageCard: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  cardImage: {
    width: '100%',
    height: 180,
    borderRadius: BorderRadius.lg,
    position: 'absolute',
  },
  imageOverlay: {
    height: 180,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    justifyContent: 'flex-end',
  },
  imageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  imageDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.md,
    lineHeight: 20,
  },
  imageButton: {
    alignSelf: 'flex-start',
  },
  privilegesSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
});
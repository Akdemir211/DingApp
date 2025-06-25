import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Platform, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { router } from 'expo-router';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/UI/Button';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withDelay, 
  Easing,
  FadeIn,
  SlideInDown,
  SlideInLeft,
  SlideInRight,
  SlideInUp
} from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { 
  MessageSquare, 
  Clock, 
  Users, 
  Brain, 
  Star,
  Shield,
  Zap,
  Trophy,
  Smartphone,
  Globe,
  CheckCircle,
  ArrowRight,
  Quote,
  LogIn,
  UserPlus,
  Blocks
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const { theme, themeMode } = useTheme();
  const { user } = useAuth();
  
  const isTablet = width > 768;
  const isMobile = width < 768;
  
  const features = [
    {
      icon: MessageSquare,
      title: "Güvenli Sohbet Odaları",
      description: "End-to-end şifreleme ile arkadaşlarınla güvenle sohbet et",
      color: '#6366F1',
      benefits: ["Şifreli mesajlaşma", "Grup sohbetleri", "Dosya paylaşımı"]
    },
    {
      icon: Clock,
      title: "Akıllı Çalışma Odaları", 
      description: "Pomodoro tekniği ile verimli çalışma seansları düzenle",
      color: '#10B981',
      benefits: ["Zamanlayıcı", "Sıralama tablosu", "İstatistikler"]
    },
    {
      icon: Users,
      title: "Birlikte İzleme Odaları",
      description: "Arkadaşlarınla video izleyip gerçek zamanlı etkileşim kur",
      color: '#F59E0B',
      benefits: ["Senkron video", "Canlı sohbet", "Oynatma kontrolü"]
    },
    {
      icon: Brain,
      title: "AI Öğrenme Asistanı",
      description: "Yapay zeka destekli kişisel gelişim ve öğrenme koçu",
      color: '#EF4444',
      benefits: ["Kişisel tavsiyeler", "Çalışma planı", "Motivasyon"]
    }
  ];

  const stats = [
    { number: "10,000+", label: "Aktif Kullanıcı", icon: Users, color: '#6366F1' },
    { number: "50,000+", label: "Mesaj Gönderildi", icon: MessageSquare, color: '#10B981' },
    { number: "15,000+", label: "Çalışma Saati", icon: Clock, color: '#F59E0B' },
    { number: "4.8★", label: "Kullanıcı Puanı", icon: Star, color: '#EF4444' }
  ];

  const testimonials = [
    {
      name: "Elif Kaya",
      role: "Üniversite Öğrencisi",
      avatar: "E",
      text: "Çalışma odaları sayesinde arkadaşlarımla birlikte çalışarak motivasyonumu artırdım. Verimlilik %70 arttı!",
      rating: 5
    },
    {
      name: "Mehmet Demir", 
      role: "Yazılım Geliştirici",
      avatar: "M",
      text: "Sohbet odaları ekip çalışması için harika. Güvenli ve hızlı mesajlaşma.",
      rating: 5
    }
  ];

  const highlights = [
    { icon: Shield, text: "End-to-end şifreleme" },
    { icon: Zap, text: "Hızlı ve güvenilir" },
    { icon: Trophy, text: "Ödüllü tasarım" },
    { icon: Smartphone, text: "Mobil uyumlu" }
  ];
  
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
      return;
    }
  }, [user]);
  
  const styles = createStyles(theme.colors, width, height, isTablet, isMobile);
  
  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
        
        {/* Floating Island Navigation */}
        <Animated.View 
          entering={SlideInDown.delay(200).duration(800)}
          style={styles.floatingIsland}
        >
          <LinearGradient
            colors={[
              theme.colors.background.card + 'E6',
              theme.colors.background.card + 'F2'
            ]}
            style={styles.islandGradient}
          >
                         <View style={styles.islandContent}>
               {/* Brand Icon */}
               <View style={styles.miniLogo}>
                 <Blocks size={20} color={theme.colors.primary[400]} />
               </View>
              
              {/* Action Buttons */}
              <View style={styles.islandButtons}>
                                 <Pressable 
                   style={[styles.islandButton, styles.loginButton, { borderColor: theme.colors.primary[400] + '40' }]}
                   onPress={() => router.push('/(auth)/sign-in')}
                 >
                   <LogIn size={18} color={theme.colors.primary[400]} />
                   <Text style={[styles.islandButtonText, { color: theme.colors.primary[400] }]}>
                     Giriş
                   </Text>
                 </Pressable>
                 
                 <Pressable 
                   style={[styles.islandButton, styles.signupButton, { backgroundColor: theme.colors.primary[500] }]}
                   onPress={() => router.push('/(auth)/sign-up')}
                 >
                   <UserPlus size={18} color="white" />
                   <Text style={[styles.islandButtonText, { color: 'white' }]}>
                     Hesap Oluştur
                   </Text>
                 </Pressable>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <SafeContainer style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            {/* Hero Section */}
            <Animated.View 
              entering={FadeIn.delay(400).duration(800)}
              style={styles.heroSection}
            >
              <View style={styles.logoContainer}>
                <Image
                  source={require('@/assets/images/roomix-logo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              
              <View style={styles.heroContent}>
                <Text style={[styles.heroTitle, { color: theme.colors.text.primary }]}>
                  Roomix
                </Text>
                <Text style={[styles.heroSubtitle, { color: theme.colors.primary[400] }]}>
                  Sosyal Çalışma & Eğlence Platformu
                </Text>
                <Text style={[styles.heroDescription, { color: theme.colors.text.secondary }]}>
                  Arkadaşlarınla birlikte çalış, sohbet et ve birlikte video izle. 
                  Modern tasarım ve güvenli teknoloji ile.
                </Text>
              </View>

              {/* Highlights */}
              <Animated.View 
                entering={SlideInDown.delay(600).duration(600)}
                style={styles.highlightsContainer}
              >
                {highlights.map((highlight, index) => (
                  <View key={index} style={[styles.highlightItem, { backgroundColor: theme.colors.background.card + '60' }]}>
                    <highlight.icon size={18} color={theme.colors.primary[400]} />
                    <Text style={[styles.highlightText, { color: theme.colors.text.secondary }]}>
                      {highlight.text}
                    </Text>
                  </View>
                ))}
              </Animated.View>
            </Animated.View>

            {/* Stats Section */}
            <Animated.View 
              entering={SlideInLeft.delay(800).duration(600)}
              style={styles.statsSection}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Platform İstatistikleri
              </Text>
              <View style={styles.statsGrid}>
                {stats.map((stat, index) => (
                  <Animated.View 
                    key={index}
                    entering={FadeIn.delay(1000 + index * 100).duration(500)}
                    style={[styles.statCard, { backgroundColor: theme.colors.background.card + '80' }]}
                  >
                    <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                      <stat.icon size={24} color={stat.color} />
                    </View>
                    <Text style={[styles.statNumber, { color: theme.colors.text.primary }]}>
                      {stat.number}
                    </Text>
                    <Text style={[styles.statLabel, { color: theme.colors.text.secondary }]}>
                      {stat.label}
                    </Text>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Features Section */}
            <Animated.View 
              entering={SlideInRight.delay(1200).duration(600)}
              style={styles.featuresSection}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Özellikler
              </Text>
              <View style={styles.featuresGrid}>
                {features.map((feature, index) => (
                  <Animated.View 
                    key={index}
                    entering={FadeIn.delay(1400 + index * 150).duration(500)}
                    style={[styles.featureCard, { backgroundColor: theme.colors.background.card + '80' }]}
                  >
                    <Pressable style={styles.featureContent}>
                      <View style={styles.featureHeader}>
                        <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
                          <feature.icon size={28} color={feature.color} />
                        </View>
                        <ArrowRight size={20} color={theme.colors.text.tertiary} />
                      </View>
                      
                      <Text style={[styles.featureTitle, { color: theme.colors.text.primary }]}>
                        {feature.title}
                      </Text>
                      <Text style={[styles.featureDescription, { color: theme.colors.text.secondary }]}>
                        {feature.description}
                      </Text>
                      
                      <View style={styles.benefitsList}>
                        {feature.benefits.map((benefit, bIndex) => (
                          <View key={bIndex} style={styles.benefitItem}>
                            <CheckCircle size={14} color={feature.color} />
                            <Text style={[styles.benefitText, { color: theme.colors.text.secondary }]}>
                              {benefit}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </Animated.View>

            {/* Testimonials */}
            <Animated.View 
              entering={FadeIn.delay(2000).duration(600)}
              style={styles.testimonialsSection}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Kullanıcı Deneyimleri
              </Text>
              <View style={styles.testimonialsGrid}>
                {testimonials.map((testimonial, index) => (
                  <View 
                    key={index}
                    style={[styles.testimonialCard, { backgroundColor: theme.colors.background.card + '80' }]}
                  >
                    <Quote size={24} color={theme.colors.primary[400]} style={styles.quoteIcon} />
                    
                    <Text style={[styles.testimonialText, { color: theme.colors.text.primary }]}>
                      {testimonial.text}
                    </Text>
                    
                    <View style={styles.testimonialFooter}>
                      <View style={styles.testimonialAuthor}>
                        <View style={[styles.avatar, { backgroundColor: theme.colors.primary[500] }]}>
                          <Text style={styles.avatarText}>{testimonial.avatar}</Text>
                        </View>
                        <View>
                          <Text style={[styles.authorName, { color: theme.colors.text.primary }]}>
                            {testimonial.name}
                          </Text>
                          <Text style={[styles.authorRole, { color: theme.colors.text.secondary }]}>
                            {testimonial.role}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.rating}>
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} size={14} color={theme.colors.warning} fill={theme.colors.warning} />
                        ))}
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </Animated.View>
          </ScrollView>
        </SafeContainer>
      </GradientBackground>
    </View>
  );
}

const createStyles = (colors: any, screenWidth: number, screenHeight: number, isTablet: boolean, isMobile: boolean) => StyleSheet.create({
  container: {
    flex: 1,
  },
  
  // Floating Island
  floatingIsland: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1000,
    ...Shadows.large,
  },
  islandGradient: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary + '30',
  },
  islandContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  miniLogo: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    backgroundColor: colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary[400] + '30',
  },
  islandButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  islandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    minWidth: isMobile ? 110 : 130,
    justifyContent: 'center',
  },
  loginButton: {
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  signupButton: {
    ...Shadows.medium,
  },
  islandButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: isMobile ? FontSizes.sm : FontSizes.md,
  },
  
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  
  // Hero Section
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 140 : 100, // Space for floating island
    paddingBottom: Spacing.xxl,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logo: {
    width: isMobile ? 182 : 234,
    height: isMobile ? 182 : 234,
    borderRadius: BorderRadius.round,
  },
  heroContent: {
    alignItems: 'center',
    maxWidth: isTablet ? 600 : screenWidth - Spacing.xl * 2,
    marginBottom: Spacing.xl,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: isMobile ? 36 : 48,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  heroSubtitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: isMobile ? FontSizes.lg : FontSizes.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  heroDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: isMobile ? FontSizes.md : FontSizes.lg,
    textAlign: 'center',
    lineHeight: isMobile ? 22 : 26,
    opacity: 0.9,
  },
  
  // Highlights
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    gap: Spacing.xs,
  },
  highlightText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  
  // Stats Section
  statsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: isMobile ? FontSizes.xl : FontSizes.xxl,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  statCard: {
    width: (screenWidth - Spacing.xl * 2 - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary + '20',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: isMobile ? FontSizes.lg : FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  
  // Features Section
  featuresSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  featuresGrid: {
    gap: Spacing.lg,
  },
  featureCard: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary + '20',
    overflow: 'hidden',
  },
  featureContent: {
    padding: Spacing.xl,
  },
  featureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  benefitsList: {
    gap: Spacing.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  benefitText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  
  // Testimonials Section
  testimonialsSection: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  testimonialsGrid: {
    gap: Spacing.lg,
  },
  testimonialCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border.primary + '20',
    position: 'relative',
  },
  quoteIcon: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    opacity: 0.3,
  },
  testimonialText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
    paddingRight: Spacing.xl,
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  testimonialAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
    color: 'white',
  },
  authorName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  authorRole: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  rating: {
    flexDirection: 'row',
    gap: 2,
  },
});
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { router } from 'expo-router';
import { Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/UI/Button';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { GradientBackground } from '@/components/UI/GradientBackground';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { MessageSquare, Clock, Users, Brain } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const { theme, themeMode } = useTheme();
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const featureOpacity = useSharedValue(0);
  const featureTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const { user } = useAuth();
  
  const isTablet = width > 768;
  const isMobile = width < 768;
  
  useEffect(() => {
    if (user) {
      router.replace('/(tabs)');
      return;
    }
    
    logoOpacity.value = withTiming(1, { duration: 800, easing: Easing.ease });
    titleOpacity.value = withDelay(200, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(200, withTiming(0, { duration: 800 }));
    featureOpacity.value = withDelay(500, withTiming(1, { duration: 800 }));
    featureTranslateY.value = withDelay(500, withTiming(0, { duration: 800 }));
    buttonOpacity.value = withDelay(800, withTiming(1, { duration: 800 }));
    buttonTranslateY.value = withDelay(800, withTiming(0, { duration: 800 }));
  }, [user]);
  
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
  }));
  
  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));
  
  const featureStyle = useAnimatedStyle(() => ({
    opacity: featureOpacity.value,
    transform: [{ translateY: featureTranslateY.value }],
  }));
  
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ translateY: buttonTranslateY.value }],
  }));
  
  const styles = createStyles(theme.colors, width, height, isTablet, isMobile);
  
  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
        <FloatingBubbleBackground />
        
        <SafeContainer style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <Animated.View style={[styles.logoContainer, logoStyle]}>
              <Image
                source={require('@/assets/images/roomix-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
            
            <Animated.View style={[styles.contentContainer, titleStyle]}>
              <Text style={styles.appName}>Roomix</Text>
              <Text style={styles.tagline}>Bağlan. Sohbet Et. Birlikte Çalış.</Text>
            </Animated.View>
            
            <Animated.View style={[styles.featuresContainer, featureStyle]}>
              <View style={styles.featureItem}>
                <MessageSquare size={isMobile ? 30 : 28} color={theme.colors.primary[400]} />
                <Text style={styles.featureText}>Özel konuşmalar için şifreli sohbet odaları</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Clock size={isMobile ? 30 : 28} color={theme.colors.primary[400]} />
                <Text style={styles.featureText}>Verimlilik zamanlayıcılı çalışma odaları</Text>
              </View>
              
              <View style={styles.featureItem}>
                <Users size={isMobile ? 30 : 28} color={theme.colors.primary[400]} />
                <Text style={styles.featureText}>Sıralama tablolu ortak çalışma alanları</Text>
              </View>

              <View style={styles.featureItem}>
                <Brain size={isMobile ? 30 : 28} color={theme.colors.primary[400]} />
                <Text style={styles.featureText}>Yapay zeka destekli eğitim koçu</Text>
              </View>
            </Animated.View>
            
            <Animated.View style={[styles.buttonContainer, buttonStyle]}>
              <Button 
                title="Giriş Yap" 
                onPress={() => router.push('/(auth)/sign-in')} 
                variant="primary"
                size={isMobile ? "medium" : "large"}
                style={styles.primaryButton}
              />
              <Button 
                title="Hesap Oluştur" 
                onPress={() => router.push('/(auth)/sign-up')} 
                variant="outline"
                size={isMobile ? "medium" : "large"}
                style={styles.outlineButton}
              />
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
    backgroundColor: colors.background.primary,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: isMobile ? Spacing.lg : Spacing.xl,
    paddingTop: isMobile ? Spacing.lg : Spacing.xl,
    paddingBottom: Spacing.xl,
    minHeight: screenHeight,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: isMobile ? Spacing.md : Spacing.lg,
    marginBottom: isMobile ? Spacing.lg : Spacing.xl,
  },
  logo: {
    width: isMobile ? Math.min(screenWidth * 0.4, 150) : Math.min(screenWidth * 0.3, 200),
    height: isMobile ? Math.min(screenWidth * 0.4, 150) : Math.min(screenWidth * 0.3, 200),
    borderRadius: BorderRadius.round,
  },
  contentContainer: {
    alignItems: 'center',
    marginBottom: isMobile ? Spacing.xl : Spacing.xxl,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: isMobile ? 42 : isTablet ? 64 : 56,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: isMobile ? FontSizes.lg : FontSizes.xl,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: isMobile ? 20 : 24,
    paddingHorizontal: Spacing.sm,
  },
  featuresContainer: {
    flex: 1,
    marginBottom: Spacing.xl,
    width: '100%',
    maxWidth: isTablet ? 600 : '100%',
    alignSelf: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isMobile ? Spacing.md : Spacing.lg,
    paddingVertical: isMobile ? Spacing.md : Spacing.lg,
    paddingHorizontal: isMobile ? Spacing.md : Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.card + '80',
    borderWidth: 1,
    borderColor: colors.border.primary + '20',
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: isMobile ? FontSizes.md : FontSizes.lg,
    color: colors.text.primary,
    marginLeft: isMobile ? Spacing.md : Spacing.lg,
    flex: 1,
    lineHeight: isMobile ? 18 : 22,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: isTablet ? 400 : '100%',
    alignSelf: 'center',
    gap: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.md,
  },
  primaryButton: {
    width: '100%',
    minHeight: isMobile ? 48 : 56,
    shadowColor: colors.primary[400],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  outlineButton: {
    width: '100%',
    minHeight: isMobile ? 48 : 56,
    borderWidth: 2,
    borderColor: colors.primary[400],
    backgroundColor: colors.background.card + '40',
  },
});
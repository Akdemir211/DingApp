import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, useWindowDimensions, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/UI/Button';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { MessageSquare, Clock, Users, Brain } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const { theme, themeMode } = useTheme();
  const logoOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);
  const featureOpacity = useSharedValue(0);
  const featureTranslateY = useSharedValue(30);
  const buttonOpacity = useSharedValue(0);
  const buttonTranslateY = useSharedValue(40);
  const { user } = useAuth();
  
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
  
  const styles = createStyles(theme.colors);
  
  return (
    <View style={styles.container}>
      <StatusBar style={themeMode === 'light' ? 'dark' : 'light'} />
      <FloatingBubbleBackground />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <Image
            source={require('@/assets/images/roomix-logo.png')}
            style={[styles.logo, { width: width * 0.6, height: width * 0.6 }]}
          />
        </Animated.View>
        
        <Animated.View style={[styles.contentContainer, titleStyle]}>
          <Text style={styles.appName}>Roomix</Text>
          <Text style={styles.tagline}>Bağlan. Sohbet Et. Birlikte Çalış.</Text>
        </Animated.View>
        
        <Animated.View style={[styles.featuresContainer, featureStyle]}>
          <View style={styles.featureItem}>
            <MessageSquare size={28} color={theme.colors.primary[400]} />
            <Text style={styles.featureText}>Özel konuşmalar için şifreli sohbet odaları</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Clock size={28} color={theme.colors.primary[400]} />
            <Text style={styles.featureText}>Verimlilik zamanlayıcılı çalışma odaları</Text>
          </View>
          
          <View style={styles.featureItem}>
            <Users size={28} color={theme.colors.primary[400]} />
            <Text style={styles.featureText}>Sıralama tablolu ortak çalışma alanları</Text>
          </View>

          <View style={styles.featureItem}>
            <Brain size={28} color={theme.colors.primary[400]} />
            <Text style={styles.featureText}>Yapay zeka destekli eğitim koçu</Text>
          </View>
        </Animated.View>
        
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <Button 
            title="Giriş Yap" 
            onPress={() => router.push('/(auth)/sign-in')} 
            variant="primary"
            size="large"
            style={styles.button}
          />
          <Button 
            title="Hesap Oluştur" 
            onPress={() => router.push('/(auth)/sign-up')} 
            variant="outline"
            size="large"
            style={styles.button}
          />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 40 : 60,
    paddingBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: Spacing.xxl,
    marginBottom: Spacing.xl,
  },
  logo: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  contentContainer: {
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  appName: {
    fontFamily: 'Inter-Bold',
    fontSize: 56,
    color: colors.text.primary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xl,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xxl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: colors.background.card,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: colors.text.primary,
    marginLeft: Spacing.lg,
    flex: 1,
    lineHeight: 22,
  },
  buttonContainer: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  button: {
    width: '100%',
  },
});
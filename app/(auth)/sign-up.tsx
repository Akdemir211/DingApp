import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { GradientBackground } from '@/components/UI/GradientBackground';
import { Mail, Lock, User, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [cooldown, setCooldown] = useState(0);
  const { signUp, loading } = useAuth();
  const { theme } = useTheme();
  
  // Handle cooldown timer
  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);
  
  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    
    if (!name) {
      newErrors.name = 'İsim gerekli';
    }
    
    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    } else if (password.length < 6) {
      newErrors.password = 'Şifre en az 6 karakter olmalı';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Şifreler eşleşmiyor';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignUp = async () => {
    if (!validateForm() || cooldown > 0) return;
    
    try {
      await signUp(email, password, name);
      // Show success message after successful signup
      setErrors({
        email: 'Kayıt başarılı! Lütfen e-posta adresinizi doğrulayın.'
      });
    } catch (error: any) {
      if (error.message?.includes('over_email_send_rate_limit')) {
        const waitTime = parseInt(error.message.match(/\d+/)[0] || '60');
        setCooldown(waitTime);
        setErrors({
          email: `Güvenlik nedeniyle ${waitTime} saniye beklemeniz gerekiyor.`
        });
      } else {
        setErrors({
          email: error.message || 'Kayıt başarısız. Lütfen tekrar deneyin.'
        });
      }
    }
  };
  
  const styles = createStyles(theme.colors);

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={28} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text.primary }]}>Hesap Oluştur</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Ding'e katılmak için kayıt ol</Text>
        </View>
        
        <View style={styles.formContainer}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="İsminizi girin"
            autoCapitalize="words"
            leftIcon={<User size={24} color={theme.colors.darkGray[400]} />}
            error={errors.name}
          />
          
          <Input
            value={email}
            onChangeText={setEmail}
            placeholder="E-posta adresinizi girin"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Mail size={24} color={theme.colors.darkGray[400]} />}
            error={errors.email}
          />
          
          <Input
            value={password}
            onChangeText={setPassword}
            placeholder="Şifre oluşturun"
            secureTextEntry
            leftIcon={<Lock size={24} color={theme.colors.darkGray[400]} />}
            error={errors.password}
          />
          
          <Input
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Şifrenizi tekrar girin"
            secureTextEntry
            leftIcon={<Lock size={24} color={theme.colors.darkGray[400]} />}
            error={errors.confirmPassword}
          />
          
          <Button
            title={cooldown > 0 ? `Lütfen ${cooldown} saniye bekleyin` : "Hesap Oluştur"}
            onPress={handleSignUp}
            variant="primary"
            size="large"
            isLoading={loading}
            style={styles.button}
            disabled={cooldown > 0}
          />
          
          <View style={styles.bottomText}>
            <Text style={[styles.accountText, { color: theme.colors.text.secondary }]}>Zaten hesabın var mı? </Text>
            <Link href="/(auth)/sign-in" asChild>
              <TouchableOpacity>
                <Text style={[styles.signInLink, { color: theme.colors.primary[500] }]}>Giriş Yap</Text>
              </TouchableOpacity>
            </Link>
          </View>
            </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeContainer>
      </GradientBackground>
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  backButton: {
    marginBottom: Spacing.xl,
    padding: Spacing.sm,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 32,
    marginBottom: Spacing.sm,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    lineHeight: 24,
  },
  formContainer: {
    marginTop: Spacing.lg,
  },
  button: {
    marginTop: Spacing.xl,
  },
  bottomText: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.xxl,
  },
  accountText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
  signInLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
  },
});
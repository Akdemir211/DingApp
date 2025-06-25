import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router, Link } from 'expo-router';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { GradientBackground } from '@/components/UI/GradientBackground';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { signIn, loading } = useAuth();
  const { theme } = useTheme();
  
  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = 'E-posta adresi gerekli';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Geçerli bir e-posta adresi girin';
    }
    
    if (!password) {
      newErrors.password = 'Şifre gerekli';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSignIn = async () => {
    if (!validateForm()) return;
    
    try {
      await signIn(email, password);
    } catch (error: any) {
      if (error.message?.includes('invalid_credentials')) {
        setErrors({
          email: 'E-posta adresi veya şifre hatalı',
          password: 'E-posta adresi veya şifre hatalı'
        });
      } else {
        setErrors({
          password: 'Giriş yapılamadı. Lütfen tekrar deneyin.'
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
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>Tekrar Hoşgeldin</Text>
                <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>Ding'e devam etmek için giriş yap</Text>
              </View>
              
              <View style={styles.formContainer}>
                <Input
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setErrors((prev) => ({ ...prev, email: undefined }));
                  }}
                  placeholder="E-posta adresinizi girin"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={24} color={theme.colors.darkGray[400]} />}
                  error={errors.email}
                />
                
                <Input
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setErrors((prev) => ({ ...prev, password: undefined }));
                  }}
                  placeholder="Şifrenizi girin"
                  secureTextEntry
                  leftIcon={<Lock size={24} color={theme.colors.darkGray[400]} />}
                  error={errors.password}
                />
                
                <Button
                  title="Giriş Yap"
                  onPress={handleSignIn}
                  variant="primary"
                  size="large"
                  isLoading={loading}
                  style={styles.button}
                />
                
                <View style={styles.bottomText}>
                  <Text style={[styles.noAccountText, { color: theme.colors.text.secondary }]}>Hesabın yok mu?</Text>
                  <Link href="/(auth)/sign-up" asChild>
                    <TouchableOpacity>
                      <Text style={[styles.signUpLink, { color: theme.colors.primary[500] }]}>Kayıt Ol</Text>
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
  noAccountText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    marginRight: Spacing.sm,
  },
  signUpLink: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
  },
});
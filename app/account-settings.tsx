import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { GradientBackground } from '@/components/UI/GradientBackground';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ArrowLeft, User, Lock, Shield, Mail, Camera, AlertCircle } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';
import { getProfilePhoto } from '@/lib/profileService';
import Animated, { 
  FadeIn, 
  SlideInDown,
  SlideInRight
} from 'react-native-reanimated';

export default function AccountSettingsScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!router.canGoBack()) {
      router.replace('/(tabs)/profile');
      return;
    }

    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;
      if (userData && 'name' in userData) {
        setName((userData as any).name || '');
      }

      setEmail(user.email || '');
      
      const photoUrl = await getProfilePhoto(user.id);
      setPhotoUrl(photoUrl);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError('Profil bilgileri yüklenirken hata oluştu');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { error } = await supabase
        .from('users')
        .update({ name })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess('Profil bilgileri güncellendi');
      eventEmitter.emit(Events.USER_DATA_UPDATED);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      if (newPassword !== confirmPassword) {
        throw new Error('Şifreler eşleşmiyor');
      }

      if (newPassword.length < 6) {
        throw new Error('Şifre en az 6 karakter olmalı');
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess('Şifre güncellendi');
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpdated = (url: string) => {
    setPhotoUrl(url);
    eventEmitter.emit(Events.USER_DATA_UPDATED);
  };

  const showMessage = (message: string, isError: boolean = false) => {
    Alert.alert(
      isError ? 'Hata' : 'Başarılı',
      message,
      [{ text: 'Tamam' }]
    );
  };

  useEffect(() => {
    if (error) {
      showMessage(error, true);
      setError(null);
    }
  }, [error]);

  useEffect(() => {
    if (success) {
      showMessage(success, false);
      setSuccess(null);
    }
  }, [success]);

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
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Header */}
              <Animated.View 
                style={styles.header}
                entering={FadeIn.duration(400)}
              >
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                  <ArrowLeft size={28} color={theme.colors.text.primary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text.primary }]}>
                  Hesap Ayarları
                </Text>
                <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                  Profil bilgilerinizi güncelleyin
                </Text>
              </Animated.View>

              {/* Profile Photo Section */}
              <Animated.View 
                entering={FadeIn.delay(200).duration(600)}
                style={styles.photoSection}
              >
                <View style={styles.photoContainer}>
                  <View style={styles.photoWrapper}>
                    <ProfilePhoto 
                      uri={photoUrl}
                      size={100}
                      editable={true}
                      onPhotoUpdated={handlePhotoUpdated}
                    />
                    <View style={[styles.cameraIconContainer, { backgroundColor: theme.colors.primary[500] }]}>
                      <Camera size={18} color={theme.colors.text.inverse} />
                    </View>
                  </View>
                  <Text style={[styles.photoTitle, { color: theme.colors.text.primary }]}>
                    Profil Fotoğrafı
                  </Text>
                  <Text style={[styles.photoSubtitle, { color: theme.colors.text.secondary }]}>
                    Fotoğrafınızı güncellemek için tıklayın
                  </Text>
                </View>
              </Animated.View>

              {/* Profile Information Form */}
              <Animated.View 
                entering={SlideInRight.delay(400).duration(600)}
                style={styles.formSection}
              >
                <View style={styles.sectionHeader}>
                  <User size={24} color={theme.colors.primary[400]} style={styles.sectionIcon} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    Kişisel Bilgiler
                  </Text>
                </View>
                
                <Input
                  
                  value={name}
                  onChangeText={setName}
                  placeholder="Adınızı girin"
                  autoCapitalize="words"
                  leftIcon={<User size={24} color={theme.colors.darkGray[400]} />}
                />
                
                <Input
                  
                  value={email}
                  onChangeText={setEmail}
                  placeholder="E-posta adresiniz"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Mail size={24} color={theme.colors.darkGray[400]} />}
                  editable={false}
                />
                
                <Button
                  title="Profili Güncelle"
                  onPress={handleUpdateProfile}
                  variant="primary"
                  size="large"
                  isLoading={loading}
                  style={styles.updateButton}
                />
              </Animated.View>

              {/* Password Change Form */}
              <Animated.View 
                entering={SlideInRight.delay(600).duration(600)}
                style={styles.formSection}
              >
                <View style={styles.sectionHeader}>
                  <Lock size={24} color={theme.colors.warning} style={styles.sectionIcon} />
                  <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                    Şifre Güvenliği
                  </Text>
                </View>
                
                <Input
                  
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Yeni şifrenizi girin"
                  secureTextEntry
                  leftIcon={<Lock size={24} color={theme.colors.darkGray[400]} />}
                />
                
                <Input
                  
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Yeni şifrenizi tekrar girin"
                  secureTextEntry
                  leftIcon={<Lock size={24} color={theme.colors.darkGray[400]} />}
                />
                
                <Button
                  title="Şifreyi Güncelle"
                  onPress={handleUpdatePassword}
                  variant="secondary"
                  size="large"
                  isLoading={loading}
                  style={styles.passwordButton}
                  disabled={!newPassword || !confirmPassword}
                />
              </Animated.View>

              {/* Security Info */}
              <Animated.View 
                entering={FadeIn.delay(800).duration(600)}
                style={styles.infoSection}
              >
                <View style={[styles.infoContainer, { 
                  backgroundColor: theme.colors.primary[500] + '15',
                  borderColor: theme.colors.primary[400] + '30'
                }]}>
                  <AlertCircle size={20} color={theme.colors.primary[400]} style={styles.infoIcon} />
                  <View style={styles.infoContent}>
                    <Text style={[styles.infoTitle, { color: theme.colors.text.primary }]}>
                      Güvenlik Önerileri
                    </Text>
                    <Text style={[styles.infoText, { color: theme.colors.text.secondary }]}>
                      Hesabınızın güvenliği için güçlü bir şifre kullanın. Şifreniz en az 6 karakter olmalı.
                    </Text>
                  </View>
                </View>
              </Animated.View>
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
    paddingHorizontal: Spacing.xxl,
    paddingTop: 0,
    paddingBottom: Spacing.xxl,
  },
  header: {
    marginBottom: Spacing.xl,
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
  photoSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    alignItems: 'center',
  },
  photoWrapper: {
    position: 'relative',
    marginBottom: Spacing.lg,
  },
  cameraIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.dark,
  },
  photoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  photoSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    textAlign: 'center',
    opacity: 0.8,
  },
  formSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionIcon: {
    marginRight: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
  },
  updateButton: {
    marginTop: Spacing.lg,
  },
  passwordButton: {
    marginTop: Spacing.lg,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  infoIcon: {
    marginRight: Spacing.md,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
    opacity: 0.9,
  },
})
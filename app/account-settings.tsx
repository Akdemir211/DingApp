import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { ArrowLeft, User, Lock, Shield, CheckCircle, AlertCircle, Mail } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';
import { getProfilePhoto } from '@/lib/profileService';
import Animated, { 
  FadeIn, 
  SlideInDown
} from 'react-native-reanimated';

export default function AccountSettingsScreen() {
  const { user } = useAuth();
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

  return (
    <SafeAreaView style={styles.container}>
      <FloatingBubbleBackground />
      
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Header */}
        <Animated.View 
          style={styles.header}
          entering={FadeIn.duration(400)}
        >
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.title}>Hesap Ayarları</Text>
          <Text style={styles.subtitle}>Profil bilgilerinizi yönetin</Text>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <Animated.View 
            entering={FadeIn.delay(200).duration(600)}
            style={styles.photoSection}
          >
            <View style={styles.photoContainer}>
              <ProfilePhoto 
                uri={photoUrl}
                size={80}
                editable={true}
                onPhotoUpdated={handlePhotoUpdated}
              />
              <View style={styles.photoInfo}>
                <Text style={styles.photoTitle}>Profil Fotoğrafı</Text>
                <Text style={styles.photoSubtitle}>Fotoğrafınızı değiştirmek için tıklayın</Text>
              </View>
            </View>
          </Animated.View>

          {/* Profile Information */}
          <Animated.View 
            entering={FadeIn.delay(400).duration(600)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <User size={20} color={Colors.primary[400]} />
              <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>
            </View>
            
            <View style={styles.formContainer}>
              <Input
                label=""
                value={name}
                onChangeText={setName}
                placeholder="Adınızı girin"
                autoCapitalize="words"
                leftIcon={<User size={24} color={Colors.darkGray[400]} />}
                style={styles.input}
              />
              
              <Input
                label=""
                value={email}
                onChangeText={setEmail}
                placeholder="E-posta adresiniz"
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<Mail size={24} color={Colors.darkGray[400]} />}
                editable={false}
                style={[styles.input, styles.disabledInput]}
              />
              
              <Button
                title="Profili Güncelle"
                onPress={handleUpdateProfile}
                variant="primary"
                isLoading={loading}
                style={styles.updateButton}
              />
            </View>
          </Animated.View>

          {/* Password Change */}
          <Animated.View 
            entering={FadeIn.delay(600).duration(600)}
            style={styles.section}
          >
            <View style={styles.sectionHeader}>
              <Lock size={20} color={Colors.primary[400]} />
              <Text style={styles.sectionTitle}>Şifre Değiştir</Text>
            </View>
            
            <View style={styles.formContainer}>
              <Input
                label=""
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="Yeni şifre"
                secureTextEntry
                leftIcon={<Lock size={24} color={Colors.darkGray[400]} />}
                style={styles.input}
              />
              
              <Input
                label=""
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Yeni şifreyi tekrar girin"
                secureTextEntry
                leftIcon={<Lock size={24} color={Colors.darkGray[400]} />}
                style={styles.input}
              />
              
              <Button
                title="Şifreyi Güncelle"
                onPress={handleUpdatePassword}
                variant="secondary"
                isLoading={loading}
                style={styles.passwordButton}
                disabled={!newPassword || !confirmPassword}
              />
            </View>
          </Animated.View>

          {/* Security Info */}
          <Animated.View 
            entering={FadeIn.delay(800).duration(600)}
            style={styles.infoSection}
          >
            <View style={styles.infoCard}>
              <Shield size={24} color={Colors.primary[400]} />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Güvenlik</Text>
                <Text style={styles.infoText}>
                  Hesabınızın güvenliği için güçlü bir şifre kullanın ve düzenli olarak güncelleyin.
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  backButton: {
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    alignSelf: 'flex-start',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: 28,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 36,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxl,
  },
  photoSection: {
    marginBottom: Spacing.xxl,
  },
  photoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  photoInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  photoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  photoSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  formContainer: {
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  input: {
    marginBottom: Spacing.md,
  },
  disabledInput: {
    opacity: 0.6,
  },
  updateButton: {
    marginTop: Spacing.sm,
  },
  passwordButton: {
    marginTop: Spacing.sm,
  },
  infoSection: {
    marginBottom: Spacing.xl,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.primary[500] + '10',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.primary[400] + '20',
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  infoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  infoText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
});
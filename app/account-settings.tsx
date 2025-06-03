import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ArrowLeft, User, Lock, Shield, CheckCircle, AlertCircle } from 'lucide-react-native';
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
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

      const photoUrl = await getProfilePhoto(user.id);
      setPhotoUrl(photoUrl);
    } catch (error: any) {
      console.error('Error fetching user profile:', error);
      setError(t('account.loading_error'));
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

      setSuccess(t('account.profile_updated'));
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
        throw new Error(t('account.passwords_not_match'));
      }

      if (newPassword.length < 6) {
        throw new Error(t('account.password_min_length'));
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setSuccess(t('account.password_updated'));
      setNewPassword('');
      setConfirmPassword('');
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

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <Animated.View 
            style={styles.header}
            entering={FadeIn.duration(400)}
          >
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('account.title')}</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Profile Hero */}
            <Animated.View 
              entering={FadeIn.delay(200).duration(600)}
              style={styles.heroSection}
            >
              <GradientCard colors={theme.colors.gradients.accent} style={styles.heroCard}>
                <View style={styles.heroContent}>
                  <ProfilePhoto 
                    uri={photoUrl}
                    size={70}
                    editable={true}
                    onPhotoUpdated={handlePhotoUpdated}
                  />
                  <View style={styles.heroInfo}>
                    <Text style={[styles.heroName, { color: theme.colors.text.primary }]}>{name || t('profile.user')}</Text>
                    <Text style={[styles.heroEmail, { color: theme.colors.text.secondary }]}>{user?.email}</Text>
                  </View>
                </View>
              </GradientCard>
            </Animated.View>

            {/* Profile Information */}
            <Animated.View 
              entering={FadeIn.delay(400).duration(600)}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('account.profile_info')}</Text>
              <ModernCard variant="elevated" style={styles.formCard}>
                <View style={styles.formHeader}>
                  <User size={20} color={theme.colors.primary[400]} />
                  <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>{t('account.personal_info')}</Text>
                </View>
                
                <View style={styles.form}>
                  <Input
                    label={t('account.full_name')}
                    value={name}
                    onChangeText={setName}
                    placeholder={t('account.enter_name')}
                    style={styles.input}
                  />
                  
                  <Button
                    title={t('account.update_profile')}
                    onPress={handleUpdateProfile}
                    variant="primary"
                    isLoading={loading}
                    style={styles.updateButton}
                  />
                </View>
              </ModernCard>
            </Animated.View>

            {/* Security */}
            <Animated.View 
              entering={FadeIn.delay(600).duration(600)}
              style={styles.section}
            >
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{t('account.security')}</Text>
              <ModernCard variant="elevated" style={styles.formCard}>
                <View style={styles.formHeader}>
                  <Shield size={20} color={theme.colors.warning} />
                  <Text style={[styles.formTitle, { color: theme.colors.text.primary }]}>{t('account.change_password')}</Text>
                </View>
                
                <View style={styles.form}>
                  <Input
                    label={t('account.new_password')}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder={t('account.enter_new_password')}
                    secureTextEntry
                    style={styles.input}
                  />
                  
                  <Input
                    label={t('account.confirm_password')}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder={t('account.enter_confirm_password')}
                    secureTextEntry
                    style={styles.input}
                  />
                  
                  <Button
                    title={t('account.update_password')}
                    onPress={handleUpdatePassword}
                    variant="primary"
                    isLoading={loading}
                    style={styles.updateButton}
                  />
                </View>
              </ModernCard>
            </Animated.View>

            {/* Messages */}
            {error && (
              <Animated.View 
                entering={FadeIn.duration(400)}
                style={styles.messageContainer}
              >
                <View style={[styles.errorCard, { backgroundColor: theme.colors.error + '10' }]}>
                  <View style={styles.messageContent}>
                    <AlertCircle size={18} color={theme.colors.error} />
                    <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
            
            {success && (
              <Animated.View 
                entering={FadeIn.duration(400)}
                style={styles.messageContainer}
              >
                <View style={[styles.successCard, { backgroundColor: theme.colors.success + '10' }]}>
                  <View style={styles.messageContent}>
                    <CheckCircle size={18} color={theme.colors.success} />
                    <Text style={[styles.successText, { color: theme.colors.success }]}>{success}</Text>
                  </View>
                </View>
              </Animated.View>
            )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
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
  headerSpacer: {
    flex: 1,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  heroCard: {
    width: '100%',
    padding: Spacing.xl,
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroInfo: {
    flexDirection: 'column',
  },
  heroName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
  },
  heroEmail: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  formCard: {
    padding: Spacing.lg,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  formTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
  },
  form: {
    gap: Spacing.md,
  },
  input: {
    marginBottom: 0,
  },
  updateButton: {
    marginTop: Spacing.md,
  },
  messageContainer: {
    marginTop: Spacing.lg,
  },
  errorCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  successCard: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadows.small,
  },
  successText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  messageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
});
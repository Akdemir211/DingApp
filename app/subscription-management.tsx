import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground } from '@/components/UI/GradientBackground';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { 
  ArrowLeft, 
  Crown, 
  RefreshCw, 
  X, 
  AlertTriangle,
  CheckCircle
} from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { PRO_PACKAGES } from '@/lib/stripeService';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  SlideInDown
} from 'react-native-reanimated';

export default function SubscriptionManagementScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('is_pro, pro_package, pro_started_at')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error: any) {
      console.error('Kullanıcı verisi alınırken hata:', error);
      Alert.alert('Hata', 'Üyelik bilgileri yüklenirken bir hata oluştu');
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Üyeliği İptal Et',
      'Pro üyeliğinizi iptal etmek istediğinizden emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'İptal Et',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              const { error } = await supabase
                .from('users')
                .update({ 
                  is_pro: false,
                  pro_package: null,
                  pro_started_at: null
                })
                .eq('id', user?.id);

              if (error) throw error;

              Alert.alert(
                'Üyelik İptal Edildi',
                'Pro üyeliğiniz başarıyla iptal edildi.',
                [{ text: 'Tamam', onPress: () => router.back() }]
              );
            } catch (error: any) {
              Alert.alert('Hata', 'Üyelik iptal edilirken bir hata oluştu');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const currentPackage = userData?.pro_package ? PRO_PACKAGES[userData.pro_package as 'monthly' | 'yearly'] : null;

  if (!userData?.is_pro) {
    return (
      <View style={styles.container}>
        <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
          <SafeContainer style={styles.safeArea}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
                <ArrowLeft size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Üyelik</Text>
              <View style={styles.headerSpacer} />
            </View>
            
            <View style={styles.centerContainer}>
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.warning + '20' }]}>
                <AlertTriangle size={48} color={theme.colors.warning} />
              </View>
              <Text style={[styles.centerTitle, { color: theme.colors.text.primary }]}>
                Pro Üyeliğiniz Yok
              </Text>
              <Text style={[styles.centerDescription, { color: theme.colors.text.secondary }]}>
                Pro özelliklerden yararlanmak için üyeliğinizi yükseltin
              </Text>
              <Button
                title="Pro'ya Yükselt"
                onPress={() => router.push('/pro-upgrade')}
                style={styles.upgradeButton}
              />
            </View>
          </SafeContainer>
        </GradientBackground>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(400)}
          >
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Üyelik Yönetimi</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Mevcut Plan - Minimalist */}
            <Animated.View entering={FadeIn.delay(200).duration(600)}>
              <ModernCard style={styles.planCard}>
                <View style={styles.planHeader}>
                  <View style={[styles.crownContainer, { backgroundColor: theme.colors.medal.gold + '15' }]}>
                    <Crown size={24} color={theme.colors.medal.gold} />
                  </View>
                  <View style={styles.planInfo}>
                    <Text style={[styles.planTitle, { color: theme.colors.text.primary }]}>
                      {currentPackage?.name || 'Pro Üyelik'}
                    </Text>
                    <Text style={[styles.planPrice, { color: theme.colors.text.secondary }]}>
                      {currentPackage?.price || '59.90'}₺/ay
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: theme.colors.success + '15' }]}>
                    <CheckCircle size={16} color={theme.colors.success} />
                    <Text style={[styles.statusText, { color: theme.colors.success }]}>Aktif</Text>
                  </View>
                </View>
              </ModernCard>
            </Animated.View>

            {/* Pro Özellikler - Minimalist */}
            <Animated.View entering={FadeIn.delay(400).duration(600)} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
                Pro Özellikleriniz
              </Text>
              
              <ModernCard style={styles.featuresCard}>
                <View style={styles.featuresList}>
                  {['Sınırsız AI Sohbet', 'Gelişmiş Çalışma Takibi', 'Premium Temalar', 'Öncelikli Destek'].map((feature, index) => (
                    <View key={index} style={styles.featureItem}>
                      <CheckCircle size={16} color={theme.colors.success} />
                      <Text style={[styles.featureText, { color: theme.colors.text.primary }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </ModernCard>
            </Animated.View>

            {/* Yönetim Butonları - Minimalist */}
            <Animated.View entering={FadeIn.delay(600).duration(600)} style={styles.actionsSection}>
              <Button
                title="Paketi Değiştir"
                onPress={() => router.push('/pro-upgrade')}
                variant="outline"
                style={styles.actionButton}
                icon={<RefreshCw size={18} color={theme.colors.primary[500]} />}
              />
              
              <Button
                title="Üyeliği İptal Et"
                onPress={handleCancelSubscription}
                variant="outline"
                style={[styles.actionButton, { 
                  borderColor: theme.colors.error + '50',
                  backgroundColor: theme.colors.error + '05'
                }]}
                icon={<X size={18} color={theme.colors.error} />}
                isLoading={loading}
              />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  headerSpacer: {
    width: 44,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xxl * 2,
  },
  
  // Not Pro User Styles
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  centerTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 24,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  centerDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl * 2,
    opacity: 0.8,
  },
  upgradeButton: {
    minWidth: 200,
  },

  // Pro User Styles
  planCard: {
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crownContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  planPrice: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    opacity: 0.7,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 20,
    gap: 6,
  },
  statusText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
  },
  
  section: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 18,
    marginBottom: Spacing.lg,
  },
  featuresCard: {
    padding: Spacing.xl,
  },
  featuresList: {
    gap: Spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
  },
  
  actionsSection: {
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  actionButton: {
    height: 52,
  },
}); 
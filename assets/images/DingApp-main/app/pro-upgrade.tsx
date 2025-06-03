import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Brain, LineChart as ChartLine, Bot, Infinity, Gift, Star, Zap, Check } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

// Yeni olay yayınlama için EventEmitter
import { eventEmitter, Events } from '@/lib/eventEmitter';

const ProFeature = ({ 
  icon, 
  title, 
  description,
  delay = 0
}: { 
  icon: React.ReactNode, 
  title: string,
  description: string,
  delay?: number
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
  };

  return (
    <Animated.View 
      entering={SlideInRight.delay(delay).duration(600)}
      style={animatedStyle}
    >
      <ModernCard 
        onPress={handlePress}
        variant="elevated"
        style={styles.featureCard}
      >
        <View style={styles.featureIcon}>
          {icon}
        </View>
        <View style={styles.featureContent}>
          <Text style={styles.featureTitle}>{title}</Text>
          <Text style={styles.featureDescription}>{description}</Text>
        </View>
        <Check size={20} color={Colors.success} style={styles.featureCheck} />
      </ModernCard>
    </Animated.View>
  );
};

export default function ProUpgradeScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refreshUserDataAndNavigate = async () => {
    try {
      // Pro üyelik durumu güncellendikten sonra olay yayınla
      eventEmitter.emit(Events.USER_DATA_UPDATED);
      
      // Kısa bir gecikme sonrası ana sayfaya dön
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);
    } catch (error: any) {
      console.error('User data refresh error:', error.message);
    }
  };

  const handleUpgrade = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Kullanıcının pro üyeliğini güncelle
      const { error } = await supabase
        .from('users')
        .update({ is_pro: true })
        .eq('id', user.id);

      if (error) throw error;

      await refreshUserDataAndNavigate();
    } catch (error: any) {
      console.error('Pro üyelik yükseltme hatası:', error.message);
      setError('Pro üyelik yükseltme başarısız oldu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  const handlePromoCode = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Promosyon kodunu kontrol et
      if (promoCode.toUpperCase() === 'İBRAHİM100') {
        // Pro üyeliği aktifleştir
        const { error } = await supabase
          .from('users')
          .update({ is_pro: true })
          .eq('id', user.id);

        if (error) throw error;

        await refreshUserDataAndNavigate();
      } else {
        setError('Geçersiz promosyon kodu');
      }
    } catch (error: any) {
      console.error('Promosyon kodu hatası:', error.message);
      setError('Promosyon kodu kullanılamadı. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <GradientBackground colors={[Colors.background.dark, Colors.background.darker]}>
        <FloatingBubbleBackground />
        <SafeAreaView style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(600)}
          >
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={Colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>Pro Sürümle Tanışın</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Hero Price Card */}
            <Animated.View entering={FadeIn.delay(200).duration(800)}>
              <LinearGradient
                colors={Colors.gradients.accent}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <View style={styles.crownContainer}>
                    <Crown size={48} color={Colors.medal.gold} />
                    <Star size={20} color={Colors.medal.gold} style={styles.starIcon} />
                  </View>
                  <Text style={styles.heroTitle}>Pro Üyelik</Text>
                  <Text style={styles.heroSubtitle}>Tüm özelliklerin kilidini aç</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>59.90 ₺</Text>
                    <Text style={styles.priceSubtext}>/ aylık</Text>
                  </View>
                  <View style={styles.discountBadge}>
                    <Zap size={16} color={Colors.warning} />
                    <Text style={styles.discountText}>İlk ay %50 indirim!</Text>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>

            {/* Features Section */}
            <Animated.View 
              style={styles.featuresSection}
              entering={FadeIn.delay(400).duration(800)}
            >
              <Text style={styles.sectionTitle}>Pro Özellikler</Text>
              
              <ProFeature
                icon={<Brain size={24} color={Colors.primary[400]} />}
                title="Yapay Zeka Koçluğu"
                description="Kişiselleştirilmiş eğitim planı ve akıllı tavsiyeler"
                delay={500}
              />
              
              <ProFeature
                icon={<Bot size={24} color={Colors.success} />}
                title="Soru Çözüm Asistanı"
                description="AI destekli anında soru çözüm ve açıklama"
                delay={600}
              />
              
              <ProFeature
                icon={<ChartLine size={24} color={Colors.warning} />}
                title="Detaylı Analitik"
                description="Gelişim grafikler ve başarı analizleri"
                delay={700}
              />
              
              <ProFeature
                icon={<Infinity size={24} color={Colors.primary[500]} />}
                title="Sınırsız Erişim"
                description="Tüm premium içerik ve özellikler"
                delay={800}
              />
            </Animated.View>

            {/* Action Section */}
            <Animated.View 
              style={styles.actionSection}
              entering={SlideInDown.delay(600).duration(800)}
            >
              {error && (
                <GradientCard 
                  colors={[Colors.error + '20', Colors.error + '10']}
                  style={styles.errorCard}
                >
                  <Text style={styles.errorText}>{error}</Text>
                </GradientCard>
              )}

              {showPromoCode ? (
                <GradientCard 
                  colors={Colors.gradients.warmDark}
                  style={styles.promoCard}
                >
                  <Text style={styles.promoTitle}>Promosyon Kodu</Text>
                  <Input
                    label=""
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholder="Kodunuzu buraya girin"
                    leftIcon={<Gift size={20} color={Colors.primary[400]} />}
                    style={styles.promoInput}
                  />
                  <View style={styles.promoButtons}>
                    <Button
                      title="İptal"
                      onPress={() => setShowPromoCode(false)}
                      variant="outline"
                      size="medium"
                      style={styles.promoButton}
                    />
                    <Button
                      title="Kodu Kullan"
                      onPress={handlePromoCode}
                      variant="primary"
                      size="medium"
                      isLoading={loading}
                      style={styles.promoButton}
                    />
                  </View>
                </GradientCard>
              ) : (
                <>
                  <Button
                    title="Pro'ya Yükselt - 59.90₺"
                    onPress={handleUpgrade}
                    variant="primary"
                    size="large"
                    isLoading={loading}
                    style={styles.upgradeButton}
                  />
                  <Button
                    title="Promosyon Kodu Var"
                    onPress={() => setShowPromoCode(true)}
                    variant="outline"
                    size="large"
                    style={styles.promoCodeButton}
                  />
                </>
              )}
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
    backgroundColor: Colors.darkGray[800],
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
    color: Colors.text.primary,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  heroCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    ...Shadows.large,
  },
  heroContent: {
    alignItems: 'center',
  },
  crownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  starIcon: {
    marginLeft: Spacing.sm,
  },
  heroTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxxl,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  heroSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.lg,
  },
  price: {
    fontFamily: 'Inter-Bold',
    fontSize: 48,
    color: Colors.text.primary,
  },
  priceSubtext: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  discountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.warning + '20',
    gap: Spacing.xs,
  },
  discountText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.warning,
  },
  featuresSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  featureIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary[500] + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary[500] + '30',
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  featureDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  featureCheck: {
    marginLeft: Spacing.md,
  },
  actionSection: {
    gap: Spacing.md,
  },
  errorCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.error,
    textAlign: 'center',
  },
  promoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  promoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  promoInput: {
    marginBottom: Spacing.lg,
  },
  promoButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  promoButton: {
    flex: 1,
  },
  upgradeButton: {
    marginBottom: Spacing.md,
  },
  promoCodeButton: {
    marginBottom: Spacing.lg,
  },
});
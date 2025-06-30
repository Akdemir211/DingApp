import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ArrowLeft, Crown, Brain, LineChart as ChartLine, Bot, Infinity, Gift, Star, Zap, Check, CreditCard, Sparkles, Trophy, Target } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInRight,
  SlideInLeft,
  BounceIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming
} from 'react-native-reanimated';

// Yeni olay yayınlama için EventEmitter
import { eventEmitter, Events } from '@/lib/eventEmitter';
// Ödeme entegrasyonu
import { PaymentForm } from '@/components/Payment';
import { PRO_PACKAGES } from '@/lib/stripeService';

const { width } = Dimensions.get('window');

// Yeni Price Card Component
const PriceCard = ({ 
  packageType,
  title, 
  price,
  originalPrice,
  description,
  features,
  isPopular = false,
  onPress,
  theme,
  delay = 0
}: { 
  packageType: 'monthly' | 'yearly',
  title: string,
  price: string,
  originalPrice?: string,
  description: string,
  features: string[],
  isPopular?: boolean,
  onPress: () => void,
  theme: any,
  delay?: number
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.96, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View 
      entering={SlideInDown.delay(delay).duration(600)}
      style={[animatedStyle, styles.priceCardContainer]}
    >
      {isPopular && (
        <View style={[styles.popularBadge, { backgroundColor: theme.colors.warning }]}>
          <Trophy size={16} color="#FFFFFF" />
          <Text style={styles.popularText}>En Popüler</Text>
        </View>
      )}
      
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <LinearGradient
          colors={isPopular ? theme.colors.gradients.accent : [theme.colors.darkGray[800], theme.colors.darkGray[700]]}
          style={[
            styles.priceCard,
            isPopular && { borderColor: theme.colors.warning, borderWidth: 2 }
          ]}
        >
          <View style={styles.priceHeader}>
            <Text style={[styles.packageTitle, { color: theme.colors.text.primary }]}>{title}</Text>
            <Text style={[styles.packageDescription, { color: theme.colors.text.secondary }]}>{description}</Text>
          </View>

          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={[styles.priceAmount, { color: theme.colors.text.primary }]}>{price}₺</Text>
              {originalPrice && (
                <Text style={[styles.originalPrice, { color: theme.colors.text.tertiary }]}>{originalPrice}₺</Text>
              )}
            </View>
            <Text style={[styles.priceUnit, { color: theme.colors.text.secondary }]}>
              {packageType === 'monthly' ? '/ ay' : '/ yıl'}
            </Text>
          </View>

          <View style={styles.featuresContainer}>
            {features.map((feature, index) => (
              <View key={index} style={styles.featureRow}>
                <Check size={16} color={theme.colors.success} />
                <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>{feature}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.selectButton, { backgroundColor: isPopular ? theme.colors.warning : theme.colors.primary[500] }]}>
            <Text style={[styles.selectButtonText, { color: '#FFFFFF' }]}>
              {isPopular ? 'En İyi Seçim' : 'Başla'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Yeni Feature Grid Component
const FeatureGrid = ({ theme, delay = 0 }: { theme: any, delay?: number }) => {
  const features = [
    { icon: <Brain size={28} color={theme.colors.primary[400]} />, title: 'AI Koçluğu', desc: 'Kişisel eğitim planı' },
    { icon: <Bot size={28} color={theme.colors.success} />, title: 'Soru Asistanı', desc: 'Anında çözüm' },
    { icon: <ChartLine size={28} color={theme.colors.warning} />, title: 'Analitik', desc: 'Detaylı raporlar' },
    { icon: <Infinity size={28} color={theme.colors.primary[500]} />, title: 'Sınırsız', desc: 'Tüm özellikler' },
    { icon: <Target size={28} color={theme.colors.secondary} />, title: 'Hedef Takip', desc: 'Başarı ölçümü' },
    { icon: <Sparkles size={28} color={theme.colors.medal.gold} />, title: 'Premium İçerik', desc: 'Özel materyaller' }
  ];

  return (
    <Animated.View 
      style={styles.featureGrid}
      entering={FadeIn.delay(delay).duration(800)}
    >
      <Text style={[styles.featureGridTitle, { color: theme.colors.text.primary }]}>
        Pro Özellikleri
      </Text>
      <View style={styles.featureGridContainer}>
        {features.map((feature, index) => (
          <Animated.View 
            key={index}
            entering={BounceIn.delay(delay + (index * 100)).duration(600)}
            style={[styles.featureGridItem, { backgroundColor: theme.colors.darkGray[800] }]}
          >
            <View style={[styles.featureGridIcon, { backgroundColor: theme.colors.background.elevated }]}>
              {feature.icon}
            </View>
            <Text style={[styles.featureGridItemTitle, { color: theme.colors.text.primary }]}>
              {feature.title}
            </Text>
            <Text style={[styles.featureGridItemDesc, { color: theme.colors.text.secondary }]}>
              {feature.desc}
            </Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function ProUpgradeScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<'monthly' | 'yearly'>('monthly');

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

  const handleUpgrade = (packageType: 'monthly' | 'yearly') => {
    setSelectedPackage(packageType);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await refreshUserDataAndNavigate();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
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
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[900]]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(600)}
          >
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <View style={styles.headerIcon}>
                <Crown size={32} color={theme.colors.medal.gold} />
              </View>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Pro'ya Geç</Text>
              <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
                Potansiyelini tam olarak ortaya çıkar
              </Text>
            </View>
          </Animated.View>

          <ScrollView 
            style={styles.content} 
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* New Pricing Cards Section */}
            <View style={styles.pricingSection}>
              <PriceCard
                packageType="monthly"
                title="Aylık Pro"
                price="59.90"
                originalPrice="89.90"
                description="Esnek ödeme seçeneği"
                features={['AI Koçluğu', 'Soru Asistanı', 'Detaylı Analitik', 'Premium İçerik']}
                onPress={() => handleUpgrade('monthly')}
                theme={theme}
                delay={200}
              />
              
              <PriceCard
                packageType="yearly"
                title="Yıllık Pro"
                price="599.90"
                originalPrice="1079.90"
                description="%45 tasarruf edin"
                features={['Tüm Aylık Özellikler', 'Öncelikli Destek', 'Ekstra AI Kredisi', 'Sınırsız İçerik']}
                isPopular
                onPress={() => handleUpgrade('yearly')}
                theme={theme}
                delay={400}
              />

              {/* Promosyon Kodu Butonu */}
              {!showPromoCode && (
                <View>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowPromoCode(true);
                      setError(null);
                    }}
                    style={[styles.promoCodeButtonMinimal, { backgroundColor: theme.colors.darkGray[800] + '60' }]}
                  >
                    <Gift size={18} color={theme.colors.warning} />
                    <Text style={[styles.promoCodeButtonMinimalText, { color: theme.colors.text.primary }]}>
                      Promosyon Kodum Var
                    </Text>
                    <ArrowLeft 
                      size={14} 
                      color={theme.colors.text.secondary} 
                      style={{ transform: [{ rotate: '-90deg' }] }}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {/* Promosyon Kodu Açılır Kutucuk */}
              {showPromoCode && (
                <Animated.View 
                  entering={SlideInDown.duration(400)}
                  style={styles.promoCodeContainer}
                >
                  <LinearGradient
                    colors={[theme.colors.primary[500] + '10', theme.colors.primary[400] + '05']}
                    style={styles.promoCodeBox}
                  >
                    <View style={styles.promoCodeHeader}>
                      <View style={[styles.promoCodeHeaderIcon, { backgroundColor: theme.colors.warning }]}>
                        <Gift size={24} color="#FFFFFF" />
                      </View>
                      <Text style={[styles.promoCodeTitle, { color: theme.colors.text.primary }]}>
                        Promosyon Kodu
                      </Text>
                      <Text style={[styles.promoCodeSubtitle, { color: theme.colors.text.secondary }]}>
                        Özel kodunuzu girerek avantajlı fiyatlardan yararlanın
                      </Text>
                    </View>

                    <View style={styles.promoCodeInputContainer}>
                      <Input
                        label=""
                        value={promoCode}
                        onChangeText={setPromoCode}
                        placeholder="Promosyon kodunuzu buraya girin"
                        leftIcon={<Gift size={20} color={theme.colors.primary[400]} />}
                        style={styles.promoCodeInput}
                        inputStyle={styles.promoCodeTextInput}
                      />
                    </View>

                    <View style={styles.promoCodeActions}>
                      <TouchableOpacity 
                        onPress={() => setShowPromoCode(false)}
                        style={[styles.promoCodeCancelButton, { backgroundColor: theme.colors.darkGray[700] }]}
                      >
                        <Text style={[styles.promoCodeCancelText, { color: theme.colors.text.secondary }]}>
                          İptal
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        onPress={handlePromoCode}
                        disabled={loading || !promoCode.trim()}
                        style={[
                          styles.promoCodeApplyButton, 
                          { 
                            backgroundColor: (loading || !promoCode.trim()) ? theme.colors.darkGray[600] : theme.colors.warning,
                            opacity: (loading || !promoCode.trim()) ? 0.6 : 1
                          }
                        ]}
                      >
                        {loading ? (
                          <Text style={[styles.promoCodeApplyText, { color: '#FFFFFF' }]}>
                            Kontrol Ediliyor...
                          </Text>
                        ) : (
                          <>
                            <Check size={16} color="#FFFFFF" />
                            <Text style={[styles.promoCodeApplyText, { color: '#FFFFFF' }]}>
                              Kodu Kullan
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    {error && (
                      <Animated.View 
                        entering={BounceIn.duration(400)}
                        style={[styles.promoCodeError, { backgroundColor: theme.colors.error + '15' }]}
                      >
                        <Text style={[styles.promoCodeErrorText, { color: theme.colors.error }]}>
                          {error}
                        </Text>
                      </Animated.View>
                    )}
                  </LinearGradient>
                </Animated.View>
              )}
            </View>

            {/* Feature Grid */}
            <FeatureGrid theme={theme} delay={600} />


          </ScrollView>
        </SafeContainer>
      </GradientBackground>

      {/* Ödeme Modalı */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handlePaymentCancel}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background.primary }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handlePaymentCancel} style={[styles.closeButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Ödeme</Text>
            <View style={styles.headerSpacer} />
          </View>
          
          <PaymentForm
            packageType={selectedPackage}
            onSuccess={handlePaymentSuccess}
            onCancel={handlePaymentCancel}
          />
        </View>
      </Modal>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
    marginBottom: Spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxxl,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  pricingSection: {
    marginBottom: Spacing.xl,
  },
  priceCardContainer: {
    marginBottom: Spacing.lg,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    left: '50%',
    transform: [{ translateX: -50 }],
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    zIndex: 10,
    gap: Spacing.xs,
  },
  popularText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xs,
    color: '#FFFFFF',
  },
  priceCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  priceHeader: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  packageTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginBottom: Spacing.xs,
  },
  packageDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceAmount: {
    fontFamily: 'Inter-Bold',
    fontSize: 36,
  },
  originalPrice: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    textDecorationLine: 'line-through',
  },
  priceUnit: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },
  featuresContainer: {
    marginBottom: Spacing.xl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  featureText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    flex: 1,
  },
  selectButton: {
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  selectButtonText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
  },
  featureGrid: {
    marginBottom: Spacing.xl,
  },
  featureGridTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  featureGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  featureGridItem: {
    width: (width - (Spacing.lg * 2) - (Spacing.xs * 2) - Spacing.md) / 2,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.medium,
  },
  featureGridIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  featureGridItemTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  featureGridItemDesc: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    textAlign: 'center',
    lineHeight: 16,
  },

  promoCodeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  promoCodeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
  promoCodeButtonNew: {
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadows.medium,
  },
  promoCodeButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  promoCodeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCodeTextContainer: {
    flex: 1,
  },
  promoCodeButtonTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  promoCodeButtonSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  promoCodeArrow: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoCodeButtonMinimal: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  promoCodeButtonMinimalText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    flex: 1,
    marginLeft: Spacing.sm,
  },
  promoCodeContainer: {
    marginBottom: Spacing.lg,
  },
  promoCodeBox: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.large,
  },
  promoCodeHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  promoCodeHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  promoCodeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  promoCodeSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  promoCodeInputContainer: {
    marginBottom: Spacing.xl,
    minHeight: 40,
  },
  promoCodeInput: {
    marginBottom: 0,
    minHeight: 30,
    paddingVertical: Spacing.lg,
  },
  promoCodeTextInput: {
    minHeight: 56,
    paddingVertical: Spacing.lg,
    fontSize: FontSizes.md,
    textAlignVertical: 'center',
  },
  promoCodeActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  promoCodeCancelButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  promoCodeCancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
  promoCodeApplyButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  promoCodeApplyText: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.md,
  },
  promoCodeError: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  promoCodeErrorText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  modalTitle: {
    flex: 1,
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
    marginHorizontal: Spacing.md,
  },
  headerSpacer: {
    paddingTop: Spacing.xxl,
    flex: 1,
  },
});
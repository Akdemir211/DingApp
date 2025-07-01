import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from '@/components/UI/Button';
import { Input } from '@/components/UI/Input';
import { ModernCard } from '@/components/UI/ModernCard';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { PRO_PACKAGES, mockPaymentProcess } from '@/lib/stripeService';
import { CreditCard, Shield, Lock, CheckCircle, Star } from 'lucide-react-native';
import { Spacing } from '@/constants/Theme';

interface PaymentFormProps {
  packageType: 'monthly' | 'yearly';
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ packageType, onSuccess, onCancel }: PaymentFormProps) {
  const { theme } = useTheme();
  const { t } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [holderName, setHolderName] = useState('');

  const selectedPackage = PRO_PACKAGES[packageType];

  const handlePayment = async () => {
    if (!cardNumber || !expiry || !cvc || !holderName || !user) {
      Alert.alert(t('common.error'), t('payment.fill_all_fields'));
      return;
    }

    if (cardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert(t('common.error'), t('payment.valid_card_number'));
      return;
    }

    try {
      setLoading(true);

      // Mock ödeme işlemi
      await mockPaymentProcess(selectedPackage.price, packageType);

      // Kullanıcının pro durumunu güncelle
      await updateUserProStatus();
      
      Alert.alert(
        t('payment.success_title'),
        t('payment.success_message'),
        [{ text: t('common.ok'), onPress: onSuccess }]
      );
    } catch (error: any) {
      console.error('Ödeme hatası:', error);
      Alert.alert(t('payment.error_title'), t('payment.error_message'));
    } finally {
      setLoading(false);
    }
  };

  const updateUserProStatus = async () => {
    const { error } = await supabase
      .from('users')
      .update({ 
        is_pro: true,
        pro_package: packageType,
        pro_started_at: new Date().toISOString()
      })
      .eq('id', user?.id);

    if (error) throw error;
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const proFeatures = [
    t('payment.features.unlimited_ai'),
    t('payment.features.premium_rooms'),
    t('payment.features.advanced_stats'),
    t('payment.features.ad_free'),
    t('payment.features.priority_support')
  ];

  return (
    <ScrollView 
      style={Object.assign({}, styles.container, { backgroundColor: theme.colors.background.primary })} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Premium Başlık */}
      <View style={[styles.headerContainer, { backgroundColor: theme.colors.primary[500] }]}>
        <View style={styles.headerContent}>
          <Star size={24} color="#fff" />
          <Text style={styles.headerTitle}>{t('payment.pro_title')}</Text>
          <Star size={24} color="#fff" />
        </View>
        <Text style={styles.headerSubtitle}>
          {t('payment.premium_features')}
        </Text>
      </View>

      {/* Paket Özeti */}
              <ModernCard style={Object.assign({}, styles.packageCard, { backgroundColor: theme.colors.background.secondary })}>
        <View style={styles.packageHeader}>
          <View>
            <Text style={[styles.packageTitle, { color: theme.colors.text.primary }]}>
              {selectedPackage.name}
            </Text>
            <Text style={[styles.packageDuration, { color: theme.colors.text.secondary }]}>
              {packageType === 'monthly' ? t('payment.monthly_subscription') : t('payment.yearly_subscription')}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            <Text style={[styles.packagePrice, { color: theme.colors.primary[500] }]}>
              {selectedPackage.price} ₺
            </Text>
            {packageType === 'yearly' && (
              <Text style={[styles.priceNote, { color: theme.colors.text.secondary }]}>
                {t('payment.per_year')}
              </Text>
            )}
          </View>
        </View>

        {'discount' in selectedPackage && selectedPackage.discount && (
          <View style={[styles.discountBadge, { backgroundColor: theme.colors.success + '20' }]}>
            <Text style={[styles.discountText, { color: theme.colors.success }]}>
              {selectedPackage.discount}
            </Text>
          </View>
        )}

        {/* Pro Özellikler */}
        <View style={styles.featuresContainer}>
          {proFeatures.map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <CheckCircle size={16} color={theme.colors.success} />
              <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>
                {feature}
              </Text>
            </View>
          ))}
        </View>
      </ModernCard>

      {/* Kart Bilgileri */}
      <ModernCard style={Object.assign({}, styles.cardContainer, { backgroundColor: theme.colors.background.secondary })}>
        <View style={styles.cardHeader}>
          <View style={[styles.cardIcon, { backgroundColor: theme.colors.primary[100] }]}>
            <CreditCard size={24} color={theme.colors.primary[500]} />
          </View>
          <Text style={[styles.cardTitle, { color: theme.colors.text.primary }]}>
            {t('payment.card_info')}
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
              {t('payment.card_holder')}
            </Text>
            <Input
              placeholder={t('account.enter_name')}
              value={holderName}
              onChangeText={setHolderName}
              style={[styles.input, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary }]}
              autoCapitalize="words"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
              {t('payment.card_number')}
            </Text>
            <Input
              placeholder="1234 5678 9012 3456"
              value={cardNumber}
              onChangeText={(text) => setCardNumber(formatCardNumber(text))}
              style={[styles.input, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary }]}
              keyboardType="numeric"
              maxLength={19}
            />
          </View>
          
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: Spacing.md }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                {t('payment.expiry_date')}
              </Text>
              <Input
                placeholder="MM/YY"
                value={expiry}
                onChangeText={(text) => setExpiry(formatExpiry(text))}
                style={[styles.input, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary }]}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
            
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.secondary }]}>
                {t('payment.cvc')}
              </Text>
              <Input
                placeholder="123"
                value={cvc}
                onChangeText={setCvc}
                style={[styles.input, { backgroundColor: theme.colors.background.primary, color: theme.colors.text.primary }]}
                keyboardType="numeric"
                maxLength={4}
                secureTextEntry
              />
            </View>
          </View>
        </View>
      </ModernCard>

      {/* Güvenlik Bilgisi */}
      <View style={styles.securityInfo}>
        <Shield size={16} color={theme.colors.success} />
        <Text style={[styles.securityText, { color: theme.colors.text.secondary }]}>
          {t('payment.security_info')}
        </Text>
      </View>

      {/* Ödeme Butonu */}
      <View style={styles.buttonContainer}>
        <Button
          title={loading ? t('payment.processing') : t('payment.complete_payment')}
          onPress={handlePayment}
          disabled={loading}
          variant="primary"
          style={styles.paymentButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  headerContainer: {
    paddingTop: 60,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'Inter-Bold',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    opacity: 0.9,
    fontFamily: 'Inter-Regular',
  },
  packageCard: {
    marginHorizontal: 20,
    marginTop: -16,
    padding: 24,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  packageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  packageTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
    marginBottom: 4,
  },
  packageDuration: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  packagePrice: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'Inter-Bold',
  },
  priceNote: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  featuresContainer: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
  },
  cardContainer: {
    marginHorizontal: 20,
    padding: 24,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'Inter-SemiBold',
  },
  inputContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter-Medium',
    marginLeft: 4,
  },
  input: {
    height: 64,
    fontSize: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    fontFamily: 'Inter-Regular',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 32,
    gap: 12,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  securityText: {
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    textAlign: 'center',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 60,
    paddingTop: 20,
    gap: 16,
  },
  paymentButton: {
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
}); 
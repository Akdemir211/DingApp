import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage } from '@/context/LanguageContext';
import { router } from 'expo-router';
import { ArrowLeft, Mail, MessageSquare, Globe, Phone, HelpCircle } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import Animated, { FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';

const ContactItem = ({ 
  icon, 
  title, 
  value,
  onPress,
  delay = 0,
  theme
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  onPress: () => void,
  delay?: number,
  theme: any
}) => {
  return (
    <Animated.View entering={SlideInRight.delay(delay).duration(600)}>
      <ModernCard 
        onPress={onPress} 
        variant="elevated" 
        style={{
          ...styles.contactItem,
          backgroundColor: theme.colors.darkGray[800]
        }}
      >
        <View style={[styles.contactIcon, { backgroundColor: theme.colors.background.elevated }]}>{icon}</View>
        <View style={styles.contactInfo}>
          <Text style={[styles.contactTitle, { color: theme.colors.text.primary }]}>{title}</Text>
          <Text style={[styles.contactValue, { color: theme.colors.text.secondary }]}>{value}</Text>
        </View>
      </ModernCard>
    </Animated.View>
  );
};

export default function HelpSupportScreen() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const handleEmail = () => {
    Linking.openURL('mailto:akdemiribrahim007@gmail.com');
  };

  const handleChat = () => {
    // Chat desteği henüz aktif değil
    console.log('Chat desteği yakında!');
  };

  const handleWebsite = () => {
    Linking.openURL('https://roomiks.netlify.app/');
  };

  const handlePhone = () => {
    Linking.openURL('tel:+905323859586');
  };

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
                  <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(600)}
          >
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>{t('help.title')}</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.delay(200).duration(800)}>
              <GradientCard colors={theme.colors.gradients.accent} style={styles.welcomeCard}>
                <HelpCircle size={48} color={theme.colors.text.primary} style={styles.helpIcon} />
                <Text style={[styles.welcomeTitle, { color: theme.colors.text.primary }]}>{t('help.welcome_title')}</Text>
                <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                  {t('help.welcome_desc')}
                </Text>
              </GradientCard>
            </Animated.View>

            <View style={styles.contactList}>
              <ContactItem
                icon={<Mail size={24} color={theme.colors.primary[400]} />}
                title={t('help.email')}
                value="akdemiribrahim007@gmail.com"
                onPress={handleEmail}
                delay={400}
                theme={theme}
              />

              <ContactItem
                icon={<MessageSquare size={24} color={theme.colors.success} />}
                title={t('help.live_support')}
                value={t('help.live_support_desc')}
                onPress={handleChat}
                delay={500}
                theme={theme}
              />

              <ContactItem
                icon={<Globe size={24} color={theme.colors.warning} />}
                title={t('help.website')}
                value="https://roomiks.netlify.app/"
                onPress={handleWebsite}
                delay={600}
                theme={theme}
              />

              <ContactItem
                icon={<Phone size={24} color={theme.colors.medal.gold} />}
                title={t('help.phone')}
                value="+90 532 385 9586"
                onPress={handlePhone}
                delay={700}
                theme={theme}
              />
            </View>

            <Animated.View entering={SlideInDown.delay(800).duration(600)}>
              <GradientCard colors={theme.colors.gradients.warmDark} style={styles.faqCard}>
                <Text style={[styles.faqTitle, { color: theme.colors.text.primary }]}>{t('help.faq_title')}</Text>
                
                <View style={styles.faqList}>
                  <View style={styles.faqItem}>
                    <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                      {t('help.faq_1_q')}
                    </Text>
                    <Text style={[styles.answer, { color: theme.colors.text.secondary }]}>
                      {t('help.faq_1_a')}
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                      {t('help.faq_2_q')}
                    </Text>
                    <Text style={[styles.answer, { color: theme.colors.text.secondary }]}>
                      {t('help.faq_2_a')}
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                      {t('help.faq_3_q')}
                    </Text>
                    <Text style={[styles.answer, { color: theme.colors.text.secondary }]}>
                      {t('help.faq_3_a')}
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                      {t('help.faq_4_q')}
                    </Text>
                    <Text style={[styles.answer, { color: theme.colors.text.secondary }]}>
                      {t('help.faq_4_a')}
                    </Text>
                  </View>

                  <View style={styles.faqItem}>
                    <Text style={[styles.question, { color: theme.colors.text.primary }]}>
                      {t('help.faq_5_q')}
                    </Text>
                    <Text style={[styles.answer, { color: theme.colors.text.secondary }]}>
                      {t('help.faq_5_a')}
                    </Text>
                  </View>
                </View>
              </GradientCard>
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
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
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
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  welcomeCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.large,
  },
  helpIcon: {
    marginBottom: Spacing.lg,
  },
  welcomeTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  contactList: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  contactIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  contactValue: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  faqCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  faqTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  faqList: {
    gap: Spacing.lg,
  },
  faqItem: {
    gap: Spacing.sm,
  },
  question: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    lineHeight: 20,
  },
  answer: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
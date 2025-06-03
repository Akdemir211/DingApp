import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { router } from 'expo-router';
import { ArrowLeft, Mail, MessageSquare, Globe, Phone, HelpCircle } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import Animated, { FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';

const ContactItem = ({ 
  icon, 
  title, 
  value,
  onPress,
  delay = 0
}: { 
  icon: React.ReactNode, 
  title: string, 
  value: string,
  onPress: () => void,
  delay?: number
}) => {
  return (
    <Animated.View entering={SlideInRight.delay(delay).duration(600)}>
      <ModernCard onPress={onPress} variant="elevated" style={styles.contactItem}>
        <View style={styles.contactIcon}>{icon}</View>
        <View style={styles.contactInfo}>
          <Text style={styles.contactTitle}>{title}</Text>
          <Text style={styles.contactValue}>{value}</Text>
        </View>
      </ModernCard>
    </Animated.View>
  );
};

export default function HelpSupportScreen() {
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
            <Text style={styles.title}>Yardım & Destek</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeIn.delay(200).duration(800)}>
              <GradientCard colors={Colors.gradients.accent} style={styles.welcomeCard}>
                <HelpCircle size={48} color={Colors.text.primary} style={styles.helpIcon} />
                <Text style={styles.welcomeTitle}>Size Nasıl Yardımcı Olabiliriz?</Text>
                <Text style={styles.description}>
                  Herhangi bir sorunuz veya sorununuz mu var? Size yardımcı olmaktan mutluluk duyarız.
                  Aşağıdaki kanallardan bizimle iletişime geçebilirsiniz.
                </Text>
              </GradientCard>
            </Animated.View>

            <View style={styles.contactList}>
              <ContactItem
                icon={<Mail size={24} color={Colors.primary[400]} />}
                title="E-posta"
                value="akdemiribrahim007@gmail.com"
                onPress={handleEmail}
                delay={400}
              />

              <ContactItem
                icon={<MessageSquare size={24} color={Colors.success} />}
                title="Canlı Destek"
                value="7/24 Chat Desteği"
                onPress={handleChat}
                delay={500}
              />

              <ContactItem
                icon={<Globe size={24} color={Colors.warning} />}
                title="Website"
                value="https://roomiks.netlify.app/"
                onPress={handleWebsite}
                delay={600}
              />

              <ContactItem
                icon={<Phone size={24} color={Colors.medal.gold} />}
                title="Telefon"
                value="+90 532 385 9586"
                onPress={handlePhone}
                delay={700}
              />
            </View>

            <Animated.View entering={SlideInDown.delay(800).duration(600)}>
              <GradientCard colors={Colors.gradients.warmDark} style={styles.faqCard}>
                <Text style={styles.faqTitle}>Sıkça Sorulan Sorular</Text>
                <Text style={styles.faqDescription}>
                  Sıkça sorulan sorular ve cevapları için websitemizi ziyaret edebilirsiniz.
                </Text>
              </GradientCard>
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
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
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
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.darkGray[600],
  },
  contactInfo: {
    flex: 1,
  },
  contactTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  contactValue: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  faqCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    ...Shadows.medium,
  },
  faqTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  faqDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.secondary,
    lineHeight: 24,
    textAlign: 'center',
  },
});
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { ArrowLeft, Bell, MessageSquare, Clock, Calendar, Zap } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import Animated, { FadeIn, SlideInDown, SlideInRight } from 'react-native-reanimated';

interface NotificationSetting {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  enabled: boolean;
}

export default function NotificationSettingsScreen() {
  const { theme } = useTheme();
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'messages',
      title: 'Mesaj Bildirimleri',
      description: 'Yeni mesaj geldiğinde bildirim al',
      icon: MessageSquare,
      enabled: true
    },
    {
      id: 'study_reminders',
      title: 'Çalışma Hatırlatıcıları',
      description: 'Günlük çalışma hedeflerini hatırlat',
      icon: Clock,
      enabled: true
    },
    {
      id: 'room_invites',
      title: 'Oda Davetleri',
      description: 'Yeni oda davetlerinde bildirim al',
      icon: Calendar,
      enabled: true
    },
    {
      id: 'achievements',
      title: 'Başarım Bildirimleri',
      description: 'Yeni başarımlar kazandığında bildirim al',
      icon: Zap,
      enabled: true
    }
  ]);

  const toggleSetting = (id: string) => {
    setSettings(settings.map(setting => 
      setting.id === id 
        ? { ...setting, enabled: !setting.enabled }
        : setting
    ));
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
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Bildirim Ayarları</Text>
            <View style={styles.headerSpacer} />
          </Animated.View>

          <ScrollView 
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View entering={FadeIn.delay(200).duration(800)}>
              <GradientCard colors={theme.colors.gradients.warmDark} style={styles.descriptionCard}>
                <Bell size={32} color={theme.colors.primary[400]} style={styles.bellIcon} />
                <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
                  Hangi bildirimleri almak istediğinizi seçin. Bildirimleri istediğiniz zaman açıp kapatabilirsiniz.
                </Text>
              </GradientCard>
            </Animated.View>

            <Animated.View 
              entering={SlideInRight.delay(400).duration(600)}
              style={styles.settingsSection}
            >
              <ModernCard variant="elevated" style={styles.settingsCard}>
                {settings.map((setting, index) => {
                  const Icon = setting.icon;
                  return (
                    <Animated.View 
                      key={setting.id}
                      entering={SlideInRight.delay(500 + index * 100).duration(600)}
                    >
                      <View style={[
                        styles.settingItem,
                        index !== settings.length - 1 && [styles.settingItemBorder, { borderBottomColor: theme.colors.border.primary }]
                      ]}>
                        <View style={[styles.settingIcon, { backgroundColor: theme.colors.background.elevated }]}>
                          <Icon size={24} color={theme.colors.primary[400]} />
                        </View>
                        <View style={styles.settingInfo}>
                          <Text style={[styles.settingTitle, { color: theme.colors.text.primary }]}>{setting.title}</Text>
                          <Text style={[styles.settingDescription, { color: theme.colors.text.secondary }]}>{setting.description}</Text>
                        </View>
                        <Switch
                          value={setting.enabled}
                          onValueChange={() => toggleSetting(setting.id)}
                          trackColor={{ 
                            false: theme.colors.darkGray[700], 
                            true: theme.colors.primary[500] 
                          }}
                          thumbColor={setting.enabled ? theme.colors.text.primary : theme.colors.darkGray[400]}
                          ios_backgroundColor={theme.colors.darkGray[700]}
                        />
                      </View>
                    </Animated.View>
                  );
                })}
              </ModernCard>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(800).duration(600)}>
              <GradientCard colors={[theme.colors.primary[500] + '10', theme.colors.primary[400] + '05']} style={styles.noteCard}>
                <Text style={[styles.note, { color: theme.colors.text.secondary }]}>
                  💡 Bildirim ayarlarınız otomatik olarak kaydedilir ve tüm cihazlarınızda senkronize edilir.
                </Text>
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
    paddingTop: Spacing.xl,
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
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  descriptionCard: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  bellIcon: {
    marginBottom: Spacing.lg,
  },
  description: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    lineHeight: 24,
    textAlign: 'center',
  },
  settingsSection: {
    marginBottom: Spacing.xl,
  },
  settingsCard: {
    padding: 0,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  settingItemBorder: {
    borderBottomWidth: 1,
  },
  settingIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    borderWidth: 1,
  },
  settingInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  settingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  noteCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  note: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
});
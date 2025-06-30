import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { Globe, Check } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useLanguage();
  const { theme } = useTheme();

  const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
    { code: 'ku', name: 'Kurdish', nativeName: 'Kurdî', flag: '☀️' },
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' }
  ];

  const handleLanguageSelect = async (selectedLanguage: Language) => {
    await setLanguage(selectedLanguage);
    onClose();
  };

  const LanguageOption = ({ 
    langData, 
    isSelected 
  }: {
    langData: { code: Language; name: string; nativeName: string; flag: string };
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.languageOption,
        isSelected && [styles.languageOptionSelected, { borderColor: theme.colors.primary[500] }],
        { backgroundColor: theme.colors.background.card }
      ]}
      onPress={() => handleLanguageSelect(langData.code)}
    >
      <View style={styles.languageOptionContent}>
        <View style={[
          styles.languageIconContainer,
          { backgroundColor: theme.colors.primary[500] + '20' }
        ]}>
          <Text style={styles.flagEmoji}>{langData.flag}</Text>
        </View>
        <View style={styles.languageTextContainer}>
          <Text style={[styles.languageTitle, { color: theme.colors.text.primary }]}>
            {langData.nativeName}
          </Text>
          <Text style={[styles.languageDescription, { color: theme.colors.text.secondary }]}>
            {langData.name}
          </Text>
        </View>
        {isSelected && (
          <View style={[
            styles.checkContainer,
            { backgroundColor: theme.colors.primary[500] }
          ]}>
            <Check size={16} color={theme.colors.text.inverse} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1}
          onPress={onClose}
        >
          <Animated.View 
            entering={SlideInDown.duration(400)}
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background.primary }
            ]}
          >
            <TouchableOpacity activeOpacity={1}>
              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>
                  {t('language.select_language')}
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                  {t('language.select_app_language')}
                </Text>
              </View>

              {/* Language Options */}
              <View style={styles.languageOptionsContainer}>
                {languages.map((lang) => (
                  <LanguageOption
                    key={lang.code}
                    langData={lang}
                    isSelected={language === lang.code}
                  />
                ))}
              </View>

              {/* Close Button */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: theme.colors.background.secondary }
                ]}
                onPress={onClose}
              >
                <Text style={[styles.closeButtonText, { color: theme.colors.text.primary }]}>
                  {t('language.cancel')}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    width: '100%',
  },
  modalContent: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    ...Shadows.large,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
    marginBottom: Spacing.xs,
  },
  modalSubtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  languageOptionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  languageOption: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageOptionSelected: {
    // borderColor artık dinamik olarak ayarlanıyor
  },
  languageOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  flagEmoji: {
    fontSize: 24,
  },
  languageTextContainer: {
    flex: 1,
  },
  languageTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  languageDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
}); 
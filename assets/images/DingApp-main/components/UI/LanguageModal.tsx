import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from './ModernCard';
import { useLanguage, Language } from '@/context/LanguageContext';
import { Globe, Check } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({ visible, onClose }) => {
  const { language, setLanguage, t } = useLanguage();

  const languages: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View 
          style={styles.modalContainer}
          entering={SlideInDown.duration(300)}
        >
          <ModernCard variant="elevated" style={styles.modal}>
            <View style={styles.header}>
              <Globe size={24} color={Colors.primary[400]} />
              <Text style={styles.title}>{t('language.select_language')}</Text>
            </View>

            <View style={styles.languageList}>
              {languages.map((lang, index) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    index !== languages.length - 1 && styles.languageOptionBorder,
                    language === lang.code && styles.selectedLanguage
                  ]}
                  onPress={() => handleLanguageSelect(lang.code)}
                >
                  <View style={styles.languageFlag}>
                    <Text style={styles.flagEmoji}>{lang.flag}</Text>
                  </View>
                  
                  <View style={styles.languageInfo}>
                    <Text style={[
                      styles.languageName,
                      language === lang.code && styles.selectedLanguageText
                    ]}>
                      {lang.nativeName}
                    </Text>
                    <Text style={[
                      styles.languageSubname,
                      language === lang.code && styles.selectedLanguageSubtext
                    ]}>
                      {lang.name}
                    </Text>
                  </View>

                  {language === lang.code && (
                    <Check size={20} color={Colors.primary[400]} />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelText}>{t('language.cancel')}</Text>
            </TouchableOpacity>
          </ModernCard>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 380,
  },
  modal: {
    padding: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginLeft: Spacing.sm,
  },
  languageList: {
    marginBottom: Spacing.lg,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  languageOptionBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[700],
    borderRadius: 0,
  },
  selectedLanguage: {
    backgroundColor: Colors.primary[500] + '20',
    borderColor: Colors.primary[500] + '30',
    borderWidth: 1,
  },
  languageFlag: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  flagEmoji: {
    fontSize: 18,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
  languageSubname: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  selectedLanguageText: {
    color: Colors.primary[400],
  },
  selectedLanguageSubtext: {
    color: Colors.primary[300],
  },
  cancelButton: {
    padding: Spacing.md,
    alignItems: 'center',
    backgroundColor: Colors.darkGray[700],
    borderRadius: BorderRadius.sm,
  },
  cancelText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
  },
}); 
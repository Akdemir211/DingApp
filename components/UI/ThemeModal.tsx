import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { useTheme, ThemeMode } from '@/context/ThemeContext';
import { Sun, Moon, Check } from 'lucide-react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ThemeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ThemeModal({ visible, onClose }: ThemeModalProps) {
  const { theme, themeMode, setThemeMode } = useTheme();

  const handleThemeSelect = (mode: ThemeMode) => {
    setThemeMode(mode);
    // Modal otomatik kapanmasın, kullanıcı manuel kapatsın
  };

  const ThemeOption = ({ 
    mode, 
    icon, 
    title, 
    description,
    isSelected 
  }: {
    mode: ThemeMode;
    icon: React.ReactNode;
    title: string;
    description: string;
    isSelected: boolean;
  }) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        isSelected && [styles.themeOptionSelected, { borderColor: theme.colors.primary[500] }],
        { backgroundColor: theme.colors.background.card }
      ]}
      onPress={() => handleThemeSelect(mode)}
    >
      <View style={styles.themeOptionContent}>
        <View style={[
          styles.themeIconContainer,
          { backgroundColor: theme.colors.primary[500] + '20' }
        ]}>
          {icon}
        </View>
        <View style={styles.themeTextContainer}>
          <Text style={[styles.themeTitle, { color: theme.colors.text.primary }]}>
            {title}
          </Text>
          <Text style={[styles.themeDescription, { color: theme.colors.text.secondary }]}>
            {description}
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
                  Tema Seçimi
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.colors.text.secondary }]}>
                  Uygulamanın görünümünü özelleştirin
                </Text>
              </View>

              {/* Theme Options */}
              <View style={styles.themeOptionsContainer}>
                <ThemeOption
                  mode="light"
                  icon={<Sun size={24} color={theme.colors.primary[500]} />}
                  title="Aydınlık Tema"
                  description="Açık mavi ve beyaz renk paleti (BETA)"
                  isSelected={themeMode === 'light'}
                />
                
                <ThemeOption
                  mode="dark"
                  icon={<Moon size={24} color={theme.colors.primary[500]} />}
                  title="Karanlık Tema"
                  description="Koyu renk paleti, göz yorgunluğunu azaltır (Önerilen)"
                  isSelected={themeMode === 'dark'}
                />
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
                  Kapat
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

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
  themeOptionsContainer: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  themeOption: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  themeOptionSelected: {
    // borderColor artık dinamik olarak ayarlanıyor
  },
  themeOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  themeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  themeTextContainer: {
    flex: 1,
  },
  themeTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.xs,
  },
  themeDescription: {
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
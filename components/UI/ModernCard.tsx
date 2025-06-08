import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows } from '@/constants/Theme';
import { useTheme } from '@/context/ThemeContext';

interface ModernCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'glass' | 'glow';
  hoverable?: boolean;
  disabled?: boolean;
}

export const ModernCard: React.FC<ModernCardProps> = ({
  children,
  onPress,
  style,
  variant = 'default',
  hoverable = true,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: scale.value,
        },
      ],
      opacity: opacity.value,
    };
  });

  const handlePressIn = () => {
    if (!disabled && hoverable) {
      scale.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    if (!disabled && hoverable) {
      scale.value = withSpring(1);
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      opacity.value = withTiming(0.8, { duration: 100 }, () => {
        opacity.value = withTiming(1, { duration: 100 });
      });
      onPress();
    }
  };

  const getCardStyle = () => {
    const baseCard = {
      backgroundColor: theme.colors.background.card,
      borderRadius: BorderRadius.lg,
      padding: 16,
      ...Shadows.card,
    };

    switch (variant) {
      case 'elevated':
        return [
          baseCard,
          {
            backgroundColor: theme.colors.background.elevated,
            ...Shadows.soft,
          },
          style
        ];
      case 'glass':
        return [
          baseCard,
          {
            backgroundColor: theme.colors.background.card + '80',
            borderWidth: 1,
            borderColor: theme.colors.border.primary,
            ...Shadows.medium,
          },
          style
        ];
      case 'glow':
        return [
          baseCard,
          {
            borderWidth: 1,
            borderColor: theme.colors.primary[500] + '30',
            ...Shadows.glow,
          },
          style
        ];
      default:
        return [baseCard, style];
    }
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        activeOpacity={1}
        disabled={disabled}
      >
        <Animated.View style={[getCardStyle(), animatedStyle]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[getCardStyle(), animatedStyle]}>
      {children}
    </Animated.View>
  );
}; 
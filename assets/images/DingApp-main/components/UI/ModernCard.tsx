import React from 'react';
import { View, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors, BorderRadius, Shadows } from '@/constants/Theme';

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
    switch (variant) {
      case 'elevated':
        return [styles.card, styles.elevated, style];
      case 'glass':
        return [styles.card, styles.glass, style];
      case 'glow':
        return [styles.card, styles.glow, style];
      default:
        return [styles.card, style];
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.lg,
    padding: 16,
    ...Shadows.card,
  },
  elevated: {
    backgroundColor: Colors.darkGray[800],
    ...Shadows.soft,
  },
  glass: {
    backgroundColor: 'rgba(30, 32, 41, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...Shadows.medium,
  },
  glow: {
    borderWidth: 1,
    borderColor: Colors.primary[500] + '30',
    ...Shadows.glow,
  },
}); 
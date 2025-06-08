import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/Theme';

interface GradientBackgroundProps {
  children?: React.ReactNode;
  colors?: readonly [string, string, ...string[]];
  style?: any;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  colors = Colors.gradients.dark,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 }
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      {children}
    </LinearGradient>
  );
};

export const GradientCard: React.FC<GradientBackgroundProps> = ({
  children,
  colors = Colors.gradients.warmDark,
  style,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 }
}) => {
  return (
    <LinearGradient
      colors={colors}
      start={start}
      end={end}
      style={[styles.card, style]}
    >
      {children}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
}); 
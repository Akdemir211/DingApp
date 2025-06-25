import React from 'react';
import { View, StyleSheet, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeContainerProps {
  children: React.ReactNode;
  style?: any;
  backgroundColor?: string;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

export const SafeContainer: React.FC<SafeContainerProps> = ({
  children,
  style,
  backgroundColor,
  edges = ['top', 'left', 'right']
}) => {
  const insets = useSafeAreaInsets();
  
  // iPhone 14 Pro ve üzeri için dinamik ada yüksekliği
  // Dinamik ada olan cihazlarda safe area top 47'den büyüktür
  const isDynamicIslandDevice = Platform.OS === 'ios' && insets.top > 47;
  const dynamicIslandHeight = isDynamicIslandDevice ? 25 : 10;
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]} edges={edges}>
      {/* Dinamik ada için ekstra padding */}
      <View style={[styles.dynamicIslandPadding, { height: dynamicIslandHeight }]} />
      {children}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  dynamicIslandPadding: {
    width: '100%',
  },
}); 
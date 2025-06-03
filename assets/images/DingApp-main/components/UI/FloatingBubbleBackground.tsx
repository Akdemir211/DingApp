import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/Theme';

export const FloatingBubbleBackground: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Sol üst köşe dekoratif element */}
      <View style={[styles.decorativeElement, styles.topLeft]} />
      
      {/* Sağ üst köşe dekoratif element */}
      <View style={[styles.decorativeElement, styles.topRight]} />
      
      {/* Sol alt köşe dekoratif element */}
      <View style={[styles.decorativeElement, styles.bottomLeft]} />
      
      {/* Sağ alt köşe dekoratif element */}
      <View style={[styles.decorativeElement, styles.bottomRight]} />
      
      {/* Merkez dekoratif element */}
      <View style={[styles.decorativeElement, styles.center]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  decorativeElement: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.primary[500],
    opacity: 0.05,
  },
  topLeft: {
    top: -100,
    left: -100,
  },
  topRight: {
    top: -50,
    right: -100,
    width: 150,
    height: 150,
  },
  bottomLeft: {
    bottom: -80,
    left: -60,
    width: 120,
    height: 120,
  },
  bottomRight: {
    bottom: -120,
    right: -80,
    width: 180,
    height: 180,
  },
  center: {
    top: '40%',
    left: '50%',
    transform: [{ translateX: -75 }, { translateY: -75 }],
    width: 150,
    height: 150,
    opacity: 0.03,
  },
});
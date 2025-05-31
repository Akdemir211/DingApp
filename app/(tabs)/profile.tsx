import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { router } from 'expo-router';
import { 
  Settings, 
  Clock, 
  User, 
  Award, 
  MessageSquare, 
  LogOut, 
  ChevronRight,
  Crown,
  HelpCircle,
  Trash2
} from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import * as AIChatService from '@/lib/aiChatService';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withSequence,
  withDelay
} from 'react-native-reanimated';

// ... (diğer kodlar aynı kalacak)

const SettingsItem = ({ 
  icon, 
  title, 
  onPress,
  showProBadge,
  showDeleteIcon
}: { 
  icon: React.ReactNode, 
  title: string, 
  onPress: () => void,
  showProBadge?: boolean,
  showDeleteIcon?: boolean
}) => {
  const [showNotification, setShowNotification] = useState(false);
  const notificationScale = useSharedValue(0);
  
  const notificationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: notificationScale.value }]
  }));

  const handlePress = () => {
    if (showProBadge) {
      setShowNotification(true);
      notificationScale.value = withSequence(
        withSpring(1),
        withDelay(2000, withSpring(0))
      );
      setTimeout(() => setShowNotification(false), 2500);
    } else {
      onPress();
    }
  };

  return (
    <TouchableOpacity style={styles.settingsItem} onPress={handlePress}>
      <View style={styles.settingsItemIcon}>{icon}</View>
      <Text style={styles.settingsItemTitle}>{title}</Text>
      {showDeleteIcon ? (
        <Trash2 size={20} color={Colors.error} />
      ) : (
        <ChevronRight size={20} color={Colors.text.secondary} />
      )}
      
      {showNotification && (
        <Animated.View style={[styles.notification, notificationStyle]}>
          <Text style={styles.notificationText}>Zaten Pro Kullanıcısınız</Text>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
};

export default function ProfileScreen() {
  // ... (diğer state ve effect kodları aynı kalacak)

  const handleClearAIChat = async () => {
    if (!user) return;
    
    try {
      await AIChatService.clearChatHistory(user.id);
      // Başarılı silme işlemi sonrası kullanıcıya bildirim gösterilebilir
    } catch (error) {
      console.error('AI sohbet geçmişi temizleme hatası:', error);
    }
  };

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      <SafeAreaView style={styles.safeArea}>
        {/* ... (diğer UI kodları aynı kalacak) */}
        
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Ayarlar</Text>
          <Card style={styles.settingsCard}>
            <SettingsItem 
              icon={<User size={20} color={Colors.primary[400]} />}
              title="Hesap Ayarları"
              onPress={handleAccountSettings}
            />
            <SettingsItem 
              icon={<Crown size={20} color={Colors.primary[400]} />}
              title={userData?.is_pro ? "Pro Kullanıcı" : "Pro'ya Yükselt"}
              onPress={handleUpgradePro}
              showProBadge={userData?.is_pro}
            />
            <SettingsItem 
              icon={<HelpCircle size={20} color={Colors.primary[400]} />}
              title="Yardım & Destek"
              onPress={handleHelpSupport}
            />
            <SettingsItem 
              icon={<MessageSquare size={20} color={Colors.error} />}
              title="AI Sohbet Geçmişini Temizle"
              onPress={handleClearAIChat}
              showDeleteIcon
            />
          </Card>
        </View>
        
        {/* ... (diğer UI kodları aynı kalacak) */}
      </SafeAreaView>
    </View>
  );
}

// ... (stil kodları aynı kalacak)
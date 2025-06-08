import React from 'react';
import { Tabs } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useTabBar } from '@/context/TabBarContext';
import { Colors, Shadows, BorderRadius } from '@/constants/Theme';
import { Home, MessageSquare, Clock, User, Video } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  const { theme } = useTheme();
  const { isTabBarVisible } = useTabBar();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.background.darker,
          borderTopColor: theme.colors.border.primary,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 85 : 70,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 6,
          paddingHorizontal: 16,
          borderTopLeftRadius: BorderRadius.xl,
          borderTopRightRadius: BorderRadius.xl,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          ...Shadows.large,
          shadowColor: theme.colors.darkGray[900],
          elevation: 20,
          display: isTabBarVisible ? 'flex' : 'none',
        },
        tabBarActiveTintColor: theme.colors.primary[400],
        tabBarInactiveTintColor: theme.colors.text.inactive,
        tabBarLabelStyle: {
          fontFamily: 'Inter-SemiBold',
          fontSize: 11,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: BorderRadius.lg,
          marginHorizontal: 2,
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, size, focused }) => (
            <Home 
              size={focused ? size + 2 : size} 
              color={focused ? theme.colors.primary[400] : color}
              fill={focused ? theme.colors.primary[400] + '20' : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Sohbet',
          tabBarIcon: ({ color, size, focused }) => (
            <MessageSquare 
              size={focused ? size + 2 : size} 
              color={focused ? theme.colors.primary[400] : color}
              fill={focused ? theme.colors.primary[400] + '20' : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="watch"
        options={{
          title: 'İzle',
          tabBarIcon: ({ color, size, focused }) => (
            <Video 
              size={focused ? size + 2 : size} 
              color={focused ? theme.colors.primary[400] : color}
              fill={focused ? theme.colors.primary[400] + '20' : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="study"
        options={{
          title: 'Çalış',
          tabBarIcon: ({ color, size, focused }) => (
            <Clock 
              size={focused ? size + 2 : size} 
              color={focused ? theme.colors.primary[400] : color}
              fill={focused ? theme.colors.primary[400] + '20' : 'none'}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size, focused }) => (
            <User 
              size={focused ? size + 2 : size} 
              color={focused ? theme.colors.primary[400] : color}
              fill={focused ? theme.colors.primary[400] + '20' : 'none'}
            />
          ),
        }}
      />
    </Tabs>
  );
}
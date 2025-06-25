import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { SplashScreen } from 'expo-router';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { LanguageProvider } from '@/context/LanguageContext';
import { TabBarProvider } from '@/context/TabBarContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

function AppContent() {
  const { themeMode } = useTheme();

  return (
    <>
          <Stack 
            screenOptions={{
              headerShown: false,
              animation: 'fade',
              animationDuration: 200,
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              contentStyle: {
                backgroundColor: 'transparent',
              },
              presentation: 'card',
            }}
          >
            <Stack.Screen 
              name="(auth)" 
              options={{ 
                animation: 'fade',
                animationDuration: 400,
              }} 
            />
            <Stack.Screen 
              name="(tabs)" 
              options={{ 
                animation: 'fade',
                animationDuration: 400,
              }} 
            />
            <Stack.Screen 
              name="pro-upgrade" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
                animationDuration: 300,
                gestureEnabled: true,
                gestureDirection: 'vertical',
              }} 
            />
            <Stack.Screen 
              name="+not-found" 
              options={{ 
                presentation: 'modal',
                animation: 'slide_from_bottom',
                animationDuration: 300,
              }} 
            />
          </Stack>
      <StatusBar 
        style={themeMode === 'light' ? "dark" : "light"} 
        backgroundColor="transparent"
        translucent={false}
      />
    </>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });
  
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);
  
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <TabBarProvider>
            <AuthProvider>
              <AppContent />
          </AuthProvider>
          </TabBarProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
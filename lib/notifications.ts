import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

export async function registerForPushNotificationsAsync(userId?: string) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return null;

    const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
    const tokenResponse = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    const token = tokenResponse.data;

    if (!token) return null;

    if (userId) {
      await supabase
        .from('users')
        .update({ push_token: token })
        .eq('id', userId);
    }

    return token;
  } catch (e) {
    console.warn('Push token kaydı başarısız:', e);
    return null;
  }
}

export async function sendPushNotification(to: string, title: string, body: string, data?: Record<string, any>) {
  try {
    const message = {
      to,
      sound: 'default',
      title,
      body,
      data: data || {},
    };

    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn('Push gönderimi başarısız:', res.status, text);
    }
  } catch (e) {
    console.warn('Push gönderimi hatası:', e);
  }
} 
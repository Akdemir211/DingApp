import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

// SecureStore tabanlı storage adaptörü (native için önerilir)
const secureStore = {
  async getItem(key: string) {
    return SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    await SecureStore.setItemAsync(key, value, {
      keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK,
    });
  },
  async removeItem(key: string) {
    await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : secureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

export function subscribeToChatMessages(onChange: (payload: any) => void) {
  return supabase
    .channel('chat_messages')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages',
      },
      onChange
    )
    .subscribe();
}

export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
};
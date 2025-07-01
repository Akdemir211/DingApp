import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided in environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Enable realtime subscription for chat messages
supabase.channel('chat_messages')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'chat_messages' 
  }, (payload) => {
    console.log('Chat message changed:', payload);
  })
  .subscribe();

// Helper function for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  // You can add additional error handling logic here
};
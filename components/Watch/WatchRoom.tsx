import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Users, Play, Pause } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { WebView } from 'react-native-webview';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface VideoState {
  is_playing: boolean;
  current_time: number;
}

// ... (diğer interface tanımlamaları aynı kalacak)

const VideoPlayer = ({ videoUrl, onTimeUpdate, onPlayStateChange, initialState }: { 
  videoUrl: string;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  initialState: VideoState;
}) => {
  const webViewRef = useRef<WebView>(null);
  const embedUrl = getEmbedUrl(videoUrl);

  // YouTube Player API'sini enjekte et
  const injectedJavaScript = `
    let player;
    let isReady = false;
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        events: {
          'onReady': onPlayerReady,
          'onStateChange': onPlayerStateChange
        }
      });
    }

    function onPlayerReady(event) {
      isReady = true;
      player.seekTo(${initialState.current_time});
      ${initialState.is_playing ? 'player.playVideo();' : 'player.pauseVideo();'}
    }

    function onPlayerStateChange(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        isPlaying: event.data === 1,
        currentTime: player.getCurrentTime()
      }));
    }

    // Her 1 saniyede bir süreyi güncelle
    setInterval(() => {
      if (isReady && player) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'timeUpdate',
          currentTime: player.getCurrentTime()
        }));
      }
    }, 1000);
  `;

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'stateChange') {
        onPlayStateChange(data.isPlaying);
        onTimeUpdate(data.currentTime);
      } else if (data.type === 'timeUpdate') {
        onTimeUpdate(data.currentTime);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <script src="https://www.youtube.com/iframe_api"></script>
              <style>
                body { margin: 0; }
                iframe { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <div id="player"></div>
            </body>
          </html>
        `
      }}
      style={{ flex: 1, backgroundColor: 'black' }}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleMessage}
      allowsFullscreenVideo
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
    />
  );
};

export const WatchRoom: React.FC<WatchRoomProps> = ({ roomId, room, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoState, setVideoState] = useState<VideoState>({
    is_playing: false,
    current_time: 0
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const [isLandscape, setIsLandscape] = useState(SCREEN_WIDTH > SCREEN_HEIGHT);

  useEffect(() => {
    fetchInitialState();
    subscribeToVideoState();
    // ... (diğer useEffect içeriği aynı kalacak)
  }, [roomId]);

  const fetchInitialState = async () => {
    try {
      const { data, error } = await supabase
        .from('video_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) throw error;
      if (data) {
        setVideoState({
          is_playing: data.is_playing,
          current_time: data.current_time
        });
      }
    } catch (error) {
      console.error('Error fetching video state:', error);
    }
  };

  const subscribeToVideoState = () => {
    const subscription = supabase
      .channel(`video_state:${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'video_states',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (payload.new) {
          setVideoState({
            is_playing: payload.new.is_playing,
            current_time: payload.new.current_time
          });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const updateVideoState = async (isPlaying: boolean, currentTime: number) => {
    try {
      const { error } = await supabase
        .from('video_states')
        .update({
          is_playing: isPlaying,
          current_time: currentTime,
          updated_at: new Date().toISOString()
        })
        .eq('room_id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating video state:', error);
    }
  };

  // ... (diğer fonksiyonlar aynı kalacak)

  return (
    <View style={styles.container}>
      <FloatingBubbleBackground />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.roomName}>{room.name}</Text>
          <View style={styles.roomStats}>
            <Users size={14} color={Colors.text.secondary} />
            <Text style={styles.statsText}>{members.length} üye</Text>
          </View>
        </View>
      </View>

      <View style={getContentStyles()}>
        <View style={getVideoSectionStyles()}>
          <VideoPlayer 
            videoUrl={room.video_url}
            onTimeUpdate={(time) => updateVideoState(videoState.is_playing, time)}
            onPlayStateChange={(isPlaying) => updateVideoState(isPlaying, videoState.current_time)}
            initialState={videoState}
          />
        </View>

        {/* ... (geri kalan bileşen içeriği aynı kalacak) */}
      </View>
    </View>
  );
};

// ... (stiller aynı kalacak)
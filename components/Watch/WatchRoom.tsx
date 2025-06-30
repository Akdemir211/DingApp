import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTabBar } from '@/context/TabBarContext';
import { router } from 'expo-router';
import { ArrowLeft, Send, Users, Play, Pause, Video, MessageSquare, Shield, Eye, X } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { WebView } from 'react-native-webview';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInRight,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface WatchRoomProps {
  roomId: string;
  room: {
    id: string;
    name: string;
    description: string;
    video_url: string;
    is_private: boolean;
    created_by: string;
  };
  onClose: () => void;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  userName?: string;
}

interface VideoState {
  is_playing: boolean;
  playback_time: number;
}

const VideoPlayer = ({ 
  videoUrl, 
  isCreator,
  videoState,
  onStateChange,
  theme,
  onWebViewReady
}: { 
  videoUrl: string;
  isCreator: boolean;
  videoState: VideoState;
  onStateChange: (state: VideoState) => void;
  theme: any;
  onWebViewReady?: (webView: WebView | null) => void;
}) => {
  const embedUrl = getEmbedUrl(videoUrl, isCreator);
  const webViewRef = useRef<WebView>(null);
  const [localPlaying, setLocalPlaying] = useState(videoState.is_playing);
  const [currentTime, setCurrentTime] = useState(videoState.playback_time);
  const [playerReady, setPlayerReady] = useState(false);
  const [apiLoaded, setApiLoaded] = useState(false);
  const scale = useSharedValue(1);

  // WebView hazır olduğunda parent'a bildir
  useEffect(() => {
    if (onWebViewReady && webViewRef.current) {
      onWebViewReady(webViewRef.current);
    }
  }, [onWebViewReady]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  // WebView'a komut gönderme fonksiyonu - güvenli şekilde
  const sendPlayerCommand = (command: string, args?: any[]) => {
    if (webViewRef.current && playerReady && apiLoaded) {
      const argsStr = args ? `, ${args.map(arg => JSON.stringify(arg)).join(', ')}` : '';
      const script = `
        try {
          if (window.ytPlayer && window.ytPlayer.${command}) {
            window.ytPlayer.${command}(${argsStr});
            console.log('[VideoPlayer] Command executed: ${command}');
            true;
          } else {
            console.warn('[VideoPlayer] Command not available: ${command}');
            false;
          }
        } catch (error) {
          console.error('[VideoPlayer] Command error:', error);
          false;
        }
      `;
      webViewRef.current.injectJavaScript(script);
    } else {
      console.warn('[VideoPlayer] Cannot send command - player not ready:', { playerReady, apiLoaded, command });
    }
  };

  // Sadeleştirilmiş ve güvenilir JavaScript injection
  const injectedJavaScript = `
    (function() {
      console.log('[VideoPlayer] Initializing - isCreator:', ${isCreator});
      
      let ytPlayer = null;
      let playerState = -1;
      let currentVideoTime = 0;
      let isReady = false;
      const isCreatorMode = ${isCreator};
      
             // Video state gönderme fonksiyonu
       function sendStateUpdate() {
         if (ytPlayer && isReady) {
           try {
             const state = ytPlayer.getPlayerState();
             const time = ytPlayer.getCurrentTime() || 0;
             
             // Her zaman state change gönder (creator için önemli)
             if (state !== playerState || Math.abs(time - currentVideoTime) > 0.5) {
               console.log('[VideoPlayer] State update - State:', state, 'Time:', time, 'IsCreator:', isCreatorMode);
               playerState = state;
               currentVideoTime = time;
               
               window.ReactNativeWebView.postMessage(JSON.stringify({
                 type: 'stateChange',
                 data: {
                   state: state,
                   time: time,
                   isPlaying: state === 1
                 }
               }));
             }
           } catch (error) {
             console.error('[VideoPlayer] State update error:', error);
           }
         }
       }
      
      // Player event handlers
             function onPlayerReady(event) {
         console.log('[VideoPlayer] Player ready - isCreator:', isCreatorMode);
         ytPlayer = event.target;
         isReady = true;
         
         // Creator olmayan kullanıcılar için kontrolleri gizle
         if (!isCreatorMode) {
           try {
             const style = document.createElement('style');
             style.innerHTML = \`
               .ytp-chrome-bottom,
               .ytp-chrome-top,
               .ytp-chrome-controls,
               .ytp-control-bar,
               .ytp-progress-bar-container,
               .ytp-large-play-button {
                 display: none !important;
                 pointer-events: none !important;
               }
               
               .html5-video-container {
                 pointer-events: none !important;
               }
               
               iframe {
                 pointer-events: \${isCreatorMode ? 'auto' : 'none'} !important;
               }
             \`;
             document.head.appendChild(style);
           } catch (error) {
             console.error('[VideoPlayer] Style injection error:', error);
           }
         }
         
         // İlk state'i hemen gönder
         setTimeout(() => {
           sendStateUpdate();
         }, 100);
         
         // State monitoring başlat - daha sık kontrol et
         setInterval(sendStateUpdate, 500);
         
         // Ready signal gönder
         window.ReactNativeWebView.postMessage(JSON.stringify({
           type: 'playerReady'
         }));
       }
       
       function onPlayerStateChange(event) {
         console.log('[VideoPlayer] State changed:', event.data, 'IsCreator:', isCreatorMode);
         // State değişikliği olduğunda hemen gönder
         setTimeout(sendStateUpdate, 50);
       }
      
      // Global functions for external control
      window.ytPlayer = null;
      window.playVideo = function() {
        if (ytPlayer && isReady) {
          ytPlayer.playVideo();
          console.log('[VideoPlayer] Play command executed');
        }
      };
      
      window.pauseVideo = function() {
        if (ytPlayer && isReady) {
          ytPlayer.pauseVideo();
          console.log('[VideoPlayer] Pause command executed');
        }
      };
      
      window.seekTo = function(seconds, allowSeekAhead) {
        if (ytPlayer && isReady) {
          ytPlayer.seekTo(seconds, allowSeekAhead !== false);
          console.log('[VideoPlayer] Seek command executed:', seconds);
        }
      };
      
      // YouTube API yükleme
      function loadYouTubeAPI() {
        if (window.YT && window.YT.Player) {
          console.log('[VideoPlayer] YouTube API already loaded');
          initializePlayer();
          return;
        }
        
        window.onYouTubeIframeAPIReady = function() {
          console.log('[VideoPlayer] YouTube API ready');
          initializePlayer();
        };
        
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          document.head.appendChild(script);
          console.log('[VideoPlayer] YouTube API script added');
        }
      }
      
      function initializePlayer() {
        try {
          const iframe = document.querySelector('iframe');
          if (iframe && window.YT && window.YT.Player) {
            window.ytPlayer = new window.YT.Player(iframe, {
              events: {
                'onReady': onPlayerReady,
                'onStateChange': onPlayerStateChange
              }
            });
            console.log('[VideoPlayer] Player initialized');
          } else {
            console.error('[VideoPlayer] Cannot initialize - missing elements');
          }
        } catch (error) {
          console.error('[VideoPlayer] Player initialization error:', error);
        }
      }
      
      // DOM ready olduğunda başlat
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadYouTubeAPI);
      } else {
        setTimeout(loadYouTubeAPI, 100);
      }
      
    })();
    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('[VideoPlayer] Message received:', message.type, message);
      
      if (message.type === 'playerReady') {
        console.log('✅ YouTube Player Ready - Syncing video state');
        setPlayerReady(true);
        setApiLoaded(true);
        
        // Player hazır olduğunda mevcut durumu sync et
        setTimeout(() => syncVideoState(), 1000);
      }
      
      if (message.type === 'stateChange') {
        const isPlaying = message.data.state === 1; // 1 = playing, 2 = paused
        const currentTime = message.data.time || 0;
        
        console.log('🎮 Player state change:', { 
          state: message.data.state,
          isPlaying, 
          currentTime, 
          isCreator,
          previousLocalPlaying: localPlaying 
        });
        
        // Local state'i hemen güncelle
        setLocalPlaying(isPlaying);
        setCurrentTime(currentTime);
        
        // Sadece oda sahibi değişiklikleri veritabanına kaydet
        if (isCreator) {
          console.log('👑 Creator updating database state:', { is_playing: isPlaying, playback_time: currentTime });
          onStateChange({
            is_playing: isPlaying,
            playback_time: currentTime
          });
        }
      }
    } catch (error) {
      console.error('Error handling player message:', error);
    }
  };

  const syncVideoState = () => {
    if (!webViewRef.current || !playerReady || !apiLoaded) {
      console.log('⏳ Cannot sync - player not ready:', { playerReady, apiLoaded });
      return;
    }

    console.log('🔄 Syncing video state:', videoState);

    // Önce zamanı sync et
    if (videoState.playback_time > 0) {
      setTimeout(() => {
        sendPlayerCommand('seekTo', [videoState.playback_time, true]);
      }, 100);
    }
    
    // Sonra play/pause durumunu sync et
    setTimeout(() => {
      if (videoState.is_playing) {
        sendPlayerCommand('playVideo');
      } else {
        sendPlayerCommand('pauseVideo');
      }
    }, 300);
  };

  // Video state değişikliklerini dinle (tüm kullanıcılar için)
  useEffect(() => {
    console.log('📺 Video state changed:', videoState, 'isCreator:', isCreator, 'localPlaying:', localPlaying);
    
    // Remote state değişikliği geldiğinde local state'i de güncelle
    if (videoState.is_playing !== localPlaying) {
      console.log('🔄 Updating local state from remote:', { 
        remote: videoState.is_playing, 
        local: localPlaying,
        willUpdate: true
      });
      setLocalPlaying(videoState.is_playing);
    }
    
    if (Math.abs(videoState.playback_time - currentTime) > 1) {
      setCurrentTime(videoState.playback_time);
    }
    
    // İzleyiciler için player sync
    if (!isCreator && playerReady && apiLoaded) {
      console.log('👥 Viewer syncing to remote state');
      setTimeout(syncVideoState, 150);
    }
  }, [videoState, isCreator, playerReady, apiLoaded]);

  return (
    <Animated.View style={[styles.videoContainer, animatedStyle]}>
      <GradientCard colors={theme.colors.gradients.warmDark} style={styles.videoCard}>
        <View style={styles.videoHeader}>
          <View style={[styles.videoIcon, { backgroundColor: theme.colors.background.elevated }]}>
            <Video size={20} color={theme.colors.primary[400]} />
          </View>
          <View style={styles.videoInfo}>
            <Text style={[styles.videoTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
              Video İzleme {isCreator && "(Kontrol)"}
            </Text>
            <View style={styles.videoStatus}>
              <Eye size={14} color={localPlaying ? theme.colors.success : theme.colors.text.secondary} />
              <Text style={[styles.statusText, { color: localPlaying ? theme.colors.success : theme.colors.text.secondary }]}>
                {localPlaying ? 'Oynatılıyor' : 'Duraklatıldı'}
              </Text>
              {currentTime > 0 && (
                <Text style={[styles.timeText, { color: theme.colors.text.secondary, marginLeft: 8 }]}>
                  {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}
                </Text>
              )}
              {playerReady && apiLoaded && (
                <View style={[styles.readyIndicator, { backgroundColor: theme.colors.success }]}>
                  <Text style={[styles.readyText, { color: theme.colors.text.primary }]}>●</Text>
                </View>
              )}
              {__DEV__ && (
                <Text style={[styles.debugText, { color: theme.colors.text.secondary, marginLeft: 8 }]}>
                  L:{localPlaying ? '1' : '0'} R:{videoState.is_playing ? '1' : '0'}
                </Text>
              )}
            </View>
          </View>
          {!isCreator && (
            <View style={[styles.viewerBadge, { backgroundColor: theme.colors.background.elevated }]}>
              <Eye size={14} color={theme.colors.text.secondary} />
              <Text style={[styles.viewerText, { color: theme.colors.text.secondary }]}>İzleyici</Text>
            </View>
          )}
        </View>
        
        <View style={styles.videoWrapper}>
          <WebView
            ref={webViewRef}
            source={{ uri: embedUrl }}
            style={styles.webView}
            allowsFullscreenVideo={isCreator}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            javaScriptEnabled={true}
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            userAgent={isCreator ? undefined : "Mozilla/5.0 (compatible; SyncWatch-Viewer/1.0)"}
            onLoad={() => {
              console.log('[VideoPlayer] WebView loaded');
              setPlayerReady(false);
              setApiLoaded(false);
            }}
            onLoadEnd={() => {
              console.log('[VideoPlayer] WebView load ended, waiting for player...');
            }}
            scalesPageToFit={false}
            bounces={false}
            scrollEnabled={false}
            allowsLinkPreview={false}
            allowsBackForwardNavigationGestures={false}
            decelerationRate="normal"
            onShouldStartLoadWithRequest={(request) => {
              if (!isCreator && !request.url.includes('youtube.com/embed')) {
                console.log('🚫 Blocking navigation for viewer:', request.url);
                return false;
              }
              return true;
            }}
            onError={(error) => {
              console.error('[VideoPlayer] WebView error:', error);
            }}
          />
          
          {!isCreator && (
            <TouchableOpacity
              style={styles.viewerBlockOverlay}
              activeOpacity={1}
              onPress={() => {
                console.log('🚫 Viewer touch blocked by React Native overlay');
              }}
            />
          )}
        </View>
      </GradientCard>
    </Animated.View>
  );
};

const getEmbedUrl = (url: string, isCreator: boolean = false) => {
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  
  if (videoId) {
    if (isCreator) {
      // Creator için optimized kontrol
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=1&controls=1&iv_load_policy=3&origin=${encodeURIComponent(window?.location?.origin || 'https://localhost')}`;
    } else {
      // İzleyiciler için tamamen kontrol edilemez - sadeleştirilmiş
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=0&controls=0&disablekb=1&iv_load_policy=3&showinfo=0&autoplay=0`;
    }
  }
  
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    const controls = isCreator ? '1' : '0';
    return `https://player.vimeo.com/video/${vimeoId}?playsinline=1&controls=${controls}&autoplay=0`;
  }
  
  return url;
};

export const WatchRoom: React.FC<WatchRoomProps> = ({ roomId, room, onClose }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { hideTabBar, showTabBar } = useTabBar();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoState, setVideoState] = useState<VideoState>({
    is_playing: false,
    playback_time: 0
  });
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<{[key: string]: {name: string, photoUrl: string | null}}>({}); 
  const [profilePhotoModal, setProfilePhotoModal] = useState<{visible: boolean, uri: string | null, userName: string, userId: string}>({
    visible: false,
    uri: null,
    userName: '',
    userId: ''
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const [videoWebView, setVideoWebView] = useState<WebView | null>(null);
  const [isLandscape, setIsLandscape] = useState(SCREEN_WIDTH > SCREEN_HEIGHT);
  const isCreator = user?.id === room.created_by;

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    hideTabBar();
    
    loadUsers();
    fetchVideoState();
    fetchMessages();
    fetchMembers();

    // Video state için real-time subscription
    const videoStateSubscription = supabase
      .channel(`video_state_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // UPDATE ve INSERT eventlerini dinle
          schema: 'public',
          table: 'watch_room_video_state',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('🔔 Video state change received:', payload.eventType, payload);
          
          if (payload.new && typeof payload.new === 'object') {
            const newVideoState = {
              is_playing: Boolean((payload.new as any).is_playing),
              playback_time: Number((payload.new as any).playback_time) || 0
            };
            
            console.log('📡 Updating video state from subscription:', newVideoState);
            setVideoState(newVideoState);
          }
        }
      )
      .subscribe((status) => {
        console.log('📺 Video subscription status:', status);
      });

    // Chat messages için real-time subscription
    const messageSubscription = supabase
      .channel(`messages_${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'watch_room_messages',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message received:', payload);
          if (payload.new && typeof payload.new === 'object') {
            const newMsg = payload.new as any;
            
            // Mesajın zaten listede olup olmadığını kontrol et
            setMessages(prev => {
              const messageExists = prev.find(msg => msg.id === newMsg.id);
              if (messageExists) return prev;
              
              const userInfo = users[newMsg.user_id];
              const formattedMessage: Message = {
                id: newMsg.id,
                user_id: newMsg.user_id,
                content: newMsg.content,
                created_at: newMsg.created_at,
                userName: userInfo?.name || 'Kullanıcı'
              };
              
              const newMessages = [...prev, formattedMessage];
              
              // Auto-scroll to bottom
              setTimeout(() => scrollToBottom(), 100);
              
              return newMessages;
            });
          }
        }
      )
      .subscribe();

    return () => {
      showTabBar();
      videoStateSubscription.unsubscribe();
      messageSubscription.unsubscribe();
    };
  }, [roomId, hideTabBar, showTabBar]);

  // Users değiştiğinde mesajları güncelle
  useEffect(() => {
    if (Object.keys(users).length > 0) {
      setMessages(prev => prev.map(msg => ({
        ...msg,
        userName: users[msg.user_id]?.name || 'Kullanıcı'
      })));
    }
  }, [users]);

  const loadUsers = async (retryCount = 0) => {
    const maxRetries = 2;
    const timeoutMs = 5000; // 5 saniye timeout
    
    try {
      console.log(`[loadUsers] Attempting to load users (retry: ${retryCount})`);
      
      // AbortController ile timeout kontrolü
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.log('[loadUsers] Request aborted due to timeout');
      }, timeoutMs);
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, id, name, photo_url')
        .abortSignal(controller.signal);
      
      clearTimeout(timeoutId);
      
      if (error) {
        // Eğer profiles tablosu yoksa, kullanıcı bilgilerini auth'dan al
        if (error.code === '42P01') {
          console.log('[loadUsers] Profiles table not found, using fallback');
          const fallbackUsers: {[key: string]: {name: string, photoUrl: string | null}} = {};
          if (user) {
            fallbackUsers[user.id] = {
              name: user.user_metadata?.name || user.email || 'Kullanıcı',
              photoUrl: null
            };
          }
          setUsers(fallbackUsers);
          return;
        }
        
        // Network error ise retry
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error(`Network error: ${error.message}`);
        }
        
        console.error('[loadUsers] Database error:', error);
        throw error;
      }

      if (profiles && Array.isArray(profiles)) {
        const userMap: {[key: string]: {name: string, photoUrl: string | null}} = {};
        profiles.forEach((profile: any) => {
          userMap[profile.user_id || profile.id] = {
            name: profile.name || 'Kullanıcı',
            photoUrl: profile.photo_url
          };
        });
        console.log(`[loadUsers] Successfully loaded ${Object.keys(userMap).length} users`);
        setUsers(userMap);
      }
    } catch (error: any) {
      console.error(`[loadUsers] Error (attempt ${retryCount + 1}):`, error.message || error);
      
      // Network hatası ve retry hakkı varsa tekrar dene
      if (retryCount < maxRetries && (
        error.name === 'AbortError' ||
        error.message?.includes('network') || 
        error.message?.includes('timeout') ||
        error.message?.includes('fetch')
      )) {
        console.log(`[loadUsers] Retrying in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          loadUsers(retryCount + 1);
        }, (retryCount + 1) * 1000); // Artan gecikme: 1s, 2s
        return;
      }
      
      // Fallback: Sadece mevcut kullanıcı bilgisini kullan
      console.log('[loadUsers] Using fallback user data');
      if (user) {
        const fallbackUsers: {[key: string]: {name: string, photoUrl: string | null}} = {};
        fallbackUsers[user.id] = {
          name: user.user_metadata?.name || user.email || 'Kullanıcı',
          photoUrl: null
        };
        setUsers(fallbackUsers);
      } else {
        // Hiç kullanıcı yoksa boş obje
        setUsers({});
      }
    }
  };

  const fetchVideoState = async (retryCount = 0) => {
    const maxRetries = 1;
    const timeoutMs = 3000; // 3 saniye timeout
    
    try {
      console.log(`[fetchVideoState] Fetching video state (retry: ${retryCount})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      
      const { data, error } = await supabase
        .from('watch_room_video_state')
        .select('is_playing, playback_time')
        .eq('room_id', roomId)
        .abortSignal(controller.signal)
        .single();

      clearTimeout(timeoutId);

      if (error) {
        // Eğer tablo yoksa veya kayıt yoksa, varsayılan durum kullan
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.log('[fetchVideoState] Video state table/record not found, using default state');
          setVideoState({ is_playing: false, playback_time: 0 });
          return;
        }
        
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error(`Network error: ${error.message}`);
        }
        
        console.error('[fetchVideoState] Database error:', error);
        throw error;
      }

      if (data) {
        const videoData = data as any;
        const newState = {
          is_playing: Boolean(videoData.is_playing),
          playback_time: Number(videoData.playback_time) || 0
        };
        console.log('[fetchVideoState] Successfully fetched video state:', newState);
        setVideoState(newState);
      }
    } catch (error: any) {
      console.error(`[fetchVideoState] Error (attempt ${retryCount + 1}):`, error.message || error);
      
      if (retryCount < maxRetries && (
        error.name === 'AbortError' ||
        error.message?.includes('network') || 
        error.message?.includes('timeout')
      )) {
        console.log(`[fetchVideoState] Retrying in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchVideoState(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }
      
      console.log('[fetchVideoState] Using default video state');
      setVideoState({ is_playing: false, playback_time: 0 });
    }
  };

  // Debounce için timeout ref
  const updateTimeoutRef = useRef<number | null>(null);
  
  const updateVideoState = async (newState: VideoState) => {
    if (!isCreator) {
      console.log('❌ Only room creator can update video state');
      return;
    }
    
    console.log('🔄 Updating video state in database:', newState);
    
    // Önceki timeout'u iptal et
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    
    // Debounce - 200ms bekle (daha responsive)
    updateTimeoutRef.current = setTimeout(async () => {
      const timeoutMs = 3000; // 3 saniye timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      
      try {
        console.log('[updateVideoState] Updating video state:', newState);
        
        const { data, error } = await supabase
          .from('watch_room_video_state')
          .upsert({
            room_id: roomId,
            is_playing: newState.is_playing,
            playback_time: Math.round(newState.playback_time) // Saniye cinsinden yuvarlama
          }, {
            onConflict: 'room_id'
          })
          .abortSignal(controller.signal)
          .select();

        clearTimeout(timeoutId);

        if (error) {
          // Eğer tablo yoksa log yaz ama hata verme
          if (error.code === '42P01') {
            console.log('[updateVideoState] Video state table not found, video sync disabled');
            return;
          }
          console.error('[updateVideoState] Database error:', error);
          setError('Video durumu güncellenirken hata oluştu');
        } else {
          console.log('[updateVideoState] Video state updated successfully:', data);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        
        if (error.name === 'AbortError') {
          console.error('[updateVideoState] Update timeout');
          setError('Video durumu güncelleme zaman aşımı');
        } else {
          console.error('[updateVideoState] Update error:', error.message || error);
          // Hata durumunda da devam et - video sync sorunları app'i durdurmamalı
        }
      }
    }, 200);
  };

  const fetchMessages = async (retryCount = 0) => {
    const maxRetries = 1;
    const timeoutMs = 4000; // 4 saniye timeout
    
    try {
      console.log(`[fetchMessages] Fetching messages (retry: ${retryCount})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      
      const { data, error } = await supabase
        .from('watch_room_messages')
        .select('*')
        .eq('room_id', roomId)
        .abortSignal(controller.signal)
        .order('created_at', { ascending: true });

      clearTimeout(timeoutId);

      if (error) {
        // Eğer tablo yoksa boş mesaj listesi kullan
        if (error.code === '42P01') {
          console.log('[fetchMessages] Messages table not found, using empty messages');
          setMessages([]);
          return;
        }
        
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error(`Network error: ${error.message}`);
        }
        
        console.error('[fetchMessages] Database error:', error);
        throw error;
      }

      if (data && Array.isArray(data)) {
        const messagesWithUsernames = data.map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id,
          content: msg.content,
          created_at: msg.created_at,
          userName: users[msg.user_id]?.name || 'Kullanıcı'
        }));
        console.log(`[fetchMessages] Successfully loaded ${messagesWithUsernames.length} messages`);
        setMessages(messagesWithUsernames);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error: any) {
      console.error(`[fetchMessages] Error (attempt ${retryCount + 1}):`, error.message || error);
      
      if (retryCount < maxRetries && (
        error.name === 'AbortError' ||
        error.message?.includes('network') || 
        error.message?.includes('timeout')
      )) {
        console.log(`[fetchMessages] Retrying in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchMessages(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }
      
      console.log('[fetchMessages] Using empty messages array');
      setMessages([]);
    }
  };

  const fetchMembers = async (retryCount = 0) => {
    const maxRetries = 1;
    const timeoutMs = 3000; // 3 saniye timeout
    
    try {
      console.log(`[fetchMembers] Fetching members (retry: ${retryCount})`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, timeoutMs);
      
      const { data, error } = await supabase
        .from('watch_room_members')
        .select('user_id')
        .eq('room_id', roomId)
        .abortSignal(controller.signal);

      clearTimeout(timeoutId);

      if (error) {
        // Eğer tablo yoksa boş dizi kullan
        if (error.code === '42P01') {
          console.log('[fetchMembers] Members table not found, using empty array');
          setMembers([]);
          return;
        }
        
        if (error.message?.includes('network') || error.message?.includes('timeout')) {
          throw new Error(`Network error: ${error.message}`);
        }
        
        console.error('[fetchMembers] Database error:', error);
        throw error;
      }

      if (data && Array.isArray(data)) {
        console.log(`[fetchMembers] Successfully loaded ${data.length} members`);
        setMembers(data);
      }
    } catch (error: any) {
      console.error(`[fetchMembers] Error (attempt ${retryCount + 1}):`, error.message || error);
      
      if (retryCount < maxRetries && (
        error.name === 'AbortError' ||
        error.message?.includes('network') || 
        error.message?.includes('timeout')
      )) {
        console.log(`[fetchMembers] Retrying in ${(retryCount + 1) * 1000}ms...`);
        setTimeout(() => {
          fetchMembers(retryCount + 1);
        }, (retryCount + 1) * 1000);
        return;
      }
      
      console.log('[fetchMembers] Using empty members array');
      setMembers([]);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user || loading) return;

    const messageToSend = newMessage.trim();
    const tempMessage: Message = {
      id: `temp_${Date.now()}`,
      user_id: user.id,
      content: messageToSend,
      created_at: new Date().toISOString(),
      userName: users[user.id]?.name || user.user_metadata?.name || user.email || 'Kullanıcı'
    };

    // Optimistic update - mesajı hemen göster
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');
    
    // Auto-scroll
    setTimeout(() => scrollToBottom(), 100);

    try {
      setLoading(true);
      const { error } = await supabase
        .from('watch_room_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: messageToSend
        });

      if (error) {
        // Hata durumunda temp mesajı kaldır
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
        setNewMessage(messageToSend); // Mesajı geri yükle
        
        if (error.code === '42P01') {
          setError('Mesaj sistemi henüz aktif değil');
          return;
        }
        throw error;
      }
      
      // Başarılı olduğunda temp mesajı kaldır (real-time subscription gerçek mesajı ekleyecek)
      setTimeout(() => {
        setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      }, 1000);
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Mesaj gönderilirken hata oluştu');
      // Temp mesajı kaldır
      setMessages(prev => prev.filter(msg => msg.id !== tempMessage.id));
      setNewMessage(messageToSend); // Mesajı geri yükle
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const MessageBubble = ({ message, isOwnMessage, showAvatar, userInfo }: {
    message: Message;
    isOwnMessage: boolean;
    showAvatar: boolean;
    userInfo: any;
  }) => {
    return (
      <View
        style={[
          styles.messageWrapper,
          isOwnMessage && styles.ownMessageWrapper
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <TouchableOpacity 
            onPress={() => setProfilePhotoModal({
              visible: true,
              uri: userInfo?.photoUrl || null,
              userName: userInfo?.name || 'Kullanıcı',
              userId: message.user_id
            })}
            activeOpacity={0.8}
          >
            <ProfilePhoto 
              uri={userInfo?.photoUrl}
              size={40}
              style={styles.avatar}
            />
          </TouchableOpacity>
        )}
        <View style={[
          styles.messageContainer,
          !isOwnMessage && !showAvatar && styles.continuedMessage
        ]}>
          {isOwnMessage ? (
            <LinearGradient
              colors={theme.colors.gradients.primary}
              style={[styles.messageBubble, styles.ownMessage]}
            >
              <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                {message.content}
              </Text>
              <Text style={[styles.messageTime, { color: theme.colors.text.primary + '80' }]}>
                {formatTime(message.created_at)}
              </Text>
            </LinearGradient>
          ) : (
            <View style={[styles.messageBubble, styles.otherMessage, { backgroundColor: theme.colors.background.card }]}>
              {showAvatar && (
                <Text style={[styles.messageSender, { color: theme.colors.primary[400] }]}>
                  {userInfo?.name}
                </Text>
              )}
              <Text style={[styles.messageText, { color: theme.colors.text.primary }]}>
                {message.content}
              </Text>
              <Text style={[styles.messageTime, { color: theme.colors.text.secondary }]}>
                {formatTime(message.created_at)}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
      <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={[styles.header, { 
              backgroundColor: theme.colors.background.darker + 'DD',
              borderBottomColor: theme.colors.border.primary + '40'
            }]}
            entering={SlideInDown.duration(400)}
          >
                        <TouchableOpacity 
              onPress={onClose} 
              style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}
            >
              <ArrowLeft size={20} color={theme.colors.text.primary} />
            </TouchableOpacity>
            
            <View style={styles.headerCenter}>
              <View style={[styles.roomIcon, { backgroundColor: theme.colors.background.elevated }]}>
                {room?.is_private ? (
                  <Shield size={16} color={theme.colors.primary[400]} />
                ) : (
                  <Video size={16} color={theme.colors.success} />
                )}
              </View>
        <View style={styles.headerInfo}>
                <Text style={[styles.roomName, { color: theme.colors.text.primary }]} numberOfLines={1}>
                  {room?.name || 'İzleme Odası'}
                </Text>
                <Text style={[styles.memberText, { color: theme.colors.text.secondary }]}>
                  {members.length} izleyici
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <View style={[styles.liveIndicator, { backgroundColor: theme.colors.success + '20' }]}>
                <View style={[styles.liveDot, { backgroundColor: theme.colors.success }]} />
                <Text style={[styles.liveText, { color: theme.colors.success }]}>Canlı</Text>
          </View>
        </View>
          </Animated.View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
          <VideoPlayer
            videoUrl={room.video_url}
            isCreator={isCreator}
            videoState={videoState}
            onStateChange={updateVideoState}
              theme={theme}
            onWebViewReady={setVideoWebView}
            />

            <View style={styles.chatSection}>
              <GradientCard colors={theme.colors.gradients.warmDark} style={styles.chatCard}>
                <View style={styles.chatHeader}>
                  <MessageSquare size={20} color={theme.colors.primary[400]} />
                  <Text style={[styles.chatTitle, { color: theme.colors.text.primary }]}>Canlı Sohbet</Text>
                  <Text style={[styles.messageCount, { color: theme.colors.text.secondary }]}>
                    {messages.length} mesaj
                  </Text>
                </View>

                <View style={styles.messagesContainer}>
                  <ScrollView
                    ref={scrollViewRef}
                    style={styles.messagesScroll}
                    contentContainerStyle={[
                      styles.messagesContent,
                      messages.length === 0 && { flex: 1 }
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onContentSizeChange={() => {
                      // Otomatik scroll
                      setTimeout(() => scrollToBottom(), 50);
                    }}
                  >
                    {messages.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <MessageSquare size={32} color={theme.colors.text.secondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                          Henüz mesaj yok
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary + '80' }]}>
                          İlk mesajı gönderin!
                        </Text>
                      </View>
                    ) : (
                      messages.map((message, index) => {
                        const isOwnMessage = message.user_id === user?.id;
                        const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
                        const userInfo = users[message.user_id];
                        
                        return (
                          <MessageBubble
                            key={message.id}
                            message={message}
                            isOwnMessage={isOwnMessage}
                            showAvatar={showAvatar}
                            userInfo={userInfo}
                          />
                        );
                      })
                    )}
                  </ScrollView>
                </View>

                <KeyboardAvoidingView
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                  style={{ flexShrink: 0 }}
                >
                  <View style={[styles.inputContainer, { 
                    backgroundColor: theme.colors.background.elevated,
                    borderWidth: 1,
                    borderColor: theme.colors.border.primary + '40'
                  }]}>
                    <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.background.card,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.border.primary + '20'
                      }]}
                      value={newMessage}
                      onChangeText={setNewMessage}
                      placeholder="Mesajınızı yazın..."
                      placeholderTextColor={theme.colors.text.secondary + '80'}
                      multiline
                      maxLength={200}
                      returnKeyType="send"
                      onSubmitEditing={() => {
                        if (newMessage.trim() && !loading) {
                          handleSend();
                        }
                      }}
                      blurOnSubmit={false}
                    />
                    <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!newMessage.trim() || loading) && styles.sendButtonDisabled
                      ]}
                      onPress={handleSend}
                      disabled={!newMessage.trim() || loading}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={(!newMessage.trim() || loading) ? 
                          [theme.colors.darkGray[600], theme.colors.darkGray[700]] : 
                          theme.colors.gradients.primary
                        }
                        style={styles.sendButtonGradient}
                      >
                        <Send size={16} color={theme.colors.text.primary} />
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </GradientCard>
            </View>
          </ScrollView>
        </SafeContainer>
      </GradientBackground>

      {/* Profil Fotoğrafı Modal'ı */}
      {profilePhotoModal.visible && (
        <View style={styles.profileModal}>
          <TouchableOpacity 
            style={styles.profileModalBackground}
            onPress={() => setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''})}
            activeOpacity={1}
          >
            <View style={styles.profileModalContent}>
              <TouchableOpacity 
                style={styles.profileCloseButton}
                onPress={() => setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''})}
              >
                <X size={24} color={theme.colors.text.primary} />
              </TouchableOpacity>
              
              <View style={styles.profileModalHeader}>
                <Text style={[styles.profileModalTitle, { color: theme.colors.text.primary }]}>
                  {profilePhotoModal.userName}
                </Text>
              </View>
              
              <View style={styles.profilePhotoContainer}>
                <ProfilePhoto 
                  uri={profilePhotoModal.uri}
                  size={200}
                  style={styles.largeProfilePhoto}
                />
              </View>
              
              <View style={styles.profileModalActions}>
                <TouchableOpacity 
                  style={[styles.profileActionButton, { backgroundColor: theme.colors.background.card }]}
                  onPress={() => {
                    // Modal'ı kapat
                    setProfilePhotoModal({visible: false, uri: null, userName: '', userId: ''});
                    
                    // Kullanıcı ID'sini kullan
                    if (profilePhotoModal.userId) {
                      // Profil sayfasına yönlendir
                      router.push(`/user-profile?userId=${profilePhotoModal.userId}`);
                    } else {
                      console.log('Kullanıcı ID bulunamadı:', profilePhotoModal.userName);
                    }
                  }}
                >
                  <Text style={[styles.profileActionText, { color: theme.colors.text.primary }]}>
                    Profili Görüntüle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl, // Header'ı daha aşağı konumlandır
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    minHeight: 65,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xl,
  },
  roomIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    marginBottom: 4,
  },
  memberText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
  },
  videoContainer: {
    marginHorizontal: 18,
    marginTop: 0, // Header ile video arasındaki boşluk ultra minimum
    marginBottom: 12,
  },
  videoCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  videoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  videoIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginBottom: 2,
  },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
    marginLeft: Spacing.xs,
  },
  playButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    ...Shadows.small,
  },
  playButtonGradient: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    height: 200,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  chatSection: {
    margin: Spacing.lg,
    marginTop: Spacing.xs, // Video ile chat arasındaki boşluk minimize
  },
  chatCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    ...Shadows.large,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  chatTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  messageCount: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  messagesContainer: {
    height: 300,
    marginBottom: Spacing.md,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.sm,
  },
  messageWrapper: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  avatar: {
    marginRight: Spacing.xs,
    marginLeft: 0,
  },
  messageContainer: {
    flex: 1,
  },
  continuedMessage: {
    marginLeft: 48,
  },
  messageBubble: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    maxWidth: '100%',
  },
  ownMessage: {
    borderBottomRightRadius: BorderRadius.xs,
    marginLeft: Spacing.xs,
  },
  otherMessage: {
    borderBottomLeftRadius: BorderRadius.xs,
    marginRight: Spacing.xs,
  },
  messageSender: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xs,
    marginBottom: Spacing.xs,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 18,
    marginBottom: Spacing.xs,
  },
  messageTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    marginTop: Spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : 8,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    minHeight: 44,
    textAlignVertical: 'top',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    alignSelf: 'flex-end',
    marginBottom: 2,
    ...Shadows.small,
  },
  sendButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  viewerBadge: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.round,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  viewerText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  timeText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  viewerBlockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 999999,
    backgroundColor: 'transparent',
  },
  // Profil Modal Stilleri
  profileModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    zIndex: 1000,
  },
  profileModalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  profileModalContent: {
    backgroundColor: Colors.background.elevated,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    maxWidth: '90%',
    width: 320,
    alignItems: 'center',
    ...Shadows.large,
  },
  profileCloseButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background.darker,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  profileModalHeader: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  profileModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },
  profilePhotoContainer: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  largeProfilePhoto: {
    // Border kaldırıldı
  },
  profileModalActions: {
    width: '100%',
    alignItems: 'center',
  },
  profileActionButton: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: '100%',
    alignItems: 'center',
    ...Shadows.small,
  },
  profileActionText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  readyIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: Spacing.xs,
    justifyContent: 'center',
    alignItems: 'center',
  },
  readyText: {
    fontSize: 6,
    fontFamily: 'Inter-Bold',
  },
  debugText: {
    fontSize: 8,
    fontFamily: 'Inter-Regular',
  },
});
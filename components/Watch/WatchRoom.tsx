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

  // WebView'a komut gönderme fonksiyonu
  const sendPlayerCommand = (command: string, args?: any[]) => {
    if (webViewRef.current && playerReady) {
      const argsStr = args ? `, ${args.join(', ')}` : '';
      webViewRef.current.injectJavaScript(`
        try {
          if (window.${command}) {
            window.${command}(${argsStr});
            console.log('Command executed: ${command}');
          } else {
            console.log('Command not available: ${command}');
          }
        } catch (error) {
          console.error('Command error:', error);
        }
        true;
      `);
    }
  };

  const injectedJavaScript = `
    let player;
    let isPlayerReady = false;
    let pendingCommands = [];
    const isCreator = ${isCreator};
    
    function onYouTubeIframeAPIReady() {
      const iframe = document.querySelector('iframe');
      if (iframe) {
        player = new YT.Player(iframe, {
          events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
          }
        });
      }
    }

    function onPlayerReady(event) {
      isPlayerReady = true;
      console.log('YouTube Player Ready - isCreator:', isCreator);
      
      // İzleyiciler için kontrolleri tamamen devre dışı bırak
      if (!isCreator) {
        disableViewerControls();
      }
      
      // Bekleyen komutları çalıştır
      pendingCommands.forEach(cmd => {
        if (player && player[cmd.method]) {
          player[cmd.method].apply(player, cmd.args);
        }
      });
      pendingCommands = [];
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'playerReady'
      }));
    }

    function disableViewerControls() {
      // CSS ile kontrolleri gizle
      const style = document.createElement('style');
      style.textContent = \`
        /* YouTube kontrol elementlerini tamamen gizle */
        .ytp-chrome-bottom,
        .ytp-chrome-top,
        .ytp-show-cards-title,
        .ytp-pause-overlay,
        .ytp-player-content,
        .ytp-gradient-bottom,
        .ytp-gradient-top,
        .ytp-chrome-controls,
        .ytp-control-bar,
        .ytp-progress-bar-container,
        .ytp-time-display,
        .ytp-volume-slider,
        .ytp-mute-button,
        .ytp-fullscreen-button,
        .ytp-settings-button,
        .ytp-play-button,
        .ytp-pause-button,
        .ytp-prev-button,
        .ytp-next-button,
        .ytp-big-mode .ytp-large-play-button,
        .ytp-large-play-button,
        .ytp-button,
        .ytp-youtube-button,
        .ytp-watermark,
        .ytp-contextmenu,
        .ytp-popup,
        .ytp-tooltip,
        .html5-endscreen,
        .html5-player-chrome {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Video container'a overlay ekle */
        .html5-video-container {
          pointer-events: none !important;
          position: relative;
        }
        
        /* Video player'ın kendisini de kontrol edilemez yap */
        .html5-main-video {
          pointer-events: none !important;
        }
        
        /* İframe'i kontrol edilemez yap */
        iframe {
          pointer-events: none !important;
        }
        
        /* Tüm YouTube player elementlerini engelle */
        #movie_player,
        .html5-video-player {
          pointer-events: none !important;
        }
        
        /* Mouse cursor'u değiştir - video üzerinde normal ok */
        .html5-video-container,
        .html5-main-video,
        iframe,
        #movie_player {
          cursor: default !important;
        }
        
        /* Viewer overlay - video üzerinde şeffaf engelleme katmanı */
        .viewer-block-overlay {
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          width: 100% !important;
          height: 100% !important;
          z-index: 999999 !important;
          background: transparent !important;
          pointer-events: auto !important;
          cursor: default !important;
        }
      \`;
      document.head.appendChild(style);
      
      // Video üzerine şeffaf engelleme katmanı ekle
      setTimeout(() => {
        const videoContainer = document.querySelector('#movie_player') || 
                              document.querySelector('.html5-video-player') || 
                              document.querySelector('.html5-video-container') ||
                              document.body;
        
        if (videoContainer) {
          const overlay = document.createElement('div');
          overlay.className = 'viewer-block-overlay';
          overlay.style.cssText = \`
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            height: 100% !important;
            z-index: 999999 !important;
            background: transparent !important;
            pointer-events: auto !important;
            cursor: default !important;
          \`;
          
          // Overlay'e tıklandığında hiçbir şey yapma
          overlay.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            console.log('🚫 Viewer click blocked by overlay');
            return false;
          }, true);
          
          overlay.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }, true);
          
          overlay.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }, true);
          
          if (videoContainer.style) {
            videoContainer.style.position = 'relative';
          }
          videoContainer.appendChild(overlay);
          console.log('🔒 Viewer blocking overlay added');
        }
      }, 1000);
      
      // Tüm event'leri engelle - daha agresif
      const blockEvent = function(e) {
        if (!isCreator) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };
      
      // Tüm mouse event'lerini engelle
      ['click', 'mousedown', 'mouseup', 'mousemove', 'dblclick', 'contextmenu'].forEach(eventType => {
        document.addEventListener(eventType, blockEvent, true);
      });
      
      // Tüm touch event'lerini engelle
      ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
        document.addEventListener(eventType, blockEvent, true);
      });
      
      // Keyboard event'leri engelle
      ['keydown', 'keyup', 'keypress'].forEach(eventType => {
        document.addEventListener(eventType, blockEvent, true);
      });
      
      // Focus event'lerini engelle
      ['focus', 'blur', 'focusin', 'focusout'].forEach(eventType => {
        document.addEventListener(eventType, blockEvent, true);
      });
      
      console.log('🔒 All viewer controls completely disabled');
    }

    function onPlayerStateChange(event) {
      const currentTime = player ? player.getCurrentTime() : 0;
      console.log('Player state changed:', event.data, 'time:', currentTime, 'isCreator:', isCreator);
      
      // İzleyiciler state değişikliklerini yapamazsa, sadece oda sahibi değişiklik yapabilir
      if (!isCreator) {
        // İzleyici bir değişiklik yapmaya çalışıyorsa geri al
        console.log('🚫 Viewer attempted state change - blocking');
        return;
      }
      
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        data: {
          state: event.data,
          time: currentTime
        }
      }));
    }

    function executeCommand(method, args = []) {
      if (isPlayerReady && player && player[method]) {
        console.log('Executing command:', method, args);
        player[method].apply(player, args);
      } else {
        console.log('Queueing command:', method, args);
        pendingCommands.push({ method, args });
      }
    }

    // Global fonksiyonlar - sadece programmatic kullanım için
    window.playVideo = () => executeCommand('playVideo');
    window.pauseVideo = () => executeCommand('pauseVideo');
    window.seekTo = (seconds) => executeCommand('seekTo', [seconds, true]);
    window.getPlayerState = () => player ? player.getPlayerState() : -1;
    window.getCurrentTime = () => player ? player.getCurrentTime() : 0;

    // YouTube API'yi yükle
    if (!window.YT) {
      var tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      var firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    } else {
      onYouTubeIframeAPIReady();
    }

    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'playerReady') {
        console.log('✅ YouTube Player Ready - Syncing video state');
        setPlayerReady(true);
        // Player hazır olduğunda mevcut durumu sync et
        setTimeout(() => syncVideoState(), 500);
      }
      
      if (message.type === 'stateChange') {
        const isPlaying = message.data.state === 1; // 1 = playing, 2 = paused
        const currentTime = message.data.time;
        
        console.log('🎮 Player state change:', { isPlaying, currentTime, isCreator });
        
        setLocalPlaying(isPlaying);
        setCurrentTime(currentTime);
        
        // Sadece oda sahibi değişiklikleri veritabanına kaydet
        if (isCreator) {
          console.log('👑 Creator updating database state');
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
    if (!webViewRef.current || !playerReady) {
      console.log('⏳ Cannot sync - player not ready');
      return;
    }

    console.log('🔄 Syncing video state:', videoState);

    // Önce zamanı sync et
    if (videoState.playback_time > 0) {
      sendPlayerCommand('seekTo', [videoState.playback_time]);
    }
    
    // Sonra play/pause durumunu sync et
    setTimeout(() => {
      if (videoState.is_playing) {
        sendPlayerCommand('playVideo');
      } else {
        sendPlayerCommand('pauseVideo');
      }
    }, 200);
  };

  // Video state değişikliklerini dinle (diğer kullanıcılar için)
  useEffect(() => {
    console.log('📺 Video state changed:', videoState, 'isCreator:', isCreator);
    
    setLocalPlaying(videoState.is_playing);
    setCurrentTime(videoState.playback_time);
    
    if (!isCreator && playerReady) {
      // Küçük bir gecikme ile sync et
      setTimeout(syncVideoState, 200);
    }
  }, [videoState, isCreator, playerReady]);

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
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={!isCreator}
            javaScriptEnabled
            injectedJavaScript={injectedJavaScript}
            onMessage={handleMessage}
            userAgent={isCreator ? undefined : "Mozilla/5.0 (compatible; SyncWatch-Viewer/1.0)"}
            onLoad={() => {
              console.log('WebView loaded, syncing video state...');
              setTimeout(syncVideoState, 1000);
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
          />
          
          {!isCreator && (
            <TouchableOpacity
              style={styles.viewerBlockOverlay}
              activeOpacity={1}
              onPress={() => {
                console.log('🚫 Viewer touch blocked by React Native overlay');
              }}
              onLongPress={() => {
                console.log('🚫 Viewer long press blocked');
              }}
              onPressIn={() => {
                console.log('🚫 Viewer press in blocked');
              }}
              onPressOut={() => {
                console.log('🚫 Viewer press out blocked');
              }}
            >
            </TouchableOpacity>
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
      // Creator için tam kontrol
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=1&controls=1&disablekb=0&iv_load_policy=3`;
    } else {
      // İzleyiciler için minimal kontrol - tamamen devre dışı
      return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=0&controls=0&disablekb=1&iv_load_policy=3&showinfo=0&cc_load_policy=0&autoplay=0&start=0&end=0&loop=0&mute=0`;
    }
  }
  
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    const controls = isCreator ? 'true' : 'false';
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

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('user_id, id, name, photo_url');
      
      if (error) {
        // Eğer profiles tablosu yoksa, kullanıcı bilgilerini auth'dan al
        if (error.code === '42P01') {
          console.log('Profiles table not found, using fallback');
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
        console.error('Error loading users:', error);
        return;
      }

      if (profiles && Array.isArray(profiles)) {
        const userMap: {[key: string]: {name: string, photoUrl: string | null}} = {};
        profiles.forEach((profile: any) => {
          userMap[profile.user_id || profile.id] = {
            name: profile.name || 'Kullanıcı',
            photoUrl: profile.photo_url
          };
        });
        setUsers(userMap);
      }
    } catch (error) {
      console.error('Error in loadUsers:', error);
      // Fallback: Sadece mevcut kullanıcı bilgisini kullan
      if (user) {
        setUsers({
          [user.id]: {
            name: user.user_metadata?.name || user.email || 'Kullanıcı',
            photoUrl: null
          }
        });
      }
    }
  };

  const fetchVideoState = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_video_state')
        .select('is_playing, playback_time')
        .eq('room_id', roomId)
        .single();

      if (error) {
        // Eğer tablo yoksa veya kayıt yoksa, varsayılan durum kullan
        if (error.code === '42P01' || error.code === 'PGRST116') {
          console.log('Video state table/record not found, using default state');
          setVideoState({ is_playing: false, playback_time: 0 });
          return;
        }
        console.error('Error fetching video state:', error);
        return;
      }

      if (data) {
        const videoData = data as any;
        setVideoState({
          is_playing: Boolean(videoData.is_playing),
          playback_time: Number(videoData.playback_time) || 0
        });
      }
    } catch (error) {
      console.error('Error in fetchVideoState:', error);
      setVideoState({ is_playing: false, playback_time: 0 });
    }
  };

  const updateVideoState = async (newState: VideoState) => {
    if (!isCreator) {
      console.log('❌ Only room creator can update video state');
      return;
    }
    
    console.log('🔄 Updating video state in database:', newState);
    
    try {
      const { data, error } = await supabase
        .from('watch_room_video_state')
        .upsert({
          room_id: roomId,
          is_playing: newState.is_playing,
          playback_time: newState.playback_time
        }, {
          onConflict: 'room_id'
        })
        .select();

      if (error) {
        // Eğer tablo yoksa log yaz ama hata verme
        if (error.code === '42P01') {
          console.log('⚠️ Video state table not found, video sync disabled');
          return;
        }
        console.error('❌ Error updating video state:', error);
        setError('Video durumu güncellenirken hata oluştu');
      } else {
        console.log('✅ Video state updated successfully:', data);
      }
    } catch (error) {
      console.error('❌ Error in updateVideoState:', error);
      // Hata durumunda da devam et
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        // Eğer tablo yoksa boş mesaj listesi kullan
        if (error.code === '42P01') {
          console.log('Messages table not found, using empty messages');
          setMessages([]);
          return;
        }
        console.error('Error fetching messages:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        const messagesWithUsernames = data.map((msg: any) => ({
          id: msg.id,
          user_id: msg.user_id,
          content: msg.content,
          created_at: msg.created_at,
          userName: users[msg.user_id]?.name || 'Kullanıcı'
        }));
        setMessages(messagesWithUsernames);
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      setMessages([]);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_members')
        .select('user_id')
        .eq('room_id', roomId);

      if (error) {
        // Eğer tablo yoksa boş dizi kullan
        if (error.code === '42P01') {
          console.log('Members table not found, using empty array');
          setMembers([]);
          return;
        }
        console.error('Error fetching members:', error);
        return;
      }

      if (data && Array.isArray(data)) {
        setMembers(data);
      }
    } catch (error) {
      console.error('Error in fetchMembers:', error);
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
    paddingTop: 16,
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
    marginVertical: 12,
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
    marginTop: Spacing.md,
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
});
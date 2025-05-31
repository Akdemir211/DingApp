import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { useAuth } from '@/context/AuthContext';
import { ArrowLeft, Send, Users, Play, Pause } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { WebView } from 'react-native-webview';

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

interface VideoState {
  currentTime: number;
  isPlaying: boolean;
  lastUpdated: string;
  updatedBy: string;
}

const VideoPlayer = ({ 
  videoUrl, 
  onTimeUpdate, 
  onPlayStateChange,
  initialTime = 0,
  initialIsPlaying = false,
  ref
}: { 
  videoUrl: string;
  onTimeUpdate: (time: number) => void;
  onPlayStateChange: (isPlaying: boolean) => void;
  initialTime?: number;
  initialIsPlaying?: boolean;
  ref?: any;
}) => {
  const embedUrl = getEmbedUrl(videoUrl);
  const aspectRatio = Platform.OS === 'web' ? 16/9 : undefined;
  const webViewRef = useRef<WebView>(null);

  const injectedJavaScript = `
    let player;
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        events: {
          'onStateChange': onPlayerStateChange,
          'onReady': onPlayerReady
        }
      });
    }

    function onPlayerReady(event) {
      player.seekTo(${initialTime}, true);
      ${initialIsPlaying ? 'player.playVideo();' : 'player.pauseVideo();'}
    }

    function onPlayerStateChange(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        data: {
          state: event.data,
          currentTime: player.getCurrentTime()
        }
      }));
    }

    setInterval(() => {
      if (player && player.getCurrentTime) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'timeUpdate',
          data: player.getCurrentTime()
        }));
      }
    }, 1000);

    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'timeUpdate') {
        onTimeUpdate(message.data);
      } else if (message.type === 'stateChange') {
        const isPlaying = message.data.state === 1; // 1 = playing
        onPlayStateChange(isPlaying);
      }
    } catch (error) {
      console.error('Video player message error:', error);
    }
  };

  if (Platform.OS === 'web') {
    return (
      <iframe
        id="player"
        src={embedUrl}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          aspectRatio,
        }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    );
  }

  return (
    <WebView
      ref={webViewRef}
      source={{ 
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <script src="https://www.youtube.com/iframe_api"></script>
              <style>
                body { margin: 0; }
                #player { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <div id="player"></div>
            </body>
          </html>
        `
      }}
      style={{ flex: 1, backgroundColor: 'transparent' }}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleMessage}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
    />
  );
};

const getEmbedUrl = (url: string) => {
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    videoId = url.split('watch?v=')[1]?.split('&')[0] || '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  
  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}?playsinline=1&modestbranding=1&enablejsapi=1&rel=0&fs=1`;
  }
  
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${vimeoId}?playsinline=1`;
  }
  
  return url;
};

export const WatchRoom: React.FC<WatchRoomProps> = ({ roomId, room, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoState, setVideoState] = useState<VideoState>({
    currentTime: 0,
    isPlaying: false,
    lastUpdated: new Date().toISOString(),
    updatedBy: user?.id || ''
  });
  const [isLandscape, setIsLandscape] = useState(
    SCREEN_WIDTH > SCREEN_HEIGHT
  );
  const scrollViewRef = useRef<ScrollView>(null);
  const videoPlayerRef = useRef(null);
  const lastUpdateRef = useRef<string>(new Date().toISOString());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchMembers();
    initializeVideoState();
    
    const messagesSubscription = supabase
      .channel('watch_room_messages')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_room_messages',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchMessages();
      })
      .subscribe();

    const membersSubscription = supabase
      .channel('watch_room_members')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_room_members',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchMembers();
      })
      .subscribe();

    const videoStateSubscription = supabase
      .channel('video_states')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_room_video_states',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (payload.new && payload.new.updated_by !== user?.id) {
          handleVideoStateUpdate(payload.new as VideoState);
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      videoStateSubscription.unsubscribe();
    };
  }, [roomId]);

  const initializeVideoState = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_video_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setVideoState(data);
      } else {
        const { error: insertError } = await supabase
          .from('watch_room_video_states')
          .insert({
            room_id: roomId,
            current_time: 0,
            is_playing: false,
            updated_by: user?.id
          });

        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error('Video state initialization error:', error);
    }
  };

  const handleVideoStateUpdate = (newState: VideoState) => {
    if (new Date(newState.lastUpdated) > new Date(lastUpdateRef.current)) {
      setVideoState(newState);
      lastUpdateRef.current = newState.lastUpdated;
    }
  };

  const updateVideoState = async (time: number, isPlaying: boolean) => {
    if (!user) return;

    try {
      const newState = {
        current_time: time,
        is_playing: isPlaying,
        last_updated: new Date().toISOString(),
        updated_by: user.id
      };

      const { error } = await supabase
        .from('watch_room_video_states')
        .upsert({
          room_id: roomId,
          ...newState
        });

      if (error) throw error;

      setVideoState({
        currentTime: time,
        isPlaying,
        lastUpdated: newState.last_updated,
        updatedBy: user.id
      });
      lastUpdateRef.current = newState.last_updated;
    } catch (error) {
      console.error('Video state update error:', error);
    }
  };

  const getContentStyles = () => {
    if (Platform.OS === 'web') {
      return styles.webContent;
    }
    return isLandscape ? styles.landscapeContent : styles.content;
  };

  const getVideoSectionStyles = () => {
    if (Platform.OS === 'web') {
      return styles.webVideoSection;
    }
    return isLandscape ? styles.landscapeVideoSection : styles.videoSection;
  };

  const getChatSectionStyles = () => {
    if (Platform.OS === 'web') {
      return styles.webChatSection;
    }
    return isLandscape ? styles.landscapeChatSection : styles.chatSection;
  };

  if (!room) {
    return (
      <View style={styles.container}>
        <FloatingBubbleBackground />
        <View style={styles.content}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </View>
    );
  }

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
            ref={videoPlayerRef}
            videoUrl={room.video_url}
            onTimeUpdate={(time) => updateVideoState(time, videoState.isPlaying)}
            onPlayStateChange={(isPlaying) => updateVideoState(videoState.currentTime, isPlaying)}
            initialTime={videoState.currentTime}
            initialIsPlaying={videoState.isPlaying}
          />
        </View>

        <View style={getChatSectionStyles()}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
          >
            {messages.map((message, index) => {
              const isOwnMessage = message.user_id === user?.id;
              const showAvatar = !isOwnMessage && (!messages[index - 1] || messages[index - 1].user_id !== message.user_id);
              
              return (
                <View
                  key={message.id}
                  style={[
                    styles.messageWrapper,
                    isOwnMessage ? styles.ownMessageWrapper : null
                  ]}
                >
                  <View style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage
                  ]}>
                    {!isOwnMessage && showAvatar && (
                      <Text style={styles.messageSender}>{message.userName}</Text>
                    )}
                    <Text style={styles.messageText}>{message.content}</Text>
                    <Text style={styles.messageTime}>
                      {formatTime(message.created_at)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            style={styles.inputContainer}
          >
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Mesaj"
              placeholderTextColor={Colors.text.secondary}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!newMessage.trim() || loading) && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!newMessage.trim() || loading}
            >
              <Send size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.medium,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary,
  },
  backButton: {
    marginRight: Spacing.medium,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontSize: FontSizes.large,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.small,
  },
  statsText: {
    marginLeft: Spacing.small,
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
  },
  videoSection: {
    height: '40%',
    backgroundColor: Colors.background.secondary,
  },
  webVideoSection: {
    flex: 2,
    backgroundColor: Colors.background.secondary,
    margin: Spacing.medium,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  landscapeVideoSection: {
    flex: 2,
    backgroundColor: Colors.background.secondary,
    margin: Spacing.medium,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
  },
  chatSection: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  webChatSection: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    margin: Spacing.medium,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  landscapeChatSection: {
    flex: 1,
    backgroundColor: Colors.background.primary,
    margin: Spacing.medium,
    borderRadius: BorderRadius.medium,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.medium,
  },
  messageWrapper: {
    marginBottom: Spacing.small,
    flexDirection: 'row',
  },
  ownMessageWrapper: {
    justifyContent: 'flex-end',
  },
  messageContainer: {
    maxWidth: '80%',
    padding: Spacing.medium,
    borderRadius: BorderRadius.medium,
  },
  ownMessage: {
    backgroundColor: Colors.primary,
  },
  otherMessage: {
    backgroundColor: Colors.background.secondary,
  },
  messageSender: {
    fontSize: FontSizes.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.small,
  },
  messageText: {
    fontSize: FontSizes.medium,
    color: Colors.text.primary,
  },
  messageTime: {
    fontSize: FontSizes.tiny,
    color: Colors.text.secondary,
    marginTop: Spacing.small,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: Spacing.medium,
    borderTopWidth: 1,
    borderTopColor: Colors.border.primary,
    backgroundColor: Colors.background.primary,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.medium,
    paddingHorizontal: Spacing.medium,
    paddingVertical: Spacing.small,
    marginRight: Spacing.medium,
    color: Colors.text.primary,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    fontSize: FontSizes.large,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Spacing.large,
  },
});
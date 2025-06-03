import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useTabBar } from '@/context/TabBarContext';
import { ArrowLeft, Send, Users, Play, Pause, Video, MessageSquare, Shield, Eye } from 'lucide-react-native';
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
  theme
}: { 
  videoUrl: string;
  isCreator: boolean;
  videoState: VideoState;
  onStateChange: (state: VideoState) => void;
  theme: any;
}) => {
  const embedUrl = getEmbedUrl(videoUrl);
  const webViewRef = useRef<WebView>(null);
  const [localPlaying, setLocalPlaying] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const injectedJavaScript = `
    let player;
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        events: {
          'onStateChange': onPlayerStateChange
        }
      });
    }

    function onPlayerStateChange(event) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'stateChange',
        data: {
          state: event.data,
          time: player.getCurrentTime()
        }
      }));
    }

    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    true;
  `;

  const handleMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'stateChange' && isCreator) {
        const isPlaying = message.data.state === 1;
        setLocalPlaying(isPlaying);
        onStateChange({
          is_playing: isPlaying,
          playback_time: message.data.time
        });
      }
    } catch (error) {
      console.error('Error handling player message:', error);
    }
  };

  const handlePlayPause = () => {
    scale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    
    if (isCreator && webViewRef.current) {
      const command = localPlaying ? 'pauseVideo' : 'playVideo';
      webViewRef.current.injectJavaScript(`
        if (player && player.${command}) {
          player.${command}();
        }
        true;
      `);
    }
  };

  useEffect(() => {
    if (webViewRef.current && !isCreator) {
      const command = videoState.is_playing ? 'playVideo' : 'pauseVideo';
      webViewRef.current.injectJavaScript(`
        if (player && player.${command}) {
          player.${command}();
          player.seekTo(${videoState.playback_time}, true);
        }
        true;
      `);
      setLocalPlaying(videoState.is_playing);
    }
  }, [videoState]);

  return (
    <Animated.View style={[styles.videoContainer, animatedStyle]}>
      <GradientCard colors={theme.colors.gradients.warmDark} style={styles.videoCard}>
        <View style={styles.videoHeader}>
          <View style={[styles.videoIcon, { backgroundColor: theme.colors.background.elevated }]}>
            <Video size={20} color={theme.colors.primary[400]} />
          </View>
          <View style={styles.videoInfo}>
            <Text style={[styles.videoTitle, { color: theme.colors.text.primary }]} numberOfLines={1}>
              Video İzleme
            </Text>
            <View style={styles.videoStatus}>
              <Eye size={14} color={localPlaying ? theme.colors.success : theme.colors.text.secondary} />
              <Text style={[styles.statusText, { color: localPlaying ? theme.colors.success : theme.colors.text.secondary }]}>
                {localPlaying ? 'Oynatılıyor' : 'Duraklatıldı'}
              </Text>
            </View>
          </View>
          {isCreator && (
            <TouchableOpacity 
              style={styles.playButton}
              onPress={handlePlayPause}
            >
              <LinearGradient
                colors={theme.colors.gradients.primary}
                style={styles.playButtonGradient}
              >
                {localPlaying ? (
                  <Pause size={16} color={theme.colors.text.primary} />
                ) : (
                  <Play size={16} color={theme.colors.text.primary} />
                )}
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.videoWrapper}>
    <WebView
      ref={webViewRef}
      source={{ uri: embedUrl }}
            style={styles.webView}
      allowsFullscreenVideo
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      injectedJavaScript={injectedJavaScript}
      onMessage={handleMessage}
    />
        </View>
      </GradientCard>
    </Animated.View>
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
    return `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&modestbranding=1&rel=0&fs=1`;
  }
  
  if (url.includes('vimeo.com')) {
    const vimeoId = url.split('vimeo.com/')[1]?.split('?')[0];
    return `https://player.vimeo.com/video/${vimeoId}?playsinline=1`;
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
  const scrollViewRef = useRef<ScrollView>(null);
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
    console.log('WatchRoom: Hiding tab bar');
    hideTabBar();
    
    fetchMessages();
    fetchMembers();
    fetchVideoState();
    loadUsers();
    
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

    const videoSubscription = supabase
      .channel('watch_room_video_state')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'watch_room_video_state',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchVideoState();
      })
      .subscribe();

    return () => {
      console.log('WatchRoom: Showing tab bar');
      messagesSubscription.unsubscribe();
      videoSubscription.unsubscribe();
      showTabBar();
    };
  }, [hideTabBar, showTabBar, roomId]);

  const loadUsers = async () => {
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, name');
      
      if (userError) throw userError;

      const { data: photoData, error: photoError } = await supabase
        .from('profile_photos')
        .select('user_id, photo_url');

      if (photoError) throw photoError;

      const userMap = (userData || []).reduce((acc: any, user) => {
        const photo = photoData?.find(p => p.user_id === user.id);
        acc[user.id] = { 
          name: user.name || 'Anonim Kullanıcı',
          photoUrl: photo?.photo_url || null
        };
        return acc;
      }, {});

      setUsers(userMap);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const fetchVideoState = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_video_state')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setVideoState({
          is_playing: data.is_playing,
          playback_time: data.playback_time
        });
      }
    } catch (error) {
      console.error('Error fetching video state:', error);
    }
  };

  const updateVideoState = async (newState: VideoState) => {
    try {
      const { error } = await supabase
        .from('watch_room_video_state')
        .upsert({
          room_id: roomId,
          is_playing: newState.is_playing,
          playback_time: newState.playback_time,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating video state:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const messagesWithUserNames = (data || []).map(msg => ({
        ...msg,
        userName: users[msg.user_id]?.name || 'Anonim'
        }));

        setMessages(messagesWithUserNames);
        setTimeout(() => scrollToBottom(), 100);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Mesajlar yüklenirken hata oluştu');
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('watch_room_members')
        .select('*')
        .eq('room_id', roomId);

      if (error) throw error;
      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const scrollToBottom = () => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('watch_room_messages')
        .insert({
          room_id: roomId,
          user_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Mesaj gönderilirken hata oluştu');
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
      <Animated.View
        entering={SlideInRight.delay(50).duration(400)}
        style={[
          styles.messageWrapper,
          isOwnMessage ? styles.ownMessageWrapper : null
        ]}
      >
        {!isOwnMessage && showAvatar && (
          <ProfilePhoto 
            uri={userInfo?.photoUrl}
            size={28}
            style={styles.avatar}
          />
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
            <ModernCard variant="elevated" style={[styles.messageBubble, styles.otherMessage]}>
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
            </ModernCard>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
      <FloatingBubbleBackground />
        <SafeAreaView style={styles.safeArea}>
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
          >
          <VideoPlayer
            videoUrl={room.video_url}
            isCreator={isCreator}
            videoState={videoState}
            onStateChange={updateVideoState}
              theme={theme}
            />

            <Animated.View 
              style={styles.chatSection}
              entering={FadeIn.delay(400).duration(600)}
            >
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
            contentContainerStyle={styles.messagesContent}
                    onContentSizeChange={() => scrollToBottom()}
                    showsVerticalScrollIndicator={false}
          >
            {messages.map((message, index) => {
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
                    })}
                    
                    {messages.length === 0 && (
                      <Animated.View 
                        style={styles.emptyContainer}
                        entering={FadeIn.delay(200).duration(600)}
                      >
                        <MessageSquare size={32} color={theme.colors.text.secondary} />
                        <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>
                          Henüz mesaj yok
                        </Text>
                        <Text style={[styles.emptySubtext, { color: theme.colors.text.secondary + '80' }]}>
                          İlk mesajı gönderin!
                    </Text>
                      </Animated.View>
                    )}
                  </ScrollView>
                </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
                  <View style={[styles.inputContainer, { backgroundColor: theme.colors.background.elevated }]}>
            <TextInput
                      style={[styles.input, { 
                        backgroundColor: theme.colors.background.elevated,
                        color: theme.colors.text.primary,
                        borderColor: theme.colors.border.primary
                      }]}
              value={newMessage}
              onChangeText={setNewMessage}
                      placeholder="Mesajınızı yazın..."
                      placeholderTextColor={theme.colors.text.secondary}
              multiline
                      maxLength={200}
            />
            <TouchableOpacity
                      style={[
                        styles.sendButton,
                        (!newMessage.trim() || loading) && styles.sendButtonDisabled
                      ]}
              onPress={handleSend}
              disabled={!newMessage.trim() || loading}
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
            </Animated.View>
          </ScrollView>
        </SafeAreaView>
      </GradientBackground>
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
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    minHeight: 60,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.lg,
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: 3,
  },
  memberText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    gap: 5,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  liveText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
  },
  content: {
    flex: 1,
  },
  videoContainer: {
    margin: Spacing.lg,
    marginBottom: 0,
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
    marginLeft: 32,
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
  },
  input: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.sm,
    fontSize: FontSizes.sm,
    fontFamily: 'Inter-Regular',
    maxHeight: 80,
    minHeight: 36,
    textAlignVertical: 'top',
    borderWidth: 1,
  },
  sendButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    ...Shadows.small,
  },
  sendButtonGradient: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
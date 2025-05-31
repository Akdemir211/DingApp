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
  is_playing: boolean;
  playback_time: number;
}

interface Message {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  userName?: string;
}

interface User {
  id: string;
  name: string;
  avatar_url: string | null;
}

const VideoPlayer = ({ 
  videoUrl, 
  isCreator,
  videoState,
  onPlayPause,
  webViewRef
}: { 
  videoUrl: string;
  isCreator: boolean;
  videoState: VideoState;
  onPlayPause: () => void;
  webViewRef: React.RefObject<WebView>;
}) => {
  const embedUrl = getEmbedUrl(videoUrl);
  const aspectRatio = Platform.OS === 'web' ? 16/9 : undefined;

  // YouTube Player API'sini enjekte et
  const injectedJavaScript = `
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    var player;
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
        state: event.data
      }));
    }

    true;
  `;

  if (Platform.OS === 'web') {
    return (
      <View style={styles.videoContainer}>
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
        {isCreator && (
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={onPlayPause}
          >
            {videoState.is_playing ? (
              <Pause size={24} color={Colors.text.primary} />
            ) : (
              <Play size={24} color={Colors.text.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.videoContainer}>
      <WebView
        ref={webViewRef}
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled
        injectedJavaScript={injectedJavaScript}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'stateChange') {
              // YouTube player states: -1 (unstarted), 0 (ended), 1 (playing), 2 (paused), 3 (buffering), 5 (video cued)
              console.log('Player state changed:', data.state);
            }
          } catch (error) {
            console.error('Error parsing player message:', error);
          }
        }}
      />
      {isCreator && (
        <TouchableOpacity 
          style={styles.playPauseButton}
          onPress={onPlayPause}
        >
          {videoState.is_playing ? (
            <Pause size={24} color={Colors.text.primary} />
          ) : (
            <Play size={24} color={Colors.text.primary} />
          )}
        </TouchableOpacity>
      )}
    </View>
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [videoState, setVideoState] = useState<VideoState>({
    is_playing: false,
    playback_time: 0
  });
  const scrollViewRef = useRef<ScrollView>(null);
  const webViewRef = useRef<WebView>(null);
  const [isLandscape, setIsLandscape] = useState(
    SCREEN_WIDTH > SCREEN_HEIGHT
  );

  const isCreator = user?.id === room.created_by;

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
    fetchVideoState();
    
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
        table: 'video_states',
        filter: `room_id=eq.${roomId}`
      }, (payload) => {
        if (payload.new) {
          setVideoState(payload.new as VideoState);
          
          // Video durumunu WebView'da güncelle
          const js = payload.new.is_playing
            ? 'player.playVideo()'
            : 'player.pauseVideo()';
          
          webViewRef.current?.injectJavaScript(js);
        }
      })
      .subscribe();

    return () => {
      messagesSubscription.unsubscribe();
      membersSubscription.unsubscribe();
      videoStateSubscription.unsubscribe();
    };
  }, [roomId]);

  const fetchVideoState = async () => {
    try {
      const { data, error } = await supabase
        .from('video_states')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error) throw error;
      if (data) {
        setVideoState(data);
      }
    } catch (error) {
      console.error('Error fetching video state:', error);
    }
  };

  const handlePlayPause = async () => {
    if (!isCreator) return;

    try {
      const newState = !videoState.is_playing;
      
      const { error } = await supabase
        .from('video_states')
        .update({ is_playing: newState })
        .eq('room_id', roomId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating video state:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data: messagesData, error: messagesError } = await supabase
        .from('watch_room_messages')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      if (messagesData) {
        const userIds = [...new Set(messagesData.map(msg => msg.user_id))];

        const { data: usersData, error: usersError } = await supabase
          .from('users')
          .select('id, name')
          .in('id', userIds);

        if (usersError) throw usersError;

        const userMap = new Map(usersData?.map(user => [user.id, user.name]) || []);

        const messagesWithUserNames = messagesData.map(message => ({
          ...message,
          userName: userMap.get(message.user_id) || 'Anonim Kullanıcı'
        }));

        setMessages(messagesWithUserNames);
        setTimeout(() => scrollToBottom(), 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data: memberData, error: memberError } = await supabase
        .from('watch_room_members')
        .select('user_id')
        .eq('room_id', roomId);

      if (memberError) throw memberError;

      if (memberData) {
        const userIds = memberData.map(member => member.user_id);

        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id, name, avatar_url')
          .in('id', userIds);

        if (userError) throw userError;
        setMembers(userData || []);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || loading) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('watch_room_messages')
        .insert({
          room_id: roomId,
          user_id: user?.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
            isCreator={isCreator}
            videoState={videoState}
            onPlayPause={handlePlayPause}
            webViewRef={webViewRef}
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
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : Spacing.lg,
    backgroundColor: Colors.background.darker,
    borderBottomWidth: 1,
    borderBottomColor: Colors.darkGray[800],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.darkGray[700],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xl,
    color: Colors.text.primary,
    marginBottom: 4,
  },
  roomStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  content: {
    flex: 1,
    flexDirection: 'column',
  },
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
  },
  webContent: {
    flex: 1,
    flexDirection: 'row',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  playPauseButton: {
    position: 'absolute',
    bottom: Spacing.md,
    right: Spacing.md,
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoSection: {
    height: SCREEN_WIDTH * (9/16),
    backgroundColor: Colors.background.darker,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    margin: Spacing.md,
  },
  landscapeVideoSection: {
    flex: 2,
    margin: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  webVideoSection: {
    flex: 2,
    margin: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    aspectRatio: 16/9,
  },
  chatSection: {
    flex: 1,
    margin: Spacing.md,
    marginTop: 0,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  landscapeChatSection: {
    flex: 1,
    margin: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  webChatSection: {
    flex: 1,
    margin: Spacing.md,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.md,
  },
  messageWrapper: {
    marginVertical: Spacing.xs,
    maxWidth: '80%',
  },
  ownMessageWrapper: {
    alignSelf: 'flex-end',
  },
  messageContainer: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    maxWidth: '100%',
  },
  ownMessage: {
    backgroundColor: Colors.primary[500],
    borderTopRightRadius: BorderRadius.xs,
  },
  otherMessage: {
    backgroundColor: Colors.darkGray[700],
    borderTopLeftRadius: BorderRadius.xs,
  },
  messageSender: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
    color: Colors.primary[400],
    marginBottom: 2,
  },
  messageText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  messageTime: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.xs,
    color: Colors.text.secondary,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    backgroundColor: Colors.background.darker,
    borderTopWidth: 1,
    borderTopColor: Colors.darkGray[800],
  },
  input: {
    flex: 1,
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.round,
    paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? Spacing.sm : Spacing.xs,
    color: Colors.text.primary,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.lg,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
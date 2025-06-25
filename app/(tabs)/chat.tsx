import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MessageSquare, Lock, Users, Search, Plus, Trash2, Crown, Hash, Shield } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useChat } from '@/hooks/useChat';
import { CreateRoomModal } from '@/components/Chat/CreateRoomModal';
import { JoinRoomModal } from '@/components/Chat/JoinRoomModal';
import { ChatRoom } from '@/components/Chat/ChatRoom';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { eventEmitter, Events } from '@/lib/eventEmitter';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  SlideInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export default function ChatScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { rooms, loading, error, deleteRoom } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);
  const [userData, setUserData] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      fetchUserData();
    }

    // Kullanıcı verisi güncellendiğinde dinle
    const userDataUpdatedListener = () => {
      if (user) {
        fetchUserData();
      }
    };
    
    eventEmitter.on(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    
    // Cleanup
    return () => {
      eventEmitter.off(Events.USER_DATA_UPDATED, userDataUpdatedListener);
    };
  }, [user]);

  const fetchUserData = async () => {
    try {
      if (!user || !user.id) return;

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserData(data);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  const publicRooms = rooms.filter(room => !room.is_private);
  const privateRooms = rooms.filter(room => room.is_private);
  
  const filteredPublicRooms = publicRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPrivateRooms = privateRooms.filter(room => 
    room.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleJoinRoom = (roomId: string, isPrivate: boolean, name: string) => {
    // Eğitim Koçum odası kontrolü
    if (name === "Eğitim Koçum") {
      if (!userData?.is_pro) {
        router.push('/pro-upgrade');
        return;
      }
      // Pro kullanıcılar için direkt erişim
      setSelectedRoomId(roomId);
      return;
    }

    if (isPrivate) {
      setSelectedRoomForJoin({ id: roomId, name });
      setShowJoinModal(true);
    } else {
      setSelectedRoomId(roomId);
    }
  };
  
  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      await deleteRoom(roomId);
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  const RoomCard = ({ room, delay = 0 }: { room: any, delay?: number }) => {
    const isProRoom = room.name === "Eğitim Koçum";
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: scale.value }],
    }));

    const handlePress = () => {
      scale.value = withSpring(0.98, {}, () => {
        scale.value = withSpring(1);
      });
      handleJoinRoom(room.id, room.is_private, room.name);
    };

    return (
      <Animated.View 
        entering={SlideInDown.delay(delay).duration(600).springify()}
        style={animatedStyle}
      >
        <ModernCard 
          onPress={handlePress}
          variant={isProRoom ? "glow" : "elevated"}
          style={{
            ...styles.roomCard,
            backgroundColor: isProRoom ? theme.colors.background.elevated : theme.colors.darkGray[800]
          }}
        >
          {isProRoom && (
            <LinearGradient
              colors={[theme.colors.primary[500] + '20', theme.colors.primary[600] + '10']}
              style={styles.proGradient}
            />
          )}
          
          <View style={styles.roomHeader}>
            <View style={[styles.roomIconContainer, { backgroundColor: theme.colors.background.elevated }]}>
              {room.is_private ? (
                isProRoom ? (
                  <Crown size={20} color={theme.colors.medal.gold} />
                ) : (
                  <Lock size={20} color={theme.colors.primary[400]} />
                )
              ) : (
                <Hash size={20} color={theme.colors.success} />
              )}
            </View>
            
            <View style={styles.roomInfo}>
              <View style={styles.roomNameContainer}>
                <Text style={[styles.roomName, { color: theme.colors.text.primary }]}>{room.name}</Text>
                {isProRoom && (
                  <View style={[styles.proBadge, { backgroundColor: theme.colors.medal.gold }]}>
                    <Text style={[styles.proBadgeText, { color: theme.colors.darkGray[900] }]}>PRO</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.roomDescription, { color: theme.colors.text.secondary }]} numberOfLines={2}>
                {room.description}
              </Text>
            </View>
          </View>

          <View style={styles.roomFooter}>
            <View style={styles.roomStats}>
              <View style={styles.statItem}>
                <Users size={14} color={theme.colors.text.secondary} />
                <Text style={[styles.statsText, { color: theme.colors.text.secondary }]}>Aktif Oda</Text>
              </View>
              {room.is_private && (
                <View style={styles.statItem}>
                  <Shield size={14} color={theme.colors.warning} />
                  <Text style={[styles.statsText, { color: theme.colors.text.secondary }]}>Şifreli</Text>
                </View>
              )}
            </View>
            
            {user?.id === room.created_by && (
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteRoom(room.id);
                }}
                style={[styles.deleteButton, { backgroundColor: theme.colors.error + '20' }]}
              >
                <Trash2 size={16} color={theme.colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </ModernCard>
      </Animated.View>
    );
  };

  const RoomSection = ({ title, rooms, isPrivate }: { title: string, rooms: any[], isPrivate: boolean }) => (
    <View style={styles.sectionContainer}>
      <Animated.View 
        style={styles.sectionTitleContainer}
        entering={FadeIn.delay(200).duration(800)}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{title}</Text>
        <View style={[styles.sectionBadge, { backgroundColor: theme.colors.background.elevated }]}>
          {isPrivate ? <Lock size={16} color={theme.colors.primary[400]} /> : <Hash size={16} color={theme.colors.success} />}
          <Text style={[styles.sectionBadgeText, { color: theme.colors.text.secondary }]}>{rooms.length}</Text>
        </View>
      </Animated.View>
      
      {rooms.map((room, index) => (
        <RoomCard 
          key={room.id}
          room={room}
          delay={300 + (index * 100)}
        />
      ))}
      
      {rooms.length === 0 && (
        <Animated.View 
          entering={FadeIn.delay(400).duration(600)}
          style={styles.emptyContainer}
        >
          <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>Bu kategoride henüz oda yok</Text>
        </Animated.View>
      )}
    </View>
  );

  if (selectedRoomId) {
    return (
      <ChatRoom
        roomId={selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
      />
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(600)}
          >
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Sohbet Odaları</Text>
              <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
                <LinearGradient
                  colors={theme.colors.gradients.primary}
                  style={styles.createButtonGradient}
                >
                  <Plus size={24} color={theme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
          
          <Animated.View 
            style={[styles.searchContainer, { 
              backgroundColor: theme.colors.background.elevated,
              borderColor: theme.colors.border.primary
            }]}
            entering={SlideInRight.delay(200).duration(600)}
          >
            <Search size={20} color={theme.colors.text.secondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.text.primary }]}
              placeholder="Sohbet odalarında ara..."
              placeholderTextColor={theme.colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </Animated.View>
          
          {loading ? (
            <Animated.View 
              style={styles.centerContainer}
              entering={FadeIn.duration(400)}
            >
              <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Yükleniyor...</Text>
            </Animated.View>
          ) : error ? (
            <Animated.View 
              style={styles.centerContainer}
              entering={FadeIn.duration(400)}
            >
              <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
            </Animated.View>
          ) : (
            <FlatList
              data={[]}
              renderItem={null}
              ListHeaderComponent={
                <>
                  <RoomSection 
                    title="Şifreli Odalar" 
                    rooms={filteredPrivateRooms}
                    isPrivate={true}
                  />
                  <RoomSection 
                    title="Genel Odalar" 
                    rooms={filteredPublicRooms}
                    isPrivate={false}
                  />
                </>
              }
              ListEmptyComponent={
                !filteredPublicRooms.length && !filteredPrivateRooms.length ? (
                  <Animated.View 
                    style={styles.centerContainer}
                    entering={FadeIn.delay(500).duration(800)}
                  >
                    <MessageSquare size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
                    <Text style={[styles.emptyText, { color: theme.colors.text.secondary }]}>Henüz hiç sohbet odası yok</Text>
                    <Button
                      title="Oda Oluştur"
                      onPress={handleCreateRoom}
                      variant="primary"
                      size="medium"
                      style={styles.createButton}
                    />
                  </Animated.View>
                ) : null
              }
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </SafeContainer>

        <CreateRoomModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => setShowCreateModal(false)}
        />

        {selectedRoomForJoin && (
          <JoinRoomModal
            visible={showJoinModal}
            onClose={() => {
              setShowJoinModal(false);
              setSelectedRoomForJoin(null);
            }}
            onSuccess={() => {
              setShowJoinModal(false);
              setSelectedRoomForJoin(null);
              setSelectedRoomId(selectedRoomForJoin.id);
            }}
            roomId={selectedRoomForJoin.id}
            roomName={selectedRoomForJoin.name}
          />
        )}
      </GradientBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 30,
    paddingBottom: Spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Inter-Bold',
    fontSize: FontSizes.xxl,
  },
  createRoomButton: {
    borderRadius: BorderRadius.round,
    ...Shadows.medium,
  },
  createButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
  },
  sectionContainer: {
    marginBottom: Spacing.xl,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
  },
  sectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  sectionBadgeText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  roomCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    padding: Spacing.lg,
    position: 'relative',
    overflow: 'hidden',
  },
  proGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  roomHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
  },
  roomIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  roomInfo: {
    flex: 1,
  },
  roomNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    marginRight: Spacing.sm,
  },
  proBadge: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  proBadgeText: {
    fontFamily: 'Inter-Bold',
    fontSize: 10,
  },
  roomDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statsText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  deleteButton: {
    padding: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
  },
  errorText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
  createButton: {
    marginTop: Spacing.md,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
});
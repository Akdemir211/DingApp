import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { router } from 'expo-router';
import { Video, Users, ArrowLeft, Plus, Lock, Trash2, Play, Eye, Clock } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { supabase } from '@/lib/supabase';
import { CreateWatchRoomModal } from '@/components/Watch/CreateRoomModal';
import { JoinWatchRoomModal } from '@/components/Watch/JoinRoomModal';
import { WatchRoom } from '@/components/Watch/WatchRoom';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  SlideInRight,
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const RoomCard = ({ room, onPress, onDelete, delay = 0 }: { 
  room: any, 
  onPress: () => void, 
  onDelete?: () => void,
  delay?: number 
}) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isCreator = room.created_by === user?.id;
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.98, {}, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <Animated.View 
      entering={SlideInDown.delay(delay).duration(600).springify()}
      style={animatedStyle}
    >
      <ModernCard 
        onPress={handlePress}
        variant="elevated"
        style={{
          ...styles.roomCard,
          backgroundColor: theme.colors.darkGray[800]
        }}
      >
        <View style={styles.roomHeader}>
          <GradientCard 
            colors={theme.colors.gradients.purple} 
            style={styles.roomIconContainer}
          >
            <Video size={20} color={theme.colors.text.primary} />
          </GradientCard>
          
          <View style={styles.roomInfo}>
            <View style={styles.roomNameContainer}>
              <Text style={[styles.roomName, { color: theme.colors.text.primary }]}>{room.name}</Text>
              {room.is_private && (
                <View style={[styles.privateBadge, { backgroundColor: theme.colors.warning + '20' }]}>
                  <Lock size={12} color={theme.colors.warning} />
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
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {room.members?.length || 0} üye
              </Text>
            </View>
            <View style={styles.statItem}>
              <Eye size={14} color={theme.colors.success} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>Aktif</Text>
            </View>
          </View>

          {isCreator && onDelete && (
            <TouchableOpacity 
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
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

const RoomSection = ({ title, rooms, isPrivate, onJoinRoom, onDeleteRoom }: { 
  title: string, 
  rooms: any[], 
  isPrivate: boolean,
  onJoinRoom: (roomId: string, isPrivate: boolean, name: string) => void,
  onDeleteRoom: (roomId: string) => void
}) => {
  const { theme } = useTheme();
  
  return (
    <View style={styles.sectionContainer}>
      <Animated.View 
        style={styles.sectionTitleContainer}
        entering={FadeIn.delay(200).duration(800)}
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>{title}</Text>
        <View style={[styles.sectionBadge, { backgroundColor: theme.colors.background.elevated }]}>
          {isPrivate ? <Lock size={16} color={theme.colors.primary[400]} /> : <Play size={16} color={theme.colors.success} />}
          <Text style={[styles.sectionBadgeText, { color: theme.colors.text.secondary }]}>{rooms.length}</Text>
        </View>
      </Animated.View>
      
      {rooms.map((room, index) => (
        <RoomCard 
          key={room.id}
          room={room}
          onPress={() => onJoinRoom(room.id, room.is_private, room.name)}
          onDelete={() => onDeleteRoom(room.id)}
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
};

export default function WatchScreen() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);

  useEffect(() => {
    fetchRooms();
    
    // Unique channel name to prevent multiple subscription errors
    const channelName = `watch_rooms_${Math.random().toString(36).substr(2, 9)}`;
    
    const subscription = supabase
      .channel(channelName)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'watch_rooms' 
      }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      console.log('🔄 Fetching watch rooms...');
      
      const { data, error } = await supabase
        .from('watch_rooms')
        .select(`
          *,
          members:watch_room_members(count)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching rooms:', error);
        if (error.code === '42P01') {
          throw new Error('Watch rooms tablosu bulunamadı. Veritabanı kurulumu gerekli.');
        }
        throw error;
      }
      
      console.log('✅ Fetched rooms:', data?.length || 0);
      setRooms(data || []);
    } catch (err: any) {
      console.error('💥 fetchRooms failed:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setShowCreateModal(true);
  };

  const handleJoinRoom = (roomId: string, isPrivate: boolean, name: string) => {
    const room = rooms.find(r => r.id === roomId);
    if (isPrivate) {
      setSelectedRoomForJoin({ id: roomId, name });
      setShowJoinModal(true);
    } else {
      setSelectedRoomId(roomId);
      setSelectedRoom(room);
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const { error } = await supabase
        .from('watch_rooms')
        .delete()
        .eq('id', roomId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  if (selectedRoomId && selectedRoom) {
    return (
      <WatchRoom
        roomId={selectedRoomId}
        room={selectedRoom}
        onClose={() => {
          setSelectedRoomId(null);
          setSelectedRoom(null);
        }}
      />
    );
  }

  const privateRooms = rooms.filter(room => room.is_private);
  const publicRooms = rooms.filter(room => !room.is_private);

  return (
    <View style={styles.container}>
      <GradientBackground colors={[theme.colors.background.dark, theme.colors.background.darker, theme.colors.darkGray[800]]}>
        <FloatingBubbleBackground />
        <SafeContainer style={styles.safeArea}>
          <Animated.View 
            style={styles.header}
            entering={SlideInDown.duration(600)}
          >
            <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: theme.colors.background.elevated }]}>
              <ArrowLeft size={24} color={theme.colors.text.primary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>Watch Room</Text>
            <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
              <LinearGradient
                colors={theme.colors.gradients.purple}
                style={styles.createButtonGradient}
              >
                <Plus size={24} color={theme.colors.text.primary} />
              </LinearGradient>
            </TouchableOpacity>
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
            <ScrollView 
              style={styles.roomsList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <RoomSection 
                title="Şifreli Odalar"
                rooms={privateRooms}
                isPrivate={true}
                onJoinRoom={handleJoinRoom}
                onDeleteRoom={handleDeleteRoom}
              />
              
              <RoomSection 
                title="Genel Odalar"
                rooms={publicRooms}
                isPrivate={false}
                onJoinRoom={handleJoinRoom}
                onDeleteRoom={handleDeleteRoom}
              />
              
              {privateRooms.length === 0 && publicRooms.length === 0 && (
                <Animated.View 
                  style={styles.emptyMainContainer}
                  entering={FadeIn.delay(500).duration(800)}
                >
                  <GradientCard colors={theme.colors.gradients.warmDark} style={styles.emptyCard}>
                    <Video size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
                    <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Henüz hiç izleme odası yok</Text>
                    <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                      Arkadaşlarınla birlikte video izlemek için bir oda oluştur
                    </Text>
                    <Button
                      title="Oda Oluştur"
                      onPress={handleCreateRoom}
                      variant="primary"
                      size="medium"
                      style={styles.emptyButton}
                    />
                  </GradientCard>
                </Animated.View>
              )}
            </ScrollView>
          )}
        </SafeContainer>

        <CreateWatchRoomModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRoom) => {
            setShowCreateModal(false);
            setSelectedRoomId(newRoom.id);
            setSelectedRoom(newRoom);
          }}
        />

        {selectedRoomForJoin && (
          <JoinWatchRoomModal
            visible={showJoinModal}
            onClose={() => {
              setShowJoinModal(false);
              setSelectedRoomForJoin(null);
            }}
            onSuccess={(roomData) => {
              setShowJoinModal(false);
              setSelectedRoomForJoin(null);
              setSelectedRoomId(roomData.id);
              setSelectedRoom(roomData);
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 0,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
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
  roomsList: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
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
    padding: 0,
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
  privateBadge: {
    padding: 4,
    borderRadius: BorderRadius.xs,
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
  statText: {
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
  emptyMainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xxl,
  },
  emptyCard: {
    alignItems: 'center',
    padding: Spacing.xl,
    width: '100%',
  },
  emptyIcon: {
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 22,
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
  emptyButton: {
    marginTop: Spacing.md,
  },
});
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SafeContainer } from '@/components/UI/SafeContainer';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '@/constants/Theme';
import { Card } from '@/components/UI/Card';
import { ModernCard } from '@/components/UI/ModernCard';
import { GradientBackground, GradientCard } from '@/components/UI/GradientBackground';
import { Button } from '@/components/UI/Button';
import { TimerDisplay } from '@/components/UI/AnimatedCounter';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Clock, BookOpen, Users, Plus, Play, Pause, RotateCcw, Lock, Trash2, Target, Zap, Timer } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { useStudyRooms } from '@/hooks/useStudyRooms';
import { CreateRoomModal } from '@/components/Study/CreateRoomModal';
import { JoinRoomModal } from '@/components/Study/JoinRoomModal';
import { StudyRoom } from '@/components/Study/StudyRoom';
import Animated, { 
  FadeIn, 
  SlideInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring,
  withTiming,
  withSequence,
  interpolate
} from 'react-native-reanimated';
import { router } from 'expo-router';
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
            colors={theme.colors.gradients.green} 
            style={styles.roomIconContainer}
          >
            <BookOpen size={20} color={theme.colors.text.primary} />
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
              {room.description || 'Çalışma odası'}
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
              <Clock size={14} color={theme.colors.success} />
              <Text style={[styles.statText, { color: theme.colors.text.secondary }]}>
                {room.current_members?.filter((m: any) => m.current_session_id).length || 0} aktif
              </Text>
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
          {isPrivate ? <Lock size={16} color={theme.colors.primary[400]} /> : <BookOpen size={16} color={theme.colors.success} />}
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

export default function StudyScreen() {
  const { user, session, loading } = useAuth();
  const { theme } = useTheme();
  const { 
    isRunning, 
    isPaused,
    elapsedTime, 
    startTimer, 
    stopTimer,
    resumeTimer,
    resetTimer,
    saveSession,
    updateSession
  } = useStudyTimer();
  
  const {
    rooms,
    loading: roomsLoading,
    error: roomsError,
    deleteRoom,
    joinRoom,
    fetchRooms
  } = useStudyRooms();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedRoomForJoin, setSelectedRoomForJoin] = useState<{id: string, name: string} | null>(null);

  // Timer animasyonları
  const timerScale = useSharedValue(1);
  const timerGlow = useSharedValue(0);

  const timerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: timerScale.value }],
    shadowOpacity: interpolate(timerGlow.value, [0, 1], [0.1, 0.4]),
  }));

  useEffect(() => {
    if (!loading && (!user || !session)) {
      router.replace('/(auth)/sign-in');
      return;
    }
  }, [user, session, loading]);

  useEffect(() => {
    return () => {
      if (isRunning || isPaused) {
        saveSession();
      }
    };
  }, [isRunning, isPaused]);

  useEffect(() => {
    if (isRunning) {
      timerScale.value = withSequence(
        withSpring(1.05),
        withSpring(1)
      );
      timerGlow.value = withTiming(1, { duration: 500 });
    } else {
      timerGlow.value = withTiming(0, { duration: 500 });
    }
  }, [isRunning]);

  const handleTimerAction = () => {
    if (!user) return;
    
    timerScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );
    
    if (isRunning) {
      stopTimer();
    } else if (isPaused) {
      resumeTimer();
    } else {
      startTimer();
    }
  };

  const handleReset = async () => {
    if (!user) return;
    await resetTimer();
  };

  const handleCreateRoom = () => {
    if (!user) return;
    setShowCreateModal(true);
  };

  const handleJoinRoom = async (roomId: string, isPrivate: boolean, name: string) => {
    if (!user) return;
    
    const room = rooms.find(r => r.id === roomId);
    
    if (isPrivate) {
      setSelectedRoomForJoin({ id: roomId, name });
      setShowJoinModal(true);
    } else {
      // Public oda: Kullanıcıyı member olarak kaydet ve room'a gir
      try {
        await joinRoom(roomId); // Public oda için şifre gerektirmez
        setSelectedRoomId(roomId);
        setSelectedRoom(room);
      } catch (error: any) {
        console.error('Odaya katılırken hata oluştu:', error.message);
      }
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!user) return;
    
    try {
      await deleteRoom(roomId);
    } catch (error: any) {
      console.error('Oda silinirken hata oluştu:', error.message);
    }
  };

  if (loading || !user || !session) {
    return null;
  }

  if (selectedRoomId && selectedRoom) {
    return (
      <StudyRoom
        roomId={selectedRoomId}
        room={selectedRoom}
        onClose={() => {
          setSelectedRoomId(null);
          setSelectedRoom(null);
        }}
      />
    );
  }

  // Odaları şifreli ve public olarak ayır
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
            <View style={styles.headerContent}>
              <Text style={[styles.title, { color: theme.colors.text.primary }]}>Çalışma Oturumu</Text>
              <TouchableOpacity style={styles.createRoomButton} onPress={handleCreateRoom}>
                <LinearGradient
                  colors={theme.colors.gradients.green}
                  style={styles.createButtonGradient}
                >
                  <Plus size={24} color={theme.colors.text.primary} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View
            style={[timerAnimatedStyle]}
            entering={FadeIn.delay(200).duration(800)}
          >
            <GradientCard 
              colors={isRunning ? theme.colors.gradients.accent : theme.colors.gradients.warmDark}
              style={styles.timerCard}
            >
              <View style={styles.timerHeader}>
                <View style={[styles.timerIconContainer, { backgroundColor: theme.colors.primary[500] + '20' }]}>
                  <Timer size={24} color={theme.colors.primary[400]} />
                </View>
                <Text style={[styles.timerTitle, { color: theme.colors.text.primary }]}>Çalışma Sayacı</Text>
                <View style={styles.timerStatus}>
                  {isRunning && (
                    <View style={[styles.runningIndicator, { 
                      backgroundColor: theme.colors.success + '20',
                      borderColor: theme.colors.success + '40'
                    }]}>
                      <Text style={[styles.runningText, { color: theme.colors.success }]}>Aktif</Text>
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.timerDisplay}>
                <TimerDisplay
                  hours={Math.floor(elapsedTime / 3600)}
                  minutes={Math.floor((elapsedTime % 3600) / 60)}
                  seconds={elapsedTime % 60}
                  size="large"
                />
              </View>

              <View style={styles.timerControls}>
                <TouchableOpacity
                  style={[
                    styles.timerButton, 
                    styles.primaryButton,
                    isRunning && styles.timerButtonActive
                  ]}
                  onPress={handleTimerAction}
                >
                  <LinearGradient
                    colors={isRunning ? [theme.colors.error, '#FF6B6B'] : theme.colors.gradients.primary}
                    style={styles.buttonGradient}
                  >
                    {isRunning ? (
                      <Pause size={20} color={theme.colors.text.primary} />
                    ) : isPaused ? (
                      <Play size={20} color={theme.colors.text.primary} />
                    ) : (
                      <Play size={20} color={theme.colors.text.primary} />
                    )}
                    <Text style={[styles.buttonText, { color: theme.colors.text.primary }]}>
                      {isRunning ? 'Durdur' : isPaused ? 'Devam' : 'Başla'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.timerButton, 
                    styles.secondaryButton,
                    {
                      backgroundColor: theme.colors.background.elevated,
                      borderColor: theme.colors.border.primary
                    }
                  ]}
                  onPress={handleReset}
                >
                  <RotateCcw size={20} color={theme.colors.text.secondary} />
                  <Text style={[styles.secondaryButtonText, { color: theme.colors.text.secondary }]}>Sıfırla</Text>
                </TouchableOpacity>
              </View>
            </GradientCard>
          </Animated.View>

          <ScrollView 
            style={styles.roomsList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {roomsLoading ? (
              <Animated.View 
                style={styles.centerContainer}
                entering={FadeIn.duration(400)}
              >
                <Text style={[styles.loadingText, { color: theme.colors.text.secondary }]}>Yükleniyor...</Text>
              </Animated.View>
            ) : roomsError ? (
              <Animated.View 
                style={styles.centerContainer}
                entering={FadeIn.duration(400)}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{roomsError}</Text>
              </Animated.View>
            ) : (
              <>
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
                      <Target size={48} color={theme.colors.text.secondary} style={styles.emptyIcon} />
                      <Text style={[styles.emptyTitle, { color: theme.colors.text.primary }]}>Henüz hiç çalışma odası yok</Text>
                      <Text style={[styles.emptyDescription, { color: theme.colors.text.secondary }]}>
                        Arkadaşlarınla birlikte çalışmak için bir oda oluştur ve motivasyonunu artır
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
              </>
            )}
          </ScrollView>
        </SafeContainer>

        <CreateRoomModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newRoom) => {
            setShowCreateModal(false);
            setSelectedRoomId(newRoom.id);
            setSelectedRoom(newRoom);
          }}
        />

        {selectedRoomForJoin && (
          <JoinRoomModal
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.lg, // "Çalışma Oturumu" başlığını aşağı çek
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
  timerCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    padding: Spacing.xl,
    ...Shadows.large,
  },
  timerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  timerIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  timerTitle: {
    flex: 1,
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
  },
  timerStatus: {
    minWidth: 60,
    alignItems: 'flex-end',
  },
  runningIndicator: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  runningText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.xs,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  timerControls: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  timerButton: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  primaryButton: {
    flex: 2,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  buttonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
  },
  secondaryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: FontSizes.sm,
  },
  timerButtonActive: {
    transform: [{ scale: 1.02 }],
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
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyMainContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
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
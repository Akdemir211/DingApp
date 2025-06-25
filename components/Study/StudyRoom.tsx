import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSizes, BorderRadius } from '@/constants/Theme';
import { TimerDisplay } from '@/components/UI/AnimatedCounter';
import { ProfilePhoto } from '@/components/UI/ProfilePhoto';
import { useAuth } from '@/context/AuthContext';
import { Clock, Users, ArrowLeft, RotateCcw, Play, Pause } from 'lucide-react-native';
import { FloatingBubbleBackground } from '@/components/UI/FloatingBubble';
import { useStudyTimer } from '@/hooks/useStudyTimer';
import { supabase } from '@/lib/supabase';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { getProfilePhoto } from '@/lib/profileService';

interface StudyRoomProps {
  roomId: string;
  room: {
    id: string;
    name: string;
    description: string;
    is_private: boolean;
    created_by: string;
  };
  onClose: () => void;
}

interface Member {
  user_id: string;
  current_session_id: string | null;
  user: {
    id: string;
    name: string | null;
  };
  session?: {
    id: string;
    created_at: string;
    duration: number;
    ended_at: string | null;
  };
}

interface MemberTimer {
  startTime: string;
  elapsedTime: number;
  isActive: boolean;
  initialDuration: number;
}

export default function StudyRoom({ roomId, room, onClose }: StudyRoomProps) {
  const { user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [memberTimers, setMemberTimers] = useState<Record<string, MemberTimer>>({});
  const [memberPhotos, setMemberPhotos] = useState<Record<string, string>>({});
  
  // Her kullanıcının kendi bireysel timer'ı
  const { 
    isRunning, 
    isPaused,
    elapsedTime, 
    startTimer, 
    stopTimer,
    resumeTimer,
    resetTimer,
    updateSession 
  } = useStudyTimer();

  const fetchMembers = async () => {
    try {
      const { data: roomMembers, error } = await supabase
        .from('study_room_members')
        .select(`
          user_id,
          current_session_id,
          user:users(
            id,
            name
          ),
          session:study_sessions(
            id,
            created_at,
            duration,
            ended_at
          )
        `)
        .eq('room_id', roomId);

      if (error) throw error;

      if (roomMembers) {
        // Sort members - active user on top
        const sortedMembers = (roomMembers as any[]).sort((a, b) => {
          if (a.user_id === user?.id) return -1;
          if (b.user_id === user?.id) return 1;
          return 0;
        });
        
        setMembers(sortedMembers);
        
        // Fetch member photos
        await fetchMemberPhotos(roomMembers.map((member: any) => member.user_id));
        
        // Calculate other users' timers
        const newTimers: Record<string, MemberTimer> = {};
        
        roomMembers.forEach((member: any) => {
          // Skip current user
          if (member.user_id === user?.id) return;
          
          const hasActiveSession = member.current_session_id && 
                                 member.session && 
                                 !member.session.ended_at;
          
          if (hasActiveSession) {
            const startTime = new Date(member.session.created_at);
            const now = new Date();
            const sessionElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            
            // Session'ın duration'ı varsa (resume edilmişse) onu da ekle
            const initialDuration = member.session.duration || 0;
            const totalElapsed = initialDuration + sessionElapsed;
            
            newTimers[member.user_id] = {
              startTime: member.session.created_at,
              elapsedTime: totalElapsed,
              isActive: true,
              initialDuration: initialDuration
            };
          } else {
            newTimers[member.user_id] = {
              startTime: '',
              elapsedTime: 0,
              isActive: false,
              initialDuration: 0
            };
          }
        });
        
        setMemberTimers(newTimers);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    }
  };

  const fetchMemberPhotos = async (userIds: string[]) => {
    try {
      const photos: Record<string, string> = {};
      
      for (const userId of userIds) {
        const photoUrl = await getProfilePhoto(userId);
        if (photoUrl) {
          photos[userId] = photoUrl;
        }
      }
      
      setMemberPhotos(photos);
    } catch (error) {
      console.error('Error fetching member photos:', error);
    }
  };

  // Update other users' timers every second
  useEffect(() => {
    const interval = setInterval(() => {
      setMemberTimers(prevTimers => {
        const updatedTimers: Record<string, MemberTimer> = {};
        
        Object.entries(prevTimers).forEach(([userId, timer]) => {
          if (timer.isActive && userId !== user?.id && timer.startTime) {
            const startTime = new Date(timer.startTime);
            const now = new Date();
            const sessionElapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const totalElapsed = timer.initialDuration + sessionElapsed;
            
            updatedTimers[userId] = {
              ...timer,
              elapsedTime: totalElapsed
            };
          } else {
            updatedTimers[userId] = timer;
          }
        });
        
        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [user?.id]); // Remove memberTimers dependency

  // Enhanced real-time subscriptions with member timer updates
  useEffect(() => {
    fetchMembers();
    
    // Members subscription - refetch when members change
    const membersSubscription = supabase
      .channel(`study_room_members_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_room_members',
        filter: `room_id=eq.${roomId}`
      }, () => {
        fetchMembers();
      })
      .subscribe();

    // Sessions subscription - refetch when sessions change
    const sessionsSubscription = supabase
      .channel(`study_sessions_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_sessions'
      }, () => {
        fetchMembers();
      })
      .subscribe();

    return () => {
      membersSubscription.unsubscribe();
      sessionsSubscription.unsubscribe();
    };
  }, [roomId, user?.id]);

  const handleTimerAction = async () => {
    try {
      if (isRunning) {
        // Stop timer
        await stopTimer();
        await updateSession(roomId, null);
      } else if (isPaused) {
        // Resume timer - create new session
        const session = await resumeTimer();
        if (session && typeof session === 'object' && 'id' in session) {
          await updateSession(roomId, (session as any).id);
        }
      } else {
        // Start new timer
        const session = await startTimer();
        if (session && typeof session === 'object' && 'id' in session) {
          await updateSession(roomId, (session as any).id);
        }
      }
      
      // Force refresh members to show immediate changes
      setTimeout(() => {
        fetchMembers();
      }, 500);
    } catch (error) {
      console.error('Error in timer action:', error);
    }
  };

  const handleReset = async () => {
    try {
      await resetTimer();
      await updateSession(roomId, null);
      
      // Force refresh members
      setTimeout(() => {
        fetchMembers();
      }, 500);
    } catch (error) {
      console.error('Error in timer reset:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}s ${minutes}d ${secs}sn`;
    } else if (minutes > 0) {
      return `${minutes}d ${secs}sn`;
    }
    return `${secs}sn`;
  };

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.content}>
        <View style={styles.membersSection}>
          <Text style={styles.sectionTitle}>Çalışma Üyeleri</Text>
          
          {members.map((member) => (
            <View key={member.user_id} style={styles.memberCard}>
              <ProfilePhoto 
                uri={memberPhotos[member.user_id]}
                size={40}
                style={styles.memberAvatar} 
              />
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.user?.name || 'Anonim Kullanıcı'}
                  {member.user_id === user?.id ? ' (Sen)' : ''}
                </Text>
                
                {member.user_id === user?.id ? (
                  <View style={styles.timerSection}>
                    <View style={styles.timerDisplay}>
                      <TimerDisplay
                        hours={Math.floor(elapsedTime / 3600)}
                        minutes={Math.floor((elapsedTime % 3600) / 60)}
                        seconds={elapsedTime % 60}
                        size="medium"
                      />
                    </View>

                    <View style={styles.timerControls}>
                      <TouchableOpacity
                        style={[styles.timerButton, isRunning && styles.timerButtonActive]}
                        onPress={handleTimerAction}
                      >
                        {isRunning ? (
                          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.timerButtonContent}>
                            <Pause size={18} color={Colors.text.primary} />
                            <Text style={styles.timerButtonText}>Duraklat</Text>
                          </Animated.View>
                        ) : (
                          <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.timerButtonContent}>
                            <Play size={18} color={Colors.text.primary} />
                            <Text style={styles.timerButtonText}>{isPaused ? 'Devam Et' : 'Başla'}</Text>
                          </Animated.View>
                        )}
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.resetButton, !elapsedTime && styles.resetButtonDisabled]}
                        onPress={handleReset}
                        disabled={!elapsedTime}
                      >
                        <RotateCcw size={18} color={Colors.text.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={styles.otherUserTimer}>
                    {memberTimers[member.user_id]?.isActive ? (
                      <View style={styles.memberTimer}>
                        <Clock size={14} color={Colors.primary[400]} />
                        <Text style={styles.memberTimerText}>
                          {formatTime(memberTimers[member.user_id]?.elapsedTime || 0)}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.memberStatusContainer}>
                        <Text style={styles.memberStatus}>
                          {memberTimers[member.user_id] ? 'Bekliyor' : 'Yükleniyor...'}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    paddingTop: Spacing.md,
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
    padding: Spacing.lg,
  },
  membersSection: {
    flex: 1,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.lg,
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.darkGray[800],
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  memberAvatar: {
    marginRight: Spacing.md,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.md,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  timerSection: {
    marginTop: Spacing.sm,
  },
  timerDisplay: {
    marginBottom: Spacing.sm,
  },
  timerControls: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  timerButton: {
    flex: 1,
    backgroundColor: Colors.primary[500],
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerButtonActive: {
    backgroundColor: Colors.darkGray[700],
  },
  timerButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: FontSizes.sm,
    color: Colors.text.primary,
    marginLeft: Spacing.xs,
  },
  resetButton: {
    width: 40,
    backgroundColor: Colors.darkGray[700],
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButtonDisabled: {
    opacity: 0.5,
  },
  otherUserTimer: {
    marginTop: 4,
  },
  memberTimer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberTimerText: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
    marginLeft: 4,
  },
  memberStatus: {
    fontFamily: 'Inter-Regular',
    fontSize: FontSizes.sm,
    color: Colors.text.secondary,
  },
  memberStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export { StudyRoom }
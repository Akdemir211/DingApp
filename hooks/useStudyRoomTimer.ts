import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface TimerState {
  isRunning: boolean;
  startTime: string | null;
  pauseTime: string | null;
  totalPausedDuration: number;
  currentSessionId: string | null;
  startedBy: string | null;
}

interface TimerEvent {
  id: string;
  action: 'start' | 'pause' | 'resume' | 'reset';
  user_id: string;
  timestamp: string;
  elapsed_seconds: number | null;
}

export function useStudyRoomTimer(roomId: string) {
  const { user } = useAuth();
  const [timerState, setTimerState] = useState<TimerState>({
    isRunning: false,
    startTime: null,
    pauseTime: null,
    totalPausedDuration: 0,
    currentSessionId: null,
    startedBy: null,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [events, setEvents] = useState<TimerEvent[]>([]);

  // Calculate elapsed time based on server state
  const getElapsedTime = useCallback(() => {
    if (!timerState.startTime) return 0;
    
    const startTime = new Date(timerState.startTime);
    const endTime = timerState.isRunning ? currentTime : 
                   timerState.pauseTime ? new Date(timerState.pauseTime) : currentTime;
    
    const elapsed = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);
    return Math.max(0, elapsed - timerState.totalPausedDuration);
  }, [timerState, currentTime]);

  // Fetch initial timer state
  const fetchTimerState = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_room_timer_state')
        .select('*')
        .eq('room_id', roomId)
        .single();

      if (error && error.code !== 'PGRST116') { // Not found is ok
        console.error('Error fetching timer state:', error);
        return;
      }

      if (data) {
        setTimerState({
          isRunning: data.is_running,
          startTime: data.start_time,
          pauseTime: data.pause_time,
          totalPausedDuration: data.total_paused_duration,
          currentSessionId: data.current_session_id,
          startedBy: data.started_by,
        });
      }
    } catch (error) {
      console.error('Error in fetchTimerState:', error);
    }
  }, [roomId]);

  // Fetch recent events
  const fetchEvents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('study_room_timer_events')
        .select('*')
        .eq('room_id', roomId)
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching events:', error);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error in fetchEvents:', error);
    }
  }, [roomId]);

  // Start timer
  const startTimer = useCallback(async () => {
    if (!user) return false;

    try {
      // Create a new session first
      const { data: session, error: sessionError } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration: 0,
        })
        .select()
        .single();

      if (sessionError) {
        console.error('Error creating session:', sessionError);
        return false;
      }

      const now = new Date().toISOString();
      
      // Upsert timer state
      const { error: stateError } = await supabase
        .from('study_room_timer_state')
        .upsert({
          room_id: roomId,
          is_running: true,
          start_time: now,
          pause_time: null,
          total_paused_duration: 0,
          current_session_id: session.id,
          started_by: user.id,
        });

      if (stateError) {
        console.error('Error updating timer state:', stateError);
        return false;
      }

      // Log event
      const { error: eventError } = await supabase
        .from('study_room_timer_events')
        .insert({
          room_id: roomId,
          user_id: user.id,
          action: 'start',
          elapsed_seconds: 0,
        });

      if (eventError) {
        console.error('Error logging event:', eventError);
      }

      return true;
    } catch (error) {
      console.error('Error in startTimer:', error);
      return false;
    }
  }, [user, roomId]);

  // Pause timer
  const pauseTimer = useCallback(async () => {
    if (!user) return false;

    try {
      const elapsedSeconds = getElapsedTime();
      const now = new Date().toISOString();

      const { error: stateError } = await supabase
        .from('study_room_timer_state')
        .update({
          is_running: false,
          pause_time: now,
        })
        .eq('room_id', roomId);

      if (stateError) {
        console.error('Error pausing timer:', stateError);
        return false;
      }

      // Log event
      const { error: eventError } = await supabase
        .from('study_room_timer_events')
        .insert({
          room_id: roomId,
          user_id: user.id,
          action: 'pause',
          elapsed_seconds: elapsedSeconds,
        });

      if (eventError) {
        console.error('Error logging event:', eventError);
      }

      return true;
    } catch (error) {
      console.error('Error in pauseTimer:', error);
      return false;
    }
  }, [user, roomId, getElapsedTime]);

  // Resume timer
  const resumeTimer = useCallback(async () => {
    if (!user) return false;

    try {
      const now = new Date().toISOString();
      
      // Calculate additional paused duration
      let additionalPausedDuration = 0;
      if (timerState.pauseTime) {
        const pauseTime = new Date(timerState.pauseTime);
        const nowTime = new Date(now);
        additionalPausedDuration = Math.floor((nowTime.getTime() - pauseTime.getTime()) / 1000);
      }

      const { error: stateError } = await supabase
        .from('study_room_timer_state')
        .update({
          is_running: true,
          pause_time: null,
          total_paused_duration: timerState.totalPausedDuration + additionalPausedDuration,
        })
        .eq('room_id', roomId);

      if (stateError) {
        console.error('Error resuming timer:', stateError);
        return false;
      }

      // Log event
      const { error: eventError } = await supabase
        .from('study_room_timer_events')
        .insert({
          room_id: roomId,
          user_id: user.id,
          action: 'resume',
          elapsed_seconds: getElapsedTime(),
        });

      if (eventError) {
        console.error('Error logging event:', eventError);
      }

      return true;
    } catch (error) {
      console.error('Error in resumeTimer:', error);
      return false;
    }
  }, [user, roomId, timerState, getElapsedTime]);

  // Reset timer
  const resetTimer = useCallback(async () => {
    if (!user) return false;

    try {
      const elapsedSeconds = getElapsedTime();

      // Update session if exists
      if (timerState.currentSessionId) {
        const { error: sessionError } = await supabase
          .from('study_sessions')
          .update({
            duration: elapsedSeconds,
            ended_at: new Date().toISOString(),
          })
          .eq('id', timerState.currentSessionId);

        if (sessionError) {
          console.error('Error updating session:', sessionError);
        }
      }

      const { error: stateError } = await supabase
        .from('study_room_timer_state')
        .update({
          is_running: false,
          start_time: null,
          pause_time: null,
          total_paused_duration: 0,
          current_session_id: null,
          started_by: null,
        })
        .eq('room_id', roomId);

      if (stateError) {
        console.error('Error resetting timer:', stateError);
        return false;
      }

      // Log event
      const { error: eventError } = await supabase
        .from('study_room_timer_events')
        .insert({
          room_id: roomId,
          user_id: user.id,
          action: 'reset',
          elapsed_seconds: elapsedSeconds,
        });

      if (eventError) {
        console.error('Error logging event:', eventError);
      }

      return true;
    } catch (error) {
      console.error('Error in resetTimer:', error);
      return false;
    }
  }, [user, roomId, timerState, getElapsedTime]);

  // Setup real-time subscriptions
  useEffect(() => {
    fetchTimerState();
    fetchEvents();

    // Timer state subscription
    const timerSubscription = supabase
      .channel(`timer_state_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_room_timer_state',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        fetchTimerState();
      })
      .subscribe();

    // Events subscription
    const eventsSubscription = supabase
      .channel(`timer_events_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'study_room_timer_events',
        filter: `room_id=eq.${roomId}`,
      }, () => {
        fetchEvents();
      })
      .subscribe();

    return () => {
      timerSubscription.unsubscribe();
      eventsSubscription.unsubscribe();
    };
  }, [roomId, fetchTimerState, fetchEvents]);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const elapsedTime = getElapsedTime();
  const isRunning = timerState.isRunning;
  const isPaused = !isRunning && timerState.startTime !== null;
  const canControl = user?.id === timerState.startedBy || timerState.startedBy === null;

  return {
    elapsedTime,
    isRunning,
    isPaused,
    canControl,
    startedBy: timerState.startedBy,
    events,
    startTimer,
    pauseTimer,
    resumeTimer,
    resetTimer,
  };
} 
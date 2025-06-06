import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export const useStudyTimer = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [pausedTime, setPausedTime] = useState(0); // Pause edildiği andaki süre
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const startTimer = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      setIsRunning(true);
      setIsPaused(false);

      const { data: session, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration: 0,
        })
        .select()
        .single();

      if (error || !session) {
        console.error('Error starting session:', error);
        return null;
      }

      setCurrentSessionId((session as any).id);
      return session;
    } catch (error) {
      console.error('Error in startTimer:', error);
      return null;
    }
  }, []);

  const stopTimer = useCallback(async () => {
    try {
      if (!currentSessionId) return;

      setIsRunning(false);
      setIsPaused(true);
      setPausedTime(elapsedTime); // Pause edildiği andaki süreyi kaydet

      const { error } = await supabase
        .from('study_sessions')
        .update({
          duration: elapsedTime,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Error stopping session:', error);
      }
    } catch (error) {
      console.error('Error in stopTimer:', error);
    }
  }, [currentSessionId, elapsedTime]);

  const resumeTimer = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return null;
      }

      setIsRunning(true);
      setIsPaused(false);

      // Create new session starting from paused time
      const { data: session, error } = await supabase
        .from('study_sessions')
        .insert({
          user_id: user.id,
          duration: pausedTime, // Pause edildiği yerden başla
        })
        .select()
        .single();

      if (error || !session) {
        console.error('Error resuming session:', error);
        return null;
      }

      setCurrentSessionId((session as any).id);
      return session;
    } catch (error) {
      console.error('Error in resumeTimer:', error);
      return null;
    }
  }, [pausedTime]);

  const resetTimer = useCallback(async () => {
    setIsRunning(false);
    setIsPaused(false);
    setElapsedTime(0);
    setPausedTime(0); // Paused time'ı da sıfırla
    setCurrentSessionId(null);
  }, []);

  const saveSession = useCallback(async () => {
    try {
      if (!currentSessionId) return;

      const { error } = await supabase
        .from('study_sessions')
        .update({
          duration: elapsedTime,
          ended_at: new Date().toISOString(),
        })
        .eq('id', currentSessionId);

      if (error) {
        console.error('Error saving session:', error);
      }
    } catch (error) {
      console.error('Error in saveSession:', error);
    }
  }, [currentSessionId, elapsedTime]);

  const updateSession = useCallback(async (roomId: string, sessionId: string | null) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('User not authenticated');
        return;
      }

      const { error } = await supabase
        .from('study_room_members')
        .update({ current_session_id: sessionId })
        .eq('room_id', roomId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error updating session:', error);
      }
    } catch (error) {
      console.error('Error in updateSession:', error);
    }
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        setElapsedTime((time) => time + 1);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  return {
    isRunning,
    isPaused,
    elapsedTime,
    startTimer,
    stopTimer,
    resumeTimer,
    resetTimer,
    saveSession,
    updateSession,
  };
};
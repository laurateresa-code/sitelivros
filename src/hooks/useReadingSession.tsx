import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActiveSession {
  bookId: string;
  startPage: number;
  startTime: Date;
}

interface ReadingSessionContextType {
  activeSession: ActiveSession | null;
  loading: boolean;
  startSession: (bookId: string, currentPage: number) => Promise<void>;
  endSession: (endPage: number, notes?: string) => Promise<void>;
  cancelSession: () => Promise<void>;
}

const ReadingSessionContext = createContext<ReadingSessionContextType | undefined>(undefined);

export function ReadingSessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const { user, profile, updateProfile } = useAuth();

  const startSession = useCallback(async (bookId: string, currentPage: number) => {
    if (!user) return;

    setActiveSession({
      bookId,
      startPage: currentPage,
      startTime: new Date(),
    });

    // Update profile to show "reading now"
    await updateProfile({
      is_reading_now: true,
      current_book_id: bookId,
    });
  }, [user, updateProfile]);

  const endSession = useCallback(async (endPage: number, notes?: string) => {
    if (!user || !activeSession) return null;

    setLoading(true);

    try {
      const durationMinutes = Math.round(
        (new Date().getTime() - activeSession.startTime.getTime()) / 60000
      );
      const pagesRead = endPage - activeSession.startPage;

      // Create reading session
      const { data: session, error: sessionError } = await supabase
        .from('reading_sessions')
        .insert({
          user_id: user.id,
          book_id: activeSession.bookId,
          pages_read: pagesRead,
          start_page: activeSession.startPage,
          end_page: endPage,
          duration_minutes: durationMinutes,
          notes,
          started_at: activeSession.startTime.toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Update user_books with current page
      await supabase
        .from('user_books')
        .update({ current_page: endPage })
        .eq('user_id', user.id)
        .eq('book_id', activeSession.bookId);

      // Calculate streak updates
      let streakDays = profile?.streak_days || 0;
      let lastBrokenStreak = profile?.last_broken_streak || 0;
      let consecutiveRecoveries = profile?.consecutive_recoveries || 0;
      
      const today = new Date().toISOString().split('T')[0];
      const lastReading = profile?.last_reading_date;
      
      // Only update streak logic if session is at least 10 minutes
      if (durationMinutes >= 10) {
        if (lastReading !== today) {
           const yesterday = new Date();
           yesterday.setDate(yesterday.getDate() - 1);
           const yesterdayStr = yesterday.toISOString().split('T')[0];
           
           if (lastReading === yesterdayStr) {
             // Consecutive day
             streakDays += 1;
             // Reset consecutive recoveries on normal extension
             consecutiveRecoveries = 0;
           } else {
             // Streak broken
             if (streakDays > 0) {
               lastBrokenStreak = streakDays;
             }
             streakDays = 1;
           }
        }
      }

      // Update profile stats
      const newTotalPages = (profile?.total_pages_read || 0) + pagesRead;
      const newTotalTime = (profile?.total_reading_time || 0) + durationMinutes;
      
      await updateProfile({
        is_reading_now: false,
        current_book_id: null,
        total_pages_read: newTotalPages,
        total_reading_time: newTotalTime,
        last_reading_date: durationMinutes >= 10 ? today : (lastReading || null),
        streak_days: streakDays,
        last_broken_streak: lastBrokenStreak,
        consecutive_recoveries: consecutiveRecoveries
      });

      // Create a post about the session
      await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          book_id: activeSession.bookId,
          reading_session_id: session.id,
          type: 'session_update',
          content: notes || `Leu ${pagesRead} páginas em ${durationMinutes} minutos!`,
        });

      setActiveSession(null);
      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user, profile, activeSession, updateProfile]);

  const cancelSession = useCallback(async () => {
    if (!user) return;

    await updateProfile({
      is_reading_now: false,
      current_book_id: null,
    });

    setActiveSession(null);
  }, [user, updateProfile]);

  return (
    <ReadingSessionContext.Provider value={{
      activeSession,
      loading,
      startSession,
      endSession,
      cancelSession
    }}>
      {children}
    </ReadingSessionContext.Provider>
  );
}

export function useReadingSession() {
  const context = useContext(ReadingSessionContext);
  if (context === undefined) {
    throw new Error('useReadingSession must be used within a ReadingSessionProvider');
  }
  return context;
}

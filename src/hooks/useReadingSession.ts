import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ActiveSession {
  bookId: string;
  startPage: number;
  startTime: Date;
}

export function useReadingSession() {
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

      // Update profile stats
      const newTotalPages = (profile?.total_pages_read || 0) + pagesRead;
      const newTotalTime = (profile?.total_reading_time || 0) + durationMinutes;
      
      await updateProfile({
        is_reading_now: false,
        current_book_id: null,
        total_pages_read: newTotalPages,
        total_reading_time: newTotalTime,
        last_reading_date: new Date().toISOString().split('T')[0],
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

  return {
    activeSession,
    loading,
    startSession,
    endSession,
    cancelSession,
  };
}

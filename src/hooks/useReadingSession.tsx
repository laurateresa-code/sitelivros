import React, { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from './useAuth';
import { Badge } from '../types';
import { BadgeAwardedDialog } from '../components/rewards/BadgeAwardedDialog';

interface ActiveSession {
  bookId: string;
  startPage: number;
  startTime: Date;
}

interface ReadingSessionContextType {
  activeSession: ActiveSession | null;
  loading: boolean;
  startSession: (bookId: string, currentPage: number) => Promise<void>;
  endSession: (endPage: number, notes?: string) => Promise<{ session: any; newBadge: any | null } | null>;
  cancelSession: () => Promise<void>;
}

const STREAK_BADGES = {
  1: 'Bom Começo',
  3: 'Aquecimento',
  7: 'Leitor Dedicado',
  14: 'Leitor Comprometido',
  30: 'Hábito de Ferro'
};

const ReadingSessionContext = createContext<ReadingSessionContextType | undefined>(undefined);

export function ReadingSessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [awardedBadge, setAwardedBadge] = useState<Badge | null>(null);
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
      
      // Use local date to avoid timezone issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const lastReading = profile?.last_reading_date;
      
      // Calculate total reading time for today to support cumulative sessions
      // Start of today in UTC (since database stores timestamps in UTC)
      // We need to be careful with timezones. Best approach is to query sessions started today in local time concept
      // But for simplicity and robustness with Supabase, let's get sessions from the last 24h and filter in JS or 
      // rely on the fact that if we just read now, we are active.
      
      // Better approach: Query all sessions from today
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();

      const { data: todaySessions } = await supabase
        .from('reading_sessions')
        .select('duration_minutes')
        .eq('user_id', user.id)
        .gte('started_at', startOfDay)
        .lt('started_at', endOfDay)
        .neq('id', session.id);
        
      const totalMinutesToday = (todaySessions?.reduce((acc, curr) => acc + curr.duration_minutes, 0) || 0) + durationMinutes;

      console.log('Total minutes today:', totalMinutesToday, 'Current streak:', streakDays);

      // Only update streak logic if TOTAL daily reading is at least 10 minutes
      let updatedLastReadingDate = lastReading;
      
      if (totalMinutesToday >= 10) {
        updatedLastReadingDate = today;
        
        if (lastReading !== today) {
           const yesterdayDate = new Date();
           yesterdayDate.setDate(yesterdayDate.getDate() - 1);
           const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;
           
           if (lastReading === yesterdayStr) {
             // Consecutive day
             streakDays += 1;
             // Reset consecutive recoveries on normal extension
             consecutiveRecoveries = 0;
           } else if (lastReading !== today) { // Avoid resetting if we already processed today but just added more minutes
             // Streak broken or new streak (only if we haven't already counted today)
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
      
      const updateData: any = {
        is_reading_now: false,
        current_book_id: null,
        total_pages_read: newTotalPages,
        total_reading_time: newTotalTime,
        last_reading_date: updatedLastReadingDate,
        streak_days: streakDays
      };

      // Only include recovery fields if they exist in the profile type to avoid 400 errors
      // until the database schema is updated
      if ('last_broken_streak' in (profile || {})) {
        updateData.last_broken_streak = lastBrokenStreak;
      }
      if ('consecutive_recoveries' in (profile || {})) {
        updateData.consecutive_recoveries = consecutiveRecoveries;
      }

      const { error: updateError } = await updateProfile(updateData);
      
      if (updateError) {
        console.error('Error updating profile stats:', updateError);
      }

      // Check for streak badges
      let newBadge = null;
      // We check if the current streak matches any of our badge thresholds
      // Note: We use the calculated streakDays which includes today's update
      console.log('Checking for badges. Streak:', streakDays);
      if (streakDays > 0 && STREAK_BADGES[streakDays as keyof typeof STREAK_BADGES]) {
        const badgeName = STREAK_BADGES[streakDays as keyof typeof STREAK_BADGES];
        console.log('Eligible for badge:', badgeName);
        
        try {
          // Find badge by name
          const { data: badgeData, error: badgeError } = await supabase
            .from('badges')
            .select('*')
            .eq('name', badgeName)
            .single();
            
          if (badgeError) {
             console.error('Error fetching badge data:', badgeError);
          }

          if (badgeData) {
            // Check if user already has it
            const { data: existingBadge } = await supabase
              .from('user_badges')
              .select('id')
              .eq('user_id', user.id)
              .eq('badge_id', badgeData.id)
              .maybeSingle();
              
            if (!existingBadge) {
              // Award badge
              const { error: awardError } = await supabase
                .from('user_badges')
                .insert({
                  user_id: user.id,
                  badge_id: badgeData.id
                });
                
              if (!awardError) {
                newBadge = badgeData;
              }
            }
          }
        } catch (error) {
          console.error('Error checking/awarding badge:', error);
        }
      }

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
      
      if (newBadge) {
        setAwardedBadge(newBadge);
      }
      
      return { session, newBadge };
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
      <BadgeAwardedDialog 
        open={!!awardedBadge} 
        onOpenChange={(open) => !open && setAwardedBadge(null)} 
        badge={awardedBadge} 
      />
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

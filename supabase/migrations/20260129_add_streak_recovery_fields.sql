-- Add columns for streak recovery system
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_broken_streak INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS consecutive_recoveries INTEGER DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_recovery_date DATE;

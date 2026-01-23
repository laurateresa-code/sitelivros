-- Update posts table type check constraint to include 'general'
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;

ALTER TABLE public.posts 
  ADD CONSTRAINT posts_type_check 
  CHECK (type IN ('started_reading', 'finished_reading', 'session_update', 'review', 'milestone', 'general'));

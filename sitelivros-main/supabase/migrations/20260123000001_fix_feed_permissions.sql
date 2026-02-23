-- Ensure robust functioning of the feed by fixing constraints and policies

-- 1. Fix 'type' constraint on posts table to allow 'general' posts
ALTER TABLE public.posts DROP CONSTRAINT IF EXISTS posts_type_check;
ALTER TABLE public.posts ADD CONSTRAINT posts_type_check 
  CHECK (type IN ('started_reading', 'finished_reading', 'session_update', 'review', 'milestone', 'general'));

-- 2. Ensure club_id column exists on posts table
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'club_id') THEN
        ALTER TABLE public.posts ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Reset and strengthen RLS policies for posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Users can view all posts" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can insert their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Create comprehensive policies

-- View: Everyone can view posts (simplifies feed logic)
CREATE POLICY "Public posts are viewable by everyone" ON public.posts
    FOR SELECT
    USING (true);

-- Insert: Authenticated users can create posts
CREATE POLICY "Users can insert their own posts" ON public.posts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Update: Users can only update their own posts
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Delete: Users can only delete their own posts
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Ensure real-time publication is enabled for posts
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

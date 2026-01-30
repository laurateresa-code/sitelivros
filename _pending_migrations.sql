
-- 1. Create Profiles Table (if not exists)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    bio TEXT,
    website TEXT,
    location TEXT,
    
    -- Gamification / Stats
    reader_level TEXT DEFAULT 'iniciante', -- iniciante, leitor, leitor_avido, devorador, mestre
    total_pages_read INTEGER DEFAULT 0,
    total_books_read INTEGER DEFAULT 0,
    total_reading_time INTEGER DEFAULT 0, -- in minutes
    streak_days INTEGER DEFAULT 0,
    last_reading_date TIMESTAMP WITH TIME ZONE,
    
    -- Reading Preferences
    favorite_genres TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create Books Table
CREATE TABLE IF NOT EXISTS public.books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    google_books_id TEXT UNIQUE,
    title TEXT NOT NULL,
    author TEXT,
    description TEXT,
    cover_url TEXT,
    page_count INTEGER,
    published_date DATE,
    categories TEXT[],
    isbn TEXT,
    average_rating DECIMAL(3, 2),
    total_ratings INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.profiles(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure RLS is enabled for books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for books (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Books are viewable by everyone') THEN
        CREATE POLICY "Books are viewable by everyone" ON public.books FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Authenticated users can insert books') THEN
        CREATE POLICY "Authenticated users can insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Book creators can update their books') THEN
        CREATE POLICY "Book creators can update their books" ON public.books FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

-- 3. Create User Books (Library)
CREATE TABLE IF NOT EXISTS public.user_books (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('reading', 'read', 'want_to_read', 'dropped')),
    current_page INTEGER DEFAULT 0,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    finished_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, book_id)
);

-- 4. Create Reading Sessions
CREATE TABLE IF NOT EXISTS public.reading_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
    pages_read INTEGER NOT NULL,
    start_page INTEGER,
    end_page INTEGER,
    duration_minutes INTEGER,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Create Posts (Feed)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE NOT NULL,
    book_id UUID REFERENCES public.books(id) ON DELETE SET NULL,
    reading_session_id UUID REFERENCES public.reading_sessions(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN ('started_reading', 'finished_reading', 'session_update', 'review', 'milestone', 'general')),
    content TEXT,
    rating INTEGER,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Add Invite Code to Clubs
ALTER TABLE public.clubs 
ADD COLUMN IF NOT EXISTS invite_code TEXT DEFAULT substring(replace(gen_random_uuid()::text, '-', ''), 1, 8);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'clubs_invite_code_idx') THEN
        CREATE UNIQUE INDEX clubs_invite_code_idx ON public.clubs (invite_code);
    END IF;
END $$;

UPDATE public.clubs SET invite_code = substring(replace(gen_random_uuid()::text, '-', ''), 1, 8) WHERE invite_code IS NULL;

-- 7. Badges and Rewards System
CREATE TABLE IF NOT EXISTS public.badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    icon_name TEXT, -- For using Lucide icons or internal asset names
    category TEXT DEFAULT 'challenge',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(user_id, badge_id)
);

-- RLS for Badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Badges viewable by everyone" ON public.badges FOR SELECT USING (true);
CREATE POLICY "User badges viewable by everyone" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Users can insert own badges" ON public.user_badges FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed initial badge for the current challenge
INSERT INTO public.badges (name, description, icon_name, category)
SELECT 'Leitor de Clássicos', 'Completou o desafio de ler um clássico da literatura.', 'BookOpen', 'challenge'
WHERE NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Leitor de Clássicos');

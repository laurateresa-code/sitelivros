-- Create challenges table
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT CHECK (type IN ('monthly', 'special')) DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create user_challenges table to track participation
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    status TEXT CHECK (status IN ('accepted', 'completed', 'failed')) DEFAULT 'accepted',
    progress INTEGER DEFAULT 0,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Policies for challenges
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON public.challenges;
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges
    FOR SELECT USING (true);

-- Policies for user_challenges
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenges
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join challenges" ON public.user_challenges;
CREATE POLICY "Users can join challenges" ON public.user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can update their own challenge progress" ON public.user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Insert the default "Leia um clássico" challenge for January 2026 if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE title = 'Leia um clássico' AND start_date = '2026-01-01') THEN
        INSERT INTO public.challenges (title, description, start_date, end_date, type)
        VALUES (
            'Leia um clássico',
            'Este mês, desafiamos você a ler uma obra clássica da literatura que você nunca leu antes.',
            '2026-01-01',
            '2026-01-31',
            'monthly'
        );
    END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload config';

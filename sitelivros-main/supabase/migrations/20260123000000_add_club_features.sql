
-- Add club_id to posts
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Create club_messages table
CREATE TABLE IF NOT EXISTS public.club_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

-- Policies for club_messages

-- Members can view club messages
CREATE POLICY "Members can view club messages" ON public.club_messages
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_messages.club_id
            AND user_id = auth.uid()
        )
    );

-- Members can insert club messages
CREATE POLICY "Members can insert club messages" ON public.club_messages
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_id = public.club_messages.club_id
            AND user_id = auth.uid()
        )
    );

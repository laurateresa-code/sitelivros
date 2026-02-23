
-- Create club_messages table
CREATE TABLE IF NOT EXISTS public.club_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Members can view club messages" ON public.club_messages;
CREATE POLICY "Members can view club messages" ON public.club_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = club_messages.club_id
            AND club_members.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Members can send club messages" ON public.club_messages;
CREATE POLICY "Members can send club messages" ON public.club_messages
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = club_messages.club_id
            AND club_members.user_id = auth.uid()
        )
    );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.club_messages;

-- Notify to reload schema cache
NOTIFY pgrst, 'reload config';

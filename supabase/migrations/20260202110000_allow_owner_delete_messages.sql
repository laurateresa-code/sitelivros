
-- Drop existing delete policy
DROP POLICY IF EXISTS "Users can delete their own club messages" ON public.club_messages;

-- Create new comprehensive delete policy
CREATE POLICY "Users can delete messages" ON public.club_messages
    FOR DELETE
    USING (
        -- User is the author
        auth.uid() = user_id 
        OR 
        -- User is the owner of the club
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = public.club_messages.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role = 'owner'
        )
    );

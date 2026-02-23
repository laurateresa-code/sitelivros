
-- Allow users to delete their own messages
CREATE POLICY "Users can delete their own club messages"
ON public.club_messages
FOR DELETE
USING (auth.uid() = user_id);

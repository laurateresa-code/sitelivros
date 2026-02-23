
-- Copie e cole este código no SQL Editor do seu projeto Supabase para corrigir o erro de permissão

-- 1. Remove políticas antigas que podem estar conflitando
DROP POLICY IF EXISTS "Users can delete their own club messages" ON public.club_messages;
DROP POLICY IF EXISTS "Users can delete messages" ON public.club_messages;

-- 2. Cria a nova política que permite deletar se for dono do clube OU autor da mensagem
CREATE POLICY "Users can delete messages" ON public.club_messages
    FOR DELETE
    USING (
        -- O usuário é o autor da mensagem
        auth.uid() = user_id 
        OR 
        -- O usuário é o dono do clube onde a mensagem foi postada
        EXISTS (
            SELECT 1 FROM public.club_members
            WHERE club_members.club_id = public.club_messages.club_id
            AND club_members.user_id = auth.uid()
            AND club_members.role = 'owner'
        )
    );

-- 3. Garante que o RLS está ativado
ALTER TABLE public.club_messages ENABLE ROW LEVEL SECURITY;

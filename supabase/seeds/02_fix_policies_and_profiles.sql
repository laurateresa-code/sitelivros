-- Ensure all users have profiles
INSERT INTO public.profiles (user_id, username, display_name)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'username', 'user_' || SUBSTRING(id::text, 1, 8)),
    COALESCE(raw_user_meta_data->>'display_name', raw_user_meta_data->>'username', 'Leitor')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.profiles);

-- Drop existing policies for posts to avoid conflicts/duplicates
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON public.posts;

-- Re-create policies
-- 1. Permitir SELECT para todos os usuários autenticados (conforme solicitado)
CREATE POLICY "Posts are viewable by authenticated users" ON public.posts
    FOR SELECT TO authenticated USING (true);

-- 2. Permitir INSERT apenas para usuários autenticados e seus próprios posts
CREATE POLICY "Users can create their own posts" ON public.posts
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Update/Delete policies (good practice)
CREATE POLICY "Users can update their own posts" ON public.posts
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 4. Delete policy (good practice)
CREATE POLICY "Users can delete their own posts" ON public.posts
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Ensure RLS is enabled
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Grant permissions
GRANT ALL ON public.posts TO authenticated;
-- Revoke SELECT from anon if we want to be strict, but RLS will block it anyway if no policy exists for anon.
-- However, we should ensure anon has no access if that's the goal.
-- RLS default is deny all. So if no policy for anon, anon cannot see.

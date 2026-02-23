-- Garante que a tabela existe
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT DEFAULT 'monthly',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilita RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;

-- Recria policy de leitura pública (DROP antes para garantir que não haja conflitos ou policies restritivas antigas)
DROP POLICY IF EXISTS "Challenges are viewable by everyone" ON public.challenges;
CREATE POLICY "Challenges are viewable by everyone" ON public.challenges
    FOR SELECT USING (true);

-- Insere desafio para JANEIRO 2026 (se não existir)
INSERT INTO public.challenges (title, description, start_date, end_date, type)
SELECT 'Leia um clássico', 'Este mês, desafiamos você a ler uma obra clássica da literatura que você nunca leu antes.', '2026-01-01', '2026-01-31', 'monthly'
WHERE NOT EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE start_date = '2026-01-01' AND type = 'monthly'
);

-- Insere desafio para FEVEREIRO 2026 (para garantir continuidade)
INSERT INTO public.challenges (title, description, start_date, end_date, type)
SELECT 'Ficção Científica', 'Explore novos mundos e tecnologias futuristas neste mês.', '2026-02-01', '2026-02-28', 'monthly'
WHERE NOT EXISTS (
    SELECT 1 FROM public.challenges 
    WHERE start_date = '2026-02-01' AND type = 'monthly'
);

-- Garante tabela user_challenges
CREATE TABLE IF NOT EXISTS public.user_challenges (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'accepted',
    progress INTEGER DEFAULT 0,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(user_id, challenge_id)
);

ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;

-- Policies user_challenges
DROP POLICY IF EXISTS "Users can view their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can view their own challenge progress" ON public.user_challenges
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can join challenges" ON public.user_challenges;
CREATE POLICY "Users can join challenges" ON public.user_challenges
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own challenge progress" ON public.user_challenges;
CREATE POLICY "Users can update their own challenge progress" ON public.user_challenges
    FOR UPDATE USING (auth.uid() = user_id);

-- Recarrega cache do schema
NOTIFY pgrst, 'reload config';

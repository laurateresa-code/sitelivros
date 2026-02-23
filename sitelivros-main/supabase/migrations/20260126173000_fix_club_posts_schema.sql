
-- Este script verifica se a coluna já existe antes de tentar criar
-- e tenta recarregar o cache do esquema da API

DO $$
BEGIN
    -- Verifica e adiciona a coluna club_id se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'club_id') THEN
        ALTER TABLE public.posts ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Cria o índice se não existir (para performance)
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON public.posts(club_id);

-- Força o recarregamento do cache do esquema da API (PostgREST)
-- Isso resolve o erro "Could not find the 'club_id' column... in the schema cache"
NOTIFY pgrst, 'reload schema';

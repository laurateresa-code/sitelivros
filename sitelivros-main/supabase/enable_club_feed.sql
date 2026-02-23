BEGIN;

-- 1. Adicionar coluna club_id na tabela posts
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- 2. Adicionar índice para performance
CREATE INDEX IF NOT EXISTS idx_posts_club_id ON public.posts(club_id);

-- 3. Atualizar constraint de tipo para permitir 'general' (usado em posts de clube)
DO $$
BEGIN
    -- Verifica se a constraint existe antes de tentar modificar
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'posts_type_check'
    ) THEN
        ALTER TABLE public.posts DROP CONSTRAINT posts_type_check;
        ALTER TABLE public.posts ADD CONSTRAINT posts_type_check 
        CHECK (type IN ('review', 'milestone', 'quote', 'note', 'general'));
    END IF;
END $$;

-- 4. Recarregar cache do esquema da API
NOTIFY pgrst, 'reload config';

COMMIT;

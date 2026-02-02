
-- Primeiro: Atualizar a estrutura da tabela
DO $$
BEGIN
    -- Adicionar coluna category se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'category') THEN
        ALTER TABLE public.badges ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    -- Adicionar coluna icon_name se não existir
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'icon_name') THEN
        ALTER TABLE public.badges ADD COLUMN icon_name TEXT;
    END IF;

    -- Tornar colunas antigas opcionais para flexibilidade
    ALTER TABLE public.badges ALTER COLUMN requirement_type DROP NOT NULL;
    ALTER TABLE public.badges ALTER COLUMN requirement_value DROP NOT NULL;
    ALTER TABLE public.badges ALTER COLUMN icon DROP NOT NULL;
END $$;

-- Segundo: Inserir as medalhas
INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
VALUES 
    ('Bom Começo', 'Completou seu primeiro dia de leitura!', 'Sparkles', 'streak', 'streak', 1),
    ('Aquecimento', 'Completou 3 dias seguidos de leitura!', 'Flame', 'streak', 'streak', 3),
    ('Leitor Dedicado', 'Completou 7 dias seguidos de leitura!', 'Zap', 'streak', 'streak', 7),
    ('Leitor Comprometido', 'Completou 14 dias seguidos de leitura!', 'Star', 'streak', 'streak', 14),
    ('Hábito de Ferro', 'Completou 30 dias seguidos de leitura!', 'Crown', 'streak', 'streak', 30)
ON CONFLICT (name) DO UPDATE 
SET 
    icon_name = EXCLUDED.icon_name,
    category = EXCLUDED.category,
    requirement_type = EXCLUDED.requirement_type,
    requirement_value = EXCLUDED.requirement_value;

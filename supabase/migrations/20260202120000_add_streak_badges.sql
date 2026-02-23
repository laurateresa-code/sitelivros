
-- Add category and icon_name columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'category') THEN
        ALTER TABLE public.badges ADD COLUMN category TEXT DEFAULT 'general';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'badges' AND column_name = 'icon_name') THEN
        ALTER TABLE public.badges ADD COLUMN icon_name TEXT;
    END IF;

    -- Make requirement columns nullable since we might use manual awarding or different logic
    ALTER TABLE public.badges ALTER COLUMN requirement_type DROP NOT NULL;
    ALTER TABLE public.badges ALTER COLUMN requirement_value DROP NOT NULL;
    ALTER TABLE public.badges ALTER COLUMN icon DROP NOT NULL;
END $$;

-- Ensure streak badges exist
DO $$
BEGIN
    -- 1 Day
    IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Bom Começo') THEN
        INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
        VALUES ('Bom Começo', 'Completou seu primeiro dia de leitura!', 'Sparkles', 'streak', 'streak', 1);
    END IF;

    -- 3 Days
    IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Aquecimento') THEN
        INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
        VALUES ('Aquecimento', 'Completou 3 dias seguidos de leitura!', 'Flame', 'streak', 'streak', 3);
    END IF;

    -- 7 Days
    IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Leitor Dedicado') THEN
        -- Check if it already exists (from initial seed) and update it to have icon_name/category if needed
        UPDATE public.badges 
        SET icon_name = 'Zap', category = 'streak' 
        WHERE name = 'Leitor Dedicado';
        
        -- If not exists (unlikely given seed), insert it
        INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
        VALUES ('Leitor Dedicado', 'Completou 7 dias seguidos de leitura!', 'Zap', 'streak', 'streak', 7)
        ON CONFLICT (name) DO NOTHING;
    END IF;

    -- 14 Days
    IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Leitor Comprometido') THEN
        INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
        VALUES ('Leitor Comprometido', 'Completou 14 dias seguidos de leitura!', 'Star', 'streak', 'streak', 14);
    END IF;

    -- 30 Days
    IF NOT EXISTS (SELECT 1 FROM public.badges WHERE name = 'Hábito de Ferro') THEN
        INSERT INTO public.badges (name, description, icon_name, category, requirement_type, requirement_value)
        VALUES ('Hábito de Ferro', 'Completou 30 dias seguidos de leitura!', 'Crown', 'streak', 'streak', 30);
    END IF;
END $$;

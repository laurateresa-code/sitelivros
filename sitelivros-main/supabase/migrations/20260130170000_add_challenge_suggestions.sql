-- Create challenge_suggestions table
CREATE TABLE IF NOT EXISTS public.challenge_suggestions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    challenge_id UUID REFERENCES public.challenges(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    author TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.challenge_suggestions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Suggestions are viewable by everyone" ON public.challenge_suggestions;
CREATE POLICY "Suggestions are viewable by everyone" ON public.challenge_suggestions
    FOR SELECT USING (true);

-- Seed suggestions for the default 'Leia um clássico' challenge
DO $$
DECLARE
    v_challenge_id UUID;
BEGIN
    SELECT id INTO v_challenge_id FROM public.challenges WHERE title = 'Leia um clássico' LIMIT 1;
    
    IF v_challenge_id IS NOT NULL THEN
        -- Check if suggestions already exist to avoid duplicates if run multiple times
        IF NOT EXISTS (SELECT 1 FROM public.challenge_suggestions WHERE challenge_id = v_challenge_id) THEN
            INSERT INTO public.challenge_suggestions (challenge_id, title, author)
            VALUES 
                (v_challenge_id, 'Dom Casmurro', 'Machado de Assis'),
                (v_challenge_id, 'Memórias Póstumas de Brás Cubas', 'Machado de Assis'),
                (v_challenge_id, 'O Cortiço', 'Aluísio Azevedo'),
                (v_challenge_id, 'Grande Sertão: Veredas', 'João Guimarães Rosa'),
                (v_challenge_id, 'Vidas Secas', 'Graciliano Ramos'),
                (v_challenge_id, 'Capitães da Areia', 'Jorge Amado'),
                (v_challenge_id, 'A Hora da Estrela', 'Clarice Lispector'),
                (v_challenge_id, 'O Grande Gatsby', 'F. Scott Fitzgerald'),
                (v_challenge_id, '1984', 'George Orwell'),
                (v_challenge_id, 'Orgulho e Preconceito', 'Jane Austen'),
                (v_challenge_id, 'Moby Dick', 'Herman Melville'),
                (v_challenge_id, 'Hamlet', 'William Shakespeare'),
                (v_challenge_id, 'Dom Quixote', 'Miguel de Cervantes'),
                (v_challenge_id, 'O Pequeno Príncipe', 'Antoine de Saint-Exupéry');
        END IF;
    END IF;
END $$;

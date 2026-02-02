
-- Adiciona coluna 'genero_literario' à tabela 'challenge_suggestions'
ALTER TABLE public.challenge_suggestions 
ADD COLUMN IF NOT EXISTS genero_literario TEXT;

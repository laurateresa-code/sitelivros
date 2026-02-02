
-- 1. Garante que a coluna existe (caso não tenha rodado a migration)
ALTER TABLE public.challenge_suggestions 
ADD COLUMN IF NOT EXISTS genero_literario TEXT;

-- 2. Insere sugestões para o desafio de Ficção Científica (Fevereiro 2026) com o Gênero
DO $$
DECLARE
    v_challenge_id UUID;
BEGIN
    -- Busca o ID do desafio de Ficção Científica
    SELECT id INTO v_challenge_id FROM public.challenges WHERE title = 'Ficção Científica' LIMIT 1;
    
    IF v_challenge_id IS NOT NULL THEN
        -- Remove sugestões antigas desse desafio para evitar duplicação
        DELETE FROM public.challenge_suggestions WHERE challenge_id = v_challenge_id;

        -- Insere novas sugestões com o gênero
        INSERT INTO public.challenge_suggestions (challenge_id, title, author, genero_literario)
        VALUES 
            (v_challenge_id, 'Duna', 'Frank Herbert', 'Ficção Científica'),
            (v_challenge_id, 'O Guia do Mochileiro das Galáxias', 'Douglas Adams', 'Ficção Científica'),
            (v_challenge_id, 'Neuromancer', 'William Gibson', 'Ficção Científica'),
            (v_challenge_id, 'Eu, Robô', 'Isaac Asimov', 'Ficção Científica'),
            (v_challenge_id, 'Fahrenheit 451', 'Ray Bradbury', 'Ficção Científica'),
            (v_challenge_id, 'A Mão Esquerda da Escuridão', 'Ursula K. Le Guin', 'Ficção Científica'),
            (v_challenge_id, 'O Fim da Infância', 'Arthur C. Clarke', 'Ficção Científica'),
            (v_challenge_id, 'Admirável Mundo Novo', 'Aldous Huxley', 'Ficção Científica'),
            (v_challenge_id, 'Blade Runner', 'Philip K. Dick', 'Ficção Científica'),
            (v_challenge_id, 'Fundação', 'Isaac Asimov', 'Ficção Científica'),
            (v_challenge_id, 'Solaris', 'Stanislaw Lem', 'Ficção Científica'),
            (v_challenge_id, 'Tropas Estelares', 'Robert A. Heinlein', 'Ficção Científica'),
            (v_challenge_id, '2001: Uma Odisseia no Espaço', 'Arthur C. Clarke', 'Ficção Científica'),
            (v_challenge_id, 'Guerra dos Mundos', 'H.G. Wells', 'Ficção Científica'),
            (v_challenge_id, 'O Homem do Castelo Alto', 'Philip K. Dick', 'Ficção Científica');
    END IF;
END $$;


-- Adiciona sugestões para o desafio de Ficção Científica (Fevereiro)
DO $$
DECLARE
    v_challenge_id UUID;
BEGIN
    -- Busca o ID do desafio de Ficção Científica
    SELECT id INTO v_challenge_id FROM public.challenges WHERE title = 'Ficção Científica' LIMIT 1;
    
    IF v_challenge_id IS NOT NULL THEN
        -- Verifica se já existem sugestões para evitar duplicação
        IF NOT EXISTS (SELECT 1 FROM public.challenge_suggestions WHERE challenge_id = v_challenge_id) THEN
            INSERT INTO public.challenge_suggestions (challenge_id, title, author)
            VALUES 
                (v_challenge_id, 'Duna', 'Frank Herbert'),
                (v_challenge_id, 'O Guia do Mochileiro das Galáxias', 'Douglas Adams'),
                (v_challenge_id, 'Neuromancer', 'William Gibson'),
                (v_challenge_id, 'Eu, Robô', 'Isaac Asimov'),
                (v_challenge_id, 'Fahrenheit 451', 'Ray Bradbury'),
                (v_challenge_id, 'A Mão Esquerda da Escuridão', 'Ursula K. Le Guin'),
                (v_challenge_id, 'O Fim da Infância', 'Arthur C. Clarke'),
                (v_challenge_id, 'Admirável Mundo Novo', 'Aldous Huxley'),
                (v_challenge_id, 'Blade Runner', 'Philip K. Dick'),
                (v_challenge_id, 'Fundação', 'Isaac Asimov'),
                (v_challenge_id, 'Solaris', 'Stanislaw Lem'),
                (v_challenge_id, 'Tropas Estelares', 'Robert A. Heinlein');
        END IF;
    END IF;
END $$;

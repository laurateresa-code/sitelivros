-- Script para popular posts iniciais se houver usuários
-- Execute isso no SQL Editor do Supabase

DO $$
DECLARE
    v_user_id UUID;
    v_book_id UUID;
BEGIN
    -- Pegar o primeiro usuário encontrado
    SELECT id INTO v_user_id FROM auth.users LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- Garantir que o perfil existe
        INSERT INTO public.profiles (user_id, username, display_name, reader_level)
        VALUES (v_user_id, 'usuario_demo', 'Usuário Demo', 'iniciante')
        ON CONFLICT (user_id) DO NOTHING;

        -- Criar um livro de exemplo
        INSERT INTO public.books (title, author, description, cover_url)
        VALUES (
            'O Senhor dos Anéis: A Sociedade do Anel', 
            'J.R.R. Tolkien', 
            'O primeiro volume da trilogia épica.',
            'https://m.media-amazon.com/images/I/81SM0D5+DwL._AC_UF1000,1000_QL80_.jpg'
        )
        RETURNING id INTO v_book_id;

        -- Criar posts variados
        
        -- Post 1: Começou a ler
        INSERT INTO public.posts (user_id, book_id, type, content, created_at)
        VALUES (
            v_user_id, 
            v_book_id, 
            'started_reading', 
            'Finalmente começando esta jornada pela Terra Média!', 
            NOW() - INTERVAL '2 days'
        );

        -- Post 2: Milestone
        INSERT INTO public.posts (user_id, book_id, type, content, created_at)
        VALUES (
            v_user_id, 
            v_book_id, 
            'milestone', 
            'Cheguei em Valfenda. A descrição é incrível.', 
            NOW() - INTERVAL '1 day'
        );

        -- Post 3: General
        INSERT INTO public.posts (user_id, type, content, created_at)
        VALUES (
            v_user_id, 
            'general', 
            'Alguém tem recomendações de livros de fantasia com sistemas de magia complexos?', 
            NOW()
        );
        
    END IF;
END $$;

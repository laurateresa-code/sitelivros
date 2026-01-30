-- Ensure RLS is enabled for books
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for books (if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Books are viewable by everyone') THEN
        CREATE POLICY "Books are viewable by everyone" ON public.books FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Authenticated users can insert books') THEN
        CREATE POLICY "Authenticated users can insert books" ON public.books FOR INSERT TO authenticated WITH CHECK (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'books' AND policyname = 'Book creators can update their books') THEN
        CREATE POLICY "Book creators can update their books" ON public.books FOR UPDATE USING (auth.uid() = created_by);
    END IF;
END $$;

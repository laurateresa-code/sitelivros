
ALTER TABLE public.user_challenges 
ADD COLUMN IF NOT EXISTS book_id UUID REFERENCES public.books(id);

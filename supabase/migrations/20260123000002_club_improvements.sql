-- Add nickname to club_members
ALTER TABLE public.club_members ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Ensure cover_url exists in clubs
ALTER TABLE public.clubs ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- Add club_id to posts if not exists (fixes "couldn't find the 'club_id' column" error)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'posts' AND column_name = 'club_id') THEN
        ALTER TABLE public.posts ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Function to update member_count
CREATE OR REPLACE FUNCTION update_club_member_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.clubs
        SET member_count = member_count + 1
        WHERE id = NEW.club_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.clubs
        SET member_count = member_count - 1
        WHERE id = OLD.club_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger for member_count
DROP TRIGGER IF EXISTS update_club_member_count_trigger ON public.club_members;
CREATE TRIGGER update_club_member_count_trigger
AFTER INSERT OR DELETE ON public.club_members
FOR EACH ROW
EXECUTE FUNCTION update_club_member_count();

-- Recalculate existing counts to ensure accuracy
UPDATE public.clubs c
SET member_count = (
    SELECT COUNT(*)
    FROM public.club_members cm
    WHERE cm.club_id = c.id
);

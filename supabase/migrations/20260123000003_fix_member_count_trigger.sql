-- Fix permission issue for member count trigger
-- The function must be SECURITY DEFINER to allow updates to clubs table
-- even when the user (member joining) is not the owner of the club.

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recalculate counts one more time to fix any discrepancies
UPDATE public.clubs c
SET member_count = (
    SELECT COUNT(*)
    FROM public.club_members cm
    WHERE cm.club_id = c.id
);

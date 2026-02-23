
-- Add club_id to posts table
ALTER TABLE public.posts 
ADD COLUMN club_id UUID REFERENCES public.clubs(id) ON DELETE CASCADE;

-- Create index for performance
CREATE INDEX idx_posts_club_id ON public.posts(club_id);

-- Update RLS policies for posts to handle club privacy
-- (Optional: refine policies later if strict club privacy is needed, 
-- currently 'Posts are viewable by everyone' covers it)

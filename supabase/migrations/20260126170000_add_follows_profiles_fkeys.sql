
-- Add FKs to profiles to enable joining follows with profiles
ALTER TABLE public.follows
ADD CONSTRAINT follows_follower_profile_fkey
FOREIGN KEY (follower_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

ALTER TABLE public.follows
ADD CONSTRAINT follows_following_profile_fkey
FOREIGN KEY (following_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

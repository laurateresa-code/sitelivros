
-- Add FK to profiles to enable joining posts with profiles
ALTER TABLE public.posts
ADD CONSTRAINT posts_profiles_fk
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Add FK to profiles to enable joining comments with profiles
ALTER TABLE public.comments
ADD CONSTRAINT comments_profiles_fk
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

-- Add FK to profiles to enable joining likes with profiles
ALTER TABLE public.likes
ADD CONSTRAINT likes_profiles_fk
FOREIGN KEY (user_id)
REFERENCES public.profiles(user_id)
ON DELETE CASCADE;

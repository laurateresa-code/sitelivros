
-- Enable realtime for comments and comment_likes
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;

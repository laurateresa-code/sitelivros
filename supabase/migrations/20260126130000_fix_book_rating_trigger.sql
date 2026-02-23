-- Function to calculate and update book rating
CREATE OR REPLACE FUNCTION public.update_book_rating()
RETURNS TRIGGER AS $$
DECLARE
  target_book_id UUID;
BEGIN
  IF (TG_OP = 'DELETE') THEN
    target_book_id := OLD.book_id;
  ELSE
    target_book_id := NEW.book_id;
  END IF;

  UPDATE public.books
  SET 
    average_rating = (
      SELECT COALESCE(AVG(rating), 0)
      FROM public.user_books
      WHERE book_id = target_book_id AND rating IS NOT NULL
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM public.user_books
      WHERE book_id = target_book_id AND rating IS NOT NULL
    )
  WHERE id = target_book_id;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function on user_books changes
DROP TRIGGER IF EXISTS on_rating_change ON public.user_books;
CREATE TRIGGER on_rating_change
AFTER INSERT OR UPDATE OF rating OR DELETE ON public.user_books
FOR EACH ROW
EXECUTE FUNCTION public.update_book_rating();

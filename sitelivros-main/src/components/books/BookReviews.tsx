import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Post } from '@/types';
import { PostCard } from '@/components/feed/PostCard';
import { Loader2, MessageSquare } from 'lucide-react';
import { useFeed } from '@/hooks/useFeed';
import { CreateReviewDialog } from '@/components/books/CreateReviewDialog';
import { useAuth } from '@/hooks/useAuth';

interface BookReviewsProps {
  bookId: string;
}

export function BookReviews({ bookId }: BookReviewsProps) {
  const [reviews, setReviews] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { likePost, unlikePost } = useFeed();
  const { user } = useAuth();

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch posts (reviews) for this book
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('book_id', bookId)
        .eq('type', 'review')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setReviews([]);
        setLoading(false);
        return;
      }

      // 2. Collect IDs for related data
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      // bookId is already known, but we might need book details if not passed? 
      // Actually BookReviews is inside BookDetails, but PostCard expects a 'book' object.
      // We can fetch the book details once or just reuse what we have if we had it, 
      // but here we are isolated. Let's fetch the book info for the cards.
      
      // 3. Fetch related data in parallel
      const [profilesResult, booksResult, likesResult] = await Promise.all([
        userIds.length > 0 
          ? supabase.from('profiles').select('*').in('user_id', userIds)
          : Promise.resolve({ data: [] }),
        supabase.from('books').select('*').eq('id', bookId).single(),
        user 
          ? supabase.from('likes').select('post_id').eq('user_id', user.id).in('post_id', postsData.map(p => p.id))
          : Promise.resolve({ data: [] })
      ]);

      const profilesMap = new Map((profilesResult.data || []).map(p => [p.user_id, p]));
      const bookData = booksResult.data; // Single book
      const likedPostIds = (likesResult.data || []).map(l => l.post_id);

      // 4. Format posts
      const formattedReviews = postsData.map(post => {
        const profile = profilesMap.get(post.user_id);
        
        return {
          ...post,
          profile: profile || {
            id: post.user_id,
            user_id: post.user_id,
            username: 'Unknown',
            display_name: 'Usuário',
            avatar_url: null,
            reader_level: 'iniciante'
          },
          book: bookData, // All reviews are for this book
          reading_session: null, // Reviews usually don't have reading session displayed in this context, or we can fetch if needed
          liked_by_user: likedPostIds.includes(post.id)
        };
      }) as Post[];

      setReviews(formattedReviews);
    } catch (error) {
      console.error('Error fetching book reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [bookId, user]);

  useEffect(() => {
    if (bookId) {
      fetchReviews();

      const channel = supabase
        .channel(`reviews-${bookId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
            filter: `book_id=eq.${bookId}`,
          },
          () => {
            fetchReviews();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [bookId, fetchReviews]);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold font-display">
          Avaliações da Comunidade
        </h3>
        {user && (
          <CreateReviewDialog bookId={bookId} onReviewCreated={fetchReviews} />
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-muted/30 rounded-lg border border-dashed">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="font-semibold text-lg mb-2">Nenhuma avaliação ainda</h3>
          <p className="text-muted-foreground">
            Seja o primeiro a avaliar este livro!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={likePost}
              onUnlike={unlikePost}
            />
          ))}
        </div>
      )}
    </div>
  );
}

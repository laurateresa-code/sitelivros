import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserBook, Book } from '@/types';
import { useAuth } from './useAuth';

export function useUserBooks(userId?: string) {
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const targetUserId = userId || user?.id;

  const fetchBooks = useCallback(async () => {
    if (!targetUserId) {
      setBooks([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('user_books')
        .select(`
          *,
          books (*)
        `)
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const formattedBooks = (data || []).map(ub => ({
        ...ub,
        book: ub.books,
      })) as UserBook[];

      setBooks(formattedBooks);
    } catch (error) {
      console.error('Error fetching user books:', error);
    } finally {
      setLoading(false);
    }
  }, [targetUserId]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const addToList = useCallback(async (
    book: Book,
    status: 'reading' | 'read' | 'want_to_read'
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const existingEntry = books.find(b => b.book_id === book.id);
    const now = new Date().toISOString();

    let started_at: string | null = null;
    let finished_at: string | null = null;
    let current_page = existingEntry?.current_page || 0;

    if (status === 'reading') {
      started_at = existingEntry?.started_at || now;
      finished_at = null;
    } else if (status === 'read') {
      started_at = existingEntry?.started_at || null;
      finished_at = existingEntry?.status === 'read' && existingEntry.finished_at 
        ? existingEntry.finished_at 
        : now;
      
      if (book.page_count) {
        current_page = book.page_count;
      }
    } else {
      // want_to_read
      started_at = null;
      finished_at = null;
      current_page = 0;
    }

    const { error } = await supabase
      .from('user_books')
      .upsert({
        id: existingEntry?.id,
        user_id: user.id,
        book_id: book.id,
        status,
        started_at,
        finished_at,
        current_page,
        updated_at: now
      }, {
        onConflict: 'user_id,book_id'
      });

    if (!error) {
      // Create post if starting or finishing a book
      if ((status === 'reading' || status === 'read') && existingEntry?.status !== status) {
        await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            book_id: book.id,
            type: status === 'reading' ? 'started_reading' : 'finished_reading',
            content: status === 'reading'
              ? `Começou a ler "${book.title}"`
              : `Terminou de ler "${book.title}"`,
          });
      }

      fetchBooks();
    }

    return { error };
  }, [user, fetchBooks, books]);

  const updateBook = useCallback(async (
    bookId: string,
    updates: Partial<UserBook>
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_books')
      .update(updates)
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (!error) {
      fetchBooks();
    }

    return { error };
  }, [user, fetchBooks]);

  const rateBook = useCallback(async (
    bookId: string,
    rating: number,
    review?: string
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_books')
      .update({ rating, review })
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (!error) {
      // Recalculate book average rating
      const { data: ratingsData } = await supabase
        .from('user_books')
        .select('rating')
        .eq('book_id', bookId)
        .not('rating', 'is', null);

      if (ratingsData) {
        const totalRatings = ratingsData.length;
        const sumRatings = ratingsData.reduce((acc, curr) => acc + (curr.rating || 0), 0);
        const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

        await supabase
          .from('books')
          .update({ 
            average_rating: averageRating,
            total_ratings: totalRatings
          })
          .eq('id', bookId);
      }

      // Handle Post creation/update for Community Reviews
      const { data: existingPosts } = await supabase
        .from('posts')
        .select('id')
        .eq('user_id', user.id)
        .eq('book_id', bookId)
        .eq('type', 'review')
        .limit(1);

      const existingPost = existingPosts?.[0];

      if (existingPost) {
        const postUpdate: any = { rating };
        if (review !== undefined) {
          postUpdate.content = review;
        }
        
        await supabase
          .from('posts')
          .update(postUpdate)
          .eq('id', existingPost.id);
      } else {
        await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            book_id: bookId,
            type: 'review',
            content: review || '',
            rating,
          });
      }

      fetchBooks();
    }

    return { error };
  }, [user, fetchBooks]);

  const removeBook = useCallback(async (bookId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('user_books')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (!error) {
      setBooks(prev => prev.filter(b => b.book_id !== bookId));
      
      // Also update profile if this was the current book
      const { data: profile } = await supabase
        .from('profiles')
        .select('current_book_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.current_book_id === bookId) {
        await supabase
          .from('profiles')
          .update({ 
            is_reading_now: false, 
            current_book_id: null 
          })
          .eq('id', user.id);
      }
    }

    return { error };
  }, [user]);

  return {
    books,
    readingBooks: books.filter(b => b.status === 'reading'),
    readBooks: books.filter(b => b.status === 'read'),
    wantToReadBooks: books.filter(b => b.status === 'want_to_read'),
    loading,
    addToList,
    removeBook,
    refresh: fetchBooks
  };
}

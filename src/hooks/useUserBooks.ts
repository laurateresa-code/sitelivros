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

    const { error } = await supabase
      .from('user_books')
      .upsert({
        user_id: user.id,
        book_id: book.id,
        status,
        started_at: status === 'reading' ? new Date().toISOString() : null,
        finished_at: status === 'read' ? new Date().toISOString() : null,
      });

    if (!error) {
      // Create post if starting or finishing a book
      if (status === 'reading' || status === 'read') {
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
  }, [user, fetchBooks]);

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
      if (review) {
        await supabase
          .from('posts')
          .insert({
            user_id: user.id,
            book_id: bookId,
            type: 'review',
            content: review,
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
      fetchBooks();
    }

    return { error };
  }, [user, fetchBooks]);

  return {
    books,
    loading,
    refetch: fetchBooks,
    addToList,
    updateBook,
    rateBook,
    removeBook,
    readingBooks: books.filter(b => b.status === 'reading'),
    readBooks: books.filter(b => b.status === 'read'),
    wantToReadBooks: books.filter(b => b.status === 'want_to_read'),
  };
}

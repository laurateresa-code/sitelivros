import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book, GoogleBookResult } from '@/types';

export function useBooks() {
  const [loading, setLoading] = useState(false);

  const searchGoogleBooks = useCallback(async (query: string): Promise<GoogleBookResult[]> => {
    if (!query.trim()) return [];
    
    try {
      const response = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
      );
      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error searching Google Books:', error);
      return [];
    }
  }, []);

  const addBookFromGoogle = useCallback(async (googleBook: GoogleBookResult, userId: string): Promise<Book | null> => {
    setLoading(true);
    
    try {
      // Check if book already exists
      const { data: existingBook } = await supabase
        .from('books')
        .select('*')
        .eq('google_books_id', googleBook.id)
        .maybeSingle();

      if (existingBook) {
        setLoading(false);
        return existingBook as Book;
      }

      const volumeInfo = googleBook.volumeInfo;
      const isbn = volumeInfo.industryIdentifiers?.find(
        id => id.type === 'ISBN_13' || id.type === 'ISBN_10'
      )?.identifier;

      const { data, error } = await supabase
        .from('books')
        .insert({
          google_books_id: googleBook.id,
          title: volumeInfo.title,
          author: volumeInfo.authors?.join(', ') || null,
          description: volumeInfo.description || null,
          cover_url: volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          page_count: volumeInfo.pageCount || null,
          published_date: volumeInfo.publishedDate || null,
          categories: volumeInfo.categories || null,
          isbn: isbn || null,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    } catch (error) {
      console.error('Error adding book:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addManualBook = useCallback(async (
    bookData: Partial<Book>,
    userId: string
  ): Promise<Book | null> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('books')
        .insert({
          ...bookData,
          created_by: userId,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Book;
    } catch (error) {
      console.error('Error adding manual book:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getBook = useCallback(async (bookId: string): Promise<Book | null> => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', bookId)
      .single();

    if (error) {
      console.error('Error fetching book:', error);
      return null;
    }
    return data as Book;
  }, []);

  const getPopularBooks = useCallback(async (): Promise<Book[]> => {
    // Fetch books with most ratings or just recent ones as a proxy for "popular" in the app context
    // Ideally this would order by a popularity metric
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('total_ratings', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching popular books:', error);
      return [];
    }
    return data as Book[];
  }, []);

  return {
    loading,
    searchGoogleBooks,
    addBookFromGoogle,
    addManualBook,
    getBook,
    getPopularBooks,
  };
}

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book, GoogleBookResult } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function useBooks() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchGoogleBooks = useCallback(async (query: string): Promise<GoogleBookResult[]> => {
    if (!query.trim()) return [];
    
    const cacheKey = `google_books_cache_${query}`;
    const cachedData = localStorage.getItem(cacheKey);
    
    if (cachedData) {
      try {
        const parsed = JSON.parse(cachedData);
        // Valid for 24 hours
        if (Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000) {
          console.log('Using cached data for:', query);
          return parsed.items;
        }
      } catch (e) {
        console.error('Error parsing cache:', e);
        localStorage.removeItem(cacheKey);
      }
    }

    try {
      // Helper to fetch with retry for 429 errors
      const fetchWithRetry = async (attempt = 0): Promise<Response> => {
        try {
          const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10`
          );
          // If rate limited, retry with exponential backoff
          if (res.status === 429 && attempt < 2) {
             console.warn(`Rate limit hit for ${query}, retrying... (Attempt ${attempt + 1})`);
             await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1))); // 2s, 4s
             return fetchWithRetry(attempt + 1);
          }
          return res;
        } catch (err) {
          // Network errors, retry as well
          if (attempt < 2) {
             await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
             return fetchWithRetry(attempt + 1);
          }
          throw err;
        }
      };

      const response = await fetchWithRetry();
      
      if (!response.ok) {
        if (response.status === 503 || response.status === 429) {
          console.warn('Rate limit or Service Unavailable, returning cached data if available');
          // If still failing, try to return stale cache if exists
          if (cachedData) {
            const parsed = JSON.parse(cachedData);
            return parsed.items;
          }
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      let items: GoogleBookResult[] = data.items || [];
      
      // Deduplicate items based on Title + Author
      if (items.length > 0) {
        const seen = new Set<string>();
        items = items.filter(item => {
          const title = item.volumeInfo.title?.toLowerCase().trim() || '';
          const authors = item.volumeInfo.authors?.map(a => a.toLowerCase().trim()).sort().join(',') || '';
          const key = `${title}|${authors}`;
          
          if (seen.has(key)) return false;
          
          // Filter out "collector's edition", "box set", etc if needed
          // For now, basic deduplication is the main goal. 
          // We keep the first occurrence which is usually the most relevant/popular result.
          seen.add(key);
          return true;
        });

        localStorage.setItem(cacheKey, JSON.stringify({
          timestamp: Date.now(),
          items
        }));
      }
      
      return items;
    } catch (error) {
      console.error('Error searching Google Books:', error);
      // Fallback to cache on error even if expired
      if (cachedData) {
         try {
           return JSON.parse(cachedData).items;
         } catch { return []; }
      }
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
      toast({
        title: 'Erro ao salvar livro',
        description: 'Não foi possível salvar o livro no banco de dados. Verifique se as migrações foram aplicadas.',
        variant: 'destructive',
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

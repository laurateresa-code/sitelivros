import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Book } from '@/types';
import { useAuth } from './useAuth';

export function useRecommendations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecommendations() {
      if (!user) {
        setLoading(false);
        return;
      }

      setLoading(true);

      try {
        // 1. Get user's read/reading books to understand taste
        const { data: userBooks, error: userBooksError } = await supabase
          .from('user_books')
          .select('book_id, books(id, author, categories)')
          .eq('user_id', user.id);

        if (userBooksError) throw userBooksError;

        // Collect owned IDs to exclude them later
        const ownedBookIds = new Set(userBooks?.map(ub => ub.book_id) || []);

        // If user has no books, fetch popular ones
        if (!userBooks || userBooks.length === 0) {
          const { data: popular } = await supabase
            .from('books')
            .select('*')
            .order('total_ratings', { ascending: false })
            .limit(10);
          
          setRecommendations(popular as Book[] || []);
          setLoading(false);
          return;
        }

        // 2. Extract preferences
        const authors = new Set<string>();
        const categories = new Set<string>();

        userBooks.forEach(ub => {
          if (ub.books) {
            // @ts-ignore - Supabase types might be inferred incorrectly for joined tables
            const book = ub.books;
            if (book.author) authors.add(book.author);
            if (book.categories && Array.isArray(book.categories)) {
              book.categories.forEach((c: string) => categories.add(c));
            }
          }
        });

        // 3. Fetch Recommendations
        // Strategy: Get books with overlapping categories or same authors
        const categoryList = Array.from(categories).slice(0, 8); // Take top genres
        
        let query = supabase.from('books').select('*');

        // Build filter
        if (categoryList.length > 0) {
          // Use overlaps for array column
          query = query.overlaps('categories', categoryList);
        } else {
           // Fallback to generic popular if no categories found
           query = query.order('total_ratings', { ascending: false });
        }
        
        const { data: recommendedBooks, error: recError } = await query.limit(20);

        if (recError) {
          console.error('Error fetching recommendations (strategy 1):', recError);
        }

        // 4. Filter and Shuffle
        let filtered = (recommendedBooks as Book[] || [])
          .filter(b => !ownedBookIds.has(b.id)); // Exclude books user already has

        // Simple shuffle
        filtered = filtered.sort(() => Math.random() - 0.5).slice(0, 10);

        // If we filtered everything out (e.g. user read all recommended) or query returned nothing
        if (filtered.length < 5) {
           console.log('Recommendations low, fetching fallback popular books...');
           const { data: popular, error: popularError } = await supabase
            .from('books')
            .select('*')
            .order('total_ratings', { ascending: false })
            .limit(20);
           
           if (popularError) {
             console.error('Error fetching popular fallback:', popularError);
           }

           if (popular) {
             const popularFiltered = (popular as Book[]).filter(b => !ownedBookIds.has(b.id));
             
             // Avoid duplicates
             const existingIds = new Set(filtered.map(b => b.id));
             const uniquePopular = popularFiltered.filter(b => !existingIds.has(b.id));
             
             filtered = [...filtered, ...uniquePopular].slice(0, 10);
           }
        }

        // FINAL FALLBACK: If still nothing, just get *any* books
        if (filtered.length === 0) {
           console.log('Recommendations still empty, fetching ANY books...');
           const { data: anyBooks, error: anyError } = await supabase
             .from('books')
             .select('*')
             .limit(10);
             
           if (!anyError && anyBooks) {
             const finalFallback = (anyBooks as Book[]).filter(b => !ownedBookIds.has(b.id));
             filtered = finalFallback.slice(0, 10);
           }
        }

        console.log('Final recommendations count:', filtered.length);
        setRecommendations(filtered);

      } catch (error) {
        console.error('Error fetching recommendations:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [user]);

  return { recommendations, loading };
}

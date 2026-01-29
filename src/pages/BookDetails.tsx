import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { useBooks } from '@/hooks/useBooks';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Book, UserBook } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { StarRating } from '@/components/ui/StarRating';
import { supabase } from '@/integrations/supabase/client';
import { BookOpen, Calendar, FileText, Share2, Clock, Check, Loader2, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ReadingSessionModal } from '@/components/reading/ReadingSessionModal';
import { BookReviews } from '@/components/books/BookReviews';
import { useAuth } from '@/hooks/useAuth';

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [userBook, setUserBook] = useState<UserBook | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const { getBook } = useBooks();
  const { books, addToList, updateBook, rateBook } = useUserBooks(); // books from useUserBooks contains current user's books
  const { user } = useAuth();
  const { toast } = useToast();
  const [isReadingSessionOpen, setIsReadingSessionOpen] = useState(false);

  const loadBook = useCallback(async () => {
    if (!id) return;
    // Don't set loading to true here to avoid flashing content on updates
    // setLoading(true); 
    
    // Fetch book details
    const bookData = await getBook(id);
    
    // Fetch real-time stats directly from user_books to handle RLS update delays/restrictions
    const { data: statsData } = await supabase
      .from('user_books')
      .select('rating')
      .eq('book_id', id)
      .not('rating', 'is', null);
      
    if (statsData && bookData) {
      const total = statsData.length;
      const sum = statsData.reduce((acc, curr) => acc + (curr.rating || 0), 0);
      const avg = total > 0 ? sum / total : 0;
      
      bookData.average_rating = avg;
      bookData.total_ratings = total;
    }

    setBook(bookData);

    // Check if user has this book
    const foundUserBook = books.find(b => b.book_id === id);
    setUserBook(foundUserBook);

    setLoading(false);
  }, [id, books, getBook]);

  useEffect(() => {
    setLoading(true); // Initial loading
    loadBook();

    // Subscribe to real-time updates for this book
    const channel = supabase
      .channel(`book-detail-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log('Book updated:', payload);
          setBook(payload.new as Book);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadBook, id]);

  const handleStatusChange = async (status: 'reading' | 'read' | 'want_to_read') => {
    if (!book || !user) return;

    const { error } = await addToList(book, status);
    
    if (error) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' });
    } else {
      toast({ title: 'Status atualizado com sucesso!' });
      loadBook(); // Refresh book data
    }
  };

  const handleRating = async (rating: number) => {
    if (!book || !user) return;
    
    const { error } = await rateBook(book.id, rating);
    
    if (error) {
      toast({ title: 'Erro ao avaliar', variant: 'destructive' });
    } else {
      toast({ title: 'Avaliação salva!' });
      loadBook(); // Refresh book data to show new average
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!book) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Livro não encontrado</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="grid md:grid-cols-[300px_1fr] gap-8">
          {/* Cover */}
          <div className="space-y-4">
            <div className="aspect-[2/3] rounded-lg overflow-hidden shadow-2xl">
              {book.cover_url ? (
                <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <BookOpen className="w-20 h-20 text-muted-foreground/50" />
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant={userBook?.status === 'want_to_read' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleStatusChange('want_to_read')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Quero
              </Button>
              <Button 
                variant={userBook?.status === 'reading' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleStatusChange('reading')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Lendo
              </Button>
              <Button 
                variant={userBook?.status === 'read' ? 'default' : 'outline'}
                className="w-full"
                onClick={() => handleStatusChange('read')}
              >
                <Check className="w-4 h-4 mr-2" />
                Lido
              </Button>
            </div>

            {userBook?.status === 'reading' && (
               <>
                 <Button 
                   className="w-full mt-2" 
                   onClick={() => setIsReadingSessionOpen(true)}
                 >
                   <Play className="w-4 h-4 mr-2" />
                   Registrar Sessão
                 </Button>
                 <ReadingSessionModal 
                   open={isReadingSessionOpen}
                   onOpenChange={setIsReadingSessionOpen}
                   userBook={userBook}
                 />
               </>
            )}
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold font-display mb-2">{book.title}</h1>
              <p className="text-xl text-muted-foreground">{book.author}</p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <StarRating rating={Math.round(book.average_rating)} readonly />
                <span className="font-bold text-lg">{book.average_rating.toFixed(1)}</span>
                <span className="text-muted-foreground">({book.total_ratings} avaliações)</span>
              </div>
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground border-y py-4">
              {book.page_count && (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  {book.page_count} páginas
                </div>
              )}
              {book.published_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(book.published_date).getFullYear()}
                </div>
              )}
            </div>

            <div className="prose prose-gray dark:prose-invert max-w-none">
              <h3 className="text-lg font-semibold mb-2">Sinopse</h3>
              <p className="leading-relaxed text-muted-foreground">
                {book.description || 'Nenhuma descrição disponível.'}
              </p>
            </div>

            {/* User Review Section */}
            {userBook && (
              <Card className="bg-muted/30">
                <CardContent className="pt-6 space-y-4">
                  <h3 className="font-semibold">Sua Avaliação</h3>
                  <div className="flex items-center gap-4">
                    <StarRating 
                      rating={userBook.rating || 0} 
                      onRatingChange={handleRating}
                      size="lg"
                    />
                    <span className="text-sm text-muted-foreground">
                      {userBook.rating ? 'Toque para alterar' : 'Toque para avaliar'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Community Reviews */}
            <BookReviews bookId={book.id} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

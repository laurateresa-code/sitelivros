import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Clock, Play } from 'lucide-react';
import { ReadingSessionModal } from '@/components/reading/ReadingSessionModal';
import { UserBook } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function WantToRead() {
  const { wantToReadBooks, loading, addToList } = useUserBooks();
  const [expanded, setExpanded] = useState(false);
  const [sessionBook, setSessionBook] = useState<UserBook | null>(null);
  const { toast } = useToast();

  const handleStartReading = async (userBook: UserBook) => {
    if (!userBook.book) return;

    const { error } = await addToList(userBook.book, 'reading');
    
    if (error) {
      toast({ title: 'Erro ao iniciar leitura', variant: 'destructive' });
      return;
    }

    setSessionBook({ ...userBook, status: 'reading' });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary" />
          Quero Ler
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : wantToReadBooks.length > 0 ? (
          <div className="space-y-3">
            {(expanded ? wantToReadBooks : wantToReadBooks.slice(0, 5)).map(ub => (
              <div key={ub.id} className="flex gap-3 items-center group">
                <div className="w-10 h-14 bg-muted rounded overflow-hidden flex-shrink-0 transition-all duration-300 group-hover:shadow-md group-hover:scale-105 group-hover:rotate-2">
                  {ub.book?.cover_url && (
                    <img src={ub.book.cover_url} alt={ub.book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/book/${ub.book_id}`} className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                    {ub.book?.title}
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ub.book?.author}</p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                  onClick={() => handleStartReading(ub)}
                  title="Iniciar Leitura"
                >
                  <Play className="h-4 w-4 fill-current" />
                </Button>
              </div>
            ))}
            {wantToReadBooks.length > 5 && (
              <Button 
                variant="link" 
                size="sm" 
                className="w-full text-muted-foreground"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? 'Ver menos' : `Ver mais ${wantToReadBooks.length - 5} livros`}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-xs text-muted-foreground">Sua lista está vazia</p>
            <Link to="/search">
              <Button variant="outline" size="sm" className="mt-2 w-full">
                Adicionar Livros
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
      {sessionBook && (
        <ReadingSessionModal 
          open={!!sessionBook}
          onOpenChange={(open) => !open && setSessionBook(null)}
          userBook={sessionBook}
        />
      )}
    </Card>
  );
}

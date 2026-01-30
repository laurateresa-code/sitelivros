import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useUserBooks } from '@/hooks/useUserBooks';
import { Clock } from 'lucide-react';

export function WantToRead() {
  const { wantToReadBooks, loading } = useUserBooks();
  const [expanded, setExpanded] = useState(false);

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
                <div className="w-10 h-14 bg-muted rounded overflow-hidden flex-shrink-0">
                  {ub.book?.cover_url && (
                    <img src={ub.book.cover_url} alt={ub.book.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/book/${ub.book_id}`} className="font-medium text-sm line-clamp-1 hover:text-primary transition-colors">
                    {ub.book?.title}
                  </Link>
                  <p className="text-xs text-muted-foreground line-clamp-1">{ub.book?.author}</p>
                </div>
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
    </Card>
  );
}

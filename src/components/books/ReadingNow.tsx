import { useState, useEffect } from 'react';
import { BookOpen, Book, Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useReadingSession } from '@/hooks/useReadingSession';
import { ReadingSessionModal } from '@/components/reading/ReadingSessionModal';
import { UserBook } from '@/types';

function SessionTimer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      const start = new Date(startTime);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - start.getTime()) / 60000);
      setElapsed(diffInMinutes);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000 * 60);

    return () => clearInterval(interval);
  }, [startTime]);

  return (
    <div className="text-[10px] font-medium text-primary mt-2 text-center bg-primary/10 rounded px-1 py-0.5 w-full animate-pulse">
      {elapsed} min
    </div>
  );
}

export function ReadingNow() {
  const { readingBooks, removeBook } = useUserBooks();
  const { activeSession } = useReadingSession();
  const [sessionBook, setSessionBook] = useState<UserBook | null>(null);

  if (readingBooks.length === 0) {
    return null;
  }

  return (
    <>
      {sessionBook && (
        <ReadingSessionModal 
          open={!!sessionBook}
          onOpenChange={(open) => !open && setSessionBook(null)}
          userBook={sessionBook}
        />
      )}

      <Card className="overflow-hidden border-primary/20 bg-primary/5">
        <CardHeader className="bg-primary/10 pb-4">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Lendo Agora
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {readingBooks.map((book) => (
            <div key={book.id} className="relative border-b border-border/50 pb-6 last:border-0 last:pb-0">
              <div className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0 w-20">
                  <div className="w-20 h-28 bg-muted rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    {book.book?.cover_url ? (
                      <img src={book.book.cover_url} alt={book.book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Book className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  {activeSession?.bookId === book.book_id && activeSession.startTime && (
                    <SessionTimer startTime={activeSession.startTime} />
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-lg leading-tight line-clamp-2" title={book.book?.title}>{book.book?.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{book.book?.author}</p>
                    {book.book?.page_count && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {Math.round((book.current_page / book.book.page_count) * 100)}% concluído
                      </p>
                    )}
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button 
                      size="sm" 
                      className="gradient-primary text-white gap-2 h-8"
                      onClick={() => setSessionBook(book)}
                    >
                      <Play className="w-3 h-3 fill-current" />
                      Registrar
                    </Button>
                    <Link to={`/book/${book.book_id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full h-8">
                        Detalhes
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </>
  );
}

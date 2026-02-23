import { useState, useEffect } from 'react';
import { useBooks } from '@/hooks/useBooks';
import { GoogleBookResult } from '@/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Search, BookOpen } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface BookSearchProps {
  onSelect: (book: GoogleBookResult) => void;
  className?: string;
}

export function BookSearch({ onSelect, className = '' }: BookSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { searchGoogleBooks } = useBooks();

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (query.trim().length > 2) {
        setSearching(true);
        const books = await searchGoogleBooks(query);
        setResults(books);
        setSearching(false);
      } else {
        setResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [query, searchGoogleBooks]);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Buscar livros no Google Books..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {results.length > 0 && (
        <ScrollArea className="h-[300px] rounded-md border p-2">
          <div className="space-y-2">
            {results.map((book) => (
              <div
                key={book.id}
                className="flex gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer transition-all duration-200 group hover:scale-[1.01]"
                onClick={() => onSelect(book)}
              >
                <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-1">
                  {book.volumeInfo.imageLinks?.thumbnail ? (
                    <img
                      src={book.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:')}
                      alt={book.volumeInfo.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1">{book.volumeInfo.title}</h4>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {book.volumeInfo.authors?.join(', ') || 'Autor desconhecido'}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                    {book.volumeInfo.description || 'Sem descrição.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      )}

      {query.length > 2 && !searching && results.length === 0 && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Nenhum livro encontrado.
        </div>
      )}
    </div>
  );
}

import { useState } from 'react';
import { Search as SearchIcon, Loader2, BookOpen } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBooks } from '@/hooks/useBooks';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useAuth } from '@/hooks/useAuth';
import { GoogleBookResult, Book } from '@/types';
import { BookCard } from '@/components/books/BookCard';
import { useToast } from '@/hooks/use-toast';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const { searchGoogleBooks, addBookFromGoogle } = useBooks();
  const { addToList } = useUserBooks();
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    const data = await searchGoogleBooks(query);
    setResults(data);
    setSearching(false);
  };

  const handleAddBook = async (googleBook: GoogleBookResult, status: 'reading' | 'read' | 'want_to_read') => {
    if (!user) {
      toast({ title: 'Faça login para adicionar livros', variant: 'destructive' });
      return;
    }

    try {
      const book = await addBookFromGoogle(googleBook, user.id);
      if (book) {
        const { error } = await addToList(book, status);
        if (error) throw error;
        
        toast({ 
          title: 'Livro adicionado!', 
          description: `"${book.title}" foi adicionado à sua estante.` 
        });
      }
    } catch (error) {
      toast({ 
        title: 'Erro ao adicionar livro', 
        description: 'Tente novamente mais tarde.', 
        variant: 'destructive' 
      });
    }
  };

  // Convert Google Book to display format
  const mapToDisplayBook = (gb: GoogleBookResult): Book => ({
    id: gb.id, // This is temporary, won't match DB ID until added
    google_books_id: gb.id,
    title: gb.volumeInfo.title,
    author: gb.volumeInfo.authors?.join(', ') || null,
    description: gb.volumeInfo.description || null,
    cover_url: gb.volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
    page_count: gb.volumeInfo.pageCount || 0,
    published_date: gb.volumeInfo.publishedDate || null,
    categories: gb.volumeInfo.categories || null,
    isbn: null,
    average_rating: 0,
    total_ratings: 0,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold font-display">Encontre sua próxima leitura</h1>
          <p className="text-muted-foreground">
            Pesquise por título, autor ou ISBN no catálogo do Google Books
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome do livro..."
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8 gradient-primary text-white" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>

        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {results.map((result) => (
              <div key={result.id} className="flex flex-col gap-2">
                <BookCard
                  book={mapToDisplayBook(result)}
                  showAddButton={false} // We handle adding manually
                />
                <div className="grid grid-cols-3 gap-1 mt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs px-0"
                    onClick={() => handleAddBook(result, 'want_to_read')}
                  >
                    Quero
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs px-0"
                    onClick={() => handleAddBook(result, 'reading')}
                  >
                    Lendo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs px-0"
                    onClick={() => handleAddBook(result, 'read')}
                  >
                    Lido
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !searching && query && (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum livro encontrado para "{query}"</p>
          </div>
        )}
      </div>
    </Layout>
  );
}

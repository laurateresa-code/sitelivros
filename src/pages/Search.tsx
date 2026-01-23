import { useState, useEffect } from 'react';
import { Search as SearchIcon, Loader2, BookOpen, TrendingUp, Sparkles, Heart, Brain, Rocket } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useBooks } from '@/hooks/useBooks';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useAuth } from '@/hooks/useAuth';
import { GoogleBookResult, Book } from '@/types';
import { BookCard } from '@/components/books/BookCard';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  
  // Recommendations state
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);
  const [romanceBooks, setRomanceBooks] = useState<GoogleBookResult[]>([]);
  const [classicRomanceBooks, setClassicRomanceBooks] = useState<GoogleBookResult[]>([]);
  const [modernRomanceBooks, setModernRomanceBooks] = useState<GoogleBookResult[]>([]);
  const [fantasyBooks, setFantasyBooks] = useState<GoogleBookResult[]>([]);
  const [scifiBooks, setScifiBooks] = useState<GoogleBookResult[]>([]);
  const [mysteryBooks, setMysteryBooks] = useState<GoogleBookResult[]>([]);
  const [selfHelpBooks, setSelfHelpBooks] = useState<GoogleBookResult[]>([]);

  const { searchGoogleBooks, addBookFromGoogle, getPopularBooks } = useBooks();
  const { addToList } = useUserBooks();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const loadRecommendations = async () => {
      // Load internal popular books
      const popular = await getPopularBooks();
      setPopularBooks(popular);

      // Load categories from Google Books
      // We run these in parallel
      const [romance, classicRomance, modernRomance, fantasy, scifi, mystery, selfHelp] = await Promise.all([
        searchGoogleBooks('subject:romance'),
        searchGoogleBooks('subject:romance+classic'),
        searchGoogleBooks('subject:romance+contemporary'),
        searchGoogleBooks('subject:fantasy'),
        searchGoogleBooks('subject:science fiction'),
        searchGoogleBooks('subject:mystery'),
        searchGoogleBooks('subject:self-help')
      ]);

      setRomanceBooks(romance);
      setClassicRomanceBooks(classicRomance);
      setModernRomanceBooks(modernRomance);
      setFantasyBooks(fantasy);
      setScifiBooks(scifi);
      setMysteryBooks(mystery);
      setSelfHelpBooks(selfHelp);
    };

    loadRecommendations();
  }, [getPopularBooks, searchGoogleBooks]);

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

  const handleAddBookFromDB = async (book: Book, status: 'reading' | 'read' | 'want_to_read') => {
    if (!user) return;
    try {
      const { error } = await addToList(book, status);
      if (error) throw error;
      toast({ 
        title: 'Livro adicionado!', 
        description: `"${book.title}" foi adicionado à sua estante.` 
      });
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
    id: gb.id,
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

  const CategorySection = ({ 
    title, 
    icon: Icon, 
    books, 
    isGoogleBook = true 
  }: { 
    title: string; 
    icon: any; 
    books: (GoogleBookResult | Book)[]; 
    isGoogleBook?: boolean; 
  }) => {
    if (books.length === 0) return null;

    return (
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">{title}</h2>
        </div>
        
        <ScrollArea className="w-full whitespace-nowrap rounded-md">
          <div className="flex w-max space-x-4 pb-4">
            {books.map((item) => {
              const book = isGoogleBook ? mapToDisplayBook(item as GoogleBookResult) : (item as Book);
              const key = isGoogleBook ? (item as GoogleBookResult).id : (item as Book).id;
              
              return (
                <div key={key} className="w-[160px] space-y-2">
                  <BookCard 
                    book={book} 
                    showAddButton={false}
                  />
                  <div className="grid grid-cols-3 gap-1 px-1">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px] h-7 px-0"
                      onClick={() => isGoogleBook 
                        ? handleAddBook(item as GoogleBookResult, 'want_to_read')
                        : handleAddBookFromDB(item as Book, 'want_to_read')
                      }
                    >
                      Quero
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px] h-7 px-0"
                      onClick={() => isGoogleBook 
                        ? handleAddBook(item as GoogleBookResult, 'reading')
                        : handleAddBookFromDB(item as Book, 'reading')
                      }
                    >
                      Lendo
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full text-[10px] h-7 px-0"
                      onClick={() => isGoogleBook 
                        ? handleAddBook(item as GoogleBookResult, 'read')
                        : handleAddBookFromDB(item as Book, 'read')
                      }
                    >
                      Lido
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </section>
    );
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4 pt-4">
          <h1 className="text-3xl font-bold font-display">Encontre sua próxima leitura</h1>
          <p className="text-muted-foreground">
            Explore o catálogo do Google Books ou veja o que a comunidade está lendo
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
          <div className="relative flex-1">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Título, autor, ISBN ou categoria..."
              className="pl-10 h-12 text-lg"
            />
          </div>
          <Button type="submit" size="lg" className="h-12 px-8 gradient-primary text-white" disabled={searching}>
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buscar'}
          </Button>
        </form>

        {results.length > 0 ? (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-xl font-semibold">Resultados da busca</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {results.map((result) => (
                <div key={result.id} className="flex flex-col gap-2">
                  <BookCard
                    book={mapToDisplayBook(result)}
                    showAddButton={false}
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
          </div>
        ) : !searching && (
          <div className="space-y-12 animate-fade-in pb-12">
            {popularBooks.length > 0 && (
              <CategorySection 
                title="Populares na Comunidade" 
                icon={TrendingUp} 
                books={popularBooks} 
                isGoogleBook={false} 
              />
            )}
            
            <CategorySection 
              title="Romance Clássico" 
              icon={Heart} 
              books={classicRomanceBooks} 
            />
            
            <CategorySection 
              title="Romance Contemporâneo" 
              icon={Heart} 
              books={modernRomanceBooks} 
            />
            
            <CategorySection 
              title="Mais Romances" 
              icon={Heart} 
              books={romanceBooks} 
            />
            
            <CategorySection 
              title="Fantasia" 
              icon={Sparkles} 
              books={fantasyBooks} 
            />
            
            <CategorySection 
              title="Suspense e Mistério" 
              icon={BookOpen} 
              books={mysteryBooks} 
            />
            
            <CategorySection 
              title="Ficção Científica" 
              icon={Rocket} 
              books={scifiBooks} 
            />

            <CategorySection 
              title="Desenvolvimento Pessoal" 
              icon={Brain} 
              books={selfHelpBooks} 
            />
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

import React, { useState, useEffect, useRef } from 'react';
import { Search as SearchIcon, Loader2, BookOpen, TrendingUp, Sparkles, Heart, Brain, Rocket, Filter, Zap, Eye, Flag, type LucideIcon } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useBooks } from '@/hooks/useBooks';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useAuth } from '@/hooks/useAuth';
import { GoogleBookResult, Book } from '@/types';
import { BookCard } from '@/components/books/BookCard';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

const BrazilFlagIcon = ({ className, ...props }: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M12 7L19 12L12 17L5 12Z" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBookResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [authorFilter, setAuthorFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  
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
  const loadingRef = useRef(false);

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadRecommendations = async () => {
      // Load internal popular books
      const popular = await getPopularBooks();
      setPopularBooks(popular);

      // BookTok specific queries
      const bookTokQueries = [
        'intitle:É Assim que Acaba+inauthor:Colleen Hoover',
        'intitle:Ugly Love+inauthor:Colleen Hoover',
        'intitle:Verity+inauthor:Colleen Hoover',
        'intitle:Os Dois Morrem no Final+inauthor:Adam Silvera',
        'intitle:A Canção de Aquiles+inauthor:Madeline Miller',
        'intitle:Corte de Espinhos e Rosas+inauthor:Sarah J. Maas',
        'intitle:Six of Crows+inauthor:Leigh Bardugo',
        'intitle:Vermelho, Branco e Sangue Azul+inauthor:Casey McQuiston',
        'intitle:A Vida Invisível de Addie LaRue+inauthor:V. E. Schwab',
        'intitle:O Príncipe Cruel+inauthor:Holly Black',
        'intitle:O Jogo do Amor e do Ódio+inauthor:Sally Thorne',
        'intitle:Um Lugar Bem Longe Daqui+inauthor:Delia Owens',
        'intitle:Cidade da Lua Crescente+inauthor:Sarah J. Maas',
        'intitle:Os Seis de Atlas+inauthor:Olivie Blake',
        'intitle:Projeto Hail Mary+inauthor:Andy Weir'
      ];

      // Modern Romance specific queries
      const modernRomanceQueries = [
        'intitle:Amor, Teoricamente+inauthor:Ali Hazelwood',
        'intitle:A Hipótese do Amor+inauthor:Ali Hazelwood',
        'intitle:Amor & Outras Coisas+inauthor:Christina Lauren',
        'intitle:Teto Para Dois+inauthor:Beth O\'Leary',
        'intitle:Um de Nós É o Próximo+inauthor:Karen McManus',
        'intitle:Orgulho e Preconceito+inauthor:Jane Austen',
        'intitle:Razão e Sensibilidade+inauthor:Jane Austen',
        'intitle:Jane Eyre+inauthor:Charlotte Brontë',
        'intitle:E o Vento Levou+inauthor:Margaret Mitchell',
        'intitle:Os Sete Maridos de Evelyn Hugo+inauthor:Taylor Jenkins Reid',
        'intitle:Amor(es) Verdadeiro(s)+inauthor:Taylor Jenkins Reid',
        'intitle:Como Eu Era Antes de Você+inauthor:Jojo Moyes',
        'intitle:Um Acordo Peculiar+inauthor:Talia Hibbert',
        'intitle:A Noiva Acidental+inauthor:Tessa Bailey',
        'intitle:Para Todos os Garotos que Já Amei+inauthor:Jenny Han'
      ];

      // Fantasy specific queries
      const fantasyQueries = [
        'intitle:Corte de Espinhos e Rosas+inauthor:Sarah J. Maas',
        'intitle:Corte de Névoa e Fúria+inauthor:Sarah J. Maas',
        'intitle:Corte de Asas e Ruína+inauthor:Sarah J. Maas',
        'intitle:Casa de Terra e Sangue+inauthor:Sarah J. Maas',
        'intitle:Casa de Céu e Sopro+inauthor:Sarah J. Maas',
        'intitle:Trono de Vidro+inauthor:Sarah J. Maas',
        'intitle:Six of Crows+inauthor:Leigh Bardugo',
        'intitle:Sombra e Ossos+inauthor:Leigh Bardugo',
        'intitle:O Príncipe Cruel+inauthor:Holly Black',
        'intitle:A Rainha do Nada+inauthor:Holly Black',
        'intitle:A Canção de Aquiles+inauthor:Madeline Miller',
        'intitle:Circe+inauthor:Madeline Miller',
        'intitle:O Nome do Vento+inauthor:Patrick Rothfuss',
        'intitle:A Sociedade do Anel+inauthor:Tolkien',
        'intitle:As Crônicas de Nárnia+inauthor:C. S. Lewis'
      ];

      // Mystery/Thriller specific queries
      const mysteryQueries = [
        'intitle:A Paciente Silenciosa+inauthor:Alex Michaelides',
        'intitle:A Mulher na Janela+inauthor:A. J. Finn',
        'intitle:Garota Exemplar+inauthor:Gillian Flynn',
        'intitle:A Última Festa+inauthor:Lucy Foley',
        'intitle:A Lista de Convidados+inauthor:Lucy Foley',
        'intitle:As Musas+inauthor:Alex Michaelides',
        'intitle:Um de Nós Está Mentindo+inauthor:McManus',
        'intitle:O Homem de Giz+inauthor:C. J. Tudor',
        'intitle:A Queda+inauthor:T. J. Newman',
        'intitle:O Instituto+inauthor:Stephen King',
        'intitle:Assassinato no Expresso do Oriente+inauthor:Agatha Christie',
        'intitle:O Assassinato de Roger Ackroyd+inauthor:Agatha Christie',
        'intitle:Morte no Nilo+inauthor:Agatha Christie',
        'intitle:E Não Sobrou Nenhum+inauthor:Agatha Christie',
        'intitle:Os Crimes ABC+inauthor:Agatha Christie'
      ];

      // Brazilian Literature specific queries
      const brazilianQueries = [
        'intitle:Suicidas+inauthor:Raphael Montes',
        'intitle:Dias Perfeitos+inauthor:Raphael Montes',
        'intitle:Jantar Secreto+inauthor:Raphael Montes',
        'intitle:Uma Mulher no Escuro+inauthor:Raphael Montes',
        'intitle:O Vilarejo+inauthor:Raphael Montes',
        'intitle:O Caso Laura+inauthor:André Vianco',
        'intitle:A Noite Maldita+inauthor:André Vianco',
        'intitle:O Escravo de Capela+inauthor:Marcos DeBrito',
        'intitle:A Casa dos Dois Amores+inauthor:Marina Colasanti',
        'intitle:Serpentário+inauthor:Felipe Castilho',
        'intitle:Ninguém Nasce Herói+inauthor:Eric Novello',
        'intitle:Cães+inauthor:Fábio Kabral',
        'intitle:O Grande Circo Negro+inauthor:Carmen Capuz',
        'intitle:Homens Elegantes+inauthor:Samir Machado de Machado',
        'intitle:O Clube dos Jardineiros de Fumaça+inauthor:Carol Bensimon'
      ];

      // Self-Help/Personal Development specific queries
      const selfHelpQueries = [
        'intitle:Rápido e Devagar+inauthor:Daniel Kahneman',
        'intitle:A Coragem de Ser Imperfeito+inauthor:Brené Brown',
        'intitle:O Jeito Harvard de Ser Feliz+inauthor:Shawn Achor',
        'intitle:Despertar o Tigre+inauthor:Peter Levine',
        'intitle:Fluir+inauthor:Mihaly Csikszentmihalyi',
        'intitle:Meditações+inauthor:Marco Aurélio',
        'intitle:Em Busca de Sentido+inauthor:Viktor Frankl',
        'intitle:A Arte de Viver+inauthor:Epicteto',
        'intitle:A Morte é um Dia que Vale a Pena Viver+inauthor:Ana Claudia Quintana Arantes',
        'intitle:Trabalho Focado+inauthor:Cal Newport',
        'intitle:Minimalismo Digital+inauthor:Cal Newport',
        'intitle:A Regra é Não Ter Regras+inauthor:Reed Hastings',
        'intitle:Os Quatro Amores+inauthor:C.S. Lewis',
        'intitle:O Caminho do Artista+inauthor:Julia Cameron',
        'intitle:Coragem para Liderar+inauthor:Brené Brown'
      ];

      // Helper for concurrent processing with queue
      const processQueue = async (items: { query: string, setter: React.Dispatch<React.SetStateAction<GoogleBookResult[]>> }[]) => {
        const CONCURRENCY = 4; // Increased for speed
        const DELAY_BETWEEN_REQUESTS = 50; // Minimal delay

        let index = 0;
        const total = items.length;

        const next = async () => {
          if (index >= total) return;
          
          const currentIndex = index++;
          const item = items[currentIndex];
          
          try {
            const res = await searchGoogleBooks(item.query);
            if (res && res[0]) {
              // Incremental update for better UX
              item.setter(prev => {
                // Avoid duplicates based on ID
                if (prev.some(b => b.id === res[0].id)) return prev;
                return [...prev, res[0]];
              });
            }
          } catch (e) {
            console.error(`Error fetching ${item.query}:`, e);
          }
          
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_REQUESTS));
          await next();
        };

        const promises = [];
        for (let i = 0; i < CONCURRENCY; i++) {
          promises.push(next());
        }
        await Promise.all(promises);
      };

      const loadAllCategories = async () => {
        // Simple searches first - fire and forget
        searchGoogleBooks('subject:romance+classic').then(setClassicRomanceBooks);

        // Prepare queue items
        const queueItems = [
          ...bookTokQueries.map(q => ({ query: q, setter: setRomanceBooks })),
          ...modernRomanceQueries.map(q => ({ query: q, setter: setModernRomanceBooks })),
          ...fantasyQueries.map(q => ({ query: q, setter: setFantasyBooks })),
          ...brazilianQueries.map(q => ({ query: q, setter: setScifiBooks })),
          ...mysteryQueries.map(q => ({ query: q, setter: setMysteryBooks })),
          ...selfHelpQueries.map(q => ({ query: q, setter: setSelfHelpBooks })),
        ];

        // Process all in parallel with concurrency limit
        await processQueue(queueItems);
      };

      loadAllCategories();
    };

    loadRecommendations();
  }, [getPopularBooks, searchGoogleBooks]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !authorFilter && subjectFilter === 'all') return;

    setSearching(true);
    
    let searchQuery = query.trim();
    if (authorFilter.trim()) {
      searchQuery += `+inauthor:${authorFilter.trim()}`;
    }
    if (subjectFilter !== 'all') {
      searchQuery += `+subject:${subjectFilter}`;
    }

    const data = await searchGoogleBooks(searchQuery);
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
    icon: LucideIcon | React.ComponentType<React.ComponentProps<"svg">>; 
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
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar"
                className="pl-10 h-12 text-lg"
              />
            </div>
            <Button 
              type="button" 
              variant="outline" 
              className="h-12 w-12 px-0 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-5 h-5" />
            </Button>
            <Button type="submit" size="lg" className="h-12 w-12 px-0 gradient-primary text-white shrink-0" disabled={searching}>
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <SearchIcon className="w-5 h-5" />}
            </Button>
          </div>

          {showFilters && (
            <div className="p-4 border rounded-lg bg-card/50 backdrop-blur-sm space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Autor</Label>
                  <Input 
                    id="author" 
                    placeholder="Ex: J.K. Rowling" 
                    value={authorFilter}
                    onChange={(e) => setAuthorFilter(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Gênero / Categoria</Label>
                  <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                    <SelectTrigger id="subject">
                      <SelectValue placeholder="Selecione um gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="fiction">Ficção</SelectItem>
                      <SelectItem value="romance">Romance</SelectItem>
                      <SelectItem value="fantasy">Fantasia</SelectItem>
                      <SelectItem value="mystery">Mistério & Suspense</SelectItem>
                      <SelectItem value="science fiction">Ficção Científica</SelectItem>
                      <SelectItem value="horror">Terror</SelectItem>
                      <SelectItem value="biography">Biografia</SelectItem>
                      <SelectItem value="history">História</SelectItem>
                      <SelectItem value="business">Negócios</SelectItem>
                      <SelectItem value="self-help">Autoajuda</SelectItem>
                      <SelectItem value="comics">Quadrinhos / Mangás</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
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
              title="Destaques do BookTok (YA)" 
              icon={Zap} 
              books={romanceBooks} 
            />
            
            <CategorySection 
              title="Fantasia" 
              icon={Sparkles} 
              books={fantasyBooks} 
            />
            
            <CategorySection 
              title="Suspense e Mistério" 
              icon={Eye} 
              books={mysteryBooks} 
            />
            
            <CategorySection 
              title="Literatura Brasileira" 
              icon={BrazilFlagIcon} 
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

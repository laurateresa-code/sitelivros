import { Layout } from '@/components/layout/Layout';
import { useUserBooks } from '@/hooks/useUserBooks';
import { BookCard } from '@/components/books/BookCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Check, Clock, Library, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function MyBooks() {
  const { books, readingBooks, readBooks, wantToReadBooks, loading } = useUserBooks();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
      <Library className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
      <p className="text-muted-foreground mb-4">{message}</p>
      <Link to="/search">
        <Button variant="outline">Adicionar Livros</Button>
      </Link>
    </div>
  );

  const BookGrid = ({ list }: { list: typeof books }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
      {list.map((userBook) => (
        <BookCard
          key={userBook.id}
          book={userBook.book!}
          userBook={userBook}
        />
      ))}
    </div>
  );

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-display mb-2">Meus Livros</h1>
          <p className="text-muted-foreground">Gerencie sua biblioteca pessoal e acompanhe seu progresso</p>
        </div>

        <Tabs defaultValue="all" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-[400px]">
            <TabsTrigger value="all">Todos</TabsTrigger>
            <TabsTrigger value="reading">Lendo</TabsTrigger>
            <TabsTrigger value="want_to_read">Quero Ler</TabsTrigger>
            <TabsTrigger value="read">Lidos</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {books.length > 0 ? (
              <BookGrid list={books} />
            ) : (
              <EmptyState message="Você ainda não tem livros na sua estante." />
            )}
          </TabsContent>

          <TabsContent value="reading" className="space-y-6">
            <div className="flex items-center gap-2 mb-4 text-primary font-medium">
              <BookOpen className="w-5 h-5" />
              <span>Lendo Atualmente ({readingBooks.length})</span>
            </div>
            {readingBooks.length > 0 ? (
              <BookGrid list={readingBooks} />
            ) : (
              <EmptyState message="Você não está lendo nenhum livro no momento." />
            )}
          </TabsContent>

          <TabsContent value="want_to_read" className="space-y-6">
            <div className="flex items-center gap-2 mb-4 text-muted-foreground font-medium">
              <Clock className="w-5 h-5" />
              <span>Quero Ler ({wantToReadBooks.length})</span>
            </div>
            {wantToReadBooks.length > 0 ? (
              <BookGrid list={wantToReadBooks} />
            ) : (
              <EmptyState message="Sua lista de desejos está vazia." />
            )}
          </TabsContent>

          <TabsContent value="read" className="space-y-6">
            <div className="flex items-center gap-2 mb-4 text-primary font-medium">
              <Check className="w-5 h-5" />
              <span>Lidos ({readBooks.length})</span>
            </div>
            {readBooks.length > 0 ? (
              <BookGrid list={readBooks} />
            ) : (
              <EmptyState message="Você ainda não terminou nenhum livro." />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

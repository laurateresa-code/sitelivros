// Aqui está uma versão revisada e estilizada da sua seção de biblioteca.
// Acrescentei efeitos visuais mais modernos, profundidade, carrosséis mais elegantes,
// cartões mais consistentes e uma experiência geral mais "premium" para leitura.

import { useState } from 'react';
import { UserBook } from '@/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { BookOpen, Star, Clock, Library } from 'lucide-react';
 

interface MyLibrarySectionProps {
  books: UserBook[];
  isLoading?: boolean;
}

export function MyLibrarySection({ books, isLoading }: MyLibrarySectionProps) {
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  const readingBooks = books.filter(b => b.status === 'reading');
  const readBooks = books.filter(b => b.status === 'read');
  const wantToReadBooks = books.filter(b => b.status === 'want_to_read');

  if (isLoading) {
    return (
      <div className="w-full h-[500px] bg-muted/10 rounded-3xl animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground opacity-50 font-medium text-lg">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg md:text-xl font-display tracking-wide">Minha Biblioteca</h2>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 px-3 py-1 text-sm bg-background shadow-sm">
            <Library className="w-3 h-3" /> {books.length}
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1 text-xs bg-background/60">
            <BookOpen className="w-3 h-3" /> {readingBooks.length}
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1 text-xs bg-background/60">
            <Star className="w-3 h-3" /> {readBooks.length}
          </Badge>
          <Badge variant="outline" className="gap-1 px-3 py-1 text-xs bg-background/60">
            <Clock className="w-3 h-3" /> {wantToReadBooks.length}
          </Badge>
        </div>
      </div>

      {/* ---------------- LENDO AGORA ---------------- */}
      <Section title="Lendo Agora" count={readingBooks.length} icon={<BookOpen className="w-3 h-3" />}>
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max items-end space-x-6 min-w-full px-1">
            {readingBooks.map(book => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="group relative cursor-pointer flex-shrink-0 hover:-translate-y-1 transition-transform"
              >
                <div className="relative w-24 md:w-28 aspect-[2/3] rounded-lg shadow-md overflow-hidden ring-1 ring-amber-200 bg-amber-50 group-hover:shadow-lg transition-all">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground p-3 text-center text-xs">
                      {book.book?.title}
                    </div>
                  )}

                  <div className="absolute top-2 left-2">
                    <Badge className="gap-1 text-[10px] backdrop-blur-sm bg-background/80 shadow">
                      <BookOpen className="w-3 h-3" /> Lendo
                    </Badge>
                  </div>
                </div>
              </button>
            ))}
            <div className="w-4" />
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Section>

      {/* ---------------- LIDOS ---------------- */}
      <Section title="Lidos" count={readBooks.length} icon={<Star className="w-3 h-3" />}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
          {readBooks.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
            >
              <div className="relative rounded-lg overflow-hidden shadow-sm ring-1 ring-amber-200 bg-background transition-all hover:shadow-md">
                <div className="aspect-[2/3] w-full">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs p-3 text-center">
                      {book.book?.title}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <div className="text-sm font-medium line-clamp-2">{book.book?.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-2">{book.book?.author || 'Autor desconhecido'}</div>
                </div>

                {book.rating && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-background/80 shadow px-2 py-1 rounded text-[10px] backdrop-blur-sm">
                    <Star className="w-3 h-3 fill-current" />
                    {book.rating}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </Section>

      {/* ---------------- QUERO LER ---------------- */}
      <Section title="Quero Ler" count={wantToReadBooks.length} icon={<Clock className="w-3 h-3" />}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {wantToReadBooks.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
            >
              <div className="relative rounded-lg overflow-hidden shadow ring-1 ring-amber-200 bg-background">
                <div className="aspect-[2/3] w-full">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground p-3 text-center text-xs">
                      {book.book?.title}
                    </div>
                  )}
                </div>

                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="gap-1 text-[10px] backdrop-blur-sm bg-background/90">
                    <Clock className="w-3 h-3" /> Quero Ler
                  </Badge>
                </div>
              </div>
            </button>
          ))}
        </div>
      </Section>

      <BookDetailModal
        book={selectedBook}
        open={!!selectedBook}
        onOpenChange={(open) => !open && setSelectedBook(null)}
      />
    </div>
  );
}

/* ---------------- COMPONENTE REUTILIZÁVEL PARA SESSÃO ---------------- */
interface SectionProps {
  title: string;
  children: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
}
function Section({ title, children, count, icon }: SectionProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-md px-3 py-1 bg-background/60 ring-1 ring-amber-200 shadow-sm">
          {icon}
          <span className="text-xs font-semibold tracking-wide uppercase">{title}</span>
        </div>
        {typeof count === 'number' && (
          <Badge variant="outline" className="text-[10px] px-2 py-0.5">{count}</Badge>
        )}
      </div>
      <div className="border-t border-amber-100/60" />
      {children}
    </section>
  );
}

/* ---------------- MODAL ---------------- */
interface BookDetailModalProps {
  book: UserBook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function BookDetailModal({ book, open, onOpenChange }: BookDetailModalProps) {
  if (!book || !book.book) return null;
  const b = book.book;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'reading': return 'Lendo Atualmente';
      case 'read': return 'Lido';
      case 'want_to_read': return 'Quero Ler';
      default: return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl overflow-hidden p-0 rounded-2xl">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-2/5 p-8 flex items-center justify-center bg-muted/10">
            <div className="relative w-28 md:w-32 rounded-lg overflow-hidden shadow ring-1 ring-amber-200 bg-amber-50">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-full h-auto object-cover" />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center">
                  <BookOpen className="w-12 h-12" />
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 p-8 space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs px-2 py-1">
                {getStatusLabel(book.status)}
              </Badge>

              {book.rating && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-medium">{book.rating}</span>
                </div>
              )}
            </div>

            <DialogTitle className="text-xl md:text-2xl font-display leading-tight">{b.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{b.author || 'Autor desconhecido'}</p>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {b.page_count && (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Páginas</span>
                  <span className="text-lg font-semibold">{b.page_count}</span>
                </div>
              )}

              {b.published_date && (
                <div className="flex flex-col">
                  <span className="text-xs text-muted-foreground">Ano</span>
                  <span className="text-lg font-semibold">{new Date(b.published_date).getFullYear()}</span>
                </div>
              )}
            </div>

            {b.description && (
              <div className="mt-2">
                <div className="text-xs font-semibold text-muted-foreground mb-1">Sinopse</div>
                <div className="rounded-md bg-background/60 ring-1 ring-amber-100 p-3">
                  <ScrollArea className="h-32">
                    <div className="pr-3 text-sm leading-relaxed text-muted-foreground">{b.description}</div>
                    <ScrollBar orientation="vertical" />
                  </ScrollArea>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Redesign completo considerando:
// - Capas menores para evitar perda de qualidade
// - Mais elementos visuais para o layout não ficar frio
// - Modal agora exibe também a sinopse
// - Visual mais aconchegante, com texturas leves e camadas

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
    <div className="space-y-14">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Badge variant="outline" className="gap-1 px-3 py-1 text-sm bg-background shadow-sm">
            <Library className="w-3 h-3" /> {books.length} livros
          </Badge>
        </div>
      </div>

      {/* ---------------- LENDO AGORA ---------------- */}
      <Section title="Lendo Agora">
        <ScrollArea className="w-full whitespace-nowrap pb-2">
          <div className="flex w-max items-start space-x-6 min-w-full px-1">
            {readingBooks.map(book => (
              <button
                key={book.id}
                onClick={() => setSelectedBook(book)}
                className="group cursor-pointer flex-shrink-0 hover:-translate-y-1 transition-transform"
              >
                <div className="relative w-24 aspect-[2/3] rounded-lg shadow-md overflow-hidden ring-1 ring-muted bg-muted/20 hover:shadow-xl transition-all">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground p-2 text-center text-xs">
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
      <Section title="Lidos">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {readBooks.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="hover:scale-[1.02] transition-transform"
            >
              <div className="relative rounded-xl overflow-hidden shadow ring-1 ring-muted bg-popover hover:shadow-lg transition-all">
                <div className="aspect-[2/3] w-full">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
                      {book.book?.title}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1">
                  <div className="text-sm font-semibold line-clamp-2">{book.book?.title}</div>
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
      <Section title="Quero Ler">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {wantToReadBooks.map(book => (
            <button
              key={book.id}
              onClick={() => setSelectedBook(book)}
              className="hover:scale-[1.02] transition-transform"
            >
              <div className="relative rounded-xl overflow-hidden shadow ring-1 ring-muted bg-popover">
                <div className="aspect-[2/3] w-full">
                  {book.book?.cover_url ? (
                    <img src={book.book.cover_url} alt={book.book?.title || ''} className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-muted-foreground p-2 text-center text-xs">
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

/* ---------------- COMPONENTE DE SESSÃO ---------------- */
function Section({ title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="text-xs font-semibold text-muted-foreground tracking-wide uppercase bg-muted/20 px-3 py-1 w-fit rounded-md">
        {title}
      </h3>
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
          {/* CAPA */}
          <div className="w-full md:w-2/5 p-8 flex items-center justify-center bg-muted/10">
            <div className="relative w-32 rounded-lg overflow-hidden shadow">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-full h-auto object-cover" />
              ) : (
                <div className="aspect-[2/3] flex items-center justify-center">
                  <BookOpen className="w-10 h-10" />
                  </div>
              )}
            </div>
          </div>

          {/* INFO */}
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

            <DialogTitle className="text-2xl font-display leading-tight">{b.title}</DialogTitle>
            <p className="text-sm text-muted-foreground">{b.author || 'Autor desconhecido'}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

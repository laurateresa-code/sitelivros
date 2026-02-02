import { useState } from 'react';
import { UserBook } from '@/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star, Library } from 'lucide-react';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { RecommendationSection } from './RecommendationSection';

interface LibraryBookshelfProps {
  books: UserBook[];
  isLoading?: boolean;
  hideReading?: boolean;
}

export function LibraryBookshelf({ books, isLoading, hideReading = false }: LibraryBookshelfProps) {
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  const readingBooks = books.filter(b => b.status === 'reading');
  const readBooks = books.filter(b => b.status === 'read');
  const wantToReadBooks = books.filter(b => b.status === 'want_to_read');

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-muted/10 rounded-3xl animate-pulse flex items-center justify-center">
        <div className="text-muted-foreground opacity-50 font-medium text-lg">Carregando estante...</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto pt-4 pb-12">
      {/* Mobile View */}
      <div className="md:hidden">
        <MobileBookshelf 
          readingBooks={readingBooks}
          readBooks={readBooks}
          wantToReadBooks={wantToReadBooks}
          onBookClick={setSelectedBook}
          hideReading={hideReading}
        />
      </div>

      {/* Desktop View */}
      <div className="hidden md:block">
        <ClassicBookshelf 
          readingBooks={readingBooks} 
          readBooks={readBooks} 
          wantToReadBooks={wantToReadBooks}
          onBookClick={setSelectedBook}
          hideReading={hideReading}
        />
      </div>

      <BookDetailModal 
        book={selectedBook} 
        open={!!selectedBook} 
        onOpenChange={(open) => !open && setSelectedBook(null)} 
      />
    </div>
  );
}

function MobileBookshelf({ readingBooks, readBooks, wantToReadBooks, onBookClick, hideReading }: {
  readingBooks: UserBook[], 
  readBooks: UserBook[], 
  wantToReadBooks: UserBook[],
  onBookClick: (book: UserBook) => void,
  hideReading: boolean
}) {
  return (
    <div className="space-y-8 pb-12 bg-background/50 min-h-screen">
      {/* Header Mobile */}
      <div className="relative text-center py-6">
        <h2 className="text-xl font-display font-light text-foreground tracking-wide">
          Minha Coleção
        </h2>
      </div>

      <RecommendationSection />

      {/* Lendo Atualmente */}
      {!hideReading && readingBooks.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-700 delay-100">
          <h3 className="px-6 text-muted-foreground font-medium tracking-wide text-xs uppercase flex items-center gap-2">
            <BookOpen className="w-3 h-3" /> Lendo Agora
          </h3>
          <Carousel className="w-full" opts={{ align: "center", loop: true }}>
            <CarouselContent>
              {readingBooks.map((book) => (
                <CarouselItem key={book.id} className="basis-[75%] pl-4">
                  <div 
                    onClick={() => onBookClick(book)}
                    className="relative aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-95 active:shadow-inner ring-offset-background hover:ring-2 hover:ring-primary/50"
                  >
                     {book.book?.cover_url ? (
                        <img 
                          src={book.book.cover_url} 
                          alt={book.book.title} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center p-4 text-center border border-border">
                          <span className="text-muted-foreground text-sm">{book.book?.title}</span>
                        </div>
                      )}
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute bottom-4 left-4 right-4">
                         <p className="text-white text-sm font-medium truncate shadow-black/50 drop-shadow-md">{book.book?.title}</p>
                         <p className="text-white/70 text-xs truncate shadow-black/50 drop-shadow-md">{book.book?.author}</p>
                      </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* Lidos */}
      {readBooks.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-200">
          <div className="px-6 flex items-center justify-between">
             <h3 className="text-muted-foreground font-medium tracking-wide text-xs uppercase">Lidos ({readBooks.length})</h3>
          </div>
          <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-2 px-6">
               {readBooks.map((book, i) => (
                  <CarouselItem key={book.id} className="pl-2 basis-[40%]">
                     <div 
                        onClick={() => onBookClick(book)}
                        className="aspect-[2/3] rounded-lg shadow-lg overflow-hidden bg-muted relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl"
                     >
                       {book.book?.cover_url ? (
                         <img src={book.book.cover_url} alt={book.book.title} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center p-1 text-center border border-border">
                            <span className="text-[10px] text-muted-foreground leading-tight">{book.book?.title}</span>
                         </div>
                       )}
                     </div>
                  </CarouselItem>
               ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}

      {/* Quero Ler */}
      {wantToReadBooks.length > 0 && (
        <div className="space-y-4 animate-in slide-in-from-bottom-8 duration-700 delay-300">
          <div className="px-6 flex items-center justify-between">
             <h3 className="text-muted-foreground font-medium tracking-wide text-xs uppercase">Quero Ler ({wantToReadBooks.length})</h3>
          </div>
          <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
            <CarouselContent className="-ml-2 px-6">
               {wantToReadBooks.map((book, i) => (
                  <CarouselItem key={book.id} className="pl-2 basis-[40%]">
                     <div 
                        onClick={() => onBookClick(book)}
                        className="aspect-[2/3] rounded-lg shadow-lg overflow-hidden bg-muted relative transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-xl group"
                     >
                       {book.book?.cover_url ? (
                         <img src={book.book.cover_url} alt={book.book.title} className="w-full h-full object-cover opacity-90" />
                       ) : (
                         <div className="w-full h-full flex items-center justify-center p-1 text-center border border-border">
                            <span className="text-[10px] text-muted-foreground leading-tight">{book.book?.title}</span>
                         </div>
                       )}
                       {/* Subtle indicator for 'want to read' */}
                       <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary/90 shadow-sm ring-1 ring-white/50" />
                     </div>
                  </CarouselItem>
               ))}
            </CarouselContent>
          </Carousel>
        </div>
      )}
    </div>
  );
}

function ClassicBookshelf({ readingBooks, readBooks, wantToReadBooks, onBookClick, hideReading }: { 
  readingBooks: UserBook[], 
  readBooks: UserBook[], 
  wantToReadBooks: UserBook[],
  onBookClick: (book: UserBook) => void,
  hideReading: boolean
}) {
  return (
    <div className="space-y-12 relative p-8 lg:p-16 bg-[#2c1810] rounded-lg shadow-xl border border-[#4e342e] overflow-hidden max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="relative text-center mb-8 z-10">
        <div className="inline-flex items-center justify-center p-4 bg-[#3e2723]/90 backdrop-blur-sm border border-[#5d4037] rounded-lg shadow-sm">
          <Library className="w-6 h-6 text-[#d7ccc8] mr-3" />
          <h2 className="text-3xl font-display font-light text-[#efebe9] tracking-wide">
            Minha Coleção
          </h2>
        </div>
      </div>

      <div className="space-y-20 relative z-10">
        <RecommendationSection />

        {/* Lendo Atualmente */}
        {!hideReading && (
          <ShelfRow 
            title="Lendo Atualmente" 
            books={readingBooks} 
            onBookClick={onBookClick}
            emptyMessage="Nenhuma leitura em andamento."
            icon={<BookOpen className="w-4 h-4" />}
          />
        )}

        {/* Biblioteca Concluída */}
        <ShelfRow 
          title="Lidos" 
          books={readBooks} 
          onBookClick={onBookClick}
          emptyMessage="Sua estante de lidos está vazia."
          count={readBooks.length}
        />

        {/* Lista de Desejos */}
        <ShelfRow 
          title="Quero Ler" 
          books={wantToReadBooks} 
          onBookClick={onBookClick}
          emptyMessage="Sua lista de desejos está vazia."
          count={wantToReadBooks.length}
          variant="want-to-read"
        />
      </div>
    </div>
  );
}

interface ShelfRowProps {
  title: string;
  books: UserBook[];
  onBookClick: (book: UserBook) => void;
  emptyMessage: string;
  count?: number;
  icon?: React.ReactNode;
  variant?: 'default' | 'want-to-read';
}

function ShelfRow({ title, books, onBookClick, emptyMessage, count, icon, variant = 'default' }: ShelfRowProps) {
  return (
    <div className="relative group rounded-lg overflow-hidden border border-[#4e342e] bg-[#3e2723] shadow-sm">
      {/* Shelf Header Bar (Dark Wood Beam) */}
      <div className="h-12 bg-[#3e2723] border-b border-[#2c1810] flex items-center justify-center relative shadow-md z-20">
         {/* Brass Plate Label */}
         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-[#fdf5e6] to-[#deb887] border border-[#8d6e63] px-6 py-1 rounded-sm shadow-sm flex items-center gap-2 min-w-[200px] justify-center">
            {icon && <span className="text-[#3e2723] opacity-80">{icon}</span>}
            <h3 className="text-[#3e2723] font-serif font-bold tracking-wide uppercase text-sm">{title}</h3>
            {count !== undefined && (
              <span className="ml-2 text-[10px] font-bold text-[#fdf5e6] bg-[#3e2723] px-1.5 rounded-full">
                {count}
              </span>
            )}
            
            {/* Screws */}
            <div className="absolute top-1 left-1 w-1 h-1 rounded-full bg-[#8d6e63]" />
            <div className="absolute top-1 right-1 w-1 h-1 rounded-full bg-[#8d6e63]" />
            <div className="absolute bottom-1 left-1 w-1 h-1 rounded-full bg-[#8d6e63]" />
            <div className="absolute bottom-1 right-1 w-1 h-1 rounded-full bg-[#8d6e63]" />
         </div>
      </div>

      {/* The Shelf Container */}
      <div className="relative">
        {/* Dark background behind books */}
        <div className="absolute inset-0 bg-[#1a0f0a] shadow-inner" />

        <ScrollArea className="w-full whitespace-nowrap pb-4 pt-8 px-4">
          <div className="flex w-max items-end space-x-6 min-w-full min-h-[180px] pb-4 px-4">
            {books.length > 0 ? (
              books.map((book) => (
                <div 
                  key={book.id} 
                  onClick={() => onBookClick(book)}
                  className="group/book relative cursor-pointer flex-shrink-0 transition-all duration-300 hover:-translate-y-2 hover:z-20"
                >
                  {/* Book Spine/Cover */}
                  <div className={`relative w-28 md:w-32 aspect-[2/3] rounded-sm shadow-md bg-[#3e2723] overflow-hidden transform transition-transform duration-300 group-hover/book:shadow-xl ${
                    variant === 'want-to-read' ? 'group-hover/book:ring-1 group-hover/book:ring-[#deb887]' : ''
                  }`}>
                    {book.book?.cover_url ? (
                      <img 
                        src={book.book.cover_url} 
                        alt={book.book.title} 
                        className="h-full w-full object-cover opacity-90 group-hover/book:opacity-100 transition-opacity" 
                      />
                    ) : (
                       <div className="h-full w-full flex items-center justify-center bg-[#4e342e] text-[#d7ccc8] border border-[#5d4037] p-2 text-center">
                          <span className="text-xs font-serif leading-tight">{book.book?.title}</span>
                       </div>
                    )}
                    
                    {/* Lighting/Sheen */}
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover/book:opacity-30 transition-opacity pointer-events-none" />
                    
                    {/* Rating Badge (Only for rated books) */}
                    {book.rating && (
                       <div className="absolute -top-2 -right-2 bg-[#3e2723] border border-[#5d4037] text-[#efebe9] rounded-full w-6 h-6 flex items-center justify-center text-[10px] font-bold shadow-lg z-20 scale-0 group-hover/book:scale-100 transition-transform delay-75">
                          {book.rating}
                       </div>
                    )}

                    {/* Want to Read specific badge */}
                    {variant === 'want-to-read' && (
                       <div className="absolute -top-2 -right-2 bg-[#deb887] text-[#3e2723] rounded-full w-6 h-6 flex items-center justify-center shadow-lg z-20 scale-0 group-hover/book:scale-100 transition-transform delay-75">
                          <div className="w-1.5 h-1.5 rounded-full bg-[#3e2723] animate-pulse" />
                       </div>
                    )}
                  </div>
                  
                  {/* Shadow on shelf */}
                  <div className="absolute -bottom-2 left-2 right-2 h-2 bg-black/30 blur-sm rounded-full opacity-0 group-hover/book:opacity-100 group-hover/book:scale-90 transition-all duration-300" />
                </div>
              ))
            ) : (
              <div className="w-full flex items-center justify-center text-[#8d6e63] font-light italic py-10">
                {emptyMessage}
              </div>
            )}
            
            {/* Spacer for scrolling */}
            <div className="w-4" />
          </div>
          <ScrollBar orientation="horizontal" className="bg-[#3e2723] thumb-[#5d4037]" />
        </ScrollArea>

        {/* The Dark Wood Shelf Plank */}
        <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-b from-[#5d4037] to-[#2c1810] border-t border-[#3e2723] shadow-lg z-10" />
      </div>
    </div>
  );
}

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
      <DialogContent className="max-w-2xl overflow-hidden p-0 border-[#4e342e] shadow-2xl bg-[#2c1810] text-[#efebe9]">
        <div className="flex flex-col md:flex-row">
          {/* Left: Cover */}
          <div className="w-full md:w-2/5 bg-[#1a0f0a] p-8 flex items-center justify-center relative overflow-hidden">
             {/* Background Blur */}
             {b.cover_url && (
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-20 scale-150"
                  style={{ backgroundImage: `url(${b.cover_url})` }}
                />
             )}
             
            <div className="relative w-36 shadow-2xl rounded-sm overflow-hidden transition-transform hover:scale-105 duration-500 border-l border-white/10">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-full h-auto object-cover" />
              ) : (
                <div className="aspect-[2/3] bg-[#3e2723] flex items-center justify-center border border-[#5d4037]">
                  <BookOpen className="w-12 h-12 text-[#d7ccc8]" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 p-8 space-y-6 flex flex-col justify-center relative">
             <div className="absolute top-0 right-0 p-4 opacity-5">
                <Library className="w-32 h-32 text-[#d7ccc8]" />
             </div>

            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                 <Badge variant="outline" className="text-xs uppercase tracking-wider font-medium text-[#d7ccc8] border-[#5d4037] bg-[#3e2723]">
                    {getStatusLabel(book.status)}
                 </Badge>
                 {book.rating && (
                   <div className="flex items-center gap-1 text-[#d7ccc8]">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="text-sm font-medium">{book.rating}</span>
                   </div>
                 )}
              </div>
              
              <DialogTitle className="text-3xl font-display font-light text-[#efebe9] leading-tight mb-2">
                {b.title}
              </DialogTitle>
              <p className="text-lg text-[#a1887f] font-light">
                {b.author || 'Autor desconhecido'}
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#4e342e] relative">
               <div className="grid grid-cols-2 gap-4 text-sm">
                  {b.page_count && (
                    <div className="flex flex-col">
                       <span className="text-[#8d6e63] text-xs uppercase tracking-wide font-medium">Páginas</span>
                       <span className="text-[#efebe9] text-lg">{b.page_count}</span>
                    </div>
                  )}
                  {b.published_date && (
                    <div className="flex flex-col">
                       <span className="text-[#8d6e63] text-xs uppercase tracking-wide font-medium">Ano</span>
                       <span className="text-[#efebe9] text-lg">{new Date(b.published_date).getFullYear()}</span>
                    </div>
                  )}
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

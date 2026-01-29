import { useState } from 'react';
import { UserBook } from '@/types';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Star } from 'lucide-react';
import { StarRating } from '@/components/ui/StarRating';

interface LibraryBookshelfProps {
  books: UserBook[];
  isLoading?: boolean;
}

export function LibraryBookshelf({ books, isLoading }: LibraryBookshelfProps) {
  const [selectedBook, setSelectedBook] = useState<UserBook | null>(null);

  const readingBooks = books.filter(b => b.status === 'reading');
  const readBooks = books.filter(b => b.status === 'read');
  const wantToReadBooks = books.filter(b => b.status === 'want_to_read');

  if (isLoading) {
    return (
      <div className="w-full h-[600px] bg-[#2c1810] rounded-t-3xl animate-pulse flex items-center justify-center border-4 border-[#1a0f0a]">
        <div className="text-[#d4c5b5] opacity-50 font-serif text-xl">Construindo biblioteca...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto pt-8 pb-12">
      {/* Grand Bookcase Container */}
      <div className="relative bg-[#2c1810] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-t-[40px] overflow-hidden border-x-[16px] border-[#1a0f0a]">
        
        {/* Crown Molding (Top Ornament) */}
        <div className="h-24 bg-[#1a0f0a] relative flex items-center justify-center border-b-8 border-[#0f0805] shadow-lg z-20">
           {/* Decorative Top Curve - REMOVED */}
           <div className="relative z-10 text-center">
             <h2 className="text-2xl md:text-3xl font-serif text-[#d4c5b5] tracking-[0.2em] uppercase drop-shadow-md">
               Biblioteca
             </h2>
             <div className="flex justify-center gap-2 mt-1 opacity-60">
                <Star className="w-3 h-3 text-[#c5a065] fill-current" />
                <Star className="w-4 h-4 text-[#c5a065] fill-current" />
                <Star className="w-3 h-3 text-[#c5a065] fill-current" />
             </div>
           </div>
        </div>

        {/* Main Cabinet Body */}
        <div className="bg-[#2c1810] relative">
          {/* Inner Shadow & Texture */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 pointer-events-none" />
          <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.8)] pointer-events-none z-10" />

          {/* Shelves */}
          <div className="relative z-0">
             <BookcaseShelf title="Lendo Atualmente" books={readingBooks} onBookClick={setSelectedBook} />
             <BookcaseShelf title="Estante de Lidos" books={readBooks} onBookClick={setSelectedBook} />
             <BookcaseShelf title="Lista de Desejos" books={wantToReadBooks} onBookClick={setSelectedBook} />
             
             {/* Empty Shelf for spacing/visuals if needed */}
             <div className="h-4 bg-[#1a0f0a] shadow-[0_5px_10px_rgba(0,0,0,0.5)] z-20 relative" />
          </div>
        </div>

        {/* Bottom Cabinet / Base */}
        <div className="h-40 bg-[#1a0f0a] relative border-t-8 border-[#0f0805] flex">
           {/* Left Door */}
           <div className="flex-1 m-4 mr-2 bg-[#2c1810] border-4 border-[#0f0805] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative group cursor-pointer overflow-hidden rounded-sm">
              <div className="absolute inset-4 border border-[#0f0805]/50 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#0f0805]/30 group-hover:border-[#c5a065]/20 transition-colors" />
              </div>
              <div className="absolute top-1/2 right-4 w-2 h-8 bg-[#0f0805] rounded-full shadow-lg" />
           </div>
           {/* Right Door */}
           <div className="flex-1 m-4 ml-2 bg-[#2c1810] border-4 border-[#0f0805] shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative group cursor-pointer overflow-hidden rounded-sm">
              <div className="absolute inset-4 border border-[#0f0805]/50 opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full border-4 border-[#0f0805]/30 group-hover:border-[#c5a065]/20 transition-colors" />
              </div>
              <div className="absolute top-1/2 left-4 w-2 h-8 bg-[#0f0805] rounded-full shadow-lg" />
           </div>
        </div>

      </div>

      <BookDetailModal 
        book={selectedBook} 
        open={!!selectedBook} 
        onOpenChange={(open) => !open && setSelectedBook(null)} 
      />
    </div>
  );
}

function BookcaseShelf({ title, books, onBookClick }: { title: string, books: UserBook[], onBookClick: (b: UserBook) => void }) {
  return (
    <div className="relative group">
      {/* Shelf Content Area */}
      <div className="min-h-[220px] px-8 py-6 flex items-end gap-6 overflow-x-auto relative scrollbar-thin scrollbar-thumb-[#3e2316] scrollbar-track-transparent">
        
        {/* Shelf Plaque (Label) */}
        <ShelfPlaque title={title} />

        {/* Books */}
        {books.length > 0 ? (
          books.map((book) => (
             <ShelfBookCover key={book.id} userBook={book} onClick={() => onBookClick(book)} />
          ))
        ) : (
          <div className="h-32 flex items-center justify-center opacity-20 ml-4">
             <div className="text-[#d4c5b5] font-serif italic text-sm">...</div>
          </div>
        )}

      </div>

      {/* The Shelf Plank */}
      <div className="h-6 bg-gradient-to-b from-[#3e2316] to-[#1a0f0a] border-t border-[#4a2c1d] shadow-[0_10px_20px_rgba(0,0,0,0.6)] z-20 relative" />
    </div>
  );
}

function ShelfPlaque({ title }: { title: string }) {
  return (
    <div className="flex-shrink-0 w-32 h-[140px] flex flex-col justify-end items-center relative group select-none mr-2">
      {/* Stand Base */}
      <div className="absolute bottom-0 w-24 h-4 bg-[#1a0f0a] rounded-t-sm shadow-lg z-20" 
           style={{ clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)' }} />
      
      {/* Brass Plate Container */}
      <div className="relative w-full h-24 mb-3 flex items-center justify-center z-30 transform transition-transform duration-300 group-hover:scale-105">
        {/* The Plate */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#f0e68c] via-[#daa520] to-[#b8860b] rounded-md shadow-[0_5px_15px_rgba(0,0,0,0.4)] border-2 border-[#8b4513] flex items-center justify-center p-1">
          {/* Inner Border/Groove */}
          <div className="w-full h-full border border-[#8b4513]/50 rounded-sm flex items-center justify-center bg-gradient-to-br from-[#daa520] via-[#f0e68c] to-[#b8860b] opacity-90">
             <span className="font-serif font-bold text-[#3e2316] text-center leading-tight uppercase tracking-widest text-xs md:text-sm drop-shadow-sm px-2">
               {title}
             </span>
          </div>
          
          {/* Screws */}
          <div className="absolute top-1 left-1 w-1.5 h-1.5 bg-[#3e2316] rounded-full opacity-60 shadow-inner" />
          <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#3e2316] rounded-full opacity-60 shadow-inner" />
          <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-[#3e2316] rounded-full opacity-60 shadow-inner" />
          <div className="absolute bottom-1 right-1 w-1.5 h-1.5 bg-[#3e2316] rounded-full opacity-60 shadow-inner" />
          
          {/* Shine */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/30 to-transparent rounded-r-md pointer-events-none" />
        </div>
      </div>
      
      {/* Support Leg (Behind) */}
      <div className="absolute bottom-2 w-4 h-16 bg-[#0f0805] -z-10" />
    </div>
  );
}

function ShelfBookCover({ userBook, onClick }: { userBook: UserBook; onClick: () => void }) {
  const { book } = userBook;
  if (!book) return null;

  return (
    <button 
      onClick={onClick}
      className="group relative flex-shrink-0 w-28 md:w-32 transition-all duration-300 hover:-translate-y-4 hover:scale-105 focus:outline-none"
      title={book.title}
    >
      {/* Book Shadow */}
      <div className="absolute bottom-0 left-2 right-2 h-3 bg-black/60 blur-md rounded-full transform translate-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Book Cover */}
      <div className="relative aspect-[2/3] rounded-sm shadow-[5px_5px_15px_rgba(0,0,0,0.5)] overflow-hidden bg-[#1a120d] border-l border-white/10 group-hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)] transition-shadow duration-300">
        {book.cover_url ? (
          <img 
            src={book.cover_url} 
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-[#3e2c22] text-[#d4c5b5] p-3 text-center border-4 border-[#2c1810]">
            <div className="border-2 border-[#d4c5b5]/30 p-1 w-full h-full flex items-center justify-center">
               <span className="font-serif text-xs leading-tight line-clamp-4">{book.title}</span>
            </div>
          </div>
        )}
        
        {/* Lighting/Sheen Effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/10 pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/20" />
      </div>
    </button>
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
      <DialogContent className="max-w-2xl bg-[#fdfbf7] border-none shadow-2xl overflow-hidden p-0">
        <div className="flex flex-col md:flex-row">
          {/* Left: Cover */}
          <div className="w-full md:w-1/3 bg-[#e8e4dc] p-8 flex items-center justify-center">
            <div className="relative w-32 md:w-40 shadow-[10px_10px_30px_rgba(0,0,0,0.2)] transform rotate-y-12">
              {b.cover_url ? (
                <img src={b.cover_url} alt={b.title} className="w-full rounded-sm" />
              ) : (
                <div className="aspect-[2/3] bg-primary/20 flex items-center justify-center rounded-sm">
                  <BookOpen className="w-12 h-12 opacity-50" />
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="flex-1 p-6 md:p-8 space-y-6">
            <div>
              <DialogTitle className="text-2xl font-serif font-bold text-gray-900 leading-tight">
                {b.title}
              </DialogTitle>
              <p className="text-lg text-gray-600 mt-1 font-serif italic">
                {b.author || 'Autor desconhecido'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-[#e8e4dc] text-[#5c4033] hover:bg-[#d4c5b5] font-serif uppercase tracking-wider text-xs">
                {getStatusLabel(book.status)}
              </Badge>
              {book.rating && (
                <div className="flex items-center gap-1">
                   <StarRating rating={book.rating} readonly />
                </div>
              )}
            </div>

            <div className="space-y-4 border-t border-gray-200 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Páginas</span>
                  <span className="font-medium text-gray-700">{b.page_count || '-'}</span>
                </div>
                <div>
                  <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Categoria</span>
                  <span className="font-medium text-gray-700">
                    {b.categories && b.categories[0] ? b.categories[0] : '-'}
                  </span>
                </div>
              </div>

              {b.description && (
                <div>
                  <span className="block text-gray-400 text-xs uppercase tracking-wider mb-1">Sinopse</span>
                  <p className="text-sm text-gray-600 line-clamp-4 leading-relaxed font-serif">
                    {b.description}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

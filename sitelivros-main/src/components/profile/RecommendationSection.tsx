import { useRecommendations } from '@/hooks/useRecommendations';
import { Book } from '@/types';
import { Sparkles, Plus } from 'lucide-react';
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
} from '@/components/ui/carousel';
import { Button } from '@/components/ui/button';
import { useUserBooks } from '@/hooks/useUserBooks';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect } from 'react';

export function RecommendationSection() {
  const { recommendations, loading } = useRecommendations();
  const { addToList } = useUserBooks();
  const { toast } = useToast();

  useEffect(() => {
    if (loading) {
      console.log('RecommendationSection: Loading...');
    } else {
      console.log('RecommendationSection: Loaded', recommendations);
    }
  }, [loading, recommendations]);

  const handleAddBook = async (book: Book) => {
    try {
      toast({ title: "Adicionando...", description: `Adicionando "${book.title}" à sua lista.` });
      const { error } = await addToList(book, 'want_to_read');
      if (!error) {
        toast({ title: "Sucesso!", description: "Livro adicionado à lista 'Quero Ler'." });
      } else {
        console.error('Error adding book:', error);
        toast({ title: "Erro", description: "Não foi possível adicionar o livro.", variant: "destructive" });
      }
    } catch (e) {
      console.error('Exception adding book:', e);
      toast({ title: "Erro", description: "Erro inesperado.", variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 py-8">
        <div className="flex items-center gap-2 px-6">
          <Skeleton className="w-6 h-6 rounded-full bg-muted/20" />
          <Skeleton className="w-48 h-6 rounded bg-muted/20" />
        </div>
        <div className="px-6 flex gap-4 overflow-hidden">
           {[1, 2, 3].map(i => (
             <Skeleton key={i} className="w-[140px] h-[200px] rounded-xl flex-shrink-0 bg-muted/20" />
           ))}
        </div>
      </div>
    );
  }

  // Ensure recommendations is an array
  const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];

  if (safeRecommendations.length === 0) {
    return (
      <div className="space-y-6 py-8 bg-gradient-to-b from-purple-900/10 to-transparent rounded-xl border border-purple-500/10 mb-8 mx-4">
        <div className="px-6 text-center text-muted-foreground">
          <p className="text-sm">Nenhuma recomendação encontrada no momento.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-8 bg-gradient-to-b from-purple-900/10 to-transparent rounded-xl border border-purple-500/10 mb-8">
      <div className="px-6 flex items-center gap-2">
        <div className="p-2 bg-purple-500/10 rounded-full">
           <Sparkles className="w-5 h-5 text-purple-500 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-display font-medium text-foreground tracking-wide">
            Recomendações Mágicas
          </h3>
          <p className="text-xs text-muted-foreground">
            Baseado no seu gosto literário
          </p>
        </div>
      </div>

      <Carousel className="w-full" opts={{ align: "start", dragFree: true }}>
        <CarouselContent className="-ml-2 px-6">
          {safeRecommendations.map((book) => {
            if (!book || !book.id) return null;
            return (
              <CarouselItem key={book.id} className="pl-4 basis-[40%] md:basis-[20%] lg:basis-[15%]">
                <div className="group relative aspect-[2/3] rounded-xl overflow-hidden shadow-lg transition-all hover:scale-105 hover:shadow-purple-500/20 bg-muted">
                  {book.cover_url ? (
                    <img 
                      src={book.cover_url} 
                      alt={book.title || 'Livro'} 
                      className="w-full h-full object-cover" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-2 text-center border border-border">
                      <span className="text-xs text-muted-foreground">{book.title || 'Sem título'}</span>
                    </div>
                  )}
                  
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 gap-2">
                    <p className="text-white text-[10px] text-center line-clamp-2 font-medium">
                      {book.title}
                    </p>
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      className="h-7 text-[10px] w-full gap-1"
                      onClick={() => handleAddBook(book)}
                    >
                      <Plus className="w-3 h-3" />
                      Quero Ler
                    </Button>
                  </div>
                </div>
              </CarouselItem>
            );
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { UserBook, ChallengeSuggestion } from '@/types';
import { Loader2, Check, Book as BookIcon, AlertCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';

interface ChallengeCompletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (bookId: string) => Promise<void>;
  suggestions?: ChallengeSuggestion[];
  theme?: any; // Using any for simplicity as it matches ReadingChallenge THEMES structure
}

export function ChallengeCompletionDialog({ open, onOpenChange, onConfirm, suggestions = [], theme }: ChallengeCompletionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Fallback theme if not provided
  const safeTheme = theme || {
    container: "border-[#2c1810] bg-[#1a0f0a]",
    icon: "text-[#c5a065]",
    title: "text-[#d4c5b5] font-serif",
    text: "text-[#d4c5b5]/70",
    button: "bg-[#c5a065] hover:bg-[#b08d55] text-[#1a0f0a]",
    buttonSecondary: "text-[#d4c5b5] hover:bg-[#2c1810] hover:text-[#c5a065]",
    card: "bg-[#2c1810]/50 border-[#c5a065]/20",
    gradient: "from-transparent via-[#c5a065]/50 to-transparent"
  };

  useEffect(() => {
    if (open && user) {
      fetchReadBooks();
      setSelectedBookId(null);
    }
  }, [open, user]);

  async function fetchReadBooks() {
    setLoading(true);
    try {
      // Fetch books marked as 'read'
      const { data, error } = await supabase
        .from('user_books')
        .select('*, book:books(*)')
        .eq('user_id', user!.id)
        .eq('status', 'read')
        .order('finished_at', { ascending: false });

      if (error) throw error;
      setBooks(data as UserBook[]);
    } catch (error) {
      console.error('Error fetching read books:', error);
      toast({
        title: 'Erro ao carregar livros',
        description: 'Não foi possível carregar seus livros lidos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  const isBookValid = (bookTitle: string) => {
    if (!suggestions || suggestions.length === 0) return true;
    const normalizedBookTitle = bookTitle.toLowerCase().trim();
    return suggestions.some(s => {
      const normalizedSuggestion = s.title.toLowerCase().trim();
      // Allow exact match or if the book title contains the suggestion title (e.g. "Duna: Messiah" contains "Duna")
      // We check both ways to be safe: "Duna" includes "Duna"
      return normalizedBookTitle.includes(normalizedSuggestion) || normalizedSuggestion.includes(normalizedBookTitle);
    });
  };

  const handleConfirm = async () => {
    if (!selectedBookId) return;
    
    const selectedBook = books.find(b => b.book_id === selectedBookId);
    if (!selectedBook || !selectedBook.book) return;

    if (!isBookValid(selectedBook.book.title)) {
      toast({
        title: "Livro inválido",
        description: "Este livro não corresponde a nenhum dos títulos sugeridos para o desafio.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    try {
      await onConfirm(selectedBookId);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`sm:max-w-[500px] ${safeTheme.container} border text-[#d4c5b5]`}>
        <DialogHeader>
          <DialogTitle className={`tracking-wide text-xl ${safeTheme.title}`}>Concluir Desafio</DialogTitle>
          <DialogDescription className={safeTheme.text}>
            Selecione o livro que você leu para completar este desafio.
            {suggestions.length > 0 && (
              <span className={`block mt-2 text-xs p-2 rounded border opacity-90 ${safeTheme.icon.replace('text-', 'border-').replace('text-', 'bg-').replace('500', '950/30').replace('600', '950/30')} ${safeTheme.icon}`}>
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Apenas livros da lista sugerida são aceitos.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className={`w-8 h-8 animate-spin ${safeTheme.icon}`} />
            </div>
          ) : books.length === 0 ? (
            <div className={`text-center py-8 opacity-50 ${safeTheme.text}`}>
              <BookIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Você ainda não tem livros marcados como "Lido".</p>
              <p className="text-xs mt-1">Atualize sua estante para completar o desafio.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {books.map((item) => {
                  const isValid = item.book ? isBookValid(item.book.title) : false;
                  // Extract color from icon class for borders (e.g., text-cyan-400 -> border-cyan-400)
                  const borderColor = safeTheme.icon.replace('text-', 'border-');
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => isValid && setSelectedBookId(item.book_id)}
                      className={`group flex items-center gap-3 p-3 rounded-lg border transition-all duration-300 ${
                        isValid 
                          ? 'cursor-pointer hover:bg-white/5 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg' 
                          : 'cursor-not-allowed opacity-50 bg-black/40 grayscale'
                      } ${
                        selectedBookId === item.book_id
                          ? `${borderColor} bg-white/10 scale-[1.02] shadow-md`
                          : 'border-white/10'
                      }`}
                    >
                      <div className={`h-12 w-8 bg-black/40 rounded overflow-hidden flex-shrink-0 border border-white/10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                        {item.book?.cover_url ? (
                          <img src={item.book.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookIcon className="w-4 h-4 opacity-20" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium text-sm truncate ${safeTheme.title.replace('font-serif', '')}`}>{item.book?.title}</h4>
                        <p className="text-xs opacity-60 truncate">{item.book?.author}</p>
                        {!isValid && suggestions.length > 0 && (
                          <span className="text-[10px] text-red-400/80 flex items-center gap-1 mt-1">
                            Não elegível
                          </span>
                        )}
                      </div>
                      {selectedBookId === item.book_id && (
                        <Check className={`w-5 h-5 ${safeTheme.icon}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className={`hover:bg-white/10 ${safeTheme.buttonSecondary || 'text-white'}`}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedBookId || submitting}
            className={`font-bold ${safeTheme.button}`}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Confirmar Conclusão'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

  );
}

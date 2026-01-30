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
}

export function ChallengeCompletionDialog({ open, onOpenChange, onConfirm, suggestions = [] }: ChallengeCompletionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [books, setBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    return suggestions.some(s => s.title.toLowerCase().trim() === bookTitle.toLowerCase().trim());
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Concluir Desafio</DialogTitle>
          <DialogDescription>
            Selecione o livro que você leu para completar este desafio.
            {suggestions.length > 0 && (
              <span className="block mt-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded border border-amber-200 dark:border-amber-900">
                <AlertCircle className="w-3 h-3 inline mr-1" />
                Apenas livros da lista sugerida são aceitos.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>Você ainda não tem livros marcados como "Lido".</p>
              <p className="text-xs mt-1">Atualize sua estante para completar o desafio.</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px] pr-4">
              <div className="grid grid-cols-1 gap-2">
                {books.map((item) => {
                  const isValid = item.book ? isBookValid(item.book.title) : false;
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => isValid && setSelectedBookId(item.book_id)}
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        isValid 
                          ? 'cursor-pointer' 
                          : 'cursor-not-allowed opacity-50 bg-muted/50 grayscale'
                      } ${
                        selectedBookId === item.book_id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="h-12 w-8 bg-muted rounded overflow-hidden flex-shrink-0">
                        {item.book?.cover_url ? (
                          <img src={item.book.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-muted-foreground/20">
                            <BookIcon className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{item.book?.title}</h4>
                        <p className="text-xs text-muted-foreground truncate">{item.book?.author}</p>
                        {!isValid && suggestions.length > 0 && (
                          <span className="text-[10px] text-destructive flex items-center gap-1 mt-1">
                            Não elegível
                          </span>
                        )}
                      </div>
                      {selectedBookId === item.book_id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!selectedBookId || submitting}
            className="bg-green-600 hover:bg-green-700 text-white"
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

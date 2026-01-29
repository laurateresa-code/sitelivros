import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StarRating } from '@/components/ui/StarRating';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, PenLine } from 'lucide-react';

interface CreateReviewDialogProps {
  bookId: string;
  onReviewCreated: () => void;
}

export function CreateReviewDialog({ bookId, onReviewCreated }: CreateReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user) return;
    if (!content.trim()) {
      toast({
        title: 'Escreva uma avaliação',
        description: 'O texto da avaliação não pode estar vazio.',
        variant: 'destructive',
      });
      return;
    }
    if (rating === 0) {
      toast({
        title: 'Dê uma nota',
        description: 'Selecione uma nota de 1 a 5 estrelas.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        book_id: bookId,
        content: content.trim(),
        rating: rating,
        type: 'review',
      });

      if (error) throw error;

      toast({
        title: 'Avaliação publicada!',
        description: 'Sua avaliação foi compartilhada com a comunidade.',
      });

      setContent('');
      setRating(0);
      setOpen(false);
      onReviewCreated();
    } catch (error) {
      console.error('Error creating review:', error);
      toast({
        title: 'Erro ao publicar avaliação',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PenLine className="w-4 h-4" />
          Escrever Avaliação
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Escrever Avaliação</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sua nota</label>
            <StarRating rating={rating} onRatingChange={setRating} size="lg" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Sua opinião</label>
            <Textarea
              placeholder="O que você achou deste livro? O que mais gostou? Para quem recomendaria?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[150px] resize-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !content.trim() || rating === 0}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Publicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

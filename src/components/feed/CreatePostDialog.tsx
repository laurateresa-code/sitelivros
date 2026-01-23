import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PenSquare } from 'lucide-react';

interface CreatePostDialogProps {
  onPostCreated?: () => void;
}

export function CreatePostDialog({ onPostCreated }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      // Try with 'general' type first (requires updated schema)
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        content: content.trim(),
        type: 'general',
      });

      if (error) {
        // If check constraint fails, try fallback to 'milestone' (for older schema versions)
        if (error.message?.includes('check constraint') || error.code === '23514') {
          console.warn('Fallback to milestone type due to constraint violation');
          const { error: retryError } = await supabase.from('posts').insert({
            user_id: user.id,
            content: content.trim(),
            type: 'milestone',
          });
          if (retryError) throw retryError;
        } else {
          throw error;
        }
      }

      toast({
        title: 'Post criado com sucesso!',
        description: 'Seu post já está visível no feed.',
      });

      setContent('');
      setOpen(false);
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro ao criar post',
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
        <Button className="w-full gap-2" variant="outline" size="lg">
          <PenSquare className="w-4 h-4" />
          No que você está pensando?
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <Textarea
            placeholder="Compartilhe seus pensamentos sobre livros, leituras ou qualquer coisa relacionada..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px]"
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
              {loading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface EditNicknameDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId: string;
  userId: string;
  currentNickname?: string;
  onNicknameUpdated: () => void;
}

export function EditNicknameDialog({ 
  open, 
  onOpenChange, 
  clubId, 
  userId, 
  currentNickname, 
  onNicknameUpdated 
}: EditNicknameDialogProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('club_members')
        .update({ nickname: nickname.trim() || null })
        .eq('club_id', clubId)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: 'Apelido atualizado!',
        description: 'Seu apelido neste clube foi alterado.',
      });

      onOpenChange(false);
      onNicknameUpdated();
    } catch (error) {
      console.error('Error updating nickname:', error);
      toast({
        title: 'Erro ao atualizar apelido',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Apelido no Clube</DialogTitle>
          <DialogDescription>
            Como você quer ser chamado neste clube?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido</Label>
            <Input
              id="nickname"
              placeholder="Seu apelido..."
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Deixe em branco para usar seu nome de perfil.
            </p>
          </div>
          
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

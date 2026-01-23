import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Club } from '@/types';

interface EditClubDialogProps {
  club: Club;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClubUpdated: () => void;
}

export function EditClubDialog({ club, open, onOpenChange, onClubUpdated }: EditClubDialogProps) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description || '');
  const [isPublic, setIsPublic] = useState(club.is_public);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      setName(club.name);
      setDescription(club.description || '');
      setIsPublic(club.is_public);
    }
  }, [open, club]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
        })
        .eq('id', club.id);

      if (error) throw error;

      toast({
        title: 'Clube atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      });

      onOpenChange(false);
      onClubUpdated();
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: 'Erro ao atualizar clube',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
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
          <DialogTitle>Editar Clube</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu clube de leitura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Clube</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Clube dos Clássicos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              placeholder="Sobre o que é este clube?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="edit-public-mode">Clube Público</Label>
              <div className="text-sm text-muted-foreground">
                Qualquer pessoa pode ver e participar
              </div>
            </div>
            <Switch
              id="edit-public-mode"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

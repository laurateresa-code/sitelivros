import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Plus, Loader2 } from 'lucide-react';

interface CreateClubDialogProps {
  onClubCreated?: () => void;
  trigger?: React.ReactNode;
}

export function CreateClubDialog({ onClubCreated, trigger }: CreateClubDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      // 1. Create the club
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          is_public: isPublic,
          owner_id: user.id,
          member_count: 1,
        })
        .select()
        .single();

      if (clubError) throw clubError;

      // 2. Add owner as member
      const { error: memberError } = await supabase
        .from('club_members')
        .insert({
          club_id: clubData.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        // Rollback club creation if member creation fails
        await supabase.from('clubs').delete().eq('id', clubData.id);
        throw memberError;
      }

      toast({
        title: 'Clube criado com sucesso!',
        description: 'Agora você pode convidar membros para participar.',
      });

      // Reset form and close
      setName('');
      setDescription('');
      setIsPublic(true);
      setOpen(false);
      onClubCreated?.();
    } catch (error) {
      console.error('Error creating club:', error);
      toast({
        title: 'Erro ao criar clube',
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
        {trigger || (
          <Button className="gradient-primary text-white gap-2">
            <Plus className="w-4 h-4" />
            Criar Clube
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Novo Clube</DialogTitle>
          <DialogDescription>
            Crie um espaço para discutir livros com outros leitores.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Clube</Label>
            <Input
              id="name"
              placeholder="Ex: Clube dos Clássicos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Sobre o que é este clube?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="public-mode">Clube Público</Label>
              <div className="text-sm text-muted-foreground">
                Qualquer pessoa pode ver e participar
              </div>
            </div>
            <Switch
              id="public-mode"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Clube'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, User, FileText, Link as LinkIcon, Image, AtSign } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';

const profileSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username deve conter apenas letras, números, underline e hífen'),
  display_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(50, 'Nome muito longo'),
  bio: z.string().max(160, 'Bio deve ter no máximo 160 caracteres').optional(),
  avatar_url: z.string().url('URL inválida').optional().or(z.literal('')),
  banner_url: z.string().url('URL inválida').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface EditProfileDialogProps {
  profile: Profile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProfileUpdated: () => void;
}

export function EditProfileDialog({
  profile,
  open,
  onOpenChange,
  onProfileUpdated,
}: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: profile.username || '',
      display_name: profile.display_name || '',
      bio: profile.bio || '',
      avatar_url: profile.avatar_url || '',
      // banner_url: profile.banner_url || '',
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setLoading(true);
    try {
      // Check if username is taken (if changed)
      if (values.username !== profile.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', values.username)
          .neq('user_id', profile.user_id) // Ignore current user
          .maybeSingle();

        if (checkError) throw checkError;
        
        if (existingUser) {
          form.setError('username', { 
            type: 'manual', 
            message: 'Este nome de usuário já está em uso.' 
          });
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: values.username,
          display_name: values.display_name,
          bio: values.bio,
          avatar_url: values.avatar_url,
          // banner_url removido do update
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', profile.user_id);

      if (error) {
        if (error.code === '23505') { // Unique violation
          form.setError('username', { 
            type: 'manual', 
            message: 'Este nome de usuário já está em uso.' 
          });
          return;
        }
        throw error;
      }

      toast({
        title: 'Perfil atualizado!',
        description: 'Suas informações foram salvas com sucesso.',
      });
      
      onProfileUpdated();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Tente novamente mais tarde.',
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
          <DialogTitle>Editar Perfil</DialogTitle>
          <DialogDescription>
            Faça alterações no seu perfil público aqui.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 space-y-4">
            <div className="flex-1 overflow-y-auto px-1 space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <AtSign className="w-4 h-4" /> Nome de Usuário
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormDescription>
                    Seu identificador único na plataforma.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="display_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="w-4 h-4" /> Nome de Exibição
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Seu nome" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Bio
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Conte um pouco sobre você..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <LinkIcon className="w-4 h-4" /> URL do Avatar
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="banner_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Image className="w-4 h-4" /> URL do Banner
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="https://..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            </div>

            <DialogFooter className="mt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="gradient-primary text-white" disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

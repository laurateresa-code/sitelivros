import { useEffect, useState, useCallback } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Club } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, BookOpen, Plus, Loader2, MoreVertical, Edit, Share2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { CreateClubDialog } from '@/components/clubs/CreateClubDialog';
import { EditClubDialog } from '@/components/clubs/EditClubDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Clubs() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingClub, setEditingClub] = useState<Club | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const fetchClubs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('clubs')
        .select(`
          *,
          current_book:books(*)
        `)
        .order('member_count', { ascending: false });

      if (error) throw error;
      setClubs(data as Club[]);
    } catch (error) {
      console.error('Error fetching clubs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClubs();
  }, [fetchClubs]);

  const handleJoin = useCallback(async (clubId: string, isInvite = false) => {
    if (!user) {
      toast({ title: 'Faça login para entrar em um clube', variant: 'destructive' });
      return;
    }

    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: clubId,
          user_id: user.id,
          role: 'member',
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          toast({ 
            title: isInvite ? 'Você já faz parte deste clube!' : 'Você já é membro deste clube!',
            variant: isInvite ? 'default' : 'destructive'
          });
        } else {
          throw error;
        }
      } else {
        toast({ title: 'Você entrou no clube com sucesso!' });
        fetchClubs();
      }
    } catch (error) {
      console.error('Error joining club:', error);
      toast({ title: 'Erro ao entrar no clube', variant: 'destructive' });
    }
  }, [user, toast, fetchClubs]);

  useEffect(() => {
    if (authLoading) return;

    const params = new URLSearchParams(location.search);
    const inviteId = params.get('invite');
    
    if (inviteId) {
      if (user) {
        handleJoin(inviteId, true);
        navigate('/clubs', { replace: true });
      } else {
        // Keep the param so user can join after login, but warn them
        toast({ 
          title: 'Convite recebido', 
          description: 'Faça login ou crie uma conta para aceitar o convite.',
        });
      }
    }
  }, [location.search, user, authLoading, handleJoin, navigate, toast]);

  const handleInvite = (clubId: string) => {
    const link = `${window.location.origin}/clubs?invite=${clubId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link de convite copiado!',
      description: 'Compartilhe com quem você quiser convidar.',
    });
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display">Clubes de Leitura</h1>
            <p className="text-muted-foreground">
              Junte-se a grupos de leitura e discuta seus livros favoritos
            </p>
          </div>
          <CreateClubDialog onClubCreated={fetchClubs} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : clubs.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clubs.map((club) => (
              <Card key={club.id} className="group hover:shadow-lg transition-shadow overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-primary/10 to-secondary/10 relative">
                  {club.cover_url ? (
                    <img 
                      src={club.cover_url} 
                      alt={club.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-12 h-12 text-muted-foreground/20" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{club.name}</CardTitle>
                      <CardDescription className="line-clamp-2 mt-2">
                        {club.description || 'Sem descrição'}
                      </CardDescription>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user && user.id === club.owner_id && (
                          <DropdownMenuItem onClick={() => setEditingClub(club)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleInvite(club.id)}>
                          <Share2 className="w-4 h-4 mr-2" />
                          Convidar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {club.member_count} membros
                    </div>
                    <Badge variant={club.is_public ? 'secondary' : 'outline'}>
                      {club.is_public ? 'Público' : 'Privado'}
                    </Badge>
                  </div>

                  {club.current_book && (
                    <div className="p-3 bg-muted/50 rounded-lg flex gap-3 items-center">
                      <div className="h-12 w-8 bg-background rounded overflow-hidden shadow-sm flex-shrink-0">
                        {club.current_book.cover_url ? (
                          <img src={club.current_book.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Lendo atualmente:</p>
                        <p className="font-medium text-sm truncate">{club.current_book.title}</p>
                      </div>
                    </div>
                  )}

                  <Button className="w-full" variant="outline" onClick={() => handleJoin(club.id)}>
                    Participar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-muted/30 rounded-lg border-2 border-dashed">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-semibold mb-2">Nenhum clube encontrado</h3>
            <p className="text-muted-foreground mb-4">Seja o primeiro a criar um clube de leitura!</p>
            <CreateClubDialog 
              onClubCreated={fetchClubs}
              trigger={<Button variant="outline">Criar Clube</Button>}
            />
          </div>
        )}
      </div>

      {editingClub && (
        <EditClubDialog
          club={editingClub}
          open={!!editingClub}
          onOpenChange={(open) => !open && setEditingClub(null)}
          onClubUpdated={fetchClubs}
        />
      )}
    </Layout>
  );
}

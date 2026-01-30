import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Club, Profile, ClubMemberWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Users, BookOpen, Share2, Copy, LogIn, Edit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditNicknameDialog } from '@/components/clubs/EditNicknameDialog';
import { EditClubDialog } from '@/components/clubs/EditClubDialog';
import { ClubChat } from '@/components/clubs/ClubChat';

export default function ClubDetails() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const inviteCode = searchParams.get('invite');
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingClub, setIsEditingClub] = useState(false);
  const [joining, setJoining] = useState(false);
  const { user } = useAuth();
  const currentUserMember = members.find(m => m.user_id === user?.id);
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchClubDetails = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch club info
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select(`
          *,
          current_book:books(*)
        `)
        .eq('id', id)
        .single();

      if (clubError) throw clubError;
      setClub(clubData as Club);

      // Fetch members with profiles
      const { data: membersData, error: membersError } = await supabase
        .from('club_members')
        .select('*')
        .eq('club_id', id);

      if (membersError) throw membersError;

      if (membersData && membersData.length > 0) {
        const userIds = membersData.map(m => m.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*')
          .in('user_id', userIds);

        if (profilesError) throw profilesError;

        // Combine data
        const combinedMembers = membersData.map(member => {
          const profile = profilesData?.find(p => p.user_id === member.user_id);
          return {
            ...member,
            profile: profile || {
              id: member.user_id,
              user_id: member.user_id,
              username: 'Unknown',
              display_name: 'Unknown User',
              avatar_url: null,
              total_books_read: 0,
              reader_level: 'iniciante'
            } as Profile
          };
        });

        setMembers(combinedMembers as ClubMemberWithProfile[]);
      } else {
        setMembers([]);
      }

    } catch (error) {
      console.error('Error fetching club details:', error);
      toast({
        title: 'Erro ao carregar clube',
        description: 'Não foi possível carregar as informações do clube.',
        variant: 'destructive',
      });
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchClubDetails();
  }, [fetchClubDetails]);

  const handleJoinClub = async () => {
    if (!user || !club) return;
    
    // Check invite code if private
    if (!club.is_public && (!inviteCode || inviteCode !== club.invite_code)) {
      toast({
        title: 'Clube Privado',
        description: 'Você precisa de um link de convite válido para entrar neste clube.',
        variant: 'destructive',
      });
      return;
    }

    setJoining(true);
    try {
      const { error } = await supabase
        .from('club_members')
        .insert({
          club_id: club.id,
          user_id: user.id,
          role: 'member',
        });

      if (error) throw error;

      toast({
        title: 'Bem-vindo ao clube!',
        description: `Você agora faz parte do ${club.name}.`,
      });
      fetchClubDetails();
    } catch (error) {
      console.error('Error joining club:', error);
      toast({
        title: 'Erro ao entrar no clube',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setJoining(false);
    }
  };

  const copyInviteLink = () => {
    if (!club?.invite_code) return;
    const link = `${window.location.origin}/clubs/${club.id}?invite=${club.invite_code}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copiado!',
      description: 'Link de convite copiado para a área de transferência.',
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!club) return null;

  const canJoin = !currentUserMember && (club.is_public || (inviteCode && inviteCode === club.invite_code));
  const isOwner = currentUserMember?.role === 'owner';

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/clubs')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Clubes
        </Button>

        {/* Club Header */}
        <div className="relative rounded-xl overflow-hidden bg-card border shadow-sm">
          <div className="h-48 bg-gradient-to-r from-primary/20 to-secondary/20 relative">
            {club.cover_url && (
              <img 
                src={club.cover_url} 
                alt={club.name} 
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-black/40" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2">{club.name}</h1>
                <div className="flex items-center gap-4 text-sm opacity-90">
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {members.length} membros
                  </span>
                  <Badge variant={club.is_public ? 'secondary' : 'outline'} className="bg-white/20 hover:bg-white/30 text-white border-none">
                    {club.is_public ? 'Público' : 'Privado'}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isOwner && (
                  <>
                    <Button 
                      onClick={() => setIsEditingClub(true)} 
                      variant="secondary"
                      size="sm"
                      className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
                    >
                      <Edit className="w-4 h-4" />
                      <span className="hidden sm:inline">Editar</span>
                    </Button>
                    <Button 
                      onClick={copyInviteLink} 
                      variant="secondary"
                      size="sm"
                      className="gap-2 bg-white/20 hover:bg-white/30 text-white border-none backdrop-blur-sm"
                    >
                      <Copy className="w-4 h-4" />
                      <span className="hidden sm:inline">Copiar Convite</span>
                    </Button>
                  </>
                )}
                
                {canJoin && (
                  <Button 
                    onClick={handleJoinClub} 
                    disabled={joining}
                    className="gap-2 shadow-lg"
                  >
                    {joining ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <LogIn className="w-4 h-4" />
                    )}
                    Entrar no Clube
                  </Button>
                )}
              </div>
            </div>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground">{club.description || 'Sem descrição definida.'}</p>
          </div>
        </div>

        {/* Tabs for Overview, Chat */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* Current Book Section */}
            {club.current_book && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Leitura do Momento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-6 flex-col sm:flex-row">
                    <div className="w-32 h-48 bg-muted rounded-md overflow-hidden flex-shrink-0 shadow-sm mx-auto sm:mx-0">
                      {club.current_book.cover_url ? (
                        <img 
                          src={club.current_book.cover_url} 
                          alt={club.current_book.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted/50">
                          <BookOpen className="w-8 h-8 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="space-y-4 text-center sm:text-left">
                      <div>
                        <h3 className="text-xl font-semibold">{club.current_book.title}</h3>
                        <p className="text-muted-foreground">{club.current_book.author}</p>
                      </div>
                      
                      {club.current_book.description && (
                        <p className="text-sm text-muted-foreground line-clamp-4 max-w-2xl">
                          {club.current_book.description}
                        </p>
                      )}

                      <div className="flex gap-4 justify-center sm:justify-start">
                        {club.current_book.page_count && (
                          <Badge variant="secondary">
                            {club.current_book.page_count} páginas
                          </Badge>
                        )}
                        {club.current_book.published_date && (
                          <Badge variant="outline">
                            {new Date(club.current_book.published_date).getFullYear()}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Membros do Clube
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {members.map((member) => {
                    const hasNickname = !!member.nickname;
                    const displayName = member.nickname || member.profile.display_name || member.profile.username;
                    const realName = member.profile.display_name || member.profile.username;

                    return (
                      <div 
                        key={member.user_id} 
                        className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10 border-2 border-background">
                            <AvatarImage src={member.profile.avatar_url || undefined} />
                            <AvatarFallback>{displayName?.[0]?.toUpperCase() || '?'}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{displayName}</p>
                              {hasNickname && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                  ({realName})
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">@{member.profile.username}</p>
                          </div>
                          {member.role === 'owner' && (
                            <Badge variant="default" className="ml-2 text-xs">Dono</Badge>
                          )}
                        </div>
                        

                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat">
            <ClubChat clubId={club.id} members={members} />
          </TabsContent>
        </Tabs>
      </div>

      {isOwner && club && (
        <EditClubDialog
          club={club}
          open={isEditingClub}
          onOpenChange={setIsEditingClub}
          onClubUpdated={fetchClubDetails}
        />
      )}

      {currentUserMember && (
        <EditNicknameDialog
          open={isEditingNickname}
          onOpenChange={setIsEditingNickname}
          clubId={club.id}
          userId={currentUserMember.user_id}
          currentNickname={currentUserMember.nickname}
          onNicknameUpdated={fetchClubDetails}
        />
      )}
    </Layout>
  );
}

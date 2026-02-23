import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Club, Profile, ClubMemberWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ClubChat } from '@/components/clubs/ClubChat';

export default function ClubChatPage() {
  const { id } = useParams<{ id: string }>();
  const [club, setClub] = useState<Club | null>(null);
  const [members, setMembers] = useState<ClubMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchClubData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      // Fetch club info
      const { data: clubData, error: clubError } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', id)
        .single();

      if (clubError) throw clubError;
      setClub(clubData as Club);

      // Fetch members with profiles (needed for chat nicknames)
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
      console.error('Error fetching club data:', error);
      toast({
        title: 'Erro ao carregar chat',
        description: 'Não foi possível carregar as informações do clube.',
        variant: 'destructive',
      });
      navigate('/clubs');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  useEffect(() => {
    fetchClubData();
  }, [fetchClubData]);

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

  // Verify membership
  const isMember = members.some(m => m.user_id === user?.id);
  if (!isMember && !club.is_public) {
     return (
        <Layout>
             <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
                <h2 className="text-xl font-semibold">Acesso Restrito</h2>
                <p className="text-muted-foreground">Você precisa ser membro deste clube para acessar o chat.</p>
                <Button onClick={() => navigate(`/clubs/${id}`)}>
                    Voltar para o Clube
                </Button>
             </div>
        </Layout>
     )
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative">
      <div className="flex items-center gap-3 p-3 absolute top-0 left-0 right-0 z-10 glass-effect">
        <Button 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 -ml-1 hover:bg-primary/20 rounded-full"
          onClick={() => navigate(`/clubs/${id}`)}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold font-display truncate text-foreground">{club.name}</h1>
          <p className="text-xs text-muted-foreground truncate">Chat do Clube</p>
        </div>
      </div>

      <div className="flex-1 overflow-hidden pt-14">
        <ClubChat 
          clubId={club.id} 
          members={members} 
          className="h-full border-0 rounded-none bg-transparent" 
          hideHeader
        />
      </div>
    </div>
  );
}

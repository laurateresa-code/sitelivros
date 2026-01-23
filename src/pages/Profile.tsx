import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ProfileType, Post } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';
import { useFeed } from '@/hooks/useFeed';
import { Loader2, Calendar, Flame, Edit } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { Button } from '@/components/ui/button';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [stats, setStats] = useState({ booksRead: 0, pagesRead: 0, readingTime: 0 });
  const { likePost, unlikePost } = useFeed();

  useEffect(() => {
    const loadProfile = async () => {
      if (!username) return;
      setLoading(true);

      try {
        // Get profile by username
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!profileData) return;
        setProfile(profileData);
        setStats({
          booksRead: profileData.total_books_read || 0,
          pagesRead: profileData.total_pages_read || 0,
          readingTime: profileData.total_reading_time || 0
        });

        // Calculate accurate stats from user_books
        const { data: userBooks, error: userBooksError } = await supabase
          .from('user_books')
          .select(`
            status,
            current_page,
            books (page_count)
          `)
          .eq('user_id', profileData.user_id);

        if (!userBooksError && userBooks) {
          const booksRead = userBooks.filter(b => b.status === 'read' || b.status === 'reading').length;
          
          const pagesRead = userBooks.reduce((acc, book) => {
            // @ts-ignore - Supabase types inference issue with joined table
            const bookData = Array.isArray(book.books) ? book.books[0] : book.books;
            const bookPageCount = bookData?.page_count || 0;
            if (book.status === 'read') {
              return acc + (bookPageCount > 0 ? bookPageCount : (book.current_page || 0));
            }
            if (book.status === 'reading') {
              return acc + (book.current_page || 0);
            }
            return acc;
          }, 0);

          // Estimate reading time: 2 minutes per page average
          const estimatedReadingTime = Math.round(pagesRead * 2);

          setStats({ booksRead, pagesRead, readingTime: estimatedReadingTime });

          // Sync with profile table if needed (only if viewing own profile to avoid permission issues if any)
          if (user?.id === profileData.user_id && 
              (booksRead !== profileData.total_books_read || 
               pagesRead !== profileData.total_pages_read ||
               estimatedReadingTime !== profileData.total_reading_time)) {
             supabase.from('profiles').update({
               total_books_read: booksRead,
               total_pages_read: pagesRead,
               total_reading_time: estimatedReadingTime
             }).eq('id', profileData.id).then(({ error }) => {
                if (error) console.error('Error syncing stats:', error);
             });
          }
        }

        const fetchUserPosts = async () => {
          // Get user's posts
          const { data: postsData, error: postsError } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_profiles_fk (*),
              books (*),
              reading_sessions (*)
            `)
            .eq('user_id', profileData.user_id)
            .order('created_at', { ascending: false });

          if (!postsError && postsData) {
            // Check likes if user is logged in
            let likedPostIds: string[] = [];
            if (user) {
              const { data: likes } = await supabase
                .from('likes')
                .select('post_id')
                .eq('user_id', user.id);
              likedPostIds = likes?.map(l => l.post_id) || [];
            }

            // We need to map to Post type structure expected by PostCard
            const formattedPosts = postsData.map(post => {
              // Helper to handle single relation returned as array or object
              const getSingle = (val: any) => Array.isArray(val) ? val[0] : val;
              
              return {
                ...post,
                profile: getSingle(post.profiles),
                book: getSingle(post.books),
                reading_session: getSingle(post.reading_sessions),
                liked_by_user: likedPostIds.includes(post.id)
              };
            }) as Post[];
            setUserPosts(formattedPosts);
          }
        };

        fetchUserPosts();

        // Real-time updates for profile posts
        const channel = supabase
          .channel(`profile-posts-${profileData.user_id}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${profileData.user_id}` },
            () => {
              fetchUserPosts();
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(channel);
        };

      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold">Perfil não encontrado</h2>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Profile */}
        <Card className="overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />
          <CardContent className="relative pt-0">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="-mt-12">
                <Avatar className="w-32 h-32 border-4 border-background shadow-lg">
                  <AvatarImage src={profile.avatar_url || undefined} />
                  <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                    {profile.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1 mt-4 md:mt-0 pt-2 space-y-2">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold">{profile.display_name || profile.username}</h1>
                    <p className="text-muted-foreground">@{profile.username}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.id === profile.user_id && (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    )}
                    <Badge variant="secondary" className="w-fit text-lg px-4 py-1 capitalize">
                      {profile.reader_level.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                
                {profile.bio && (
                  <p className="text-muted-foreground">{profile.bio}</p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Entrou em {format(new Date(profile.created_at), 'MMMM yyyy', { locale: ptBR })}
                  </div>
                  {profile.streak_days > 0 && (
                    <div className="flex items-center gap-1 text-accent">
                      <Flame className="w-4 h-4" />
                      Sequência de {profile.streak_days} dias
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.booksRead}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Livros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{stats.pagesRead}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Páginas Lidas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {Math.round(stats.readingTime / 60)}h
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Tempo de Leitura</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{userPosts.length}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wide">Atividades</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Atividades Recentes</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onUnlike={unlikePost}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma atividade recente.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats">
            <Card>
              <CardHeader>
                <CardTitle>Estatísticas de Leitura</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    Gráficos e estatísticas detalhadas virão em breve!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {profile && (
        <EditProfileDialog
          profile={profile}
          open={isEditing}
          onOpenChange={setIsEditing}
          onProfileUpdated={() => window.location.reload()}
        />
      )}
    </Layout>
  );
}

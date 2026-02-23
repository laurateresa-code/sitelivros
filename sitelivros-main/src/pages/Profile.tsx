import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Profile as ProfileType, Post, UserBook } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PostCard } from '@/components/feed/PostCard';
import { useFeed } from '@/hooks/useFeed';
import { Loader2, Calendar, Flame, Edit, UserPlus, UserMinus, BookOpen, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/hooks/useAuth';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
 
import { Button } from '@/components/ui/button';
import { useFollows, FollowUser } from '@/hooks/useFollows';
import { FollowListDialog } from '@/components/profile/FollowListDialog';
import { READER_LEVELS } from '@/constants/levels';
import { ReaderLevelDialog } from '@/components/profile/ReaderLevelDialog';
import { MyLibrarySection } from '@/components/profile/MyLibrarySection';
import { Info } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

import { StreakRecoveryDialog } from '@/components/profile/StreakRecoveryDialog';

export default function Profile() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [userBooks, setUserBooks] = useState<UserBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showLevelDialog, setShowLevelDialog] = useState(false);
  const [stats, setStats] = useState({ booksRead: 0, pagesRead: 0, readingTime: 0 });
  const [monthlyStats, setMonthlyStats] = useState<{ name: string; livros: number; paginas: number }[]>([]);
  const [genreStats, setGenreStats] = useState<{ name: string; value: number }[]>([]);
  const [statusStats, setStatusStats] = useState<{ name: string; value: number }[]>([]);
  const [badges, setBadges] = useState<any[]>([]); // Using any for now to avoid strict type issues with joins
  const { likePost, unlikePost, deletePost } = useFeed();

  const handleDeletePost = async (postId: string) => {
    try {
      await deletePost(postId);
      setUserPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const { followUser, unfollowUser, getFollowers, getFollowing, checkIsFollowing } = useFollows();
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const [followersList, setFollowersList] = useState<FollowUser[]>([]);
  const [followingList, setFollowingList] = useState<FollowUser[]>([]);

  const handleFollowToggle = async () => {
    if (!user || !profile) return;

    if (isFollowing) {
      const success = await unfollowUser(user.id, profile.user_id);
      if (success) {
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
        const updatedFollowers = await getFollowers(profile.user_id);
        setFollowersList(updatedFollowers);
      }
    } else {
      const success = await followUser(user.id, profile.user_id);
      if (success) {
        setIsFollowing(true);
        setFollowersCount((prev) => prev + 1);
        const updatedFollowers = await getFollowers(profile.user_id);
        setFollowersList(updatedFollowers);
      }
    }
  };

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
        const { data: userBooksData, error: userBooksError } = await supabase
          .from('user_books')
          .select(`
            *,
            books (*)
          `)
          .eq('user_id', profileData.user_id);

        if (!userBooksError && userBooksData) {
          // Format user books to match UserBook interface
          const formattedUserBooks = userBooksData.map((ub: any) => ({
            ...ub,
            book: ub.books // Map the 'books' relation to 'book' property
          })) as UserBook[];
          
          setUserBooks(formattedUserBooks);

          const booksRead = formattedUserBooks.filter(b => b.status === 'read' || b.status === 'reading').length;
          
          const pagesRead = formattedUserBooks.reduce((acc, book) => {
            const bookData = book.book;
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

          // --- Calculate Charts Data ---

          // 1. Monthly Stats (Last 6 months)
          const last6Months = Array.from({ length: 6 }, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - i);
            return {
              date: d,
              name: format(d, 'MMM', { locale: ptBR }),
              fullDate: format(d, 'yyyy-MM'),
              livros: 0,
              paginas: 0
            };
          }).reverse();

          formattedUserBooks.forEach(book => {
            if (book.status === 'read' && book.finished_at) {
              const finishedDate = new Date(book.finished_at);
              const monthKey = format(finishedDate, 'yyyy-MM');
              const monthStat = last6Months.find(m => m.fullDate === monthKey);
              
              if (monthStat) {
                monthStat.livros += 1;
                const bookData = book.book;
                monthStat.paginas += bookData?.page_count || 0;
              }
            }
          });
          setMonthlyStats(last6Months);

          // 2. Genre Stats
          const genreCounts: Record<string, number> = {};
          formattedUserBooks.forEach(book => {
            const bookData = book.book;
            const categories = bookData?.categories;
            if (categories && Array.isArray(categories) && categories.length > 0) {
              // Consider only the first category as the main genre
              const mainCategory = categories[0].trim();
              if (mainCategory) {
                genreCounts[mainCategory] = (genreCounts[mainCategory] || 0) + 1;
              }
            }
          });
          
          const sortedGenres = Object.entries(genreCounts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // Top 5
          setGenreStats(sortedGenres);

          // 3. Status Stats
          const statusCounts: Record<string, number> = {
            'read': 0,
            'reading': 0,
            'want_to_read': 0,
            'dropped': 0
          };
          
          formattedUserBooks.forEach(book => {
            if (statusCounts[book.status] !== undefined) {
              statusCounts[book.status]++;
            }
          });

          const statusLabels: Record<string, string> = {
            'read': 'Lido',
            'reading': 'Lendo',
            'want_to_read': 'Quero Ler',
            'dropped': 'Abandonado'
          };

          const formattedStatusStats = Object.entries(statusCounts)
            .filter(([_, value]) => value > 0)
            .map(([key, value]) => ({
              name: statusLabels[key] || key,
              value
            }));
          setStatusStats(formattedStatusStats);

          // -----------------------------

          // Calculate correct level based on stats
          let calculatedLevel = profileData.reader_level;
          // Find the highest level the user qualifies for
          for (let i = READER_LEVELS.length - 1; i >= 0; i--) {
            const level = READER_LEVELS[i];
            if (pagesRead >= level.minPages || booksRead >= level.minBooks) {
               calculatedLevel = level.id;
               break;
            }
          }

          // Sync with profile table if needed (only if viewing own profile to avoid permission issues if any)
          if (user?.id === profileData.user_id && 
              (booksRead !== profileData.total_books_read || 
               pagesRead !== profileData.total_pages_read ||
               estimatedReadingTime !== profileData.total_reading_time ||
               calculatedLevel !== profileData.reader_level)) {
             
             const updates: Partial<ProfileType> = {
               total_books_read: booksRead,
               total_pages_read: pagesRead,
               total_reading_time: estimatedReadingTime,
             };

             if (calculatedLevel !== profileData.reader_level) {
               updates.reader_level = calculatedLevel;
               // Update local state immediately so user sees the change
               setProfile(prev => prev ? ({ ...prev, reader_level: calculatedLevel }) : null);
             }

             supabase.from('profiles').update(updates).eq('id', profileData.id).then(({ error }) => {
                if (error) console.error('Error syncing stats:', error);
             });
          }
        }

        // --- Fetch Badges ---
        const { data: badgesData } = await supabase
          .from('user_badges')
          .select('*, badge:badges(*)')
          .eq('user_id', profileData.user_id)
          .order('awarded_at', { ascending: false });
        
        if (badgesData) {
          setBadges(badgesData);
        }

        const followers = await getFollowers(profileData.user_id);
        const following = await getFollowing(profileData.user_id);
        setFollowersList(followers);
        setFollowingList(following);
        setFollowersCount(followers.length);
        setFollowingCount(following.length);

        if (user && user.id !== profileData.user_id) {
          const isFollowingUser = await checkIsFollowing(user.id, profileData.user_id);
          setIsFollowing(isFollowingUser);
        }

        const fetchUserPosts = async () => {
          try {
            // Get user's posts without complex joins to avoid FK issues
            const { data: postsData, error: postsError } = await supabase
              .from('posts')
              .select('*')
              .eq('user_id', profileData.user_id)
              .order('created_at', { ascending: false });

            if (postsError) throw postsError;

            if (postsData) {
              // Collect IDs for manual fetching
              const bookIds = [...new Set(postsData.map(p => p.book_id).filter(Boolean))];
              const sessionIds = [...new Set(postsData.map(p => p.reading_session_id).filter(Boolean))];

              // Fetch related data in parallel
              const [booksResult, sessionsResult] = await Promise.all([
                bookIds.length > 0
                  ? supabase.from('books').select('*').in('id', bookIds)
                  : Promise.resolve({ data: [] }),
                sessionIds.length > 0
                  ? supabase.from('reading_sessions').select('*').in('id', sessionIds)
                  : Promise.resolve({ data: [] })
              ]);

              const booksMap = new Map((booksResult.data || []).map(b => [b.id, b]));
              const sessionsMap = new Map((sessionsResult.data || []).map(s => [s.id, s]));

              // Check likes if user is logged in
              let likedPostIds: string[] = [];
              if (user) {
                const { data: likes } = await supabase
                  .from('likes')
                  .select('post_id')
                  .eq('user_id', user.id);
                likedPostIds = likes?.map(l => l.post_id) || [];
              }

              // Map posts with manually fetched data
              const formattedPosts = postsData.map(post => {
                return {
                  ...post,
                  profile: profileData, // Use the profile data we already have
                  book: post.book_id ? booksMap.get(post.book_id) : null,
                  reading_session: post.reading_session_id ? sessionsMap.get(post.reading_session_id) : null,
                  liked_by_user: likedPostIds.includes(post.id)
                };
              }) as Post[];
              
              setUserPosts(formattedPosts);
            }
          } catch (error) {
            console.error('Error fetching user posts:', error);
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
  }, [username, user, checkIsFollowing, getFollowers, getFollowing]);

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
          {profile.banner_url ? (
            <div 
              className="h-48 bg-cover bg-center"
              style={{ backgroundImage: `url(${profile.banner_url})` }}
            />
          ) : (
            <div className="h-32 bg-gradient-to-r from-primary/20 to-secondary/20" />
          )}
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
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-sm">
                      <button
                        type="button"
                        onClick={() => setShowFollowers(true)}
                        className="flex items-center gap-1 text-foreground hover:underline"
                      >
                        <span className="font-semibold">{followersCount}</span>
                        <span className="text-muted-foreground">seguidores</span>
                      </button>
                      <span className="text-muted-foreground">•</span>
                      <button
                        type="button"
                        onClick={() => setShowFollowing(true)}
                        className="flex items-center gap-1 text-foreground hover:underline"
                      >
                        <span className="font-semibold">{followingCount}</span>
                        <span className="text-muted-foreground">seguindo</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {user?.id === profile.user_id ? (
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Perfil
                      </Button>
                    ) : user ? (
                      <Button
                        variant={isFollowing ? "outline" : "default"}
                        size="sm"
                        onClick={handleFollowToggle}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4 mr-2" />
                            Deixar de Seguir
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Seguir
                          </>
                        )}
                      </Button>
                    ) : null}
                    <button 
                      onClick={() => setShowLevelDialog(true)} 
                      className="hover:opacity-80 transition-opacity group"
                      title="Ver níveis de leitura"
                    >
                      <Badge variant="secondary" className="w-fit text-sm px-3 py-1 capitalize cursor-pointer flex items-center gap-1.5 h-9">
                        {profile.reader_level.replace('_', ' ')}
                        <Info className="w-3.5 h-3.5 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </Badge>
                    </button>
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
                  {user?.id === profile.user_id && (
                    <StreakRecoveryDialog />
                  )}
                </div>
              </div>
            </div>

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

        <FollowListDialog 
          isOpen={showFollowers}
          onClose={() => setShowFollowers(false)}
          title="Seguidores"
          users={followersList}
        />
        
        <FollowListDialog 
          isOpen={showFollowing}
          onClose={() => setShowFollowing(false)}
          title="Seguindo"
          users={followingList}
        />

        <ReaderLevelDialog 
          open={showLevelDialog} 
          onOpenChange={setShowLevelDialog} 
          profile={profile} 
        />
        
        {/* Badges Section */}
        {badges.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-5 h-5 text-yellow-500" />
                Conquistas & Stickers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {badges.map((userBadge) => (
                  <div key={userBadge.id} className="flex flex-col items-center gap-2 group relative cursor-help">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-500/10 to-orange-500/10 rounded-full flex items-center justify-center border-2 border-yellow-500/20 group-hover:border-yellow-500 transition-colors shadow-sm">
                       {userBadge.badge?.image_url ? (
                         <img src={userBadge.badge.image_url} alt={userBadge.badge.name} className="w-full h-full object-cover rounded-full" />
                       ) : (
                         <Trophy className="w-8 h-8 text-yellow-500" /> 
                       )}
                    </div>
                    <span className="text-xs font-medium text-center max-w-[100px] leading-tight text-muted-foreground group-hover:text-foreground transition-colors">
                      {userBadge.badge?.name}
                    </span>
                    
                    {/* Tooltip-like overlay */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 bg-popover text-popover-foreground text-xs px-2 py-1 rounded shadow-md border whitespace-nowrap">
                      {userBadge.badge?.description || userBadge.badge?.name}
                      <div className="text-[10px] opacity-70 mt-0.5">
                        {new Date(userBadge.awarded_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Content */}
        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList>
            <TabsTrigger value="activity">Atividades Recentes</TabsTrigger>
            <TabsTrigger value="stats">Estatísticas</TabsTrigger>
            <TabsTrigger value="library">Minha Biblioteca</TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <MyLibrarySection books={userBooks} isLoading={loading} />
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            {userPosts.length > 0 ? (
              userPosts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={likePost}
                  onUnlike={unlikePost}
                  onDelete={handleDeletePost}
                />
              ))
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>Nenhuma atividade recente.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Leitura Mensal */}
              <Card className="col-span-1 md:col-span-2">
                <CardHeader>
                  <CardTitle>Atividade de Leitura (Últimos 6 meses)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                      <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="livros" name="Livros" fill="#8884d8" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="paginas" name="Páginas" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status de Leitura */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Status dos Livros</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex justify-center items-center pb-6">
                   {statusStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                            return percent > 0.05 ? (
                              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            ) : null;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                   ) : (
                     <div className="flex h-full items-center justify-center text-muted-foreground">
                       Sem dados suficientes
                     </div>
                   )}
                </CardContent>
              </Card>

              {/* Gêneros Favoritos */}
              <Card>
                <CardHeader className="text-center">
                  <CardTitle>Gêneros Mais Lidos</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex justify-center items-center pb-6">
                  {genreStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={genreStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                          
                            return percent > 0.05 ? (
                              <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            ) : null;
                          }}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {genreStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                     <div className="flex h-full items-center justify-center text-muted-foreground">
                       Sem dados suficientes
                     </div>
                  )}
                </CardContent>
              </Card>
            </div>
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

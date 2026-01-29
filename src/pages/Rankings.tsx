import { useEffect, useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, BookOpen, Clock, Flame, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Rankings() {
  const [topReaders, setTopReaders] = useState<Profile[]>([]);
  const [mostBooks, setMostBooks] = useState<Profile[]>([]);
  const [longestStreaks, setLongestStreaks] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRankings = async () => {
      setLoading(true);
      try {
        // Top readers by pages read
        const { data: pagesData } = await supabase
          .from('profiles')
          .select('*')
          .order('total_pages_read', { ascending: false })
          .limit(10);
        
        if (pagesData) setTopReaders(pagesData as Profile[]);

        // Most books read
        const { data: booksData } = await supabase
          .from('profiles')
          .select('*')
          .order('total_books_read', { ascending: false })
          .limit(10);
        
        if (booksData) setMostBooks(booksData as Profile[]);

        // Longest streaks
        const { data: streaksData } = await supabase
          .from('profiles')
          .select('*')
          .order('streak_days', { ascending: false })
          .limit(10);
        
        if (streaksData) setLongestStreaks(streaksData as Profile[]);

      } catch (error) {
        console.error('Error fetching rankings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const RankingList = ({ profiles, type }: { profiles: Profile[], type: 'pages' | 'books' | 'streak' }) => (
    <div className="flex flex-col gap-6">
      {profiles.map((profile, index) => (
        <Link key={profile.id} to={`/profile/${profile.username}`} className="block">
          <div className="flex items-center gap-4 py-6 pl-6 pr-4 rounded-xl bg-card hover:bg-accent/50 transition-colors border border-border shadow-sm">
            <div className={`
              w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm shrink-0 -ml-2 sm:-ml-3
              ${index === 0 ? 'bg-accent/20 text-accent' : ''}
              ${index === 1 ? 'bg-muted/50 text-muted-foreground' : ''}
              ${index === 2 ? 'bg-secondary/20 text-secondary' : ''}
              ${index > 2 ? 'text-muted-foreground' : ''}
            `}>
              {index + 1}
            </div>
            
            <Avatar className="h-14 w-14 border-2 border-border shrink-0">
              <AvatarImage src={profile.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary text-lg">
                {profile.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start text-center sm:text-left space-y-1">
              <div className="w-full sm:w-auto">
                <span className="font-bold text-base sm:text-lg leading-tight block">
                  {profile.display_name || profile.username}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">@{profile.username}</p>
            </div>

            <div className="text-right font-bold tabular-nums text-base sm:text-lg shrink-0 ml-auto">
              {type === 'pages' && (
                <div className="flex flex-col items-center justify-center text-primary">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                  <span className="text-sm sm:text-base leading-none">{profile.total_pages_read}</span>
                </div>
              )}
              {type === 'books' && (
                <div className="flex flex-col items-center justify-center text-secondary">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                  <span className="text-sm sm:text-base leading-none">{profile.total_books_read}</span>
                </div>
              )}
              {type === 'streak' && (
                <div className="flex flex-col items-center justify-center text-orange-500">
                  <Flame className="w-6 h-6 sm:w-8 sm:h-8 mb-1" />
                  <span className="text-sm sm:text-base leading-none">{profile.streak_days} dias</span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold font-display">Rankings da Comunidade</h1>
          <p className="text-muted-foreground">
            Veja quem são os leitores mais dedicados da plataforma
          </p>
        </div>

        <Tabs defaultValue="pages" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="pages">Páginas Lidas</TabsTrigger>
            <TabsTrigger value="books">Livros Lidos</TabsTrigger>
            <TabsTrigger value="streak">Sequência</TabsTrigger>
          </TabsList>

          <TabsContent value="pages">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Top Leitores por Páginas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList profiles={topReaders} type="pages" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="books">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-secondary-foreground" />
                  Top Leitores por Livros
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList profiles={mostBooks} type="books" />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="streak">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-accent" />
                  Maiores Sequências
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RankingList profiles={longestStreaks} type="streak" />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}

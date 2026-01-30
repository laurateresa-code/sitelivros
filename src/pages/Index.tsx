import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Trophy, Users, Bell } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useNotifications } from '@/hooks/useNotifications';
import { Layout } from '@/components/layout/Layout';
import { useAuth } from '@/hooks/useAuth';
import { useFeed } from '@/hooks/useFeed';
import { PostCard } from '@/components/feed/PostCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { WelcomeCard } from '@/components/feed/WelcomeCard';
import { CreatePostDialog } from '@/components/feed/CreatePostDialog';

const LandingPage = () => {
  const { posts, loading: loadingFeed, likePost, unlikePost, deletePost } = useFeed();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background z-0" />
        <div className="container relative z-10 mx-auto px-4 py-24 md:py-32">
          <div className="flex flex-col items-center text-center space-y-8 max-w-3xl mx-auto">
            <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center animate-fade-in">
              <BookOpen className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-6xl font-bold font-display tracking-tight animate-fade-in [animation-delay:200ms]">
              Sua jornada literária <br />
              <span className="gradient-text">começa aqui</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl animate-fade-in [animation-delay:400ms]">
              Acompanhe suas leituras, descubra novos livros e conecte-se com uma comunidade apaixonada por histórias.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in [animation-delay:600ms]">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-white h-12 px-8 text-lg">
                  Começar Agora
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                  Saiba Mais
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 py-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-2">Acompanhe Leituras</h3>
            <p className="text-muted-foreground">
              Registre seu progresso, faça anotações e mantenha um histórico de todos os livros que você leu.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-secondary-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Comunidade Ativa</h3>
            <p className="text-muted-foreground">
              Compartilhe suas opiniões, veja o que seus amigos estão lendo e participe de discussões.
            </p>
          </div>
          <div className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
              <Trophy className="w-6 h-6 text-accent-foreground" />
            </div>
            <h3 className="text-xl font-bold mb-2">Conquistas e Metas</h3>
            <p className="text-muted-foreground">
              Defina metas de leitura, ganhe distintivos e suba de nível conforme você lê mais.
            </p>
          </div>
        </div>
      </div>

      {/* Community Feed Preview */}
      <div className="container mx-auto px-4 py-24 bg-muted/20 border-t border-border/50">
        <div className="flex flex-col items-center text-center space-y-4 mb-12">
          <Badge variant="outline" className="px-4 py-1 border-primary/20 text-primary bg-primary/5">
            Comunidade
          </Badge>
          <h2 className="text-3xl font-bold font-display">O que está acontecendo</h2>
          <p className="text-muted-foreground max-w-2xl">
            Veja as últimas atualizações da nossa comunidade de leitores
          </p>
        </div>

        {loadingFeed ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {[1, 2].map((i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="max-w-2xl mx-auto space-y-6">
            {posts.slice(0, 3).map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onUnlike={unlikePost}
                onDelete={deletePost}
              />
            ))}
            
            <div className="flex justify-center mt-8 pt-4">
              <Link to="/auth">
                <Button size="lg" className="gradient-primary text-white px-8">
                  Entrar para ver mais
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-xl border border-border shadow-sm max-w-2xl mx-auto">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Ainda não há atividades públicas</p>
            <p className="text-muted-foreground mb-6">Seja o primeiro a compartilhar sua leitura!</p>
            <Link to="/auth">
              <Button>Começar agora</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { posts, loading: loadingFeed, likePost, unlikePost, refresh, deletePost } = useFeed();
  
  const { unreadCount, loading: loadingNotifications } = useNotifications();
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [hasCheckedNotifications, setHasCheckedNotifications] = useState(false);

  useEffect(() => {
    if (!loadingNotifications && !hasCheckedNotifications) {
      if (unreadCount > 0) {
        setShowNotificationPopup(true);
      }
      setHasCheckedNotifications(true);
    }
  }, [loadingNotifications, unreadCount, hasCheckedNotifications]);

  return (
    <>
      <Dialog open={showNotificationPopup} onOpenChange={setShowNotificationPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Novas Notificações
            </DialogTitle>
            <DialogDescription>
              Você tem {unreadCount} novas notificações esperando por você!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
              <Bell className="h-16 w-16 text-primary relative z-10 animate-bounce" />
              <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full border-2 border-background z-20">
                {unreadCount}
              </span>
            </div>
          </div>
          <DialogFooter className="sm:justify-center">
            <Button onClick={() => setShowNotificationPopup(false)} className="w-full sm:w-auto">
              Ver Notificações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-fade-in relative z-10">
        {/* Left Sidebar - Profile */}
        <div className="md:col-span-3 space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="w-12 h-12 border-2 border-background shadow-sm">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold truncate">{profile?.display_name || profile?.username}</h2>
                <p className="text-xs text-muted-foreground truncate">@{profile?.username}</p>
              </div>
            </div>
            
            <Link to={`/profile/${profile?.username}`}>
              <Button variant="outline" className="w-full text-xs h-8">
                Ver Perfil Completo
              </Button>
            </Link>
          </CardContent>
        </Card>
        </div>

        {/* Main Feed */}
        <div className="md:col-span-9 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Atividades Recentes</h2>
        </div>

        <WelcomeCard />
        <CreatePostDialog onPostCreated={refresh} fab />

        {loadingFeed ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="p-6">
                <div className="flex gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-3/4" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-6">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={likePost}
                onUnlike={unlikePost}
                onDelete={deletePost}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhuma atividade recente.</p>
            <p className="text-sm text-muted-foreground">Comece a seguir outros leitores ou inicie uma leitura!</p>
          </div>
        )}
      </div>
    </div>
    </>
  );
};

export default function Index() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) {
    return <LandingPage />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
}

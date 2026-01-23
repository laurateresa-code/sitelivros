import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Share2, BookOpen, Clock, FileText, MessageSquare, Check } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { StarRating } from '@/components/ui/StarRating';
import { Post } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
}

export function PostCard({ post, onLike, onUnlike }: PostCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleLikeClick = () => {
    if (!user) return;
    if (post.liked_by_user) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleShareClick = () => {
    const url = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast({
      title: "Link copiado!",
      description: "O link do post foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'started_reading':
        return <BookOpen className="w-4 h-4 text-success" />;
      case 'finished_reading':
        return <BookOpen className="w-4 h-4 text-primary" />;
      case 'session_update':
        return <Clock className="w-4 h-4 text-secondary" />;
      case 'review':
        return <FileText className="w-4 h-4 text-accent" />;
      case 'milestone':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      case 'general':
        return <MessageSquare className="w-4 h-4 text-primary" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getPostLabel = () => {
    switch (post.type) {
      case 'started_reading':
        return 'começou a ler';
      case 'finished_reading':
        return 'terminou de ler';
      case 'session_update':
        return 'sessão de leitura';
      case 'review':
        return 'avaliou';
      case 'milestone':
        return 'compartilhou um pensamento';
      case 'general':
        return 'compartilhou';
      default:
        return '';
    }
  };

  const renderContentWithMentions = (content: string) => {
    if (!content || typeof content !== 'string') return content;

    // Split by mentions (@username)
    return content.split(/(@\w+)/g).map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <Link
            key={i}
            to={`/profile/${part.slice(1)}`}
            className="font-medium text-primary hover:underline"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <Card className="animate-slide-up overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link 
            to={`/profile/${post.profile?.username}`}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-muted">
                <AvatarImage src={post.profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {post.profile?.username?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {post.profile?.is_reading_now && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-reading-active rounded-full border-2 border-card reading-pulse" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">
                  {post.profile?.display_name || post.profile?.username}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {post.profile?.reader_level?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                {getPostIcon()}
                <span>{getPostLabel()}</span>
              </div>
            </div>
          </Link>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-sm text-muted-foreground cursor-help">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {format(new Date(post.created_at), "dd 'de' MMMM 'às' HH:mm", {
                  locale: ptBR,
                })}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        {/* Book info */}
        {post.book && (
          <Link 
            to={`/book/${post.book.id}`}
            className="flex gap-4 p-3 bg-muted/50 rounded-lg mb-3 hover:bg-muted transition-colors"
          >
            {post.book.cover_url ? (
              <img
                src={post.book.cover_url}
                alt={post.book.title}
                className="w-16 h-24 object-cover rounded-md shadow-md"
              />
            ) : (
              <div className="w-16 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-md flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold line-clamp-2">{post.book.title}</h4>
              <p className="text-sm text-muted-foreground">{post.book.author}</p>
            </div>
          </Link>
        )}

        {/* Reading session stats */}
        {post.reading_session && (
          <div className="flex gap-4 mb-3 p-2 bg-secondary/10 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">
                {post.reading_session.pages_read} páginas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium">
                {post.reading_session.duration_minutes} min
              </span>
            </div>
          </div>
        )}

        {/* Post content */}
        {post.content && (
          <p className="text-foreground leading-relaxed">
            {renderContentWithMentions(post.content)}
          </p>
        )}

        {/* Rating */}
        {post.rating && (
          <div className="mt-3">
            <StarRating rating={post.rating} readonly size="sm" />
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-0 border-t">
        <div className="flex items-center gap-4 w-full pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.liked_by_user ? 'text-destructive' : ''}`}
            onClick={handleLikeClick}
            disabled={!user}
          >
            <Heart className={`w-4 h-4 ${post.liked_by_user ? 'fill-current' : ''}`} />
            <span>{post.likes_count}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => setShowComments(!showComments)}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 ml-auto"
            onClick={handleShareClick}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
        
        {showComments && <CommentSection postId={post.id} postAuthorId={post.user_id} />}
      </CardFooter>
    </Card>
  );
}

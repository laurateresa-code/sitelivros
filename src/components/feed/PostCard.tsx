import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, BookOpen, Clock, FileText, MessageSquare, Check, MoreVertical, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StarRating } from '@/components/ui/StarRating';
import { Post } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { CommentSection } from './CommentSection';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onUnlike: (postId: string) => void;
  onDelete?: (postId: string) => Promise<void> | void;
  isDetailView?: boolean;
}

export function PostCard({ post, onLike, onUnlike, onDelete, isDetailView = false }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(isDetailView);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === post.user_id;

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDetailView) return;
    // Prevent navigation if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, [role="button"]')) return;
    
    navigate(`/post/${post.id}`);
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(post.id);
      toast({
        title: "Post removido",
        description: "O post foi removido com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o post. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

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

  const renderContentWithMentions = (content: string) => {
    if (!content || typeof content !== 'string') return content;

    // Split by mentions (@username) - improved regex to include dots and underscores
    return content.split(/(@[a-zA-Z0-9._-]+)/g).map((part, i) => {
      if (part.startsWith('@') && part.length > 1) {
        return (
          <Link
            key={i}
            to={`/profile/${part.slice(1)}`}
            className="font-medium text-primary hover:underline cursor-pointer z-10 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  return (
    <Card 
      className={`animate-slide-up transition-all duration-300 ${
        !isDetailView 
          ? 'hover:shadow-lg hover:-translate-y-1 cursor-pointer overflow-hidden' 
          : 'shadow-none border-0 rounded-none md:border md:shadow-sm md:rounded-lg overflow-visible bg-background md:bg-card'
      }`}
      onClick={handleCardClick}
    >
      <CardHeader className={`pb-3 ${isDetailView ? 'px-4 pt-4' : ''}`}>
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
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-semibold truncate max-w-[150px] sm:max-w-none">
                  {post.profile?.display_name || post.profile?.username}
                </span>
                <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize shrink-0 px-1.5 py-0 h-5 sm:h-auto">
                  {post.profile?.reader_level?.replace('_', ' ')}
                </Badge>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            {isOwner && onDelete && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive cursor-pointer"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Excluir post
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className={`pb-4 ${isDetailView ? 'px-4' : ''}`}>
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
        {post.content && !/^Leu \d+ páginas em \d+ minutos!$/.test(post.content) && (
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

        {/* Date and Duration Footer */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-4">
          <span>
            {format(new Date(post.created_at), "d 'de' MMMM 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
      </CardContent>

      <CardFooter className={`pt-0 border-t flex-col items-stretch ${isDetailView ? 'px-4' : ''}`}>
        <div className="flex items-center gap-4 w-full pt-3">
          <Button
            variant="ghost"
            size="sm"
            className={`gap-2 ${post.liked_by_user ? 'text-destructive' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              handleLikeClick();
            }}
            disabled={!user}
          >
            <Heart className={`w-4 h-4 ${post.liked_by_user ? 'fill-current' : ''}`} />
            <span>{post.likes_count}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={(e) => {
              e.stopPropagation();
              if (!isDetailView) {
                setShowComments(!showComments);
              }
            }}
          >
            <MessageCircle className="w-4 h-4" />
            <span>{post.comments_count}</span>
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="gap-2 ml-auto"
            onClick={(e) => {
              e.stopPropagation();
              handleShareClick();
            }}
          >
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
          </Button>
        </div>
        
        {showComments && <CommentSection postId={post.id} postAuthorId={post.user_id} />}
      </CardFooter>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir post?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o seu post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

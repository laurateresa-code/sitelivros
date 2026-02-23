import { useState } from 'react';
import { Send, Loader2, Heart, MessageCircle, Share2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Comment } from '@/types';

interface CommentSectionProps {
  postId: string;
  postAuthorId?: string;
}

interface CommentItemProps {
  comment: Comment;
  allComments: Comment[];
  onReply: (parentId: string, content: string) => Promise<void>;
  onLike: (commentId: string) => Promise<void>;
  onUnlike: (commentId: string) => Promise<void>;
  currentUserId?: string;
}

function CommentItem({ comment, allComments, onReply, onLike, onUnlike, currentUserId }: CommentItemProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const replies = allComments.filter(c => c.parent_id === comment.id);

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;
    
    setSubmitting(true);
    await onReply(comment.id, replyContent);
    setReplyContent('');
    setSubmitting(false);
    setIsReplying(false);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(comment.content);
    setCopied(true);
    toast({
      title: "Comentário copiado!",
      description: "O texto do comentário foi copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex gap-3 text-sm animate-fade-in">
      <Link to={`/profile/${comment.profile?.username}`}>
        <Avatar className="w-8 h-8 border border-muted">
          <AvatarImage src={comment.profile?.avatar_url || undefined} />
          <AvatarFallback className="text-xs">
            {comment.profile?.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
      </Link>
      <div className="flex-1 space-y-2">
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-1">
            <Link 
              to={`/profile/${comment.profile?.username}`}
              className="font-semibold hover:underline"
            >
              {comment.profile?.display_name || comment.profile?.username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
          <p className="text-foreground/90">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-4 px-1">
          <button 
            onClick={() => comment.liked_by_user ? onUnlike(comment.id) : onLike(comment.id)}
            className={`flex items-center gap-1 text-xs ${comment.liked_by_user ? 'text-destructive' : 'text-muted-foreground hover:text-foreground'}`}
            disabled={!currentUserId}
          >
            <Heart className={`w-3 h-3 ${comment.liked_by_user ? 'fill-current' : ''}`} />
            <span>{comment.likes_count || 0}</span>
          </button>
          
          <button 
            onClick={() => setIsReplying(!isReplying)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            disabled={!currentUserId}
          >
            <MessageCircle className="w-3 h-3" />
            <span>Responder</span>
          </button>

          <button 
            onClick={handleShare}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {copied ? <Check className="w-3 h-3 text-green-500" /> : <Share2 className="w-3 h-3" />}
            <span>{copied ? 'Copiado' : 'Compartilhar'}</span>
          </button>
        </div>

        {isReplying && (
          <form onSubmit={handleReplySubmit} className="flex gap-2 items-center mt-2">
            <Input
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Sua resposta..."
              className="h-8 text-xs"
              autoFocus
              disabled={submitting}
            />
            <Button 
              type="submit" 
              size="sm" 
              variant="ghost" 
              className="h-8 w-8 p-0"
              disabled={!replyContent.trim() || submitting}
            >
              {submitting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
            </Button>
          </form>
        )}

        {replies.length > 0 && (
          <div className="space-y-3 mt-3 pl-3 border-l-2 border-muted">
            {replies.map(reply => (
              <CommentItem 
                key={reply.id} 
                comment={reply} 
                allComments={allComments}
                onReply={onReply}
                onLike={onLike}
                onUnlike={onUnlike}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { comments, loading, addComment, likeComment, unlikeComment } = useComments(postId, postAuthorId);
  const { user, profile } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Focus input on mount
  const inputRef = (input: HTMLInputElement | null) => {
    if (input) {
      setTimeout(() => input.focus(), 100);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    await addComment(newComment);
    setNewComment('');
    setSubmitting(false);
  };

  const rootComments = comments.filter(c => !c.parent_id);

  return (
    <div className="pt-2 mt-2 border-t animate-fade-in">
      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 items-center mb-4 pt-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escreva um comentário..."
              className="pr-12 h-10 text-sm rounded-full bg-secondary/10 border-transparent focus-visible:bg-background focus-visible:ring-1 focus-visible:ring-primary transition-all shadow-sm w-full"
              disabled={submitting}
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              className="absolute right-1 top-1 h-8 w-8 p-0 rounded-full text-muted-foreground hover:text-primary hover:bg-transparent"
              disabled={!newComment.trim() || submitting}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : rootComments.length > 0 ? (
          rootComments.map((comment) => (
            <CommentItem 
              key={comment.id} 
              comment={comment} 
              allComments={comments}
              onReply={async (parentId, content) => { await addComment(content, parentId); }}
              onLike={likeComment}
              onUnlike={unlikeComment}
              currentUserId={user?.id}
            />
          ))
        ) : (
          <p className="text-center text-xs text-muted-foreground py-2">
            Seja o primeiro a comentar!
          </p>
        )}
      </div>
    </div>
  );
}

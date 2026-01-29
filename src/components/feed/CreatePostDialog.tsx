import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { PenSquare, Plus } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CreatePostDialogProps {
  onPostCreated?: () => void;
  clubId?: string;
  fab?: boolean;
}

interface ProfileSuggestion {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function CreatePostDialog({ onPostCreated, clubId, fab }: CreatePostDialogProps) {
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<ProfileSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const searchProfiles = async () => {
      if (mentionQuery === null) {
        setSuggestions([]);
        return;
      }

      try {
        let query = supabase
          .from('profiles')
          .select('id, username, display_name, avatar_url');
          
        if (mentionQuery.trim()) {
           query = query.or(`username.ilike.%${mentionQuery}%,display_name.ilike.%${mentionQuery}%`);
        }
          
        const { data, error } = await query.limit(5);

        if (error) throw error;
        setSuggestions(data || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error searching profiles:', error);
      }
    };

    const timeoutId = setTimeout(searchProfiles, 300);
    return () => clearTimeout(timeoutId);
  }, [mentionQuery]);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setContent(newValue);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];

    if (lastWord.startsWith('@')) {
      setMentionQuery(lastWord.slice(1));
    } else {
      setMentionQuery(null);
      setShowSuggestions(false);
    }
  };

  const insertMention = (username: string) => {
    if (!textareaRef.current) return;

    const cursorPosition = textareaRef.current.selectionStart;
    const textBeforeCursor = content.slice(0, cursorPosition);
    const textAfterCursor = content.slice(cursorPosition);
    
    const words = textBeforeCursor.split(/\s/);
    const lastWord = words[words.length - 1];
    
    // Remove the partial mention text (e.g. "@use") and replace with full mention
    const newTextBeforeCursor = textBeforeCursor.slice(0, -lastWord.length);
    const newContent = `${newTextBeforeCursor}@${username} ${textAfterCursor}`;
    
    setContent(newContent);
    setMentionQuery(null);
    setShowSuggestions(false);
    
    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 0);
  };

  const handleSubmit = async () => {
    if (!user || !content.trim()) return;

    setLoading(true);
    try {
      const postData: { user_id: string; content: string; type: string; club_id?: string } = {
        user_id: user.id,
        content: content.trim(),
        type: 'general',
      };

      // Only include club_id if it exists to avoid schema errors on older DB versions
      if (clubId) {
        postData.club_id = clubId;
      }

      // Try with 'general' type first (requires updated schema)
      const { data: createdPostData, error } = await supabase.from('posts').insert(postData).select().single();
      
      let createdPost = createdPostData;

      if (error) {
        console.error('Initial post creation error:', error);
        
        // Check for missing column error (schema mismatch)
        if (error.message?.includes('club_id') || error.code === 'PGRST204' || error.message?.includes('schema cache')) {
            throw new Error('O banco de dados precisa ser atualizado (coluna club_id ausente). Por favor, execute a migração SQL.');
        }

        // If check constraint fails, try fallback to 'milestone' (for older schema versions)
        if (error.message?.includes('check constraint') || error.code === '23514') {
          console.warn('Fallback to milestone type due to constraint violation');
          postData.type = 'milestone';
          const { data: retryData, error: retryError } = await supabase.from('posts').insert(postData).select().single();
          if (retryError) throw retryError;
          createdPost = retryData;
        } else {
          throw error;
        }
      }

      // Extract mentions for notifications
      const mentionedUsernames = content.match(/@([a-zA-Z0-9._-]+)/g)?.map(m => m.slice(1)) || [];
      
      if (createdPost && mentionedUsernames.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username')
          .in('username', mentionedUsernames);
          
        if (profiles) {
          const notifications = profiles
            .filter(p => p.id !== user.id)
            .map(p => ({
              user_id: p.id,
              actor_id: user.id,
              type: 'mention',
              entity_id: createdPost.id
            }));
            
          if (notifications.length > 0) {
            supabase.from('notifications').insert(notifications).then(({ error }) => {
                if (error) console.error('Error creating mention notifications:', error);
            });
          }
        }
      }

      toast({
        title: 'Post criado com sucesso!',
        description: 'Seu post já está visível no feed.',
      });

      setContent('');
      setOpen(false);
      onPostCreated?.();
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'Erro ao criar post',
        description: error.message || 'Erro desconhecido ao criar post. Verifique as permissões.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {fab ? (
          <Button
            className="fixed bottom-20 right-4 md:bottom-6 md:right-6 h-14 w-14 rounded-full shadow-lg z-50 hover:scale-105 transition-transform"
            size="icon"
          >
            <Plus className="h-6 w-6" />
          </Button>
        ) : (
          <Button className="w-full gap-2" variant="outline" size="lg">
            <PenSquare className="w-4 h-4" />
            No que você está pensando?
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Criar novo post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              placeholder="Compartilhe seus pensamentos sobre livros, leituras ou qualquer coisa relacionada..."
              value={content}
              onChange={handleContentChange}
              className="min-h-[120px]"
            />
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-1 bg-popover text-popover-foreground rounded-md border shadow-md overflow-hidden">
                <div className="p-1 max-h-[200px] overflow-y-auto">
                  {suggestions.map((profile) => (
                    <button
                      key={profile.id}
                      className="flex items-center gap-2 w-full p-2 text-sm rounded-sm hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors"
                      onClick={() => insertMention(profile.username)}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile.avatar_url || undefined} />
                        <AvatarFallback>{profile.username?.[0]?.toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{profile.display_name || profile.username}</span>
                        <span className="text-xs text-muted-foreground">@{profile.username}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
              {loading ? 'Publicando...' : 'Publicar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClubMessage, Profile, ClubMemberWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ClubChatProps {
  clubId: string;
  members: ClubMemberWithProfile[];
  className?: string;
  hideHeader?: boolean;
}

export function ClubChat({ clubId, members, className, hideHeader = false }: ClubChatProps) {
  const [messages, setMessages] = useState<ClubMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    try {
      // 1. Fetch messages
      const { data: messagesData, error } = await supabase
        .from('club_messages')
        .select('*')
        .eq('club_id', clubId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      if (messagesData.length > 0) {
        // 2. Fetch profiles for authors
        const userIds = [...new Set(messagesData.map(m => m.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, user_id, username, display_name, avatar_url')
          .in('user_id', userIds);

        const profilesMap = new Map(profilesData?.map(p => [p.user_id, p]));

        const formattedMessages = messagesData.map(msg => ({
          ...msg,
          profile: profilesMap.get(msg.user_id)
        })) as ClubMessage[];

        setMessages(formattedMessages);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: 'Erro ao carregar mensagens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [clubId, toast]);

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel(`club-chat-${clubId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`
        },
        async (payload) => {
          const newMsg = payload.new as ClubMessage;
          
          // Fetch profile for the new message author
          const { data: profileData } = await supabase
            .from('profiles')
            .select('id, user_id, username, display_name, avatar_url')
            .eq('user_id', newMsg.user_id)
            .single();
          
          if (profileData) {
            newMsg.profile = profileData as unknown as Profile;
          }

          setMessages(prev => [...prev, newMsg]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'club_messages',
          filter: `club_id=eq.${clubId}`
        },
        (payload) => {
          setMessages(prev => prev.filter(msg => msg.id !== payload.old.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId, fetchMessages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user || !newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('club_messages')
        .insert({
          club_id: clubId,
          user_id: user.id,
          content: newMessage.trim()
        });

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Erro ao enviar mensagem',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const { error, count } = await supabase
        .from('club_messages')
        .delete({ count: 'exact' })
        .eq('id', messageId);

      if (error) throw error;
      
      // If count is 0, it means RLS prevented deletion (or message doesn't exist)
      if (count === 0) {
        throw new Error('Permissão negada ou mensagem não encontrada.');
      }
      
      // Optimistic update
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      toast({
        title: 'Mensagem apagada',
      });
    } catch (error) {
      console.error('Error deleting message:', error);
      toast({
        title: 'Erro ao apagar mensagem',
        description: error instanceof Error ? error.message : 'Verifique suas permissões.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className={cn("flex flex-col h-[calc(100vh-14rem)] min-h-[400px] border rounded-lg bg-background/50 overflow-hidden relative", className)}>
      {/* Decorative background element */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
      
      {!hideHeader && (
        <div className="p-4 border-b bg-background/95 backdrop-blur z-10">
          <h3 className="font-bold font-display flex items-center gap-2 text-lg">
            Chat do Clube
          </h3>
        </div>
      )}
      
      <ScrollArea className="flex-1 p-4 z-0" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-20 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <Send className="w-5 h-5 text-primary/60" />
            </div>
            <p className="font-medium">Nenhuma mensagem ainda.</p>
            <p className="text-sm opacity-70">Seja o primeiro a enviar uma mensagem!</p>
          </div>
        ) : (
          <div className="space-y-2 pb-4">
            {messages.map((msg, index) => {
              const isMe = user?.id === msg.user_id;
              const member = members.find(m => m.user_id === msg.user_id);
              const displayName = member?.nickname || msg.profile?.display_name || msg.profile?.username;
              const isClubOwner = members.find(m => m.user_id === user?.id)?.role === 'owner';
              const canDelete = isMe || isClubOwner;
              
              // Check if previous message was from same user to group them visually
              const isSequence = index > 0 && messages[index - 1].user_id === msg.user_id;
              // Check if next message is from same user (to hide timestamp)
              const isNextSequence = index < messages.length - 1 && messages[index + 1].user_id === msg.user_id;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${isMe ? 'flex-row-reverse' : ''} ${isSequence ? 'mt-[-0.5rem]' : ''} group animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  {!isSequence ? (
                    <Avatar className="w-8 h-8 mt-1 border-2 border-background shadow-sm">
                      <AvatarImage src={msg.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary-foreground text-xs">
                        {displayName?.[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="w-8" /> /* Spacer for alignment */
                  )}
                  
                  <div
                    className={`flex flex-col max-w-[75%] ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    {!isSequence && (
                      <span className={`text-[10px] text-muted-foreground/70 mb-0.5 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
                        {displayName}
                      </span>
                    )}
                    
                    <div
                      className={`px-3 py-2 shadow-sm text-sm relative group-hover:shadow-md transition-shadow ${
                        isMe
                          ? `bg-gradient-to-br from-primary via-primary/80 to-secondary/50 text-white rounded-3xl ${isSequence ? 'rounded-tr-lg' : 'rounded-tr-sm'} ${isNextSequence ? 'rounded-br-lg' : 'rounded-br-3xl'}`
                          : `bg-card border border-primary/10 text-card-foreground rounded-3xl ${isSequence ? 'rounded-tl-lg' : 'rounded-tl-sm'} ${isNextSequence ? 'rounded-bl-lg' : 'rounded-bl-3xl'}`
                      }`}
                    >
                      {canDelete ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <div className="cursor-pointer">
                              <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align={isMe ? "end" : "start"} className="w-40">
                            <DropdownMenuItem 
                              className="text-destructive focus:text-destructive cursor-pointer text-xs"
                              onClick={() => handleDeleteMessage(msg.id)}
                            >
                              <Trash2 className="w-3 h-3 mr-2" />
                              Apagar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                    
                    {/* Timestamp - only show if not part of a sequence or is the last one */}
                    {!isNextSequence && (
                      <span className="text-[10px] text-muted-foreground/60 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleString([], { 
                          day: '2-digit', 
                          month: '2-digit', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t bg-background/80 backdrop-blur z-10">
        <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1 rounded-3xl bg-muted/30 border-primary/10 focus-visible:ring-primary/30 min-h-[44px] py-3 px-4 shadow-inner"
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={sending || !newMessage.trim()}
            className="rounded-full w-11 h-11 shrink-0 bg-primary hover:bg-primary/90 shadow-sm transition-all hover:scale-105 active:scale-95"
          >
            {sending ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Send className="w-5 h-5 text-white ml-0.5" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

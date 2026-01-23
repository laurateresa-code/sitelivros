import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { ClubMessage, Profile, ClubMemberWithProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ClubChatProps {
  clubId: string;
  members: ClubMemberWithProfile[];
}

export function ClubChat({ clubId, members }: ClubChatProps) {
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

  const fetchMessages = async () => {
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
  };

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clubId]);

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

  return (
    <div className="flex flex-col h-[600px] border rounded-lg bg-card overflow-hidden">
      <div className="p-4 border-b bg-muted/30">
        <h3 className="font-semibold flex items-center gap-2">
          Chat do Clube
        </h3>
      </div>
      
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">
            <p>Nenhuma mensagem ainda.</p>
            <p className="text-sm">Comece a conversa!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => {
              const isMe = user?.id === msg.user_id;
              const member = members.find(m => m.user_id === msg.user_id);
              const displayName = member?.nickname || msg.profile?.display_name || msg.profile?.username;

              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}
                >
                  <Avatar className="w-8 h-8 mt-1">
                    <AvatarImage src={msg.profile?.avatar_url || undefined} />
                    <AvatarFallback>{displayName?.[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div
                    className={`flex flex-col max-w-[70%] ${
                      isMe ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-xs font-medium text-muted-foreground">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground/70">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div
                      className={`p-3 rounded-lg text-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground rounded-tr-none'
                          : 'bg-muted rounded-tl-none'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-background">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            disabled={sending}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={sending || !newMessage.trim()}>
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}

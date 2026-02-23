import { useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Check } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { Notification } from '@/types';

export function NotificationsPopover() {
  const [open, setOpen] = useState(false);
  const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    setOpen(false);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="h-4 w-4 text-red-500 fill-current" />;
      case 'comment':
        return <MessageCircle className="h-4 w-4 text-blue-500 fill-current" />;
      case 'follow':
        return <UserPlus className="h-4 w-4 text-green-500" />;
      case 'mention':
        return <AtSign className="h-4 w-4 text-orange-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationContent = (notification: Notification) => {
    const actorName = notification.actor?.display_name || notification.actor?.username || 'Alguém';
    
    switch (notification.type) {
      case 'like':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> curtiu seu post.
          </span>
        );
      case 'comment':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> comentou no seu post.
          </span>
        );
      case 'follow':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> começou a seguir você.
          </span>
        );
      case 'mention':
        return (
          <span>
            <span className="font-semibold">{actorName}</span> mencionou você em um post.
          </span>
        );
      default:
        return <span>Nova notificação de {actorName}</span>;
    }
  };

  const getNotificationLink = (notification: Notification) => {
    switch (notification.type) {
      case 'follow':
        return `/profile/${notification.actor?.username}`;
      case 'like':
      case 'comment':
      case 'mention':
        // Assuming we can link to the post directly somehow, or just the profile for now if post view isn't ready
        // For now, let's link to the actor's profile or home if we don't have a direct post link
        // Ideally: /post/${notification.entity_id}
        // Since we don't have a standalone post page yet (or do we?), let's check. 
        // We do not seem to have a /post/:id route in the context I've seen.
        // But `ClubFeed` and `Home` show posts. 
        // For now, let's link to the user profile as a fallback or if we can implement post permalinks later.
        // Actually, let's link to profile for now to be safe.
        return `/profile/${notification.actor?.username}`; 
      default:
        return '/';
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-destructive border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h4 className="font-semibold">Notificações</h4>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs h-auto p-0 text-muted-foreground hover:text-primary"
              onClick={() => markAllAsRead()}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Carregando...
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Nenhuma notificação recente
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  onClick={() => handleNotificationClick(notification)}
                  className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors ${
                    !notification.read ? 'bg-muted/20' : ''
                  }`}
                >
                  <Avatar className="h-8 w-8 mt-1">
                    <AvatarImage src={notification.actor?.avatar_url || undefined} />
                    <AvatarFallback>
                      {notification.actor?.username?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="text-sm leading-none">
                      {getNotificationContent(notification)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {getNotificationIcon(notification.type)}
                      <span>
                        {formatDistanceToNow(new Date(notification.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                  )}
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

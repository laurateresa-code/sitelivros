import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export function WelcomeNotificationDialog() {
  const { user, profile } = useAuth();
  const { unreadCount, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !user) return;

    // Check session storage to see if we already showed it this session
    const hasShown = sessionStorage.getItem('welcome_notifications_shown');
    
    // Show if there are unread notifications and we haven't shown it yet
    if (!hasShown && unreadCount > 0) {
      // Small delay to ensure UI is ready and it doesn't clash with other initial animations
      const timer = setTimeout(() => {
        setOpen(true);
        sessionStorage.setItem('welcome_notifications_shown', 'true');
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [loading, unreadCount, user]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] animate-fade-in">
        <DialogHeader className="flex flex-col items-center gap-4 pt-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Bell className="w-8 h-8 text-primary" />
            </div>
            <div className="absolute -top-1 -right-1 bg-background rounded-full p-1">
              <Sparkles className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
          
          <DialogTitle className="text-center text-xl font-display">
            Novidades para você!
          </DialogTitle>
          
          <DialogDescription className="text-center text-base">
            Olá, <span className="font-semibold text-foreground">{profile?.display_name || user?.email?.split('@')[0]}</span>! 
            <br />
            Você tem <span className="font-bold text-primary">{unreadCount}</span> novas notificações esperando sua atenção.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-2 text-center text-sm text-muted-foreground">
          Fique por dentro das últimas interações da comunidade e atualizações do BookLive.
        </div>

        <DialogFooter className="sm:justify-center mt-2">
          <Button 
            onClick={() => setOpen(false)} 
            className="w-full sm:w-auto gradient-primary text-white min-w-[150px]"
          >
            Ver Notificações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

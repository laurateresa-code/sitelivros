import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/types';
import { Trophy, Star, Flame, Zap, Crown, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BadgeAwardedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  badge: Badge | null;
}

export function BadgeAwardedDialog({ open, onOpenChange, badge }: BadgeAwardedDialogProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (open && badge) {
      // Trigger confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 50 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      }

      const interval: NodeJS.Timeout = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      // Delay content slightly for dramatic effect
      setTimeout(() => setShowContent(true), 300);
      
      return () => clearInterval(interval);
    } else {
      setShowContent(false);
    }
  }, [open, badge]);

  if (!badge) return null;

  const getIcon = () => {
    switch (badge.icon_name) {
      case 'Flame': return <Flame className="w-16 h-16 text-orange-500" />;
      case 'Zap': return <Zap className="w-16 h-16 text-yellow-500" />;
      case 'Star': return <Star className="w-16 h-16 text-purple-500" />;
      case 'Crown': return <Crown className="w-16 h-16 text-amber-500" />;
      case 'Sparkles': return <Sparkles className="w-16 h-16 text-blue-400" />;
      default: return <Trophy className="w-16 h-16 text-yellow-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md border-0 bg-transparent shadow-none p-0 flex items-center justify-center">
        <div className={`bg-background/95 backdrop-blur-xl border border-border/50 rounded-2xl p-8 w-full max-w-sm text-center shadow-2xl transform transition-all duration-700 ${showContent ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-10'}`}>
          
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
            <div className="relative bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-full inline-block ring-4 ring-background shadow-xl">
              {badge.image_url ? (
                <img src={badge.image_url} alt={badge.name} className="w-16 h-16 object-contain" />
              ) : (
                getIcon()
              )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-yellow-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              Nova Conquista!
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
            {badge.name}
          </h2>
          
          <p className="text-muted-foreground mb-8 leading-relaxed">
            {badge.description}
          </p>

          <div className="flex flex-col gap-3">
            <Button className="w-full gradient-primary text-white shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={() => onOpenChange(false)}>
              Incrível!
            </Button>
            <Button variant="ghost" className="w-full text-muted-foreground hover:text-foreground" onClick={() => onOpenChange(false)}>
              <Share2 className="w-4 h-4 mr-2" />
              Compartilhar
            </Button>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

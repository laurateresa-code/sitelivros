import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Flame, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export function StreakRecoveryDialog() {
  const { user, profile, updateProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!profile || !user) return null;

  const canRecover = profile.last_broken_streak && profile.last_broken_streak > 0 && profile.consecutive_recoveries === 0;

  if (!canRecover) return null;

  const handleRecover = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const recoveredStreak = (profile.streak_days || 0) + (profile.last_broken_streak || 0);

      const { error } = await updateProfile({
        streak_days: recoveredStreak,
        last_broken_streak: 0,
        consecutive_recoveries: 1,
        last_recovery_date: today,
        last_reading_date: today // Mark today as read to maintain the restored streak
      });

      if (error) throw error;

      toast.success('Sequência recuperada com sucesso!', {
        description: `Você recuperou sua sequência de ${recoveredStreak} dias.`
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Error recovering streak:', error);
      toast.error('Erro ao recuperar sequência');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2 text-orange-500 border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:border-orange-900 dark:hover:bg-orange-900/20"
        onClick={() => setIsOpen(true)}
      >
        <RefreshCw className="w-4 h-4" />
        Recuperar Sequência
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Recuperar Sequência
            </DialogTitle>
            <DialogDescription>
              Você perdeu uma sequência de {profile.last_broken_streak} dias.
              Para recuperá-la, você precisa se comprometer a manter o ritmo!
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 space-y-4">
            <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-lg border border-orange-100 dark:border-orange-900/30">
              <h4 className="font-semibold text-orange-700 dark:text-orange-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                Regras de Recuperação
              </h4>
              <ul className="text-sm text-orange-600 dark:text-orange-300 space-y-2 list-disc pl-4">
                <li>Você só pode recuperar a sequência uma vez consecutiva.</li>
                <li>Se perder novamente amanhã, não poderá recuperar!</li>
                <li>Sua sequência será restaurada para {((profile.streak_days || 0) + (profile.last_broken_streak || 0))} dias.</li>
              </ul>
            </div>

            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                Complete o desafio abaixo para recuperar:
              </p>
              <div className="p-4 border-2 border-dashed rounded-lg">
                <p className="font-medium">"Comprometo-me a ler pelo menos 10 minutos hoje!"</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
            <Button onClick={handleRecover} disabled={loading} className="gap-2 bg-orange-500 hover:bg-orange-600 text-white">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aceitar Desafio e Recuperar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Target, Trophy, Edit2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function ReadingGoals() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goal, setGoal] = useState<number>(0);
  const [booksRead, setBooksRead] = useState<number>(0);
  const [isEditing, setIsEditing] = useState(false);
  const [tempGoal, setTempGoal] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!user) return;

    // Load goal from localStorage
    const savedGoal = localStorage.getItem(`reading_goal_${user.id}_${currentYear}`);
    if (savedGoal) {
      setGoal(parseInt(savedGoal));
    }

    // Load books read this year
    const fetchBooksRead = async () => {
      try {
        const { data, error } = await supabase
          .from('user_books')
          .select('finished_at')
          .eq('user_id', user.id)
          .eq('status', 'read')
          .gte('finished_at', `${currentYear}-01-01`)
          .lte('finished_at', `${currentYear}-12-31`);

        if (error) throw error;
        setBooksRead(data?.length || 0);
      } catch (error) {
        console.error('Error fetching books read:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBooksRead();
  }, [user, currentYear]);

  const handleSaveGoal = () => {
    if (!user) return;
    const newGoal = parseInt(tempGoal);
    
    if (isNaN(newGoal) || newGoal <= 0) {
      toast({ title: 'Meta inválida', description: 'Por favor insira um número maior que zero.', variant: 'destructive' });
      return;
    }

    localStorage.setItem(`reading_goal_${user.id}_${currentYear}`, newGoal.toString());
    setGoal(newGoal);
    setIsEditing(false);
    toast({ title: 'Meta definida!', description: `Sua meta é ler ${newGoal} livros em ${currentYear}.` });
  };

  if (!user) return null;

  if (loading) {
    return <div className="h-32 bg-muted/20 animate-pulse rounded-lg" />;
  }

  if (goal === 0 || isEditing) {
    return (
      <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Meta de Leitura {currentYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Quantos livros você quer ler este ano? Defina sua meta e acompanhe seu progresso!
            </p>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Ex: 20"
                value={tempGoal}
                onChange={(e) => setTempGoal(e.target.value)}
                className="bg-background"
                min="1"
              />
              <Button onClick={handleSaveGoal}>Salvar</Button>
              {goal > 0 && (
                <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const progress = Math.min(100, Math.round((booksRead / goal) * 100));

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/10 overflow-hidden relative">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Trophy className="w-24 h-24 rotate-12" />
      </div>
      
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-primary" />
            Meta {currentYear}
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
            setTempGoal(goal.toString());
            setIsEditing(true);
          }}>
            <Edit2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex justify-between items-end">
          <div>
            <span className="text-3xl font-bold font-display text-primary">{booksRead}</span>
            <span className="text-muted-foreground ml-1">/ {goal} livros</span>
          </div>
          <span className="text-sm font-medium text-primary">{progress}%</span>
        </div>
        
        <Progress value={progress} className="h-3" />
        
        {progress >= 100 ? (
          <div className="flex items-center gap-2 text-sm text-green-600 font-medium bg-green-50 p-2 rounded-md">
            <CheckCircle2 className="w-4 h-4" />
            Parabéns! Você atingiu sua meta!
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Faltam {goal - booksRead} livros para atingir sua meta. Continue lendo!
          </p>
        )}
      </CardContent>
    </Card>
  );
}

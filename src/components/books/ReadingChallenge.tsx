import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Star, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Challenge, UserChallenge, ChallengeSuggestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChallengeCompletionDialog } from './ChallengeCompletionDialog';

export function ReadingChallenge() {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [suggestions, setSuggestions] = useState<ChallengeSuggestion[]>([]);
  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);

  const FALLBACK_CHALLENGE: Challenge = {
    id: 'fallback-challenge',
    title: 'Leia um clássico',
    description: 'Este mês, desafiamos você a ler uma obra clássica da literatura que você nunca leu antes.',
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    end_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    type: 'monthly',
    created_at: new Date().toISOString()
  };

  const FALLBACK_SUGGESTIONS: ChallengeSuggestion[] = [
    { id: 'f1', challenge_id: 'fallback', title: 'Dom Casmurro', author: 'Machado de Assis', created_at: new Date().toISOString() },
    { id: 'f2', challenge_id: 'fallback', title: 'Memórias Póstumas de Brás Cubas', author: 'Machado de Assis', created_at: new Date().toISOString() },
    { id: 'f3', challenge_id: 'fallback', title: 'O Cortiço', author: 'Aluísio Azevedo', created_at: new Date().toISOString() },
    { id: 'f4', challenge_id: 'fallback', title: 'Grande Sertão: Veredas', author: 'João Guimarães Rosa', created_at: new Date().toISOString() },
    { id: 'f5', challenge_id: 'fallback', title: 'Vidas Secas', author: 'Graciliano Ramos', created_at: new Date().toISOString() },
    { id: 'f6', challenge_id: 'fallback', title: '1984', author: 'George Orwell', created_at: new Date().toISOString() },
    { id: 'f7', challenge_id: 'fallback', title: 'Orgulho e Preconceito', author: 'Jane Austen', created_at: new Date().toISOString() },
  ];

  useEffect(() => {
    async function fetchChallenge() {
      try {
        const now = new Date();
        
        // Fetch active monthly challenges
        // Relaxed query: just get challenges that might be relevant
        // Removed .eq('type', 'monthly') to be more robust if column is missing
        const { data: challenges, error: challengeError } = await supabase
          .from('challenges')
          .select('*')
          .order('start_date', { ascending: false });

        if (challengeError) {
          console.warn('Error fetching challenges:', challengeError);
          // Only use fallback if we really can't get data
          setChallenge(FALLBACK_CHALLENGE);
          setSuggestions(FALLBACK_SUGGESTIONS);
          
          // Check local storage for fallback participation
          if (user) {
             const local = localStorage.getItem(`challenge_participation_${user.id}_fallback-challenge`);
             if (local) {
               setUserChallenge(JSON.parse(local));
             }
          }
          return;
        }

        // If no challenges found at all, try to auto-heal by inserting default if possible
        if (!challenges || challenges.length === 0) {
           console.log('No challenges found. Attempting to seed default challenge...');
           // Remove ID to let DB generate UUID, and format dates for DB (YYYY-MM-DD)
           const seedChallenge = {
             title: FALLBACK_CHALLENGE.title,
             description: FALLBACK_CHALLENGE.description,
             start_date: FALLBACK_CHALLENGE.start_date.split('T')[0], // YYYY-MM-DD
             end_date: FALLBACK_CHALLENGE.end_date.split('T')[0],
             type: 'monthly'
           };
           
           const { data: inserted, error: insertError } = await supabase
             .from('challenges')
             .insert(seedChallenge)
             .select()
             .single();
             
           if (!insertError && inserted) {
             setChallenge(inserted as Challenge);
             // Continue to check user participation for this new challenge below...
             // But simpler to just return here? No, need to check if user already joined (unlikely for new challenge)
           } else {
             console.warn('Failed to seed default challenge:', insertError);
             // Continue to fallback logic below
             setChallenge(FALLBACK_CHALLENGE);
             setSuggestions(FALLBACK_SUGGESTIONS);
             if (user) {
                const local = localStorage.getItem(`challenge_participation_${user.id}_fallback-challenge`);
                if (local) {
                  setUserChallenge(JSON.parse(local));
                }
             }
             return;
           }
        }

        // Find the challenge that includes "now"
        const currentChallenge = challenges?.find(c => {
          const start = new Date(c.start_date);
          const end = new Date(c.end_date);
          // Set end date to end of day to ensure coverage
          end.setHours(23, 59, 59, 999);
          
          return now >= start && now <= end;
        });

        if (currentChallenge) {
          setChallenge(currentChallenge);

          // If user is logged in, check if they joined
          if (user) {
            const { data: userChallenges, error: userError } = await supabase
              .from('user_challenges')
              .select('*')
              .eq('user_id', user.id)
              .eq('challenge_id', currentChallenge.id)
              .maybeSingle();

            if (!userError && userChallenges) {
              setUserChallenge(userChallenges);
            }
          }
          
          // Fetch suggestions
          const { data: suggestionsData } = await supabase
            .from('challenge_suggestions')
            .select('*')
            .eq('challenge_id', currentChallenge.id);
            
          if (suggestionsData && suggestionsData.length > 0) {
            setSuggestions(suggestionsData as ChallengeSuggestion[]);
          } else if (currentChallenge.title === 'Leia um clássico' || currentChallenge.title === FALLBACK_CHALLENGE.title) {
            setSuggestions(FALLBACK_SUGGESTIONS);
          }
        } else {
          // No active challenge found in DB for today
          // Try to find the most recent one instead? 
          // Or just use fallback/empty
          if (challenges && challenges.length > 0) {
             // If we have challenges but none match today exactly, maybe show the latest one?
             // For now, let's stick to strict "current" challenge, or fallback if none.
             // Actually, showing the latest available challenge is better than fallback "Leia um clássico" if that one is old.
             // But the fallback IS "Leia um clássico".
             // If DB has "Leia um clássico" (Jan) and today is Feb, we shouldn't show Jan's challenge as active.
             // So fallback is okay if we want to prompt a default.
             
             // However, if the date logic is just slightly off (timezone), we might miss it.
             // Let's be generous with the match: check if same Month and Year.
             const sameMonthChallenge = challenges.find(c => {
               const start = new Date(c.start_date);
               return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
             });
             
             if (sameMonthChallenge) {
               setChallenge(sameMonthChallenge);
               // Check participation for this one... (duplicated logic, could be refactored)
               if (user) {
                  const { data: userChallenges } = await supabase
                    .from('user_challenges')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('challenge_id', sameMonthChallenge.id)
                    .maybeSingle();
                  if (userChallenges) setUserChallenge(userChallenges);
               }
               
               // Fetch suggestions
               const { data: suggestionsData } = await supabase
                 .from('challenge_suggestions')
                 .select('*')
                 .eq('challenge_id', sameMonthChallenge.id);
                 
               if (suggestionsData && suggestionsData.length > 0) {
                 setSuggestions(suggestionsData as ChallengeSuggestion[]);
               } else if (sameMonthChallenge.title === 'Leia um clássico') {
                 setSuggestions(FALLBACK_SUGGESTIONS);
               }
             } else {
               setChallenge(FALLBACK_CHALLENGE);
               setSuggestions(FALLBACK_SUGGESTIONS);
             }
          } else {
            setChallenge(FALLBACK_CHALLENGE);
            setSuggestions(FALLBACK_SUGGESTIONS);
          }
        }
      } catch (error) {
        console.error('Error fetching challenge:', error);
        setChallenge(FALLBACK_CHALLENGE);
        setSuggestions(FALLBACK_SUGGESTIONS);
      } finally {
        setLoading(false);
      }
    }

    fetchChallenge();
  }, [user]);

  const handleJoinChallenge = async () => {
    if (!user) {
      toast({
        title: "Login necessário",
        description: "Você precisa estar logado para aceitar desafios.",
        variant: "destructive"
      });
      return;
    }

    if (!challenge) return;

    setJoining(true);

    // Optimistic update / Local Storage fallback logic
    const saveLocalFallback = () => {
      try {
        const localData = {
          user_id: user.id,
          challenge_id: challenge.id,
          status: 'accepted',
          accepted_at: new Date().toISOString()
        };
        localStorage.setItem(`challenge_participation_${user.id}_${challenge.id}`, JSON.stringify(localData));
        setUserChallenge(localData as UserChallenge);
        toast({
          title: "Desafio aceito!",
          description: "Progresso salvo localmente (Sincronização pendente).",
        });
      } catch (e) {
        console.error("Local storage error", e);
      }
    };

    // If we are using the fallback challenge (ID 'fallback-challenge'), we can't save to DB due to FK constraints.
    // So we skip directly to local storage.
    if (challenge.id === 'fallback-challenge') {
      saveLocalFallback();
      setJoining(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_challenges')
        .insert({
          user_id: user.id,
          challenge_id: challenge.id,
          status: 'accepted'
        })
        .select()
        .single();

      if (error) throw error;

      setUserChallenge(data);
      toast({
        title: "Desafio aceito!",
        description: "Boa leitura! Acompanhe seu progresso.",
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
      // Fallback to local storage if DB fails
      saveLocalFallback();
    } finally {
      setJoining(false);
    }
  };

  const handleCompleteChallenge = async (bookId: string) => {
    if (!user || !challenge) return;
    
    // Check fallback
    if (challenge.id === 'fallback-challenge') {
       if (!userChallenge) return;
       const localData: UserChallenge = {
          ...userChallenge,
          status: 'completed',
          completed_at: new Date().toISOString(),
          book_id: bookId
       };
       localStorage.setItem(`challenge_participation_${user.id}_fallback-challenge`, JSON.stringify(localData));
       setUserChallenge(localData);
       toast({ title: "Desafio Concluído!", description: "Parabéns! Progresso salvo localmente." });
       return;
    }

    const { data, error } = await supabase
        .from('user_challenges')
        .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            book_id: bookId
        })
        .eq('user_id', user.id)
        .eq('challenge_id', challenge.id)
        .select()
        .single();

    if (error) {
        console.error("Error completing challenge", error);
        toast({ title: "Erro", description: "Falha ao completar desafio", variant: "destructive" });
        return;
    }
    
    setUserChallenge(data);

    // --- Reward System ---
    
    // 1. Award Badge
    try {
      // Try to find a badge with the exact challenge name, or fallback to generic
      let { data: badge } = await supabase
        .from('badges')
        .select('*')
        .eq('name', challenge.title)
        .maybeSingle();
      
      if (!badge) {
        // Fallback for the classic challenge
        const { data: fallbackBadge } = await supabase
          .from('badges')
          .select('*')
          .eq('name', 'Leitor de Clássicos')
          .maybeSingle();
        badge = fallbackBadge;
      }

      if (badge) {
        await supabase.from('user_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
          metadata: { challenge_id: challenge.id }
        });
        
        toast({
          title: "Conquista Desbloqueada! 🏆",
          description: `Você ganhou o sticker: ${badge.name}`,
          duration: 5000,
        });
      }
    } catch (e) {
      console.error("Error awarding badge", e);
    }

    // 2. Create Official Post
    try {
      // Attempt to find book details if possible
      let bookTitle = 'um livro incrível';
      // If suggestions are available, try to find the title there (assuming bookId might match suggestion ID? No, bookId is usually a UUID from books table)
      // Actually, let's just use a generic message if we don't have the book object easily.
      
      const postContent = `Acabei de completar o desafio de leitura de ${capitalizedMonth}: ${challenge.title}! 📚✨`;
      
      await supabase.from('posts').insert({
        user_id: user.id,
        content: postContent,
        type: 'milestone',
        book_id: bookId.includes('-') ? bookId : null // Simple check if it's a UUID (DB ID) vs Google ID
      });
      
      toast({
        title: "Post Criado!",
        description: "Sua conquista foi compartilhada na comunidade.",
      });
    } catch (e) {
      console.error("Error creating post", e);
    }
    // ---------------------

    toast({ title: "Desafio Concluído!", description: "Parabéns por completar o desafio!" });
  };

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20 h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </Card>
    );
  }

  // Fallback if no challenge found in DB, use hardcoded (or return null)
  // For now, let's keep the hardcoded UI structure but use DB data if available, 
  // or fallback to the static one if DB is empty (to avoid breaking UI).
  // However, since we added a migration, we expect data. 
  // If no challenge is found, we can show a placeholder or nothing.
  
  const displayTitle = challenge?.title || "Leia um clássico";
  const displayDesc = challenge?.description || "Este mês, desafiamos você a ler uma obra clássica da literatura que você nunca leu antes.";

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-primary/5 border-accent/20">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="w-5 h-5 text-accent-foreground" />
            Desafio de Leitura
          </CardTitle>
          <Badge variant="secondary" className="bg-accent/20 text-accent-foreground hover:bg-accent/30">
            {capitalizedMonth}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-accent/20 rounded-xl">
              <Calendar className="w-6 h-6 text-accent-foreground" />
            </div>
            <div>
              <h3 className="font-bold text-lg mb-1">{displayTitle}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {displayDesc}
              </p>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>Sugestões da comunidade:</span>
            </div>
            {suggestions.length > 0 ? (
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-1">
                {suggestions.map((suggestion) => (
                  <li key={suggestion.id}>
                    {suggestion.title}{suggestion.author ? ` - ${suggestion.author}` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground ml-1">Nenhuma sugestão específica para este desafio.</p>
            )}
          </div>

          {userChallenge ? (
            userChallenge.status === 'completed' ? (
                <Button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white cursor-default">
                  <Trophy className="w-4 h-4 mr-2" />
                  Desafio Concluído!
                </Button>
            ) : (
                <div className="space-y-2">
                     <Button className="w-full bg-green-600/20 text-green-600 hover:bg-green-600/30 border-green-600/50 cursor-default" variant="outline">
                        <Check className="w-4 h-4 mr-2" />
                        Em andamento
                      </Button>
                      <Button 
                        className="w-full" 
                        variant="default"
                        onClick={() => setCompletionOpen(true)}
                      >
                        Concluir Desafio
                      </Button>
                </div>
            )
          ) : (
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={handleJoinChallenge}
              disabled={joining || !challenge}
            >
              {joining ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Aceitando...
                </>
              ) : (
                'Aceitar Desafio'
              )}
            </Button>
          )}

          <ChallengeCompletionDialog 
             open={completionOpen} 
             onOpenChange={setCompletionOpen}
             onConfirm={handleCompleteChallenge}
             suggestions={suggestions}
          />
        </div>
      </CardContent>
    </Card>
  );
}

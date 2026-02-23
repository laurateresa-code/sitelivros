import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Star, Loader2, Check, Rocket, Zap, Atom } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Challenge, UserChallenge, ChallengeSuggestion } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ChallengeCompletionDialog } from './ChallengeCompletionDialog';

const THEMES = {
  antique: {
    container: "border-[#2c1810] bg-[#1a0f0a]",
    bgPattern: "bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-30",
    gradient: "from-transparent via-[#c5a065]/50 to-transparent",
    badge: "border-[#c5a065]/50 text-[#c5a065] bg-[#2c1810]/50",
    icon: "text-[#c5a065]",
    title: "text-[#d4c5b5] font-serif",
    text: "text-[#d4c5b5]/80 font-serif italic",
    card: "bg-[#2c1810]/50 border-[#c5a065]/20",
    tag: "text-[#d4c5b5]/70 bg-[#1a0f0a]/60 border-[#d4c5b5]/10",
    button: "bg-[#c5a065] hover:bg-[#b08d55] text-[#1a0f0a] shadow-[0_0_15px_rgba(197,160,101,0.2)]",
    buttonSecondary: "bg-[#2c1810] border-[#c5a065]/30 text-[#c5a065]",
    success: "bg-gradient-to-r from-[#c5a065] to-[#a08040] text-[#1a0f0a]",
    iconType: "trophy" 
  },
  scifi: {
    container: "border-cyan-500/30 bg-[#020617]",
    bgPattern: "bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0b001a] to-black opacity-80",
    gradient: "from-transparent via-cyan-500/50 to-transparent",
    badge: "border-cyan-500/50 text-cyan-400 bg-cyan-950/30",
    icon: "text-cyan-400",
    title: "text-cyan-50 font-mono tracking-tighter",
    text: "text-cyan-100/70 font-sans",
    card: "bg-slate-900/50 border-cyan-500/20 backdrop-blur-sm",
    tag: "text-cyan-300/80 bg-cyan-950/40 border-cyan-500/20",
    button: "bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_20px_rgba(8,145,178,0.4)]",
    buttonSecondary: "bg-slate-900/80 border-cyan-500/30 text-cyan-400",
    success: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white",
    iconType: "rocket"
  }
};

const getTheme = (title: string) => {
  if (!title) return THEMES.antique;
  const lower = title.toLowerCase();
  if (lower.includes('ficção') || lower.includes('sci-fi') || lower.includes('futuro') || lower.includes('espaço')) {
    return THEMES.scifi;
  }
  return THEMES.antique;
};

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
  const [expandedSuggestions, setExpandedSuggestions] = useState(false);

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

  const theme = getTheme(displayTitle);

  return (
    <div className={`relative overflow-hidden rounded-xl border-4 shadow-xl transition-colors duration-500 animate-in fade-in zoom-in-95 duration-700 ${theme.container}`}>
      {/* Decorative corners or background texture */}
      <div className={`absolute inset-0 pointer-events-none ${theme.bgPattern}`} />
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${theme.gradient}`} />
      
      <div className="relative z-10 p-6 flex flex-col items-center text-center">
        
        {/* Header Section */}
        <div className="mb-6 flex flex-col items-center gap-2 animate-in slide-in-from-top-4 fade-in duration-700 delay-100">
           <Badge variant="outline" className={`px-3 py-1 text-xs tracking-widest uppercase mb-2 ${theme.badge}`}>
             {capitalizedMonth}
           </Badge>
           
           <div className={`flex items-center gap-2 mb-2 ${theme.icon} opacity-80`}>
             {theme.iconType === 'rocket' ? <Rocket className="w-5 h-5 animate-pulse" /> : <Trophy className="w-5 h-5" />}
             <span className={`tracking-wider text-sm uppercase ${theme.title.includes('font-mono') ? 'font-mono' : 'font-serif'}`}>
               Desafio Mensal
             </span>
             {theme.iconType === 'rocket' ? <Atom className="w-5 h-5 animate-spin-slow" /> : <Trophy className="w-5 h-5" />}
           </div>

           <h3 className={`text-2xl md:text-3xl font-bold tracking-wide drop-shadow-md px-4 leading-tight ${theme.title}`}>
             {displayTitle}
           </h3>
           
           <div className={`h-[1px] w-24 bg-gradient-to-r mt-4 ${theme.gradient}`} />
        </div>

        {/* Content Section */}
        <div className="w-full max-w-md space-y-6">
          <p className={`text-sm leading-relaxed animate-in fade-in slide-in-from-bottom-2 duration-700 delay-200 ${theme.text}`}>
            "{displayDesc}"
          </p>
          
          {/* Suggestions Area */}
          <div className={`rounded-lg p-4 border relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 ${theme.card}`}>
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r ${theme.gradient}`} />
            
            <div className={`flex items-center justify-center gap-2 text-xs font-medium mb-3 uppercase tracking-wide ${theme.icon}`}>
              {theme.iconType === 'rocket' ? <Zap className="w-3 h-3 fill-current" /> : <Star className="w-3 h-3 fill-current" />}
              <span>Inspirações da Comunidade</span>
              {theme.iconType === 'rocket' ? <Zap className="w-3 h-3 fill-current" /> : <Star className="w-3 h-3 fill-current" />}
            </div>
            
            {suggestions.length > 0 ? (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.slice(0, expandedSuggestions ? undefined : 6).map((suggestion) => (
                  <span key={suggestion.id} className={`text-xs px-2 py-1 rounded-sm border ${theme.tag} animate-in fade-in duration-300`}>
                    {suggestion.title}
                  </span>
                ))}
                {!expandedSuggestions && suggestions.length > 6 && (
                   <button 
                      onClick={() => setExpandedSuggestions(true)}
                      className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${theme.icon}`}
                   >
                      + {suggestions.length - 6}
                   </button>
                )}
                {expandedSuggestions && suggestions.length > 6 && (
                   <button 
                      onClick={() => setExpandedSuggestions(false)}
                      className={`text-xs px-2 py-1 cursor-pointer hover:opacity-80 transition-opacity ${theme.icon}`}
                   >
                      Mostrar menos
                   </button>
                )}
              </div>
            ) : (
              <p className={`text-xs italic opacity-40 ${theme.text}`}>Em breve, novas sugestões...</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-500">
            {userChallenge ? (
              userChallenge.status === 'completed' ? (
                  <div className={`w-full font-bold py-3 rounded-md shadow-lg flex items-center justify-center gap-2 cursor-default animate-in fade-in zoom-in duration-500 ${theme.success}`}>
                    <Trophy className="w-5 h-5 fill-current" />
                    Desafio Concluído!
                  </div>
              ) : (
                  <div className="space-y-3">
                       <div className={`w-full border py-2 rounded-md flex items-center justify-center gap-2 text-sm opacity-90 cursor-default ${theme.buttonSecondary}`}>
                          <Check className="w-4 h-4" />
                          Desafio em Andamento
                        </div>
                        <Button 
                          className={`w-full font-bold border-none transition-all hover:scale-[1.02] ${theme.button}`} 
                          size="lg"
                          onClick={() => setCompletionOpen(true)}
                        >
                          Concluir Desafio
                        </Button>
                  </div>
              )
            ) : (
              <Button 
                className={`w-full font-bold border-none transition-all hover:scale-[1.02] ${theme.button}`}
                size="lg"
                onClick={handleJoinChallenge}
                disabled={joining}
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
          </div>
        </div>
      </div>

      {completionOpen && (
        <ChallengeCompletionDialog 
          open={completionOpen} 
          onOpenChange={setCompletionOpen}
          onConfirm={handleCompleteChallenge}
          suggestions={suggestions}
          theme={theme}
        />
      )}
    </div>
  );
}


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Profile } from "../../types";
import { READER_LEVELS, LevelConfig } from "../../constants/levels";
import { Check, Lock, Info, LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";

interface ReaderLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile;
}

export function ReaderLevelDialog({ open, onOpenChange, profile }: ReaderLevelDialogProps) {
  const currentLevelIndex = READER_LEVELS.findIndex(l => l.id === profile.reader_level);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            🏆 Níveis de Leitor
          </DialogTitle>
          <DialogDescription>
            Conheça todas as fases da jornada de um leitor e acompanhe seu progresso.
            Alcance as metas de páginas OU livros para subir de nível!
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 p-6 pt-2">
          <div className="space-y-6">
            {READER_LEVELS.map((level: LevelConfig, index) => {
              const isUnlocked = index <= currentLevelIndex;
              const isCurrent = index === currentLevelIndex;
              const Icon = level.icon as LucideIcon;
              
              const levelColor = level.color || "text-muted-foreground";
              const levelBgColor = level.bgColor || "bg-muted";

              // Calculate progress for this level's requirements
              // If already unlocked (past level), show 100%
              // If current or next, show actual progress
              const pagesProgress = isUnlocked && !isCurrent 
                ? 100 
                : Math.min(100, (profile.total_pages_read / Math.max(1, level.minPages)) * 100);
                
              const booksProgress = isUnlocked && !isCurrent
                ? 100
                : Math.min(100, (profile.total_books_read / Math.max(1, level.minBooks)) * 100);

              return (
                <div 
                  key={level.id}
                  style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'both' }}
                  className={cn(
                    "relative p-4 rounded-lg border transition-all animate-in fade-in slide-in-from-bottom-4 duration-700",
                    isCurrent ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary/20 scale-[1.02]" : 
                    isUnlocked ? "border-muted bg-card hover:bg-muted/50 hover:shadow-sm" : "border-muted/30 opacity-70 bg-muted/10 grayscale-[0.5]"
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-full flex items-center justify-center shrink-0 shadow-sm border transition-colors",
                      isUnlocked ? cn(levelBgColor, levelColor, "border-transparent") : "bg-muted text-muted-foreground border-muted-foreground/20"
                    )}>
                      <Icon className="w-6 h-6" />
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          {level.label}
                          {isCurrent && <Badge variant="default" className="text-xs">Nível Atual</Badge>}
                          {isUnlocked && !isCurrent && <Check className="w-4 h-4 text-green-500" />}
                          {!isUnlocked && <Lock className="w-4 h-4 text-muted-foreground" />}
                        </h3>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{level.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Páginas Lidas</span>
                            <span className={cn(
                              (profile.total_pages_read >= level.minPages || (isUnlocked && !isCurrent)) ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {profile.total_pages_read} / {level.minPages}
                            </span>
                          </div>
                          <Progress value={pagesProgress} className="h-2" />
                        </div>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-medium">
                            <span className="text-muted-foreground">Livros Lidos</span>
                            <span className={cn(
                              (profile.total_books_read >= level.minBooks || (isUnlocked && !isCurrent)) ? "text-green-600" : "text-muted-foreground"
                            )}>
                              {profile.total_books_read} / {level.minBooks}
                            </span>
                          </div>
                          <Progress value={booksProgress} className="h-2" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

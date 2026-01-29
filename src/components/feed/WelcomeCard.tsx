import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users } from 'lucide-react';

export function WelcomeCard() {
  return (
    <Card className="animate-fade-in overflow-hidden border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="h-12 w-12 border-2 border-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  Li
                </AvatarFallback>
              </Avatar>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">Litera</span>
                <Badge variant="default" className="text-xs">
                  Oficial
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <BookOpen className="w-4 h-4" />
                <span>Bem-vindo!</span>
              </div>
            </div>
          </div>
          <span className="text-sm text-muted-foreground">
            Fixado
          </span>
        </div>
      </CardHeader>

      <CardContent className="pb-4">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed">
            Bem-vindo ao Litera! 📚✨
            <br />
            Estamos muito felizes em ter você aqui. Explore novas leituras, compartilhe seu progresso e conecte-se com outros leitores apaixonados.
          </p>
          
          <div className="flex gap-4 p-3 bg-background/50 rounded-lg border border-primary/10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">Comunidades</h4>
                <p className="text-xs text-muted-foreground">Participe de clubes do livro e discussões!</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

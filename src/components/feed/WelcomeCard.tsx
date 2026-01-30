import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Users } from 'lucide-react';

export function WelcomeCard() {
  const [message] = useState({
    title: 'Bem-vindo ao Litera! 📚✨',
    content: 'Estamos muito felizes em ter você aqui. Explore novas leituras, compartilhe seu progresso e conecte-se com outros leitores apaixonados.'
  });

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
      <CardContent>
        <div className="space-y-2">
          <h3 className="font-medium text-lg text-primary">
            {message.title}
          </h3>
          <p className="text-muted-foreground leading-relaxed">
            {message.content}
          </p>
        </div>
        
        <div className="mt-6 pt-4 border-t border-border/50 flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span>Comunidade Ativa</span>
          </div>
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px]"
              >
                📚
              </div>
            ))}
            <div className="w-6 h-6 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-medium">
              +1k
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

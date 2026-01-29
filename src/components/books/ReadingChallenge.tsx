import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Trophy, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ReadingChallenge() {
  const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonth.charAt(0).toUpperCase() + currentMonth.slice(1);

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
              <h3 className="font-bold text-lg mb-1">Leia um clássico</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Este mês, desafiamos você a ler uma obra clássica da literatura que você nunca leu antes.
              </p>
            </div>
          </div>
          
          <div className="bg-background/50 rounded-lg p-3 border border-border/50">
            <div className="flex items-center gap-2 text-sm font-medium mb-2">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
              <span>Sugestões da comunidade:</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside ml-1">
              <li>Dom Casmurro - Machado de Assis</li>
              <li>1984 - George Orwell</li>
              <li>Orgulho e Preconceito - Jane Austen</li>
            </ul>
          </div>

          <Button className="w-full" variant="outline">
            Aceitar Desafio
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

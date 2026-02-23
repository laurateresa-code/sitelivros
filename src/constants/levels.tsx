import { ReaderLevel } from "../types";
import { Sprout, BookOpen, Flame, Trophy, Crown, LucideIcon } from "lucide-react";

export interface LevelConfig {
  id: ReaderLevel;
  label: string;
  minPages: number;
  minBooks: number;
  description: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
}

export const READER_LEVELS: LevelConfig[] = [
  {
    id: 'iniciante',
    label: 'Iniciante',
    minPages: 0,
    minBooks: 0,
    description: 'Onde toda jornada começa. Apenas comece a ler!',
    icon: Sprout,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10'
  },
  {
    id: 'leitor',
    label: 'Leitor',
    minPages: 100,
    minBooks: 1,
    description: 'Você já deu os primeiros passos e completou seu primeiro livro ou 100 páginas.',
    icon: BookOpen,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10'
  },
  {
    id: 'leitor_avido',
    label: 'Leitor Ávido',
    minPages: 1000,
    minBooks: 5,
    description: 'A leitura é um hábito constante. 1.000 páginas ou 5 livros lidos.',
    icon: Flame,
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10'
  },
  {
    id: 'devorador',
    label: 'Devorador',
    minPages: 5000,
    minBooks: 20,
    description: 'Você devora histórias! 5.000 páginas ou 20 livros lidos.',
    icon: Trophy,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10'
  },
  {
    id: 'mestre',
    label: 'Mestre',
    minPages: 10000,
    minBooks: 50,
    description: 'O nível máximo de sabedoria. 10.000 páginas ou 50 livros lidos.',
    icon: Crown,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10'
  }
];

export function getNextLevel(currentLevelId: ReaderLevel): LevelConfig | null {
  const currentIndex = READER_LEVELS.findIndex(l => l.id === currentLevelId);
  if (currentIndex === -1 || currentIndex === READER_LEVELS.length - 1) return null;
  return READER_LEVELS[currentIndex + 1];
}

export function calculateProgress(profile: { total_pages_read: number; total_books_read: number }, nextLevel: LevelConfig) {
  const pagesProgress = Math.min(100, (profile.total_pages_read / nextLevel.minPages) * 100);
  const booksProgress = Math.min(100, (profile.total_books_read / nextLevel.minBooks) * 100);
  
  return { pagesProgress, booksProgress };
}

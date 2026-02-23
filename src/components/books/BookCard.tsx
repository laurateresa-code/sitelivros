import { Link } from 'react-router-dom';
import { BookOpen, Plus, Check, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StarRating } from '@/components/ui/StarRating';
import { Book, UserBook } from '@/types';

interface BookCardProps {
  book: Book;
  userBook?: UserBook;
  onAddToList?: (status: 'reading' | 'read' | 'want_to_read') => void;
  showAddButton?: boolean;
  onClick?: (book: Book) => void;
}

export function BookCard({
  book,
  userBook,
  onAddToList,
  showAddButton = true,
  onClick,
}: BookCardProps) {
  const getStatusBadge = () => {
    if (!userBook) return null;

    const statusConfig = {
      reading: { label: 'Lendo', variant: 'default' as const, icon: BookOpen },
      read: { label: 'Lido', variant: 'secondary' as const, icon: Check },
      want_to_read: { label: 'Quero Ler', variant: 'outline' as const, icon: Clock },
    };

    const config = statusConfig[userBook.status];
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="absolute top-2 right-2 gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      <div className="relative aspect-[2/3] overflow-hidden">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-muted-foreground" />
          </div>
        )}
        {getStatusBadge()}
        
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="absolute bottom-4 left-4 right-4">
            {onClick ? (
              <Button 
                className="w-full gradient-primary text-white"
                onClick={(e) => {
                  e.preventDefault();
                  onClick(book);
                }}
              >
                Ver Detalhes
              </Button>
            ) : (
              <Link to={`/book/${book.id}`}>
                <Button className="w-full gradient-primary text-white">
                  Ver Detalhes
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        {onClick ? (
          <h3 
            className="font-semibold line-clamp-2 hover:text-primary transition-colors cursor-pointer"
            onClick={(e) => {
              e.preventDefault();
              onClick(book);
            }}
          >
            {book.title}
          </h3>
        ) : (
          <Link to={`/book/${book.id}`}>
            <h3 className="font-semibold line-clamp-2 hover:text-primary transition-colors">
              {book.title}
            </h3>
          </Link>
        )}
        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
          {book.author || 'Autor desconhecido'}
        </p>

        {book.average_rating > 0 && (
          <div className="flex items-center gap-2 mt-2">
            <StarRating rating={Math.round(book.average_rating)} readonly size="sm" />
            <span className="text-sm text-muted-foreground">
              ({book.total_ratings})
            </span>
          </div>
        )}

        {userBook?.rating && (
          <div className="flex items-center gap-2 mt-2">
            <span className="text-sm text-muted-foreground">Sua nota:</span>
            <StarRating rating={userBook.rating} readonly size="sm" />
          </div>
        )}

        {showAddButton && onAddToList && !userBook && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full mt-3 gap-2">
                <Plus className="w-4 h-4" />
                Adicionar à lista
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => onAddToList('reading')}>
                <BookOpen className="w-4 h-4 mr-2" />
                Estou lendo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToList('want_to_read')}>
                <Clock className="w-4 h-4 mr-2" />
                Quero ler
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onAddToList('read')}>
                <Check className="w-4 h-4 mr-2" />
                Já li
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {userBook?.status === 'reading' && userBook.book?.page_count && (
          <div className="mt-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                {Math.round((userBook.current_page / userBook.book.page_count) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full gradient-primary transition-all duration-300"
                style={{
                  width: `${(userBook.current_page / userBook.book.page_count) * 100}%`,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

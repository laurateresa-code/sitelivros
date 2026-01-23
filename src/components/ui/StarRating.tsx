import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  onRatingChange?: (rating: number) => void;
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({
  rating,
  onRatingChange,
  readonly = false,
  size = 'md',
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return (
    <div 
      className="flex items-center gap-0.5"
      onMouseLeave={() => !readonly && setHoverRating(0)}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => onRatingChange?.(star)}
          onMouseEnter={() => !readonly && setHoverRating(star)}
          className={cn(
            'transition-all duration-200',
            !readonly && 'cursor-pointer hover:scale-110'
          )}
        >
          <Star
            className={cn(
              sizes[size],
              star <= (hoverRating || rating)
                ? 'fill-star-filled text-star-filled'
                : 'text-star-empty'
            )}
          />
        </button>
      ))}
    </div>
  );
}

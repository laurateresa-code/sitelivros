import { useState, useEffect } from 'react';
import { BookOpen, Clock, FileText, X, Play, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { UserBook } from '@/types';
import { useReadingSession } from '@/hooks/useReadingSession';

interface ReadingSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userBook: UserBook;
  onSessionEnd?: () => void;
}

export function ReadingSessionModal({
  open,
  onOpenChange,
  userBook,
  onSessionEnd,
}: ReadingSessionModalProps) {
  const { activeSession, startSession, endSession, cancelSession, loading } = useReadingSession();
  const [endPage, setEndPage] = useState<number>(userBook.current_page);
  const [notes, setNotes] = useState('');
  const [elapsedTime, setElapsedTime] = useState(0);

  const isSessionActive = activeSession?.bookId === userBook.book_id;

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isSessionActive && activeSession) {
      interval = setInterval(() => {
        const elapsed = Math.floor(
          (new Date().getTime() - activeSession.startTime.getTime()) / 1000
        );
        setElapsedTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isSessionActive, activeSession]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startSession(userBook.book_id, userBook.current_page);
  };

  const handleEnd = async () => {
    await endSession(endPage, notes);
    onSessionEnd?.();
    onOpenChange(false);
    setNotes('');
    setEndPage(userBook.current_page);
    setElapsedTime(0);
  };

  const handleCancel = async () => {
    await cancelSession();
    onOpenChange(false);
    setElapsedTime(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            Sessão de Leitura
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Book info */}
          <div className="flex gap-4 p-4 bg-muted rounded-lg">
            {userBook.book?.cover_url ? (
              <img
                src={userBook.book.cover_url}
                alt={userBook.book.title}
                className="w-16 h-24 object-cover rounded-md shadow"
              />
            ) : (
              <div className="w-16 h-24 bg-primary/10 rounded-md flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h4 className="font-semibold">{userBook.book?.title}</h4>
              <p className="text-sm text-muted-foreground">{userBook.book?.author}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Página atual: {userBook.current_page} / {userBook.book?.page_count || '?'}
              </p>
            </div>
          </div>

          {!isSessionActive ? (
            // Start session view
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="w-12 h-12 text-primary" />
              </div>
              <p className="text-muted-foreground">
                Inicie uma sessão de leitura para registrar seu progresso
              </p>
              <Button
                className="w-full gradient-primary text-white gap-2"
                size="lg"
                onClick={handleStart}
              >
                <Play className="w-5 h-5" />
                Iniciar Leitura
              </Button>
            </div>
          ) : (
            // Active session view
            <div className="space-y-4">
              {/* Timer */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-success/10 rounded-full">
                  <span className="w-3 h-3 bg-success rounded-full reading-pulse" />
                  <Clock className="w-5 h-5 text-success" />
                  <span className="text-2xl font-mono font-bold text-success">
                    {formatTime(elapsedTime)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Lendo desde a página {activeSession?.startPage}
                </p>
              </div>

              {/* End page input */}
              <div className="space-y-2">
                <Label htmlFor="endPage">Página onde parou</Label>
                <Input
                  id="endPage"
                  type="number"
                  value={endPage}
                  onChange={(e) => setEndPage(parseInt(e.target.value) || 0)}
                  min={activeSession?.startPage}
                  max={userBook.book?.page_count || 9999}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Anotações (opcional)
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="O que você achou das páginas lidas?"
                  rows={3}
                />
              </div>

              {/* Summary */}
              {endPage > (activeSession?.startPage || 0) && (
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p>
                    📚 <strong>{endPage - (activeSession?.startPage || 0)}</strong> páginas lidas
                  </p>
                  <p>
                    ⏱️ <strong>{Math.round(elapsedTime / 60)}</strong> minutos de leitura
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  className="flex-1 gradient-primary text-white"
                  onClick={handleEnd}
                  disabled={loading || endPage <= (activeSession?.startPage || 0)}
                >
                  <Square className="w-4 h-4 mr-2" />
                  Finalizar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

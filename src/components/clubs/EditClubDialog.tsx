import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ImageUpload } from '@/components/ui/image-upload';
import { Loader2, X, BookOpen } from 'lucide-react';
import { Club, Book, GoogleBookResult } from '@/types';
import { BookSearch } from '@/components/books/BookSearch';
import { useBooks } from '@/hooks/useBooks';

interface EditClubDialogProps {
  club: Club;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClubUpdated: () => void;
}

export function EditClubDialog({ club, open, onOpenChange, onClubUpdated }: EditClubDialogProps) {
  const [name, setName] = useState(club.name);
  const [description, setDescription] = useState(club.description || '');
  const [coverUrl, setCoverUrl] = useState(club.cover_url || '');
  const [isPublic, setIsPublic] = useState(club.is_public);
  const [currentBook, setCurrentBook] = useState<Book | null>(club.current_book || null);
  const [isSearchingBook, setIsSearchingBook] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { addBookFromGoogle } = useBooks();

  useEffect(() => {
    if (open) {
      setName(club.name);
      setDescription(club.description || '');
      setCoverUrl(club.cover_url || '');
      setIsPublic(club.is_public);
      setCurrentBook(club.current_book || null);
      setIsSearchingBook(false);
    }
  }, [open, club]);

  const handleBookSelect = async (googleBook: GoogleBookResult) => {
    if (!user) return;
    
    try {
      const book = await addBookFromGoogle(googleBook, user.id);
      if (book) {
        setCurrentBook(book);
        setIsSearchingBook(false);
      } else {
        // Error is already toasted in useBooks
      }
    } catch (error) {
      console.error("Failed to select book:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name.trim()) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('clubs')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          cover_url: coverUrl.trim() || null,
          is_public: isPublic,
          current_book_id: currentBook?.id || null,
        })
        .eq('id', club.id);

      if (error) throw error;

      toast({
        title: 'Clube atualizado com sucesso!',
        description: 'As alterações foram salvas.',
      });

      onOpenChange(false);
      onClubUpdated();
    } catch (error) {
      console.error('Error updating club:', error);
      toast({
        title: 'Erro ao atualizar clube',
        description: error instanceof Error ? error.message : 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Clube</DialogTitle>
          <DialogDescription>
            Atualize as informações do seu clube de leitura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nome do Clube</Label>
            <Input
              id="edit-name"
              placeholder="Ex: Clube dos Clássicos"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <ImageUpload
            value={coverUrl}
            onChange={setCoverUrl}
            label="Imagem de Capa"
          />
          
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descrição</Label>
            <Textarea
              id="edit-description"
              placeholder="Sobre o que é este clube?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label>Livro do Momento</Label>
            {!isSearchingBook ? (
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                {currentBook ? (
                  <div className="flex gap-3">
                    <div className="h-16 w-12 bg-muted rounded overflow-hidden flex-shrink-0">
                      {currentBook.cover_url ? (
                        <img
                          src={currentBook.cover_url}
                          alt={currentBook.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-background">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm line-clamp-1">{currentBook.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{currentBook.author}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-5 w-5" />
                    <span className="text-sm">Nenhum livro selecionado</span>
                  </div>
                )}
                <div className="flex gap-2">
                  {currentBook && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentBook(null)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setIsSearchingBook(true)}
                  >
                    {currentBook ? 'Alterar' : 'Selecionar'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2 border rounded-lg p-3 bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Buscar Livro</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsSearchingBook(false)}
                    className="h-6 px-2"
                  >
                    Cancelar
                  </Button>
                </div>
                <BookSearch onSelect={handleBookSelect} />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <Label htmlFor="edit-public-mode">Clube Público</Label>
              <div className="text-sm text-muted-foreground">
                Qualquer pessoa pode ver e participar
              </div>
            </div>
            <Switch
              id="edit-public-mode"
              checked={isPublic}
              onCheckedChange={setIsPublic}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !name.trim()}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

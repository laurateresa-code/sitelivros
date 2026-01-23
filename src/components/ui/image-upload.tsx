import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string) => void;
  disabled?: boolean;
  bucket?: string;
  className?: string;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  bucket = 'club-covers',
  className = '',
  label = 'Imagem'
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${fileName}`;

      setUploading(true);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);

      onChange(data.publicUrl);
      
      toast({
        title: "Imagem enviada com sucesso!",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro ao enviar imagem",
        description: "Verifique se o arquivo é uma imagem válida e tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <Label>{label}</Label>
      
      {value ? (
        <div className="space-y-2">
          <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border bg-muted">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => !disabled && fileInputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload className="w-4 h-4 mr-2" />
              Trocar Imagem
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemove}
              disabled={disabled || uploading}
              className="text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4 mr-2" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <div 
          onClick={() => !disabled && !uploading && fileInputRef.current?.click()}
          className={`
            border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors
            ${disabled || uploading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/50 hover:border-primary/50'}
          `}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <div className="bg-muted p-3 rounded-full">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="text-center">
            <p className="text-sm font-medium">
              {uploading ? "Enviando..." : "Clique para selecionar"}
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG ou WEBP (max. 2MB)
            </p>
          </div>
        </div>
      )}

      <Input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleUpload}
        disabled={disabled || uploading}
      />
    </div>
  );
}

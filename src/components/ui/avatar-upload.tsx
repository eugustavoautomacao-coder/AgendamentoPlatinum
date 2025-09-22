import React, { useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Upload, Camera } from 'lucide-react';

interface AvatarUploadProps {
  currentAvatarUrl?: string;
  userName?: string;
  userId: string;
  onAvatarChange: (newAvatarUrl: string) => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
  disabled?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
  xl: 'h-24 w-24'
};

const buttonSizeClasses = {
  sm: 'h-6 w-6 text-xs',
  md: 'h-8 w-8 text-sm',
  lg: 'h-10 w-10 text-base',
  xl: 'h-12 w-12 text-lg'
};

export function AvatarUpload({
  currentAvatarUrl,
  userName = '',
  userId,
  onAvatarChange,
  size = 'md',
  showUploadButton = true,
  disabled = false,
  className = ''
}: AvatarUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploading, uploadAvatar } = useAvatarUpload();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    const newAvatarUrl = await uploadAvatar(file, userId);
    if (newAvatarUrl) {
      onAvatarChange(newAvatarUrl);
    }
  };

  const handleUploadClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative">
        <Avatar className={sizeClasses[size]}>
          <AvatarImage src={currentAvatarUrl} />
          <AvatarFallback className="text-sm font-medium">
            {getInitials(userName)}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {showUploadButton && (
        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleUploadClick}
            disabled={disabled || uploading}
            className="flex items-center gap-2"
          >
            {uploading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-3 w-3" />
                Alterar Foto
              </>
            )}
          </Button>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled || uploading}
          />
          
          <p className="text-xs text-muted-foreground text-center">
            JPG, PNG ou GIF até 5MB
          </p>
        </div>
      )}
    </div>
  );
}


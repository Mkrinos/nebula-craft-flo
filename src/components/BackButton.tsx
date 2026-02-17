import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface BackButtonProps {
  className?: string;
  fallbackPath?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ 
  className,
  fallbackPath = '/dashboard'
}) => {
  const navigate = useNavigate();
  const { trigger } = useHapticFeedback();

  const handleBack = () => {
    trigger('light');
    
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to dashboard if no history
      navigate(fallbackPath);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleBack}
      className={cn(
        "gap-2 text-muted-foreground hover:text-foreground transition-colors min-h-[44px] active:scale-95",
        className
      )}
    >
      <ArrowLeft className="h-4 w-4 pointer-events-none" />
      <span className="hidden sm:inline pointer-events-none">Back</span>
    </Button>
  );
};

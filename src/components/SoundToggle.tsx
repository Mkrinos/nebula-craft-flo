import { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { sciFiButtonVariants } from './ui/sci-fi-button';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  compact?: boolean;
}

export function SoundToggle({ compact = false }: SoundToggleProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const haptic = useHapticFeedback();

  useEffect(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    setSoundEnabled(saved !== 'false');
  }, []);

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem('soundEffectsEnabled', String(newValue));
    haptic.trigger('selection');
    
    toast.success(newValue ? 'Sound effects enabled' : 'Sound effects muted', {
      duration: 2000,
    });
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <TouchTriggerButton
          onClick={toggleSound}
          className={cn(
            sciFiButtonVariants({ variant: 'ghost', size: 'icon' }),
            compact ? 'w-8 h-8' : 'w-10 h-10'
          )}
        >
          {soundEnabled ? (
            <Volume2 className="w-4 h-4 text-neon-cyan pointer-events-none" />
          ) : (
            <VolumeX className="w-4 h-4 text-muted-foreground pointer-events-none" />
          )}
        </TouchTriggerButton>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}</p>
      </TooltipContent>
    </Tooltip>
  );
}

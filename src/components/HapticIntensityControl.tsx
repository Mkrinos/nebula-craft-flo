import { useState, useEffect } from 'react';
import { Vibrate, Settings2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { useHapticFeedback, getHapticIntensity, setHapticIntensity } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
// Tooltip removed - compact view no longer uses tooltip wrapper for better touch reliability

interface HapticIntensityControlProps {
  compact?: boolean;
  className?: string;
}

export function HapticIntensityControl({ compact, className }: HapticIntensityControlProps) {
  const haptic = useHapticFeedback();
  const navigate = useNavigate();
  const [intensity, setIntensity] = useState(getHapticIntensity() * 100);

  // Update global intensity when slider changes
  const handleIntensityChange = (value: number[]) => {
    const newIntensity = value[0];
    setIntensity(newIntensity);
    setHapticIntensity(newIntensity / 100);
    
    // Provide preview haptic feedback
    if (newIntensity > 0) {
      haptic.trigger('selection');
    }
  };

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('haptic-intensity', String(intensity / 100));
  }, [intensity]);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('haptic-intensity');
    if (saved) {
      const savedValue = parseFloat(saved);
      setIntensity(savedValue * 100);
      setHapticIntensity(savedValue);
    }
  }, []);

  if (!haptic.isSupported) {
    return null; // Don't show on devices without haptic support
  }

  if (compact) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Vibrate className={cn(
          "w-4 h-4 flex-shrink-0",
          intensity === 0 ? "text-muted-foreground" : "text-neon-cyan"
        )} />
        <Slider
          value={[intensity]}
          onValueChange={handleIntensityChange}
          min={0}
          max={200}
          step={10}
          className="w-20"
        />
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 touch-manipulation"
          onClick={() => navigate('/haptic-settings')}
        >
          <Settings2 className="h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Vibrate className={cn(
            "w-4 h-4",
            intensity === 0 ? "text-muted-foreground" : "text-neon-cyan"
          )} />
          <span className="text-sm text-muted-foreground">Haptic Feedback</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {intensity === 0 ? 'Off' : `${intensity}%`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={() => navigate('/haptic-settings')}
          >
            <Settings2 className="h-3 w-3 mr-1" />
            Settings
          </Button>
        </div>
      </div>
      <Slider
        value={[intensity]}
        onValueChange={handleIntensityChange}
        min={0}
        max={200}
        step={10}
        className="w-full"
      />
      <p className="text-[10px] text-muted-foreground">
        Adjust vibration strength on your {haptic.isIOS ? 'iOS' : haptic.isAndroid ? 'Android' : ''} device
      </p>
    </div>
  );
}

export default HapticIntensityControl;

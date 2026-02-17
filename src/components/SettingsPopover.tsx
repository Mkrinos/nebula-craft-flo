import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import MotionSettingsToggle from './MotionSettingsToggle';
import { UIThemeSelector } from './UIThemeSelector';
import { SoundToggle } from './SoundToggle';
import { HapticIntensityControl } from './HapticIntensityControl';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { sciFiButtonVariants } from './ui/sci-fi-button';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Feather, Zap, Flame, ChevronRight, Play, Bug } from 'lucide-react';
import { useHapticFeedback, getHapticIntensity, setHapticIntensity } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { TOUCH_DIAGNOSTICS_TOGGLE_EVENT } from './TouchDiagnostics';

interface SettingsPopoverProps {
  compact?: boolean;
}

const hapticPresets = [
  { id: 'gentle', name: 'Gentle', icon: Feather, intensity: 50, description: 'Subtle feedback', testPattern: 'light' as const },
  { id: 'normal', name: 'Normal', icon: Zap, intensity: 100, description: 'Balanced feedback', testPattern: 'medium' as const },
  { id: 'strong', name: 'Strong', icon: Flame, intensity: 175, description: 'Powerful feedback', testPattern: 'heavy' as const },
];

const SettingsPopover = ({ compact }: SettingsPopoverProps) => {
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const [activePreset, setActivePreset] = useState<string>(() => {
    const saved = localStorage.getItem('haptic-preset');
    return saved || 'normal';
  });

  // Dev-only: Touch diagnostics toggle state
  const isDev = import.meta.env.DEV || new URLSearchParams(window.location.search).has('debug');
  const [touchDiagnosticsEnabled, setTouchDiagnosticsEnabled] = useState(() => {
    return localStorage.getItem('touch-diagnostics-enabled') === 'true';
  });

  const toggleTouchDiagnostics = (enabled: boolean) => {
    setTouchDiagnosticsEnabled(enabled);
    localStorage.setItem('touch-diagnostics-enabled', String(enabled));
    // Dispatch custom event for TouchDiagnostics component
    window.dispatchEvent(
      new CustomEvent(TOUCH_DIAGNOSTICS_TOGGLE_EVENT, { detail: { enabled } })
    );
    haptic.trigger('selection');
    toast.success(`Touch diagnostics ${enabled ? 'enabled' : 'disabled'}`);
  };

  // Sync preset with current intensity on mount
  useEffect(() => {
    const currentIntensity = getHapticIntensity() * 100;
    const matchingPreset = hapticPresets.find(p => Math.abs(p.intensity - currentIntensity) < 15);
    if (matchingPreset) {
      setActivePreset(matchingPreset.id);
    } else {
      setActivePreset('custom');
    }
  }, []);

  const applyHapticPreset = (presetId: string, intensity: number) => {
    setActivePreset(presetId);
    setHapticIntensity(intensity / 100);
    localStorage.setItem('haptic-intensity', String(intensity / 100));
    localStorage.setItem('haptic-preset', presetId);
    haptic.trigger('success');
    toast.success(`${presetId.charAt(0).toUpperCase() + presetId.slice(1)} haptic preset applied`);
  };

  const previewPreset = (preset: typeof hapticPresets[0]) => {
    // Temporarily apply preset intensity, trigger pattern, then restore
    const originalIntensity = getHapticIntensity();
    setHapticIntensity(preset.intensity / 100);
    haptic.trigger(preset.testPattern);
    // Restore after short delay
    setTimeout(() => setHapticIntensity(originalIntensity), 300);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <TouchTriggerButton
          className={cn(
            sciFiButtonVariants({ variant: 'ghost', size: 'icon' }),
            compact ? 'w-8 h-8 lg:w-9 lg:h-9' : 'w-10 h-10'
          )}
          aria-label="Open settings"
        >
          <Settings className="w-4 h-4" />
        </TouchTriggerButton>
      </PopoverTrigger>
      
      <PopoverContent 
        align="end" 
        className="w-72 sm:w-80 bg-space-dark/95 backdrop-blur-xl border-neon-cyan/30 z-50 p-4"
      >
        <div className="space-y-4">
          <h4 className="font-display text-sm uppercase tracking-wider text-foreground mb-3">
            Settings
          </h4>
          
          {/* Language */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Language</span>
            <LanguageSelector compact />
          </div>
          
          {/* UI Theme */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Theme</span>
            <UIThemeSelector compact />
          </div>
          
          {/* Sound */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Sound Effects</span>
            <SoundToggle compact />
          </div>
          
          {/* Motion */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Motion</span>
            <MotionSettingsToggle compact />
          </div>

          {/* Haptic Feedback - Enhanced Section */}
          {haptic.isSupported && (
            <>
              <div className="h-px bg-neon-cyan/20" />
              
              {/* Haptic Quick Presets */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Haptic Feedback</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs gap-1"
                    onClick={() => navigate('/haptic-settings')}
                  >
                    Advanced
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
                
                {/* Preset Buttons with Preview */}
                <div className="grid grid-cols-3 gap-2">
                  {hapticPresets.map((preset) => {
                    const Icon = preset.icon;
                    const isActive = activePreset === preset.id;
                    return (
                      <div key={preset.id} className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          onClick={() => applyHapticPreset(preset.id, preset.intensity)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 h-auto rounded-lg border transition-all duration-200 min-h-[52px]",
                            "hover:scale-[1.02] active:scale-[0.98] touch-manipulation",
                            isActive
                              ? "bg-primary/15 border-primary/50 text-primary"
                              : "bg-card/30 border-border/30 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                          )}
                        >
                          <Icon className={cn(
                            "h-4 w-4 transition-colors pointer-events-none",
                            isActive && "text-primary"
                          )} />
                          <span className="text-[10px] font-medium pointer-events-none">{preset.name}</span>
                        </Button>
                        {/* Preview button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            previewPreset(preset);
                          }}
                          className="h-6 text-[9px] px-2 gap-1 touch-manipulation"
                        >
                          <Play className="h-2.5 w-2.5 pointer-events-none" />
                          Preview
                        </Button>
                      </div>
                    );
                  })}
                </div>
                
                {/* Fine-tune slider */}
                <HapticIntensityControl compact />
              </div>
            </>
          )}

          {/* Dev-only: Touch Diagnostics Toggle */}
          {isDev && (
            <>
              <div className="h-px bg-neon-magenta/20" />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug className="h-4 w-4 text-neon-magenta" />
                  <span className="text-sm text-muted-foreground">Touch Diagnostics</span>
                </div>
                <Switch
                  checked={touchDiagnosticsEnabled}
                  onCheckedChange={toggleTouchDiagnostics}
                  className="data-[state=checked]:bg-neon-magenta"
                />
              </div>
              <p className="text-[10px] text-muted-foreground/60">
                Dev-only: Shows tap locations and blocked elements
              </p>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SettingsPopover;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Vibrate, Music, Activity, Zap, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getRhythmHapticSettings, saveRhythmHapticSettings } from '@/hooks/useRhythmHaptics';

interface RhythmHapticsPanelProps {
  currentBeat?: { isBeat: boolean; energy: number; lowFreqEnergy: number; highFreqEnergy: number } | null;
  bpm?: number | null;
  isPlaying?: boolean;
  className?: string;
}

type Intensity = 'gentle' | 'normal' | 'strong';

const intensityConfig: { id: Intensity; label: string; icon: React.ReactNode; description: string }[] = [
  { id: 'gentle', label: 'Gentle', icon: <Volume2 className="w-4 h-4" />, description: 'Subtle taps on beats' },
  { id: 'normal', label: 'Normal', icon: <Vibrate className="w-4 h-4" />, description: 'Balanced feedback' },
  { id: 'strong', label: 'Strong', icon: <Zap className="w-4 h-4" />, description: 'Intense pulses' },
];

export const RhythmHapticsPanel: React.FC<RhythmHapticsPanelProps> = ({
  currentBeat,
  bpm,
  isPlaying = false,
  className,
}) => {
  const [settings, setSettings] = useState(getRhythmHapticSettings);
  
  useEffect(() => {
    setSettings(getRhythmHapticSettings());
  }, []);

  const updateSettings = (updates: Partial<typeof settings>) => {
    const newSettings = saveRhythmHapticSettings(updates);
    setSettings(newSettings);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <Music className="w-4 h-4 text-primary" />
          </div>
          <div>
            <Label className="text-sm font-medium">Rhythm Haptics</Label>
            <p className="text-xs text-muted-foreground">Sync vibrations with music</p>
          </div>
        </div>
        <Switch
          checked={settings.enabled}
          onCheckedChange={(enabled) => updateSettings({ enabled })}
        />
      </div>

      <AnimatePresence>
        {settings.enabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4 overflow-hidden"
          >
            {/* Beat Visualizer */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Live Beat Detection</span>
                {bpm && (
                  <span className="text-xs font-mono text-primary">{bpm} BPM</span>
                )}
              </div>
              
              <div className="flex items-end gap-1 h-12">
                {/* Bass indicator */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full rounded bg-gradient-to-t from-red-500 to-orange-400"
                    animate={{
                      height: `${(currentBeat?.lowFreqEnergy ?? 0.1) * 100}%`,
                      opacity: isPlaying ? 0.8 : 0.3,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                  <span className="text-[10px] text-muted-foreground">Bass</span>
                </div>
                
                {/* Energy indicator */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full rounded bg-gradient-to-t from-primary to-violet-400"
                    animate={{
                      height: `${(currentBeat?.energy ?? 0.1) * 100}%`,
                      opacity: isPlaying ? 0.8 : 0.3,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                  <span className="text-[10px] text-muted-foreground">Energy</span>
                </div>
                
                {/* Treble indicator */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    className="w-full rounded bg-gradient-to-t from-cyan-500 to-blue-400"
                    animate={{
                      height: `${(currentBeat?.highFreqEnergy ?? 0.1) * 100}%`,
                      opacity: isPlaying ? 0.8 : 0.3,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  />
                  <span className="text-[10px] text-muted-foreground">Treble</span>
                </div>
                
                {/* Beat pulse */}
                <div className="flex-1 flex flex-col items-center gap-1">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <AnimatePresence>
                      {currentBeat?.isBeat && (
                        <motion.div
                          initial={{ scale: 0.5, opacity: 1 }}
                          animate={{ scale: 1.5, opacity: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="absolute w-6 h-6 rounded-full bg-primary"
                        />
                      )}
                    </AnimatePresence>
                    <motion.div
                      className="w-4 h-4 rounded-full bg-primary"
                      animate={{
                        scale: currentBeat?.isBeat ? 1.2 : 1,
                        opacity: isPlaying ? 1 : 0.4,
                      }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">Beat</span>
                </div>
              </div>
            </div>

            {/* Intensity Selection */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Haptic Intensity</Label>
              <div className="grid grid-cols-3 gap-2">
                {intensityConfig.map((config) => (
                  <Button
                    key={config.id}
                    variant={settings.intensity === config.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateSettings({ intensity: config.id })}
                    className={cn(
                      "flex flex-col items-center gap-1 h-auto py-2",
                      settings.intensity === config.id && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                  >
                    {config.icon}
                    <span className="text-xs">{config.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Sensitivity Slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Beat Sensitivity</Label>
                <span className="text-xs font-mono text-muted-foreground">
                  {Math.round(settings.sensitivity * 100)}%
                </span>
              </div>
              <Slider
                value={[settings.sensitivity]}
                onValueChange={([value]) => updateSettings({ sensitivity: value })}
                min={0.1}
                max={1}
                step={0.05}
                className="w-full"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Fewer beats</span>
                <span>More beats</span>
              </div>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
              <Activity className={cn(
                "w-4 h-4 transition-colors",
                isPlaying && settings.enabled ? "text-green-500" : "text-muted-foreground"
              )} />
              <span className="text-xs text-muted-foreground">
                {!isPlaying 
                  ? "Play music to feel the rhythm"
                  : settings.enabled 
                    ? "Haptics synced to beats"
                    : "Rhythm haptics disabled"
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Compact beat indicator for use in music player
export const BeatIndicator: React.FC<{
  isBeat?: boolean;
  energy?: number;
  enabled?: boolean;
  className?: string;
}> = ({ isBeat, energy = 0, enabled = true, className }) => {
  if (!enabled) return null;
  
  return (
    <motion.div
      className={cn(
        "w-2 h-2 rounded-full",
        isBeat ? "bg-primary" : "bg-muted-foreground/30",
        className
      )}
      animate={{
        scale: isBeat ? 1.5 : 1 + energy * 0.3,
        opacity: isBeat ? 1 : 0.5 + energy * 0.3,
      }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
    />
  );
};

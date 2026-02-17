import { useState, useEffect, useCallback } from 'react';
import { Vibrate, Play, Volume2, Smartphone, Monitor, TabletSmartphone, Feather, Zap, Flame, Music, ScrollText, GripVertical } from 'lucide-react';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PullToRefresh } from '@/components/PullToRefresh';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { 
  useHapticFeedback, 
  HapticIntensity, 
  getHapticIntensity, 
  setHapticIntensity,
  triggerHaptic 
} from '@/hooks/useHapticFeedback';
import { useAudioHaptic } from '@/hooks/useAudioHaptic';
import { HapticPatternVisualizer } from '@/components/HapticPatternVisualizer';
import { RhythmHapticsPanel } from '@/components/RhythmHapticsPanel';
import { useMusicContext } from '@/contexts/MusicContext';
import { getScrollBoundarySettings, saveScrollBoundarySettings } from '@/hooks/useScrollBoundaryHaptics';
import { getReorderHapticsSettings, saveReorderHapticsSettings } from '@/hooks/useReorderHaptics';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { SEOHead } from '@/components/SEOHead';
import { BackButton } from '@/components/BackButton';

interface PatternConfig {
  id: HapticIntensity;
  name: string;
  description: string;
  category: 'basic' | 'navigation' | 'feedback';
  enabled: boolean;
  customMultiplier: number;
}

const defaultPatterns: PatternConfig[] = [
  // Basic patterns
  { id: 'light', name: 'Light', description: 'Subtle tap feedback', category: 'basic', enabled: true, customMultiplier: 1.0 },
  { id: 'medium', name: 'Medium', description: 'Standard interaction feedback', category: 'basic', enabled: true, customMultiplier: 1.0 },
  { id: 'heavy', name: 'Heavy', description: 'Strong emphasis feedback', category: 'basic', enabled: true, customMultiplier: 1.0 },
  { id: 'selection', name: 'Selection', description: 'Quick selection confirmation', category: 'basic', enabled: true, customMultiplier: 1.0 },
  // Navigation patterns
  { id: 'navigation', name: 'Navigation', description: 'Page transition feedback', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  { id: 'button-press', name: 'Button Press', description: 'Button tap confirmation', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  { id: 'swipe', name: 'Swipe', description: 'Swipe gesture feedback', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  { id: 'long-press', name: 'Long Press', description: 'Hold gesture confirmation', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  { id: 'double-tap', name: 'Double Tap', description: 'Quick double-tap feedback', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  { id: 'tour-step', name: 'Tour Step', description: 'Tutorial progression', category: 'navigation', enabled: true, customMultiplier: 1.0 },
  // Feedback patterns
  { id: 'success', name: 'Success', description: 'Positive action confirmation', category: 'feedback', enabled: true, customMultiplier: 1.0 },
  { id: 'warning', name: 'Warning', description: 'Caution notification', category: 'feedback', enabled: true, customMultiplier: 1.0 },
  { id: 'error', name: 'Error', description: 'Error alert feedback', category: 'feedback', enabled: true, customMultiplier: 1.0 },
  { id: 'achievement', name: 'Achievement', description: 'Celebration pattern', category: 'feedback', enabled: true, customMultiplier: 1.0 },
];

const STORAGE_KEY = 'haptic-pattern-settings';
const PRESET_KEY = 'haptic-preset';

type PresetType = 'gentle' | 'normal' | 'strong' | 'custom';

interface Preset {
  id: PresetType;
  name: string;
  description: string;
  icon: React.ReactNode;
  globalIntensity: number;
  patternMultiplier: number;
  testPattern: HapticIntensity;
}

const presets: Preset[] = [
  {
    id: 'gentle',
    name: 'Gentle',
    description: 'Subtle, minimal feedback',
    icon: <Feather className="h-5 w-5" />,
    globalIntensity: 50,
    patternMultiplier: 0.5,
    testPattern: 'light' as HapticIntensity,
  },
  {
    id: 'normal',
    name: 'Normal',
    description: 'Balanced, standard feedback',
    icon: <Zap className="h-5 w-5" />,
    globalIntensity: 100,
    patternMultiplier: 1.0,
    testPattern: 'medium' as HapticIntensity,
  },
  {
    id: 'strong',
    name: 'Strong',
    description: 'Powerful, intense feedback',
    icon: <Flame className="h-5 w-5" />,
    globalIntensity: 175,
    patternMultiplier: 1.5,
    testPattern: 'heavy' as HapticIntensity,
  },
];

export default function HapticSettings() {
  const haptic = useHapticFeedback();
  const audioHaptic = useAudioHaptic();
  const { isPlaying, rhythmHaptics } = useMusicContext();
  const [globalIntensity, setGlobalIntensity] = useState(getHapticIntensity() * 100);
  const [patterns, setPatterns] = useState<PatternConfig[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultPatterns;
  });
  const [hapticEnabled, setHapticEnabled] = useState(getHapticIntensity() > 0);
  const [activePreset, setActivePreset] = useState<PresetType>(() => {
    const saved = localStorage.getItem(PRESET_KEY);
    return (saved as PresetType) || 'normal';
  });
  
  // Scroll boundary haptics settings
  const [scrollBoundarySettings, setScrollBoundarySettings] = useState(getScrollBoundarySettings);
  
  // Reorder haptics settings
  const [reorderSettings, setReorderSettings] = useState(getReorderHapticsSettings);

  // Save patterns to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }, [patterns]);

  // Save active preset
  useEffect(() => {
    localStorage.setItem(PRESET_KEY, activePreset);
  }, [activePreset]);

  // Update global intensity
  useEffect(() => {
    const intensity = hapticEnabled ? globalIntensity / 100 : 0;
    setHapticIntensity(intensity);
    localStorage.setItem('haptic-intensity', String(intensity));
  }, [globalIntensity, hapticEnabled]);

  // Load settings on mount
  useEffect(() => {
    const saved = localStorage.getItem('haptic-intensity');
    if (saved) {
      const savedValue = parseFloat(saved);
      setGlobalIntensity(savedValue * 100);
      setHapticEnabled(savedValue > 0);
    }
  }, []);

  const applyPreset = (preset: Preset) => {
    setActivePreset(preset.id);
    setGlobalIntensity(preset.globalIntensity);
    setPatterns(prev => prev.map(p => ({
      ...p,
      enabled: true,
      customMultiplier: preset.patternMultiplier,
    })));
    setHapticEnabled(true);
    haptic.trigger('success');
    toast.success(`${preset.name} preset applied`);
  };

  const previewPreset = (preset: Preset) => {
    // Temporarily apply preset intensity, trigger test pattern, then restore
    const originalIntensity = getHapticIntensity();
    setHapticIntensity(preset.globalIntensity / 100);
    triggerHaptic(preset.testPattern);
    // Restore after short delay
    setTimeout(() => setHapticIntensity(originalIntensity), 300);
    toast.success(`Previewing ${preset.name} feedback`);
  };

  const handleManualChange = () => {
    // When user manually changes settings, switch to custom preset
    if (activePreset !== 'custom') {
      setActivePreset('custom');
    }
  };

  const handlePatternToggle = (patternId: HapticIntensity) => {
    setPatterns(prev => prev.map(p => 
      p.id === patternId ? { ...p, enabled: !p.enabled } : p
    ));
    handleManualChange();
    haptic.trigger('selection');
  };

  const handlePatternMultiplier = (patternId: HapticIntensity, value: number[]) => {
    setPatterns(prev => prev.map(p => 
      p.id === patternId ? { ...p, customMultiplier: value[0] / 100 } : p
    ));
    handleManualChange();
  };

  const handlePreview = (patternId: HapticIntensity) => {
    const pattern = patterns.find(p => p.id === patternId);
    if (pattern && pattern.enabled) {
      // Temporarily apply the pattern's custom multiplier
      const originalIntensity = getHapticIntensity();
      setHapticIntensity(originalIntensity * pattern.customMultiplier);
      triggerHaptic(patternId);
      // Restore original intensity after a short delay
      setTimeout(() => setHapticIntensity(originalIntensity), 500);
      toast.success(`Previewing ${pattern.name} pattern`);
    } else {
      toast.error('Pattern is disabled');
    }
  };

  const handleResetDefaults = () => {
    setPatterns(defaultPatterns);
    setGlobalIntensity(100);
    setHapticEnabled(true);
    haptic.trigger('success');
    toast.success('Settings reset to defaults');
  };

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success('Settings refreshed');
  }, []);

  const getCategoryPatterns = (category: 'basic' | 'navigation' | 'feedback') =>
    patterns.filter(p => p.category === category);

  const [playingPatternId, setPlayingPatternId] = useState<HapticIntensity | null>(null);

  const PatternCard = ({ pattern }: { pattern: PatternConfig }) => {
    const isPlaying = playingPatternId === pattern.id;
    
    const handlePreviewWithVisualizer = () => {
      if (!pattern.enabled || !hapticEnabled) return;
      
      setPlayingPatternId(pattern.id);
      
      // Temporarily apply the pattern's custom multiplier
      const originalIntensity = getHapticIntensity();
      setHapticIntensity(originalIntensity * pattern.customMultiplier);
      
      // Trigger both haptic and audio (if enabled)
      audioHaptic.trigger(pattern.id);
      
      // Restore original intensity after a short delay
      setTimeout(() => setHapticIntensity(originalIntensity), 500);
    };
    
    return (
      <Card className={cn(
        "bg-card/50 border-border/50 transition-all duration-200",
        !pattern.enabled && "opacity-50"
      )}>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h4 className="font-medium text-foreground">{pattern.name}</h4>
              <p className="text-xs text-muted-foreground">{pattern.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviewWithVisualizer}
                disabled={!pattern.enabled || !hapticEnabled}
                className={cn(
                  "h-8 w-8 p-0 touch-manipulation",
                  isPlaying && "bg-primary/20 border-primary"
                )}
              >
                <Play className={cn(
                  "h-3.5 w-3.5 pointer-events-none",
                  isPlaying && "text-primary"
                )} />
              </Button>
              <Switch
                checked={pattern.enabled}
                onCheckedChange={() => handlePatternToggle(pattern.id)}
              />
            </div>
          </div>
          
          {/* Waveform Visualizer */}
          <HapticPatternVisualizer
            pattern={pattern.id}
            isPlaying={isPlaying}
            onPlayComplete={() => setPlayingPatternId(null)}
            size="sm"
            showLabel={false}
            intensityMultiplier={pattern.customMultiplier}
          />
          
          {pattern.enabled && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Intensity</span>
                <span className="text-foreground">{Math.round(pattern.customMultiplier * 100)}%</span>
              </div>
              <Slider
                value={[pattern.customMultiplier * 100]}
                onValueChange={(value) => handlePatternMultiplier(pattern.id, value)}
                min={25}
                max={200}
                step={5}
                disabled={!hapticEnabled}
                className="w-full"
              />
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <SEOHead
        title="Haptic Settings | Nexus Touch"
        description="Customize haptic feedback patterns and intensity for your device"
      />
      
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background pb-20 md:pb-8">
          <Navigation />
          
          <main className="container mx-auto px-4 pt-20 md:pt-24 max-w-4xl">
          {/* Back Button */}
          <div className="mb-4">
            <BackButton />
          </div>
          
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Vibrate className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Haptic Settings
              </h1>
            </div>
            <p className="text-muted-foreground">
              Customize haptic feedback patterns and intensity for your device
            </p>
          </div>

          {/* Device Info */}
          <Card className="mb-6 bg-card/50 border-border/50">
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  {haptic.isIOS ? (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  ) : haptic.isAndroid ? (
                    <TabletSmartphone className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Monitor className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {haptic.isIOS ? 'iOS Device' : haptic.isAndroid ? 'Android Device' : 'Desktop'}
                  </span>
                </div>
                <Badge variant={haptic.isSupported ? "default" : "secondary"}>
                  {haptic.isSupported ? 'Haptics Supported' : 'Haptics Not Supported'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Presets */}
          <Card className="mb-6 bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Quick Presets</CardTitle>
              <CardDescription>
                Apply a preset to configure all patterns at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {presets.map((preset) => (
                  <div key={preset.id} className="flex flex-col gap-2">
                    <button
                      onClick={() => applyPreset(preset)}
                      className={cn(
                        "relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-all duration-200",
                        "hover:scale-[1.02] active:scale-[0.98] touch-manipulation min-h-[100px]",
                        activePreset === preset.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "bg-card/50 border-border/50 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                      )}
                    >
                      <div className={cn(
                        "p-2 rounded-full transition-colors",
                        activePreset === preset.id ? "bg-primary/20" : "bg-muted/50"
                      )}>
                        {preset.icon}
                      </div>
                      <span className="font-medium text-sm">{preset.name}</span>
                      <span className="text-[10px] text-center opacity-75 hidden sm:block">
                        {preset.description}
                      </span>
                      {activePreset === preset.id && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </button>
                    {/* Preview Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => previewPreset(preset)}
                      className="h-8 text-xs gap-1.5 touch-manipulation"
                    >
                      <Play className="h-3 w-3" />
                      Preview
                    </Button>
                  </div>
                ))}
              </div>
              {activePreset === 'custom' && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Custom settings applied
                </p>
              )}
            </CardContent>
          </Card>

          {/* Global Controls */}
          <Card className="mb-6 bg-card/50 border-border/50">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Volume2 className="h-5 w-5" />
                Global Settings
              </CardTitle>
              <CardDescription>
                Master controls for all haptic feedback
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-foreground">Enable Haptic Feedback</h4>
                  <p className="text-xs text-muted-foreground">Toggle all haptic feedback on or off</p>
                </div>
                <Switch
                  checked={hapticEnabled}
                  onCheckedChange={(checked) => {
                    setHapticEnabled(checked);
                    if (checked) haptic.trigger('success');
                  }}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-foreground">Global Intensity</span>
                  <span className="text-sm font-medium text-primary">
                    {hapticEnabled ? `${Math.round(globalIntensity)}%` : 'Off'}
                  </span>
                </div>
                <Slider
                  value={[globalIntensity]}
                  onValueChange={(value) => {
                    setGlobalIntensity(value[0]);
                    if (value[0] > 0) haptic.trigger('selection');
                  }}
                  min={0}
                  max={200}
                  step={10}
                  disabled={!hapticEnabled}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Adjust from 0% (off) to 200% (extra strong)
                </p>
              </div>

              <Separator />

              {/* Audio-Haptic Sync Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-neon-magenta" />
                    <div>
                      <h4 className="font-medium text-foreground">Audio-Haptic Sync</h4>
                      <p className="text-xs text-muted-foreground">Play sounds with haptic patterns</p>
                    </div>
                  </div>
                  <Switch
                    checked={audioHaptic.audioEnabled}
                    onCheckedChange={(checked) => {
                      audioHaptic.setAudioEnabled(checked);
                      if (checked) {
                        audioHaptic.preview('success');
                      }
                      toast.success(checked ? 'Audio-haptic sync enabled' : 'Audio-haptic sync disabled');
                    }}
                  />
                </div>

                {audioHaptic.audioEnabled && (
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Audio Volume</span>
                      <span className="text-sm font-medium text-neon-magenta">
                        {Math.round(audioHaptic.audioVolume * 100)}%
                      </span>
                    </div>
                    <Slider
                      value={[audioHaptic.audioVolume * 100]}
                      onValueChange={(value) => {
                        audioHaptic.setAudioVolume(value[0] / 100);
                      }}
                      min={10}
                      max={100}
                      step={5}
                      className="w-full"
                    />
                    
                    {/* Quick audio test buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => audioHaptic.preview('button-press', { audioOnly: true })}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Tap
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => audioHaptic.preview('success', { audioOnly: true })}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Success
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => audioHaptic.preview('achievement', { audioOnly: true })}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Achievement
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Rhythm Haptics Section */}
              <RhythmHapticsPanel
                currentBeat={rhythmHaptics.currentBeat}
                bpm={rhythmHaptics.bpm}
                isPlaying={isPlaying}
              />

              <Separator />

              {/* Scroll Boundary Haptics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ScrollText className="h-4 w-4 text-cyan-400" />
                    <div>
                      <h4 className="font-medium text-foreground">Scroll Boundary Haptics</h4>
                      <p className="text-xs text-muted-foreground">Rubber band effect at scroll limits</p>
                    </div>
                  </div>
                  <Switch
                    checked={scrollBoundarySettings.enabled}
                    onCheckedChange={(checked) => {
                      const newSettings = saveScrollBoundarySettings({ enabled: checked });
                      setScrollBoundarySettings(newSettings);
                      if (checked) triggerHaptic('light');
                      toast.success(checked ? 'Scroll haptics enabled' : 'Scroll haptics disabled');
                    }}
                  />
                </div>

                {scrollBoundarySettings.enabled && (
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm text-muted-foreground">Intensity</Label>
                      <div className="flex gap-1">
                        {(['light', 'medium', 'heavy'] as const).map((intensity) => (
                          <Button
                            key={intensity}
                            variant={scrollBoundarySettings.intensity === intensity ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => {
                              const newSettings = saveScrollBoundarySettings({ intensity });
                              setScrollBoundarySettings(newSettings);
                              triggerHaptic(intensity);
                            }}
                            className="h-7 text-xs capitalize"
                          >
                            {intensity}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Reorder Haptics */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 text-orange-400" />
                    <div>
                      <h4 className="font-medium text-foreground">Drag & Reorder Haptics</h4>
                      <p className="text-xs text-muted-foreground">Feedback for list reordering</p>
                    </div>
                  </div>
                  <Switch
                    checked={reorderSettings.enabled}
                    onCheckedChange={(checked) => {
                      const newSettings = saveReorderHapticsSettings({ enabled: checked });
                      setReorderSettings(newSettings);
                      if (checked) triggerHaptic('medium');
                      toast.success(checked ? 'Reorder haptics enabled' : 'Reorder haptics disabled');
                    }}
                  />
                </div>

                {reorderSettings.enabled && (
                  <div className="space-y-3 pl-6">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerHaptic(reorderSettings.pickupIntensity ?? 'medium')}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Pickup
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerHaptic(reorderSettings.moveIntensity ?? 'light')}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Move
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerHaptic(reorderSettings.dropIntensity ?? 'success')}
                        className="h-7 text-xs gap-1"
                      >
                        <Play className="h-3 w-3" /> Drop
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDefaults}
                >
                  Reset to Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Basic Patterns */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Basic Patterns</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Fundamental feedback for common interactions
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {getCategoryPatterns('basic').map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </div>

          {/* Navigation Patterns */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Navigation Patterns</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Feedback for navigation and gesture interactions
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {getCategoryPatterns('navigation').map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </div>

          {/* Feedback Patterns */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground mb-3">Status Patterns</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Feedback for status updates and notifications
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {getCategoryPatterns('feedback').map(pattern => (
                <PatternCard key={pattern.id} pattern={pattern} />
              ))}
            </div>
          </div>

          {/* Tips Section */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <h4 className="font-medium text-foreground mb-2">💡 Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Use the Preview button to test each pattern</li>
                <li>• Reduce intensity if haptics feel too strong</li>
                <li>• iOS devices have limited pattern support</li>
                <li>• Desktop browsers may not support haptics</li>
              </ul>
            </CardContent>
          </Card>
        </main>

        <MobileBottomNav />
      </div>
      </PullToRefresh>
    </>
  );
}

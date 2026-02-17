import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { HapticIntensity } from '@/hooks/useHapticFeedback';

// Pattern definitions matching useHapticFeedback.ts
const hapticPatterns: Record<HapticIntensity, number | number[]> = {
  light: 15,
  medium: 35,
  heavy: 60,
  success: [15, 60, 25, 60, 15],
  warning: [40, 60, 40, 60, 40],
  error: [60, 40, 60, 40, 60, 40, 60],
  selection: 8,
  navigation: [20, 30, 20],
  'button-press': 25,
  swipe: [10, 20, 10],
  'long-press': [30, 50, 30, 50],
  'double-tap': [15, 30, 15],
  'tour-step': [20, 40, 20, 40, 20],
  achievement: [20, 50, 30, 50, 40, 50, 30],
};

interface HapticPatternVisualizerProps {
  pattern: HapticIntensity;
  isPlaying?: boolean;
  onPlayComplete?: () => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
  intensityMultiplier?: number;
}

export function HapticPatternVisualizer({
  pattern,
  isPlaying = false,
  onPlayComplete,
  size = 'md',
  className,
  showLabel = true,
  intensityMultiplier = 1,
}: HapticPatternVisualizerProps) {
  const [activeSegment, setActiveSegment] = useState<number>(-1);
  const [isAnimating, setIsAnimating] = useState(false);

  const patternData = hapticPatterns[pattern];
  
  // Convert pattern to segments array
  const segments = typeof patternData === 'number' 
    ? [{ duration: patternData, isVibration: true }]
    : patternData.map((duration, index) => ({
        duration,
        isVibration: index % 2 === 0, // Even indices are vibrations, odd are pauses
      }));

  const totalDuration = segments.reduce((acc, seg) => acc + seg.duration, 0);

  // Animate through segments when playing
  useEffect(() => {
    if (!isPlaying || isAnimating) return;

    setIsAnimating(true);
    setActiveSegment(0);

    let currentIndex = 0;
    let timeoutId: NodeJS.Timeout;

    const playNextSegment = () => {
      if (currentIndex >= segments.length) {
        setActiveSegment(-1);
        setIsAnimating(false);
        onPlayComplete?.();
        return;
      }

      setActiveSegment(currentIndex);
      const duration = segments[currentIndex].duration * intensityMultiplier;
      
      timeoutId = setTimeout(() => {
        currentIndex++;
        playNextSegment();
      }, duration);
    };

    playNextSegment();

    return () => {
      clearTimeout(timeoutId);
      setActiveSegment(-1);
      setIsAnimating(false);
    };
  }, [isPlaying, segments, intensityMultiplier, onPlayComplete]);

  const sizeConfig = {
    sm: { height: 24, barWidth: 3, gap: 1, labelSize: 'text-[8px]' },
    md: { height: 40, barWidth: 5, gap: 2, labelSize: 'text-[10px]' },
    lg: { height: 60, barWidth: 8, gap: 3, labelSize: 'text-xs' },
  }[size];

  // Generate bars for visualization
  const generateBars = () => {
    const bars: { height: number; isVibration: boolean; segmentIndex: number }[] = [];
    
    segments.forEach((segment, segmentIndex) => {
      // Calculate number of bars based on duration
      const numBars = Math.max(1, Math.ceil(segment.duration / 10));
      
      for (let i = 0; i < numBars; i++) {
        if (segment.isVibration) {
          // Create wave pattern for vibration
          const progress = i / (numBars - 1 || 1);
          const waveHeight = Math.sin(progress * Math.PI) * 0.8 + 0.2;
          bars.push({
            height: waveHeight * intensityMultiplier,
            isVibration: true,
            segmentIndex,
          });
        } else {
          // Flat line for pause
          bars.push({
            height: 0.05,
            isVibration: false,
            segmentIndex,
          });
        }
      }
    });
    
    return bars;
  };

  const bars = generateBars();

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between">
          <span className={cn("text-muted-foreground font-medium", sizeConfig.labelSize)}>
            {pattern.replace('-', ' ').toUpperCase()}
          </span>
          <span className={cn("text-muted-foreground/60", sizeConfig.labelSize)}>
            {totalDuration}ms
          </span>
        </div>
      )}
      
      <div 
        className="flex items-end justify-center bg-background/50 rounded-md p-2 overflow-hidden"
        style={{ height: sizeConfig.height + 16 }}
      >
        {bars.map((bar, index) => {
          const isActive = activeSegment === bar.segmentIndex && isAnimating;
          
          return (
            <motion.div
              key={index}
              className={cn(
                "rounded-full transition-colors duration-100",
                bar.isVibration 
                  ? isActive 
                    ? "bg-primary shadow-[0_0_8px_hsl(var(--primary))]" 
                    : "bg-primary/40"
                  : "bg-muted/30"
              )}
              style={{
                width: sizeConfig.barWidth,
                marginLeft: index === 0 ? 0 : sizeConfig.gap,
              }}
              initial={{ height: 2 }}
              animate={{
                height: bar.height * sizeConfig.height,
                scale: isActive && bar.isVibration ? [1, 1.2, 1] : 1,
              }}
              transition={{
                height: { duration: 0.2 },
                scale: { duration: 0.15, repeat: isActive ? Infinity : 0 },
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

// Compact inline visualizer for use in lists
export function HapticPatternBadge({
  pattern,
  isPlaying = false,
  className,
}: {
  pattern: HapticIntensity;
  isPlaying?: boolean;
  className?: string;
}) {
  const patternData = hapticPatterns[pattern];
  const segments = typeof patternData === 'number' 
    ? [{ duration: patternData, isVibration: true }]
    : patternData.map((duration, index) => ({
        duration,
        isVibration: index % 2 === 0,
      }));

  return (
    <div className={cn(
      "flex items-center gap-0.5 px-2 py-1 rounded-full bg-muted/30",
      className
    )}>
      {segments.map((segment, index) => (
        <motion.div
          key={index}
          className={cn(
            "rounded-full",
            segment.isVibration 
              ? isPlaying ? "bg-primary" : "bg-primary/50"
              : "bg-muted/50"
          )}
          style={{
            width: Math.max(2, segment.duration / 15),
            height: segment.isVibration ? 8 : 2,
          }}
          animate={isPlaying && segment.isVibration ? {
            scaleY: [1, 1.5, 1],
          } : {}}
          transition={{
            duration: 0.3,
            repeat: isPlaying ? Infinity : 0,
            delay: index * 0.1,
          }}
        />
      ))}
    </div>
  );
}

// Full pattern gallery component
export function HapticPatternGallery({
  onPatternSelect,
  selectedPattern,
}: {
  onPatternSelect?: (pattern: HapticIntensity) => void;
  selectedPattern?: HapticIntensity;
}) {
  const [playingPattern, setPlayingPattern] = useState<HapticIntensity | null>(null);

  const patterns = Object.keys(hapticPatterns) as HapticIntensity[];

  const handlePlay = (pattern: HapticIntensity) => {
    setPlayingPattern(pattern);
    onPatternSelect?.(pattern);
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {patterns.map((pattern) => (
        <button
          key={pattern}
          onPointerDown={(e) => {
            if (e.pointerType === "touch") {
              e.preventDefault();
              handlePlay(pattern);
            }
          }}
          onClick={(e) => {
            if (e.detail === 0) return;
            handlePlay(pattern);
          }}
          className={cn(
            "p-3 rounded-lg border transition-all touch-manipulation min-h-[60px]",
            "hover:border-primary/50 active:scale-[0.98]",
            selectedPattern === pattern 
              ? "bg-primary/10 border-primary" 
              : "bg-card/50 border-border/50"
          )}
        >
          <HapticPatternVisualizer
            pattern={pattern}
            isPlaying={playingPattern === pattern}
            onPlayComplete={() => setPlayingPattern(null)}
            size="sm"
          />
        </button>
      ))}
    </div>
  );
}

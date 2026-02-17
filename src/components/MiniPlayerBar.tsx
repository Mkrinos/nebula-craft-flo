import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack, X } from 'lucide-react';
import { useMusicContext } from '@/contexts/MusicContext';
import { AudioVisualizer, AnimatedVisualizer, VisualizerModeToggle } from '@/components/AudioVisualizer';
import { BeatIndicator } from '@/components/RhythmHapticsPanel';
import { getRhythmHapticSettings } from '@/hooks/useRhythmHaptics';
import { cn } from '@/lib/utils';

export const MiniPlayerBar: React.FC = () => {
  const {
    isPlaying,
    currentTrack,
    progress,
    togglePlay,
    playNext,
    playPrevious,
    pause,
    audioRef,
    visualizerMode,
    setVisualizerMode,
    rhythmHaptics,
  } = useMusicContext();

  const [useWebAudio, setUseWebAudio] = useState(true);
  const rhythmSettings = getRhythmHapticSettings();

  // Check if Web Audio API is available
  useEffect(() => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    setUseWebAudio(!!AudioContextClass);
  }, []);

  // Only show when there's a current track
  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          "fixed bottom-16 md:bottom-4 left-4 right-20 md:right-24 z-40",
          "bg-background/90 backdrop-blur-xl border border-primary/30",
          "rounded-xl shadow-lg shadow-primary/10",
          "overflow-hidden"
        )}
      >
        {/* Progress bar at top */}
        <div className="h-0.5 bg-muted w-full">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-violet-500"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>

        <div className="flex items-center gap-2 p-2 md:p-3">
          {/* Audio Visualizer with mode toggle */}
          <div 
            className="w-10 h-10 md:w-12 md:h-12 min-h-[44px] min-w-[44px] rounded-lg bg-primary/10 shrink-0 relative overflow-hidden p-1 cursor-pointer touch-manipulation active:scale-95 transition-transform"
            onPointerDown={(e) => {
              if (e.pointerType === "touch") {
                e.preventDefault();
                const modes: ('bars' | 'wave' | 'circular')[] = ['bars', 'wave', 'circular'];
                const currentIndex = modes.indexOf(visualizerMode);
                setVisualizerMode(modes[(currentIndex + 1) % modes.length]);
              }
            }}
            onClick={(e) => {
              if (e.detail === 0) return;
              const modes: ('bars' | 'wave' | 'circular')[] = ['bars', 'wave', 'circular'];
              const currentIndex = modes.indexOf(visualizerMode);
              setVisualizerMode(modes[(currentIndex + 1) % modes.length]);
            }}
            title="Click to change visualizer mode"
          >
            {useWebAudio ? (
              <AudioVisualizer
                audioRef={audioRef}
                isPlaying={isPlaying}
                mode={visualizerMode}
                barCount={8}
                className="w-full h-full"
              />
            ) : (
              <AnimatedVisualizer
                isPlaying={isPlaying}
                mode={visualizerMode}
                barCount={8}
                className="w-full h-full"
              />
            )}
            {/* Subtle glow effect when playing */}
            {isPlaying && (
              <motion.div
                className="absolute inset-0 rounded-lg pointer-events-none"
                animate={{ 
                  boxShadow: [
                    'inset 0 0 10px hsl(var(--primary) / 0.2)',
                    'inset 0 0 15px hsl(var(--primary) / 0.4)',
                    'inset 0 0 10px hsl(var(--primary) / 0.2)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>

          {/* Track info */}
          <div className="flex-1 min-w-0 mr-2">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate text-foreground">
                {currentTrack.title}
              </p>
              {/* Beat indicator when rhythm haptics enabled */}
              <BeatIndicator
                isBeat={rhythmHaptics.currentBeat?.isBeat}
                energy={rhythmHaptics.currentBeat?.energy ?? 0}
                enabled={rhythmSettings.enabled && isPlaying}
              />
              {rhythmHaptics.bpm && rhythmSettings.enabled && isPlaying && (
                <span className="text-[10px] font-mono text-primary/70">{rhythmHaptics.bpm}</span>
              )}
            </div>
            {currentTrack.artist && (
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Previous - hidden on mobile */}
            <button
              onClick={playPrevious}
              className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center active:scale-90"
              aria-label="Previous track"
            >
              <SkipBack className="w-4 h-4 pointer-events-none" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className={cn(
                "p-2 rounded-full transition-all touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90",
                isPlaying 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-primary/20 text-primary hover:bg-primary/30"
              )}
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
              ) : (
                <Play className="w-4 h-4 md:w-5 md:h-5 pointer-events-none" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={playNext}
              className="p-2 text-muted-foreground hover:text-foreground transition-colors touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90"
              aria-label="Next track"
            >
              <SkipForward className="w-4 h-4 pointer-events-none" />
            </button>

            {/* Close/Stop - hidden on mobile */}
            <button
              onClick={pause}
              className="hidden md:flex p-2 text-muted-foreground hover:text-destructive transition-colors touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center active:scale-90"
              aria-label="Stop"
            >
              <X className="w-4 h-4 pointer-events-none" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

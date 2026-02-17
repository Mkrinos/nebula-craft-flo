import { useState, useCallback } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusic } from '@/contexts/MusicContext';
import { AudioVisualizer } from './AudioVisualizer';

type VisualizerMode = 'bars' | 'wave' | 'circular';

export function MiniPlayerBar() {
  const {
    isPlaying,
    currentTrack,
    toggle,
    next,
    previous,
    analyserNode,
  } = useMusic();

  const [vizMode, setVizMode] = useState<VisualizerMode>(() => {
    return (localStorage.getItem('nexus-viz-mode') as VisualizerMode) || 'bars';
  });

  const cycleVizMode = useCallback(() => {
    const modes: VisualizerMode[] = ['bars', 'wave', 'circular'];
    setVizMode((prev) => {
      const next = modes[(modes.indexOf(prev) + 1) % modes.length];
      localStorage.setItem('nexus-viz-mode', next);
      return next;
    });
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(10);
  }, []);

  const handleToggle = useCallback(() => {
    if (navigator.vibrate) navigator.vibrate(15);
    toggle();
  }, [toggle]);

  if (!currentTrack) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 80 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom"
      >
        <div className="mx-2 mb-2 rounded-xl border border-border bg-card/95 backdrop-blur-xl shadow-lg px-3 py-2 flex items-center gap-3">
          {/* Visualizer - tappable to cycle modes */}
          <button
            onClick={cycleVizMode}
            className="shrink-0 rounded-lg overflow-hidden touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Toggle visualizer mode"
          >
            <AudioVisualizer
              analyserNode={analyserNode}
              isPlaying={isPlaying}
              mode={vizMode}
            />
          </button>

          {/* Track info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {currentTrack.title}
            </p>
            {currentTrack.artist && (
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist}
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={previous}
              className="w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-95 touch-manipulation transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={18} />
            </button>
            <button
              onClick={handleToggle}
              className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground active:scale-95 touch-manipulation transition-transform"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button
              onClick={next}
              className="w-11 h-11 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground active:scale-95 touch-manipulation transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMusicContext } from '@/contexts/MusicContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import { Pause } from 'lucide-react';

interface MusicPlayingIndicatorProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const MusicPlayingIndicator: React.FC<MusicPlayingIndicatorProps> = ({ 
  className,
  size = 'sm' 
}) => {
  const { isPlaying, currentTrack, togglePlay } = useMusicContext();
  const haptic = useHapticFeedback();

  // Only show when there's a current track
  if (!currentTrack) return null;

  const barCount = size === 'sm' ? 3 : 4;
  const barWidth = size === 'sm' ? 2 : 3;
  const barGap = size === 'sm' ? 1 : 1.5;
  const containerSize = size === 'sm' ? 20 : 24;

  const handleClick = () => {
    haptic.trigger('selection');
    togglePlay();
  };

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={handleClick}
      className={cn(
        "flex items-center justify-center rounded-full transition-all duration-150",
        "hover:bg-primary/20 active:scale-90 touch-manipulation",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        className
      )}
      style={{ 
        width: containerSize, 
        height: containerSize,
      }}
      title={isPlaying ? `Pause: ${currentTrack.title}` : `Play: ${currentTrack.title}`}
      aria-label={isPlaying ? 'Pause music' : 'Resume music'}
    >
      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.div
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-end justify-center"
            style={{ gap: barGap, height: size === 'sm' ? 12 : 16 }}
          >
            {Array.from({ length: barCount }).map((_, i) => (
              <motion.div
                key={i}
                className="bg-primary rounded-full"
                style={{ width: barWidth }}
                animate={{
                  height: [
                    size === 'sm' ? 3 : 4,
                    size === 'sm' ? 10 : 14,
                    size === 'sm' ? 5 : 7,
                    size === 'sm' ? 8 : 11,
                    size === 'sm' ? 3 : 4,
                  ],
                }}
                transition={{
                  duration: 0.8 + i * 0.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="paused"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <Pause className={cn(
              "text-muted-foreground",
              size === 'sm' ? "w-3 h-3" : "w-4 h-4"
            )} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
};

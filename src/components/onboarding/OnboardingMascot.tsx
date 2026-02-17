import { motion, AnimatePresence } from 'framer-motion';
import { useGlobalPersona } from '@/contexts/GlobalPersonaContext';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { cn } from '@/lib/utils';

interface OnboardingMascotProps {
  message: string;
  isVisible: boolean;
  position?: 'left' | 'right' | 'center';
  emotion?: 'happy' | 'excited' | 'thinking' | 'waving';
}

export function OnboardingMascot({ 
  message, 
  isVisible, 
  position = 'left',
  emotion = 'happy'
}: OnboardingMascotProps) {
  const { persona } = useGlobalPersona();
  const { playSound } = useSoundEffects();
  const { isMobile, isTablet } = useDeviceDetection();
  const prevVisibleRef = useRef(isVisible);
  const prevMessageRef = useRef(message);

  const isSmallScreen = isMobile || isTablet;

  // Play sounds on visibility and message changes
  useEffect(() => {
    if (isVisible && !prevVisibleRef.current) {
      playSound('mascotAppear');
    }
    prevVisibleRef.current = isVisible;
  }, [isVisible, playSound]);

  useEffect(() => {
    if (isVisible && message !== prevMessageRef.current && prevMessageRef.current) {
      playSound('pop');
    }
    prevMessageRef.current = message;
  }, [message, isVisible, playSound]);

  const emotionAnimations = {
    happy: {
      scale: [1, 1.05, 1],
      y: [0, -3, 0],
    },
    excited: {
      scale: [1, 1.15, 0.95, 1.1, 1],
      rotate: [0, 5, -5, 3, 0],
      y: [0, -10, 0],
    },
    thinking: {
      rotate: [0, 3, 0, -3, 0],
    },
    waving: {
      rotate: [0, 10, -10, 10, 0],
      x: [0, 5, -5, 5, 0],
    }
  };

  // Responsive position classes
  const getPositionClasses = () => {
    if (isSmallScreen) {
      // On mobile/tablet, always position at bottom with safe area padding
      return cn(
        'left-2 right-2 sm:left-4 sm:right-auto',
        'bottom-32 sm:bottom-28' // Account for mobile nav
      );
    }
    
    // Desktop positioning
    const positionMap = {
      left: 'left-4',
      right: 'right-4',
      center: 'left-1/2 -translate-x-1/2'
    };
    return cn(positionMap[position], 'bottom-24');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className={cn('fixed z-50', getPositionClasses())}
        >
          <div className={cn(
            "flex items-end gap-2 sm:gap-3",
            isSmallScreen && "flex-col items-center sm:flex-row sm:items-end"
          )}>
            {/* Mascot Avatar - responsive sizing */}
            <motion.div
              animate={emotionAnimations[emotion]}
              transition={{ 
                duration: emotion === 'excited' ? 0.8 : 1.5, 
                repeat: emotion === 'waving' ? 2 : 0 
              }}
              className="relative flex-shrink-0"
            >
              <div className={cn(
                "rounded-full bg-gradient-to-br from-neon-cyan to-primary border-2 border-neon-cyan shadow-lg shadow-neon-cyan/30 overflow-hidden",
                "w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16"
              )}>
                {persona?.avatar_url ? (
                  <img 
                    src={persona.avatar_url} 
                    alt={persona.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                  </div>
                )}
              </div>
              
              {/* Glow effect */}
              <div className="absolute inset-0 rounded-full bg-neon-cyan/20 blur-md -z-10" />
              
              {/* Emotion indicator */}
              {emotion === 'excited' && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.5 }}
                  className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-accent rounded-full flex items-center justify-center"
                >
                  <span className="text-[8px] sm:text-[10px]">!</span>
                </motion.div>
              )}
            </motion.div>

            {/* Speech Bubble - responsive sizing */}
            <motion.div
              initial={{ opacity: 0, x: isSmallScreen ? 0 : -20, y: isSmallScreen ? -20 : 0 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full sm:w-auto"
            >
              <SciFiFrame 
                glowIntensity="subtle"
                className={cn(
                  "relative",
                  "p-3 sm:p-4",
                  "max-w-full sm:max-w-xs md:max-w-sm"
                )}
              >
                {/* Speech bubble pointer - hidden on very small screens */}
                <div 
                  className={cn(
                    "absolute w-3 h-3 bg-space-dark border-neon-cyan/30 transform rotate-45",
                    isSmallScreen 
                      ? "hidden sm:block left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 border-l border-t"
                      : "left-0 bottom-4 -translate-x-1/2 border-l border-b"
                  )}
                />
                
                <p className="text-xs sm:text-sm text-foreground leading-relaxed">
                  {persona?.name && (
                    <span className="text-neon-cyan font-display font-semibold">
                      {persona.name}:{' '}
                    </span>
                  )}
                  {message}
                </p>
              </SciFiFrame>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useGlobalPersona, PersonaBehaviorState } from '@/contexts/GlobalPersonaContext';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { useLocation } from 'react-router-dom';

interface GlobalPersonaCompanionProps {
  position?: 'header' | 'sidebar' | 'floating';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

// Get animation based on behavioral state
const getAnimationForState = (state: PersonaBehaviorState, reducedMotion: boolean): { [key: string]: number | number[] } => {
  if (reducedMotion) {
    return { opacity: state === 'navigate' ? 0.8 : 1 };
  }

  const animations: Record<PersonaBehaviorState, { [key: string]: number | number[] }> = {
    idle: { scale: 1.02 },
    greet: { scale: 1.15, y: -12 },
    navigate: { x: 0, opacity: 0.9 },
    react: { scale: 1.1 },
    speaking: { scale: 1.03 },
    listening: { scale: 1.05 },
    thinking: { opacity: 0.7, scale: 0.98 },
  };

  return animations[state] || animations.idle;
};

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
};

export default function GlobalPersonaCompanion({
  position = 'header',
  size = 'md',
  className,
}: GlobalPersonaCompanionProps) {
  const { persona, behaviorState, triggerNavigate, showInHeader, showInSidebar } = useGlobalPersona();
  const { settings, shouldAnimate } = useMotionSettings();
  const location = useLocation();
  const [isHovered, setIsHovered] = useState(false);

  // Trigger navigate animation on route change
  useEffect(() => {
    triggerNavigate();
  }, [location.pathname, triggerNavigate]);

  // Don't render if no persona or hidden for this position
  if (!persona?.avatar_url) return null;
  if (position === 'header' && !showInHeader) return null;
  if (position === 'sidebar' && !showInSidebar) return null;

  const currentAnimation = getAnimationForState(behaviorState, settings.reducedMotion);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        className={cn('relative group cursor-pointer touch-manipulation', className)}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileTap={{ scale: 0.95 }}
      >
        {/* Glow effect */}
        {shouldAnimate('glow') && (
          <motion.div
            className="absolute inset-0 rounded-full bg-neon-cyan/30 blur-md"
            animate={{
              opacity: isHovered ? [0.5, 0.8, 0.5] : [0.2, 0.4, 0.2],
              scale: isHovered ? 1.2 : 1.1,
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Main avatar container */}
        <motion.div
          className={cn(
            sizeClasses[size],
            'relative rounded-full overflow-hidden ring-2 ring-neon-cyan/50 bg-space-elevated'
          )}
          animate={currentAnimation}
          transition={{ duration: behaviorState === 'idle' ? 3 : 0.6, repeat: behaviorState === 'idle' ? Infinity : 0 }}
        >
          <img
            src={persona.avatar_url}
            alt={persona.name}
            className="w-full h-full object-cover"
          />

          {/* State indicator overlay */}
          {behaviorState === 'speaking' && (
            <motion.div
              className="absolute inset-0 bg-neon-cyan/20"
              animate={{ opacity: [0, 0.3, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          )}
          
          {behaviorState === 'thinking' && (
            <motion.div
              className="absolute inset-0 bg-primary/20"
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}

          {/* Shimmer effect */}
          {shouldAnimate('transitions') && (
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            />
          )}
        </motion.div>

        {/* Orbiting ring */}
        {shouldAnimate('particles') && (
          <motion.div
            className="absolute inset-[-4px] rounded-full border border-dashed border-neon-cyan/30 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
        )}

        {/* Status dot */}
        <motion.div
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-space-dark',
            behaviorState === 'idle' ? 'bg-green-500' :
            behaviorState === 'speaking' ? 'bg-neon-cyan' :
            behaviorState === 'listening' ? 'bg-yellow-500' :
            behaviorState === 'thinking' ? 'bg-primary' :
            'bg-neon-cyan'
          )}
          animate={shouldAnimate('glow') ? {
            boxShadow: ['0 0 0px currentColor', '0 0 8px currentColor', '0 0 0px currentColor'],
          } : undefined}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Hover tooltip */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-space-elevated border border-neon-cyan/30 rounded text-xs text-foreground whitespace-nowrap z-50"
            >
              {persona.name}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

import { useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { Lock, Unlock, Sparkles, Star, Wand2, User, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GlassCard from '@/components/GlassCard';
import AnimatedPersonaAvatar from '@/components/AnimatedPersonaAvatar';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';
import type { Persona } from '@/hooks/usePersonas';

interface PersonaCardProps {
  persona: Persona;
  isUnlocked: boolean;
  canUnlock: boolean;
  isSelected?: boolean;
  onUnlock: () => void;
  onUse: () => void;
  onSetAsProfile?: () => void;
  onGenerateAvatar: () => void;
  isGeneratingAvatar: boolean;
}

const SWIPE_THRESHOLD = 80;

export default function PersonaCard({
  persona,
  isUnlocked,
  canUnlock,
  isSelected = false,
  onUnlock,
  onUse,
  onSetAsProfile,
  onGenerateAvatar,
  isGeneratingAvatar
}: PersonaCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const haptic = useHapticFeedback();
  
  // Motion values for swipe gesture
  const x = useMotionValue(0);
  const opacity = useTransform(x, [0, SWIPE_THRESHOLD], [1, 0]);
  const unlockProgress = useTransform(x, [0, SWIPE_THRESHOLD], [0, 100]);
  const scale = useTransform(x, [0, SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD], [1, 1.02, 1.05]);
  
  // Swipe gesture handler for locked personas
  const bind = useDrag(
    ({ movement: [mx], down, cancel }) => {
      // Only allow swipe on locked personas that can be unlocked
      if (isUnlocked || !canUnlock) {
        x.set(0);
        return;
      }
      
      // Limit swipe to positive direction only (right swipe)
      const clampedX = Math.max(0, Math.min(mx, SWIPE_THRESHOLD + 20));
      
      if (down) {
        x.set(clampedX);
        setShowSwipeHint(false);
        // Light haptic at halfway point
        if (clampedX >= SWIPE_THRESHOLD / 2 && clampedX < SWIPE_THRESHOLD / 2 + 5) {
          haptic.trigger('light');
        }
      } else {
        // Check if swipe exceeded threshold
        if (clampedX >= SWIPE_THRESHOLD) {
          // Trigger success haptic feedback
          haptic.trigger('success');
          // Trigger unlock
          onUnlock();
          x.set(0);
        } else {
          // Snap back with light haptic
          haptic.trigger('light');
          x.set(0);
        }
      }
    },
    { 
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true }
    }
  );

  const handleUnlockClick = () => {
    haptic.trigger('medium');
    onUnlock();
  };

  const handleUseClick = () => {
    haptic.trigger('selection');
    onUse();
  };

  const handleSetProfileClick = () => {
    haptic.trigger('selection');
    onSetAsProfile?.();
  };

  const handleGenerateAvatarClick = () => {
    haptic.trigger('medium');
    onGenerateAvatar();
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="relative touch-pan-y"
    >
      {/* Unlock reveal background for locked cards */}
      {!isUnlocked && canUnlock && (
        <div className="absolute inset-0 rounded-xl overflow-hidden">
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-primary/20 via-neon-cyan/30 to-primary/20 flex items-center justify-end pr-4"
            style={{ opacity: useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]) }}
          >
            <motion.div
              className="flex items-center gap-2 text-neon-cyan"
              style={{ opacity: useTransform(x, [SWIPE_THRESHOLD / 2, SWIPE_THRESHOLD], [0, 1]) }}
            >
              <Unlock className="w-5 h-5" />
              <span className="text-sm font-display uppercase tracking-wider">Unlocking...</span>
            </motion.div>
          </motion.div>
        </div>
      )}

      <div 
        {...(!isUnlocked && canUnlock ? bind() : {})}
        className="relative touch-none"
      >
        <motion.div style={{ x, scale }}>
        <GlassCard 
          hover 
          className={cn(
            "p-3 sm:p-6 relative overflow-hidden transition-all duration-300",
            !isUnlocked && "opacity-80",
            isSelected && "ring-2 ring-primary"
          )}
        >
          {/* Lock overlay for locked personas */}
          {!isUnlocked && (
            <motion.div 
              className="absolute inset-0 bg-background/40 backdrop-blur-[2px] z-10 flex items-center justify-center"
              style={{ opacity }}
            >
              <div className="text-center px-2">
                <motion.div
                  animate={isHovered ? { scale: 1.1, rotate: [0, -10, 10, 0] } : {}}
                  transition={{ duration: 0.3 }}
                  className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-3 rounded-full bg-secondary/50 flex items-center justify-center"
                >
                  <Lock className="w-5 h-5 sm:w-8 sm:h-8 text-muted-foreground" />
                </motion.div>
                <p className="text-xs sm:text-sm font-medium text-foreground mb-1">
                  {persona.credits_to_unlock} credits
                </p>
                
                {/* Swipe hint for mobile - only show for unlockable personas */}
                {canUnlock && (
                  <>
                    <AnimatePresence>
                      {showSwipeHint && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="sm:hidden flex items-center justify-center gap-1 text-[10px] text-neon-cyan mt-2 mb-1"
                        >
                          <motion.div
                            animate={{ x: [0, 8, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                            className="flex items-center gap-0.5"
                          >
                            <span>Swipe to unlock</span>
                            <ChevronRight className="w-3 h-3" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    
                    {/* Desktop button */}
                    <Button 
                      variant="neon" 
                      size="sm" 
                      onClick={handleUnlockClick}
                      className="mt-1 sm:mt-2 gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8 px-2 sm:px-3 hidden sm:inline-flex"
                    >
                      <Unlock className="w-3 h-3 sm:w-4 sm:h-4" />
                      Unlock
                    </Button>
                    
                    {/* Mobile tap fallback */}
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleUnlockClick}
                      className="sm:hidden mt-1 text-[10px] text-muted-foreground h-6 px-2"
                    >
                      or tap here
                    </Button>
                  </>
                )}
                
                {!canUnlock && (
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Earn more credits
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Animated avatar container */}
          <div className="flex items-start justify-between mb-2 sm:mb-4">
            <div className="relative">
              {persona.avatar_url ? (
                <AnimatedPersonaAvatar
                  avatarUrl={persona.avatar_url}
                  personaName={persona.name}
                  personaStyle={persona.style}
                  size="md"
                  animate={isUnlocked && isHovered}
                  showEntryAnimation={true}
                />
              ) : (
                <motion.div
                  animate={isUnlocked && isHovered ? { 
                    scale: 1.05,
                    boxShadow: "0 0 30px hsl(var(--primary) / 0.5)"
                  } : {}}
                  className={cn(
                    "w-12 h-12 sm:w-20 sm:h-20 rounded-lg sm:rounded-xl overflow-hidden relative",
                    "bg-gradient-to-br from-primary/30 to-accent/30",
                    isUnlocked && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    {isGeneratingAvatar ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
                      </motion.div>
                    ) : (
                      <Wand2 className="w-5 h-5 sm:w-8 sm:h-8 text-primary/60" />
                    )}
                  </div>
                </motion.div>
              )}

              {/* Starter badge */}
              {persona.is_starter && (
                <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 bg-accent text-accent-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3" fill="currentColor" />
                  <span className="hidden xs:inline">Free</span>
                </div>
              )}

              {/* Selected badge */}
              {isSelected && (
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-0.5 sm:gap-1">
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                  <span className="hidden xs:inline">Profile</span>
                </div>
              )}
            </div>

            {/* Floating particles for unlocked personas - hidden on mobile */}
            {isUnlocked && isHovered && (
              <div className="absolute top-4 right-4 hidden sm:block">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute w-1.5 h-1.5 rounded-full bg-primary"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                      opacity: [0, 1, 0],
                      scale: [0, 1, 0],
                      y: [0, -20 - i * 10],
                      x: [0, (i - 1) * 10]
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      delay: i * 0.2
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <h3 className="font-display text-sm sm:text-xl font-semibold text-foreground mb-0.5 sm:mb-1 line-clamp-1">
            {persona.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-3 line-clamp-2">
            {persona.description}
          </p>

          <div className="flex items-center gap-2 mb-2 sm:mb-4">
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full bg-primary/10 text-primary truncate max-w-full">
              {persona.style}
            </span>
          </div>

          {/* Actions for unlocked personas */}
          {isUnlocked && (
            <div className="space-y-1.5 sm:space-y-2">
              {!persona.avatar_url && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full gap-1 sm:gap-2 text-xs sm:text-sm h-7 sm:h-8"
                  onClick={handleGenerateAvatarClick}
                  disabled={isGeneratingAvatar}
                >
                  <Sparkles className="w-3 h-3" />
                  {isGeneratingAvatar ? 'Generating...' : 'Generate Avatar'}
                </Button>
              )}
              <div className="flex gap-1.5 sm:gap-2">
                {persona.avatar_url && onSetAsProfile && (
                  <Button 
                    variant={isSelected ? "secondary" : "outline"}
                    size="sm" 
                    className="flex-1 gap-1 text-xs sm:text-sm h-7 sm:h-8 px-1.5 sm:px-3"
                    onClick={handleSetProfileClick}
                    disabled={isSelected}
                  >
                    <User className="w-3 h-3" />
                    <span className="hidden xs:inline">{isSelected ? 'Current' : 'Set Profile'}</span>
                    <span className="xs:hidden">{isSelected ? '✓' : 'Set'}</span>
                  </Button>
                )}
                <Button 
                  variant="neon" 
                  size="sm" 
                  className="flex-1 text-xs sm:text-sm h-7 sm:h-8"
                  onClick={handleUseClick}
                >
                  <span className="hidden xs:inline">Use Persona</span>
                  <span className="xs:hidden">Use</span>
                </Button>
              </div>
            </div>
          )}
        </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  );
}

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Share2, Trophy, Star, Zap, Target, Flame } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShootingStarsExplosion } from './ShootingStarsExplosion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface MilestoneData {
  id: string;
  title: string;
  description: string;
  icon: 'trophy' | 'star' | 'zap' | 'target' | 'flame';
  reward?: number;
  rarity?: 'common' | 'rare' | 'legendary';
  isShareable?: boolean;
}

const ICONS = {
  trophy: Trophy,
  star: Star,
  zap: Zap,
  target: Target,
  flame: Flame,
};

const RARITY_STYLES = {
  common: {
    gradient: 'from-emerald-500 to-teal-500',
    glow: 'hsl(160, 84%, 39%)',
    bgGlow: 'emerald-500/20',
  },
  rare: {
    gradient: 'from-violet-500 to-purple-600',
    glow: 'hsl(270, 76%, 55%)',
    bgGlow: 'violet-500/20',
  },
  legendary: {
    gradient: 'from-amber-400 via-orange-500 to-red-500',
    glow: '#FFD700',
    bgGlow: 'amber-500/30',
  },
};

interface MilestoneCelebrationProps {
  milestone: MilestoneData | null;
  onComplete?: () => void;
  onShare?: (milestone: MilestoneData) => void;
}

export function MilestoneCelebration({ 
  milestone, 
  onComplete,
  onShare 
}: MilestoneCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();

  const rarity = milestone?.rarity || 'common';
  const styles = RARITY_STYLES[rarity];
  const Icon = milestone ? ICONS[milestone.icon] : Trophy;

  useEffect(() => {
    if (milestone) {
      setIsVisible(true);
      setShowStars(true);
      
      // Play sounds based on rarity
      if (rarity === 'legendary') {
        playSound('achievementLegendary');
        trigger('success');
      } else if (rarity === 'rare') {
        playSound('achievementRare');
        trigger('medium');
      } else {
        playSound('milestone');
        trigger('light');
      }
      
      setTimeout(() => playSound('celebration'), 300);
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowStars(false);
        onComplete?.();
      }, rarity === 'legendary' ? 6000 : 4500);
      
      return () => clearTimeout(timer);
    }
  }, [milestone, rarity, playSound, trigger, onComplete]);

  const handleShare = () => {
    if (milestone?.isShareable && onShare) {
      playSound('ding');
      trigger('light');
      onShare(milestone);
    }
  };

  return (
    <>
      <ShootingStarsExplosion 
        isActive={showStars} 
        starCount={rarity === 'legendary' ? 50 : rarity === 'rare' ? 40 : 30}
        isIntense={rarity === 'legendary'}
        duration={rarity === 'legendary' ? 5000 : 3500}
      />
      
      <AnimatePresence>
        {isVisible && milestone && (
          <motion.div
            className="fixed inset-0 z-[100] pointer-events-none overflow-hidden flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Backdrop with animated gradient */}
            <motion.div 
              className="absolute inset-0 bg-background/70 backdrop-blur-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            
            {/* Radial pulse effect */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(circle at center, ${styles.bgGlow}, transparent 60%)`,
              }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            {/* Main content card */}
            <motion.div
              className="relative pointer-events-auto"
              initial={{ scale: 0, rotate: -15 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className={`absolute -inset-4 rounded-3xl bg-gradient-to-r ${styles.gradient} opacity-30 blur-xl`}
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              <div className="relative bg-card/95 backdrop-blur-md border-2 border-primary/50 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl overflow-hidden">
                {/* Animated corner accents */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary/50 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary/50 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary/50 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary/50 rounded-br-xl" />
                
                {/* Rarity badge */}
                <motion.div
                  className={`absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r ${styles.gradient}`}
                  initial={{ scale: 0, y: -10 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ type: 'spring', delay: 0.4 }}
                >
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    {rarity} Milestone
                  </span>
                </motion.div>
                
                {/* Icon with animated ring */}
                <motion.div
                  className="relative w-24 h-24 mx-auto mb-4"
                  animate={{
                    y: [0, -8, 0],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {/* Spinning ring */}
                  <motion.div
                    className={`absolute inset-0 rounded-full border-2 border-dashed`}
                    style={{ borderColor: styles.glow }}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                  />
                  
                  {/* Icon background */}
                  <div 
                    className={`absolute inset-2 rounded-full bg-gradient-to-br ${styles.gradient} flex items-center justify-center`}
                    style={{ boxShadow: `0 0 30px ${styles.glow}` }}
                  >
                    <Icon className="w-10 h-10 text-white" />
                  </div>
                </motion.div>
                
                {/* Title */}
                <motion.h2 
                  className={`text-xl font-bold bg-gradient-to-r ${styles.gradient} bg-clip-text text-transparent mb-2`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  {milestone.title}
                </motion.h2>
                
                {/* Description */}
                <motion.p 
                  className="text-sm text-muted-foreground mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                >
                  {milestone.description}
                </motion.p>
                
                {/* Reward display */}
                {milestone.reward && milestone.reward > 0 && (
                  <motion.div 
                    className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-500/20 rounded-lg mb-4"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.8 }}
                  >
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">
                      +{milestone.reward} Credits
                    </span>
                  </motion.div>
                )}
                
                {/* Share button */}
                {milestone.isShareable && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShare}
                      className="gap-2 border-primary/50 hover:bg-primary/10"
                    >
                      <Share2 className="w-4 h-4" />
                      Share Achievement
                    </Button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

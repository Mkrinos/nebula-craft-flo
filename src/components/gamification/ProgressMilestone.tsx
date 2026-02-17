import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Star, Trophy, Zap, Flame, Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface Milestone {
  id: string;
  label: string;
  value: number;
  icon?: React.ReactNode;
  color?: string;
}

interface ProgressMilestoneProps {
  current: number;
  max: number;
  milestones?: Milestone[];
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  variant?: 'default' | 'glow' | 'gradient' | 'streak';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const defaultMilestones: Milestone[] = [
  { id: '25', label: 'Getting Started', value: 25, icon: <Star className="w-3 h-3" />, color: 'text-blue-400' },
  { id: '50', label: 'Halfway There!', value: 50, icon: <Zap className="w-3 h-3" />, color: 'text-yellow-400' },
  { id: '75', label: 'Almost There!', value: 75, icon: <Flame className="w-3 h-3" />, color: 'text-orange-400' },
  { id: '100', label: 'Complete!', value: 100, icon: <Trophy className="w-3 h-3" />, color: 'text-emerald-400' },
];

export function ProgressMilestone({
  current,
  max,
  milestones = defaultMilestones,
  label,
  showPercentage = true,
  animated = true,
  variant = 'default',
  size = 'md',
  className,
}: ProgressMilestoneProps) {
  const { trigger } = useHapticFeedback();
  const { playSound } = useSoundEffects();
  const percentage = Math.min((current / max) * 100, 100);
  const prevPercentageRef = useRef(percentage);
  
  // Track milestone crossings and play sounds
  useEffect(() => {
    const prevPercentage = prevPercentageRef.current;
    
    milestones.forEach((milestone) => {
      const wasBelow = prevPercentage < milestone.value;
      const isNowAbove = percentage >= milestone.value;
      
      if (wasBelow && isNowAbove && animated) {
        // Milestone just reached!
        if (milestone.value === 100) {
          playSound('milestoneComplete');
          trigger('success');
        } else {
          playSound('milestone');
          trigger('light');
        }
      }
    });
    
    prevPercentageRef.current = percentage;
  }, [percentage, milestones, animated, playSound, trigger]);
  
  const sizeClasses = {
    sm: { bar: 'h-2', text: 'text-xs', icon: 'w-4 h-4' },
    md: { bar: 'h-3', text: 'text-sm', icon: 'w-5 h-5' },
    lg: { bar: 'h-4', text: 'text-base', icon: 'w-6 h-6' },
  };

  const variantClasses = {
    default: 'bg-primary',
    glow: 'bg-primary shadow-[0_0_10px_hsl(var(--primary))]',
    gradient: 'bg-gradient-to-r from-primary via-neon-cyan to-primary',
    streak: 'bg-gradient-to-r from-orange-500 via-red-500 to-orange-500',
  };

  return (
    <div className={cn('w-full space-y-2', className)}>
      {/* Header */}
      {(label || showPercentage) && (
        <div className="flex items-center justify-between">
          {label && (
            <span className={cn('font-medium text-foreground', sizeClasses[size].text)}>
              {label}
            </span>
          )}
          {showPercentage && (
            <motion.span
              className={cn('font-bold text-primary', sizeClasses[size].text)}
              key={Math.floor(percentage)}
              initial={{ scale: 1.2, color: 'hsl(var(--neon-cyan))' }}
              animate={{ scale: 1, color: 'hsl(var(--primary))' }}
            >
              {Math.floor(percentage)}%
            </motion.span>
          )}
        </div>
      )}

      {/* Progress Bar Container */}
      <div className="relative">
        {/* Background */}
        <div className={cn(
          'w-full rounded-full bg-muted overflow-hidden relative',
          sizeClasses[size].bar
        )}>
          {/* Fill */}
          <motion.div
            className={cn('h-full rounded-full relative', variantClasses[variant])}
            initial={animated ? { width: 0 } : { width: `${percentage}%` }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          >
            {/* Animated pulse glow on the fill */}
            <motion.div
              className="absolute inset-0 bg-white/30 rounded-full"
              animate={{ opacity: [0.1, 0.3, 0.1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Leading edge glow */}
            <motion.div
              className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-white/40 to-transparent rounded-full"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </div>

        {/* Milestone Markers */}
        <div className="absolute inset-0">
          {milestones.map((milestone) => {
            const isReached = percentage >= milestone.value;
            const position = (milestone.value / 100) * 100;
            
            return (
              <motion.div
                key={milestone.id}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${position}%` }}
                initial={false}
                animate={isReached ? { scale: [1, 1.3, 1] } : {}}
                onAnimationComplete={() => {
                  if (isReached && animated) {
                    trigger('success');
                  }
                }}
              >
                <div
                  className={cn(
                    'rounded-full border-2 flex items-center justify-center transition-all duration-300',
                    sizeClasses[size].icon,
                    isReached
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'bg-muted border-border text-muted-foreground'
                  )}
                >
                  {isReached ? (
                    <Check className="w-2.5 h-2.5" />
                  ) : (
                    <span className="text-[8px] font-bold">{milestone.value}</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Milestone Labels (optional - shows on hover or always) */}
      <div className="flex justify-between px-1">
        {milestones.map((milestone) => {
          const isReached = percentage >= milestone.value;
          return (
            <AnimatePresence key={milestone.id}>
              {isReached && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn('text-[10px] flex items-center gap-1', milestone.color)}
                >
                  {milestone.icon}
                </motion.div>
              )}
            </AnimatePresence>
          );
        })}
      </div>
    </div>
  );
}

// Streak display component
interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  animated?: boolean;
}

export function StreakDisplay({ currentStreak, longestStreak, animated = true }: StreakDisplayProps) {
  const { playSound } = useSoundEffects();
  const prevStreakRef = useRef(currentStreak);
  const isOnFire = currentStreak >= 7;
  const isChampion = currentStreak >= 30;

  // Play sound when streak increases
  useEffect(() => {
    if (currentStreak > prevStreakRef.current && animated) {
      playSound('streakUp');
    }
    prevStreakRef.current = currentStreak;
  }, [currentStreak, animated, playSound]);

  return (
    <motion.div
      className={cn(
        'relative p-4 rounded-xl border backdrop-blur-sm',
        isChampion ? 'border-yellow-500/50 bg-yellow-500/10' :
        isOnFire ? 'border-orange-500/50 bg-orange-500/10' :
        'border-border bg-card/50'
      )}
      initial={animated ? { scale: 0.9, opacity: 0 } : {}}
      animate={{ scale: 1, opacity: 1 }}
    >
      {/* Fire effect for streaks */}
      {isOnFire && (
        <motion.div
          className="absolute -top-3 left-1/2 -translate-x-1/2"
          animate={{ y: [0, -3, 0], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {isChampion ? (
            <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]" />
          ) : (
            <Flame className="w-8 h-8 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
          )}
        </motion.div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Streak</p>
          <motion.p
            className={cn(
              'text-3xl font-bold',
              isChampion ? 'text-yellow-400' :
              isOnFire ? 'text-orange-400' :
              'text-foreground'
            )}
            key={currentStreak}
            initial={animated ? { scale: 1.5 } : {}}
            animate={{ scale: 1 }}
          >
            {currentStreak}
            <span className="text-lg ml-1">days</span>
          </motion.p>
        </div>
        
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Best</p>
          <p className="text-xl font-semibold text-primary">
            {longestStreak}
            <span className="text-sm ml-1">days</span>
          </p>
        </div>
      </div>

      {/* Progress to next milestone */}
      <div className="mt-3">
        <ProgressMilestone
          current={currentStreak}
          max={isChampion ? 100 : isOnFire ? 30 : 7}
          milestones={[
            { id: '7', label: 'Week', value: isChampion ? 7 : isOnFire ? 23 : 100, icon: <Flame className="w-3 h-3" /> },
          ]}
          showPercentage={false}
          variant="streak"
          size="sm"
        />
      </div>
    </motion.div>
  );
}

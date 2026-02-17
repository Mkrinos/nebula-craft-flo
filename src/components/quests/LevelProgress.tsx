import { motion } from 'framer-motion';
import { Star, Zap, Trophy, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserLevel } from '@/hooks/useQuests';

interface LevelProgressProps {
  userLevel: UserLevel | null;
  xpProgress: { current: number; needed: number; percentage: number };
}

export function LevelProgress({ userLevel, xpProgress }: LevelProgressProps) {
  const level = userLevel?.current_level ?? 1;
  const questsCompleted = userLevel?.quests_completed ?? 0;

  // Level tier for visual styling
  const tierStyles = level < 5 
    ? { gradient: 'from-emerald-500 to-teal-500', glow: 'emerald-500' }
    : level < 10
    ? { gradient: 'from-blue-500 to-cyan-500', glow: 'blue-500' }
    : level < 20
    ? { gradient: 'from-violet-500 to-purple-500', glow: 'violet-500' }
    : level < 50
    ? { gradient: 'from-amber-500 to-orange-500', glow: 'amber-500' }
    : { gradient: 'from-rose-500 to-pink-500', glow: 'rose-500' };

  return (
    <motion.div
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background glow */}
      <div 
        className={cn("absolute inset-0 opacity-10 bg-gradient-to-br", tierStyles.gradient)}
      />
      
      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Level badge */}
            <motion.div
              className={cn(
                "relative w-16 h-16 rounded-xl flex items-center justify-center",
                "bg-gradient-to-br", tierStyles.gradient
              )}
              animate={{
                boxShadow: [
                  `0 0 20px hsl(var(--${tierStyles.glow}) / 0.3)`,
                  `0 0 30px hsl(var(--${tierStyles.glow}) / 0.5)`,
                  `0 0 20px hsl(var(--${tierStyles.glow}) / 0.3)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span className="text-2xl font-bold text-white">{level}</span>
              
              {/* Rotating ring */}
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-dashed border-white/30"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
            
            <div>
              <h3 className="text-lg font-bold text-foreground">Level {level}</h3>
              <p className="text-sm text-muted-foreground">
                {level < 5 && 'Novice Creator'}
                {level >= 5 && level < 10 && 'Apprentice Artist'}
                {level >= 10 && level < 20 && 'Skilled Artisan'}
                {level >= 20 && level < 50 && 'Master Creator'}
                {level >= 50 && 'Legendary Artist'}
              </p>
            </div>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span className="text-muted-foreground">{questsCompleted} quests</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Star className="w-4 h-4 text-violet-400" />
              <span className="text-muted-foreground">{userLevel?.total_xp ?? 0} XP</span>
            </div>
          </div>
        </div>
        
        {/* XP Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {level + 1}</span>
            <span className="text-primary font-medium">
              {xpProgress.current} / {xpProgress.needed} XP
            </span>
          </div>
          
          <div className="relative h-4 rounded-full bg-muted/50 overflow-hidden">
            {/* Animated progress fill */}
            <motion.div
              className={cn("h-full rounded-full bg-gradient-to-r", tierStyles.gradient)}
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress.percentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
              }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
            />
            
            {/* Notches for visual appeal */}
            <div className="absolute inset-0 flex justify-between px-1 py-1.5">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="w-0.5 h-full bg-background/20" />
              ))}
            </div>
          </div>
          
          {/* Next level preview */}
          <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
            <TrendingUp className="w-3 h-3" />
            <span>
              {xpProgress.needed - xpProgress.current} XP until next level
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

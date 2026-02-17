import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  Trophy, Sparkles, Zap, Palette, Crown, User, Users, Star, 
  Flame, Award, Lock
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import type { Achievement } from '@/hooks/useAchievements';

const iconMap: Record<string, React.ElementType> = {
  trophy: Trophy,
  sparkles: Sparkles,
  zap: Zap,
  palette: Palette,
  crown: Crown,
  user: User,
  users: Users,
  star: Star,
  flame: Flame,
  fire: Flame,
  award: Award
};

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; target: number };
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
}

export function AchievementBadge({ 
  achievement, 
  isUnlocked, 
  progress,
  size = 'md',
  showTooltip = true
}: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] || Trophy;
  
  const sizeClasses = {
    sm: 'w-10 h-10',
    md: 'w-14 h-14',
    lg: 'w-20 h-20'
  };
  
  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10'
  };

  const categoryColors: Record<string, string> = {
    creator: 'from-purple-500 to-pink-500',
    explorer: 'from-cyan-500 to-blue-500',
    dedication: 'from-orange-500 to-red-500',
    general: 'from-emerald-500 to-teal-500'
  };

  const badge = (
    <motion.div
      className={cn(
        'relative rounded-xl flex items-center justify-center transition-all duration-300',
        sizeClasses[size],
        isUnlocked 
          ? `bg-gradient-to-br ${categoryColors[achievement.category] || categoryColors.general} shadow-lg` 
          : 'bg-muted/50 border border-border/50'
      )}
      whileHover={isUnlocked ? { scale: 1.1, rotate: 5 } : { scale: 1.02 }}
      initial={false}
    >
      {isUnlocked ? (
        <>
          <Icon className={cn(iconSizes[size], 'text-white drop-shadow-md')} />
          <motion.div
            className="absolute inset-0 rounded-xl bg-white/20"
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </>
      ) : (
        <>
          <Lock className={cn(iconSizes[size], 'text-muted-foreground/50')} />
          {progress && (
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-full px-1">
              <Progress 
                value={(progress.current / progress.target) * 100} 
                className="h-1 bg-muted"
              />
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  if (!showTooltip) return badge;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {badge}
      </TooltipTrigger>
      <TooltipContent 
        side="top" 
        className="max-w-xs bg-popover/95 backdrop-blur-sm border-border"
      >
        <div className="space-y-1">
          <p className="font-semibold text-foreground">{achievement.name}</p>
          <p className="text-sm text-muted-foreground">{achievement.description}</p>
          {!isUnlocked && progress && (
            <p className="text-xs text-primary">
              Progress: {progress.current}/{progress.target}
            </p>
          )}
          {achievement.credits_reward > 0 && (
            <p className="text-xs text-emerald-400">
              +{achievement.credits_reward} credits reward
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

import { motion } from 'framer-motion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { ContributorBadge as BadgeType } from '@/hooks/useContributorBadges';

interface ContributorBadgeProps {
  badge: BadgeType;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  earned?: boolean;
}

const rarityColors = {
  common: 'from-slate-400 to-slate-500 border-slate-400/50',
  rare: 'from-blue-400 to-cyan-500 border-blue-400/50',
  epic: 'from-purple-400 to-pink-500 border-purple-400/50',
  legendary: 'from-yellow-400 to-orange-500 border-yellow-400/50'
};

const rarityGlow = {
  common: '',
  rare: 'shadow-blue-500/30',
  epic: 'shadow-purple-500/40',
  legendary: 'shadow-yellow-500/50 animate-pulse'
};

const sizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-lg',
  lg: 'w-14 h-14 text-2xl'
};

export function ContributorBadge({ 
  badge, 
  size = 'md', 
  showTooltip = true,
  earned = true 
}: ContributorBadgeProps) {
  const content = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      className={`
        ${sizes[size]} 
        rounded-full 
        bg-gradient-to-br ${rarityColors[badge.rarity]}
        border-2
        flex items-center justify-center
        ${earned ? `shadow-lg ${rarityGlow[badge.rarity]}` : 'opacity-40 grayscale'}
        transition-all duration-200
      `}
    >
      <span role="img" aria-label={badge.name}>
        {badge.icon}
      </span>
    </motion.div>
  );

  if (!showTooltip) return content;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {content}
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-[200px] bg-card border-border"
        >
          <div className="space-y-1">
            <p className="font-semibold text-foreground flex items-center gap-1">
              {badge.icon} {badge.name}
            </p>
            <p className="text-xs text-muted-foreground">{badge.description}</p>
            <p className={`text-xs capitalize font-medium ${
              badge.rarity === 'legendary' ? 'text-yellow-400' :
              badge.rarity === 'epic' ? 'text-purple-400' :
              badge.rarity === 'rare' ? 'text-blue-400' :
              'text-slate-400'
            }`}>
              {badge.rarity}
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

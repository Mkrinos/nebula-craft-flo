import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Lock, Check, Sparkles } from 'lucide-react';
import type { StudioDecoration } from '@/hooks/useStudioSpaces';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string }> = {
  common: { 
    bg: 'bg-slate-500/20', 
    border: 'border-slate-400/40',
    glow: '',
  },
  rare: { 
    bg: 'bg-blue-500/20', 
    border: 'border-blue-400/60',
    glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]',
  },
  epic: { 
    bg: 'bg-violet-500/20', 
    border: 'border-violet-400/60',
    glow: 'shadow-[0_0_20px_rgba(139,92,246,0.4)]',
  },
  legendary: { 
    bg: 'bg-amber-500/20', 
    border: 'border-amber-400/60',
    glow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]',
  },
};

const RARITY_LABELS: Record<string, string> = {
  common: 'Common',
  rare: 'Rare',
  epic: 'Epic',
  legendary: 'Legendary',
};

interface DecorationCardProps {
  decoration: StudioDecoration;
  isUnlocked: boolean;
  isSelected?: boolean;
  onSelect?: () => void;
}

export function DecorationCard({ 
  decoration, 
  isUnlocked, 
  isSelected,
  onSelect 
}: DecorationCardProps) {
  const { trigger } = useHapticFeedback();
  const rarityStyle = RARITY_STYLES[decoration.rarity] || RARITY_STYLES.common;

  const handleClick = () => {
    if (isUnlocked) {
      trigger('selection');
      onSelect?.();
    } else {
      trigger('warning');
    }
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border-2 p-3 cursor-pointer transition-all touch-manipulation min-h-[88px]",
        rarityStyle.bg,
        rarityStyle.border,
        isUnlocked && rarityStyle.glow,
        isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background",
        !isUnlocked && "opacity-60 grayscale"
      )}
      whileHover={isUnlocked ? { scale: 1.05, y: -2 } : undefined}
      whileTap={isUnlocked ? { scale: 0.95 } : { scale: 0.98 }}
      onClick={handleClick}
    >
      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/40">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          className="absolute top-1 right-1 z-20"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <div className="bg-primary rounded-full p-0.5">
            <Check className="w-3 h-3 text-primary-foreground" />
          </div>
        </motion.div>
      )}
      
      {/* Legendary shimmer */}
      {decoration.rarity === 'legendary' && isUnlocked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
      
      {/* Icon */}
      <div className="text-center mb-2">
        <motion.span 
          className="text-3xl"
          animate={isUnlocked && decoration.rarity !== 'common' ? {
            scale: [1, 1.1, 1],
          } : undefined}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {decoration.icon}
        </motion.span>
      </div>
      
      {/* Name */}
      <h4 className="text-xs font-medium text-center truncate mb-1">
        {decoration.name}
      </h4>
      
      {/* Rarity */}
      <div className={cn(
        "text-[10px] text-center uppercase tracking-wider",
        decoration.rarity === 'legendary' && "text-amber-400",
        decoration.rarity === 'epic' && "text-violet-400",
        decoration.rarity === 'rare' && "text-blue-400",
        decoration.rarity === 'common' && "text-muted-foreground",
      )}>
        {RARITY_LABELS[decoration.rarity]}
      </div>
      
      {/* Sparkle effect for epic/legendary */}
      {(decoration.rarity === 'epic' || decoration.rarity === 'legendary') && isUnlocked && (
        <motion.div
          className="absolute top-1 left-1"
          animate={{ rotate: 360, opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          <Sparkles className={cn(
            "w-3 h-3",
            decoration.rarity === 'legendary' ? "text-amber-400" : "text-violet-400"
          )} />
        </motion.div>
      )}
    </motion.div>
  );
}

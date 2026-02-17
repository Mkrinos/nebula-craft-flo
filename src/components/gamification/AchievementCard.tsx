import { motion } from 'framer-motion';
import { Star, Lock, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { AchievementBadge } from '@/components/AchievementBadge';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Achievement } from '@/hooks/useAchievements';

interface AchievementCardProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: { current: number; target: number };
  unlockedAt?: string;
  index?: number;
}

export function AchievementCard({
  achievement,
  isUnlocked,
  progress,
  unlockedAt,
  index = 0,
}: AchievementCardProps) {
  const progressPercent = progress ? (progress.current / progress.target) * 100 : 0;
  const { trigger } = useHapticFeedback();

  const handleTap = () => {
    trigger('selection');
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
      handleTap();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onPointerDown={handlePointerDown}
      onClick={(e) => { if (e.detail !== 0) handleTap(); }}
      className="group touch-manipulation cursor-pointer min-h-[80px]"
    >
      <SciFiFrame
        variant={isUnlocked ? 'accent' : 'default'}
        className={cn(
          'p-4 h-full transition-all duration-300 relative overflow-hidden',
          isUnlocked
            ? 'bg-neon-cyan/5 shadow-[0_0_20px_rgba(0,255,255,0.1)]'
            : 'opacity-80 hover:opacity-100'
        )}
      >
        {/* Shimmer effect for locked cards */}
        {!isUnlocked && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -skew-x-12 pointer-events-none"
            animate={{
              x: ['-200%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Sparkle particles for unlocked cards */}
        {isUnlocked && (
          <>
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute pointer-events-none"
                style={{
                  left: `${20 + i * 30}%`,
                  top: `${10 + i * 20}%`,
                }}
                animate={{
                  y: [0, -10, 0],
                  opacity: [0.3, 0.8, 0.3],
                  scale: [0.8, 1, 0.8],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: i * 0.5,
                }}
              >
                <Sparkles className="w-3 h-3 text-neon-cyan/50" />
              </motion.div>
            ))}
          </>
        )}

        {/* Hover glow effect */}
        <motion.div
          className={cn(
            'absolute inset-0 pointer-events-none rounded-lg transition-opacity duration-300',
            isUnlocked
              ? 'bg-gradient-to-t from-neon-cyan/10 via-transparent to-neon-cyan/5'
              : 'bg-gradient-to-t from-primary/5 via-transparent to-transparent'
          )}
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
        />

        <div className="flex flex-col items-center text-center gap-3 relative z-10">
          <AchievementBadge
            achievement={achievement}
            isUnlocked={isUnlocked}
            progress={progress}
            size="lg"
            showTooltip={false}
          />

          <div>
            <h3
              className={cn(
                'font-semibold transition-colors',
                isUnlocked ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              {achievement.name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {achievement.description}
            </p>
          </div>

          {/* Animated Progress Bar */}
          {progress && !isUnlocked && (
            <div className="w-full space-y-1">
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                {/* Animated fill */}
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-neon-cyan to-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                />
                {/* Pulse glow on the edge */}
                <motion.div
                  className="absolute inset-y-0 bg-neon-cyan/50 w-2 rounded-full blur-sm"
                  animate={{
                    left: [`${Math.max(0, progressPercent - 2)}%`, `${progressPercent}%`],
                    opacity: [0.3, 0.8, 0.3],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                  }}
                  style={{ display: progressPercent > 0 ? 'block' : 'none' }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {progress.current} / {progress.target}
              </p>
            </div>
          )}

          {/* Reward Badge */}
          {achievement.credits_reward > 0 && (
            <SciFiBadge
              variant={isUnlocked ? 'success' : 'outline'}
              className={cn(
                'text-xs transition-all',
                !isUnlocked && 'group-hover:border-neon-cyan/50 group-hover:text-neon-cyan'
              )}
            >
              <Star className="w-3 h-3 mr-1" />
              {isUnlocked ? 'Earned ' : ''}+{achievement.credits_reward} credits
            </SciFiBadge>
          )}

          {/* Unlock Date */}
          {isUnlocked && unlockedAt && (
            <p className="text-xs text-muted-foreground">
              Unlocked {new Date(unlockedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </SciFiFrame>
    </motion.div>
  );
}

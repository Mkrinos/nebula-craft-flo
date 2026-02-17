import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { Coins, Star, Trophy, Zap, Gift, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export type RewardType = 'credits' | 'achievement' | 'streak' | 'level' | 'bonus' | 'special';

interface RewardNotificationProps {
  type: RewardType;
  title: string;
  description?: string;
  amount?: number;
  icon?: React.ReactNode;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

const typeConfig: Record<RewardType, { icon: React.ReactNode; color: string; bgColor: string }> = {
  credits: {
    icon: <Coins className="w-6 h-6" />,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20 border-yellow-500/50',
  },
  achievement: {
    icon: <Trophy className="w-6 h-6" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20 border-amber-500/50',
  },
  streak: {
    icon: <Zap className="w-6 h-6" />,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20 border-orange-500/50',
  },
  level: {
    icon: <Star className="w-6 h-6" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20 border-purple-500/50',
  },
  bonus: {
    icon: <Gift className="w-6 h-6" />,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20 border-pink-500/50',
  },
  special: {
    icon: <Sparkles className="w-6 h-6" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20 border-cyan-500/50',
  },
};

export function RewardNotification({
  type,
  title,
  description,
  amount,
  icon,
  isVisible,
  onClose,
  duration = 4000,
}: RewardNotificationProps) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  const config = typeConfig[type];

  useEffect(() => {
    if (isVisible) {
      // Play different sounds based on reward type
      switch (type) {
        case 'achievement':
          playSound('achievement');
          break;
        case 'level':
          playSound('levelUp');
          break;
        case 'streak':
          playSound('streakUp');
          break;
        case 'credits':
          playSound('coinCollect');
          break;
        case 'special':
          playSound('achievementLegendary');
          break;
        default:
          playSound('celebration');
      }
      trigger('success');
      
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose, playSound, trigger, type]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-20 right-4 z-50 max-w-sm"
          initial={{ x: 300, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 300, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div
            className={cn(
              'relative overflow-hidden rounded-xl border-2 backdrop-blur-md p-4 shadow-2xl',
              config.bgColor
            )}
          >
            {/* Animated background shimmer */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ duration: 1.5, repeat: 2, ease: 'linear' }}
            />

            <div className="relative flex items-start gap-3">
              {/* Icon with pulse animation */}
              <motion.div
                className={cn('p-2 rounded-lg', config.color)}
                animate={{
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0],
                }}
                transition={{ duration: 0.6 }}
              >
                {icon || config.icon}
              </motion.div>

              <div className="flex-1 min-w-0">
                <motion.h4
                  className="font-bold text-foreground truncate"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  {title}
                </motion.h4>
                
                {description && (
                  <motion.p
                    className="text-sm text-muted-foreground mt-0.5"
                    initial={{ y: -10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    {description}
                  </motion.p>
                )}

                {amount !== undefined && (
                  <motion.div
                    className={cn('mt-2 inline-flex items-center gap-1 font-bold text-lg', config.color)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.3 }}
                  >
                    +{amount.toLocaleString()}
                    {type === 'credits' && <span className="text-sm">credits</span>}
                  </motion.div>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ×
              </button>
            </div>

            {/* Progress bar for duration */}
            <motion.div
              className={cn('absolute bottom-0 left-0 h-1', config.color.replace('text-', 'bg-'))}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook for managing reward notifications
export function useRewardNotifications() {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: RewardType;
    title: string;
    description?: string;
    amount?: number;
  }>>([]);

  const showReward = (reward: Omit<typeof notifications[0], 'id'>) => {
    const id = crypto.randomUUID();
    setNotifications((prev) => [...prev, { ...reward, id }]);
  };

  const hideReward = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, showReward, hideReward };
}

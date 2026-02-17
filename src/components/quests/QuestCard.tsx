import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Sparkles, Image, Compass, Heart, Crown, UserPlus, 
  MessageCircle, Flame, Star, Palette, DoorOpen, 
  TrendingUp, Users, Trophy, Scroll, Zap, Gift,
  Clock, CheckCircle2, Lock
} from 'lucide-react';
import type { Quest } from '@/hooks/useQuests';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  sparkles: Sparkles,
  image: Image,
  compass: Compass,
  heart: Heart,
  crown: Crown,
  'user-plus': UserPlus,
  'message-circle': MessageCircle,
  flame: Flame,
  star: Star,
  palette: Palette,
  'door-open': DoorOpen,
  'trending-up': TrendingUp,
  users: Users,
  trophy: Trophy,
  scroll: Scroll,
};

const DIFFICULTY_COLORS = [
  'from-emerald-500 to-teal-500',
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-purple-500',
  'from-orange-500 to-amber-500',
  'from-rose-500 to-pink-500',
];

const CATEGORY_BADGES: Record<string, { label: string; color: string }> = {
  creation: { label: 'Creation', color: 'bg-violet-500/20 text-violet-300' },
  exploration: { label: 'Exploration', color: 'bg-cyan-500/20 text-cyan-300' },
  social: { label: 'Social', color: 'bg-pink-500/20 text-pink-300' },
  mastery: { label: 'Mastery', color: 'bg-amber-500/20 text-amber-300' },
};

interface QuestCardProps {
  quest: Quest & { progress: number; status: string };
  onStart?: () => void;
  onClaim?: () => void;
  isLoading?: boolean;
}

export function QuestCard({ quest, onStart, onClaim, isLoading }: QuestCardProps) {
  const { trigger } = useHapticFeedback();
  const Icon = ICONS[quest.icon] || Scroll;
  const difficultyColor = DIFFICULTY_COLORS[quest.difficulty - 1] || DIFFICULTY_COLORS[0];
  const categoryBadge = CATEGORY_BADGES[quest.category];
  const progressPercent = (quest.progress / quest.requirement_value) * 100;
  
  const isAvailable = quest.status === 'available';
  const isInProgress = quest.status === 'in_progress';
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';

  const handleAction = () => {
    trigger('medium');
    if (isAvailable && onStart) onStart();
    if (isCompleted && onClaim) onClaim();
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-xl border backdrop-blur-sm transition-all touch-manipulation",
        isClaimed 
          ? "bg-muted/30 border-muted-foreground/20 opacity-60" 
          : "bg-card/80 border-primary/20 hover:border-primary/40"
      )}
      whileHover={!isClaimed ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!isClaimed ? { scale: 0.98 } : undefined}
    >
      {/* Difficulty gradient bar */}
      <div className={cn("h-1 w-full bg-gradient-to-r", difficultyColor)} />
      
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Quest icon */}
          <motion.div
            className={cn(
              "flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center",
              isClaimed 
                ? "bg-muted" 
                : `bg-gradient-to-br ${difficultyColor}`
            )}
            animate={isCompleted ? { 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0],
            } : undefined}
            transition={{ duration: 0.5, repeat: isCompleted ? Infinity : 0, repeatDelay: 2 }}
          >
            <Icon className={cn(
              "w-6 h-6",
              isClaimed ? "text-muted-foreground" : "text-white"
            )} />
          </motion.div>
          
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("text-xs px-2 py-0.5 rounded-full", categoryBadge.color)}>
                {categoryBadge.label}
              </span>
              {quest.quest_type === 'daily' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Daily
                </span>
              )}
              {quest.quest_type === 'weekly' && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Weekly
                </span>
              )}
              {quest.quest_type === 'story' && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Story
                </span>
              )}
            </div>
            
            {/* Title */}
            <h3 className={cn(
              "font-semibold text-sm mb-1",
              isClaimed ? "text-muted-foreground line-through" : "text-foreground"
            )}>
              {quest.title}
            </h3>
            
            {/* Description */}
            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
              {quest.description}
            </p>
            
            {/* Progress bar (if in progress) */}
            {isInProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="text-primary font-medium">
                    {quest.progress}/{quest.requirement_value}
                  </span>
                </div>
                <Progress value={progressPercent} className="h-2" />
              </div>
            )}
            
            {/* Rewards */}
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 text-xs">
                <Zap className="w-3 h-3 text-amber-400" />
                <span className="text-amber-400 font-medium">+{quest.credits_reward}</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <Star className="w-3 h-3 text-violet-400" />
                <span className="text-violet-400 font-medium">+{quest.xp_reward} XP</span>
              </div>
              {quest.unlock_content_type && (
                <div className="flex items-center gap-1 text-xs">
                  <Gift className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Unlock</span>
                </div>
              )}
            </div>
            
            {/* Action button */}
            {isAvailable && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleAction}
                disabled={isLoading}
                className="w-full gap-2 border-primary/50 hover:bg-primary/10 min-h-[44px] touch-manipulation active:scale-[0.98]"
              >
                <Scroll className="w-4 h-4" />
                Accept Quest
              </Button>
            )}
            
            {isCompleted && (
              <Button
                size="sm"
                onClick={handleAction}
                disabled={isLoading}
                className={cn("w-full gap-2 bg-gradient-to-r min-h-[44px] touch-manipulation active:scale-[0.98]", difficultyColor)}
              >
                <Gift className="w-4 h-4" />
                Claim Reward!
              </Button>
            )}
            
            {isClaimed && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                Completed
              </div>
            )}
            
            {isInProgress && progressPercent < 100 && (
              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-4 h-4 text-primary" />
                </motion.div>
                In Progress
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Shimmer effect for completed quests */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          }}
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
        />
      )}
    </motion.div>
  );
}

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuests, Quest } from '@/hooks/useQuests';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiProgress } from '@/components/ui/sci-fi-progress';
import { Scroll, Star, Flame, Clock, ChevronRight, Play, Gift, Sparkles } from 'lucide-react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useRef, useCallback } from 'react';

// Icon mapping
const ICONS: Record<string, React.ElementType> = {
  star: Star,
  flame: Flame,
  clock: Clock,
  sparkles: Sparkles,
  scroll: Scroll,
};

interface QuestItemProps {
  quest: Quest & { progress: number; status: string };
  onStart: () => void;
  onClaim: () => void;
}

function QuestItem({ quest, onStart, onClaim }: QuestItemProps) {
  const Icon = ICONS[quest.icon] || Star;
  const progressPercent = Math.min(100, (quest.progress / quest.requirement_value) * 100);
  const isCompleted = quest.status === 'completed';
  const isClaimed = quest.status === 'claimed';
  const isAvailable = quest.status === 'available';
  const isInProgress = quest.status === 'in_progress';
  const { trigger } = useHapticFeedback();
  
  // Touch-optimized handlers
  const startTouchRef = useRef(false);
  const claimTouchRef = useRef(false);
  
  const handleStartPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
      startTouchRef.current = true;
      trigger('selection');
      onStart();
    }
  }, [onStart, trigger]);
  
  const handleStartClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (startTouchRef.current) {
      startTouchRef.current = false;
      return;
    }
    trigger('selection');
    onStart();
  }, [onStart, trigger]);
  
  const handleClaimPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      e.preventDefault();
      claimTouchRef.current = true;
      trigger('success');
      onClaim();
    }
  }, [onClaim, trigger]);
  
  const handleClaimClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    if (claimTouchRef.current) {
      claimTouchRef.current = false;
      return;
    }
    trigger('success');
    onClaim();
  }, [onClaim, trigger]);

  return (
    <motion.div
      className={`relative p-2 rounded-lg border transition-all ${
        isCompleted
          ? 'border-neon-cyan/50 bg-neon-cyan/5'
          : isClaimed
          ? 'border-border/20 bg-muted/30 opacity-60'
          : 'border-border/30 bg-space-dark/30 hover:border-primary/30'
      }`}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: isClaimed ? 1 : 1.01 }}
    >
      <div className="flex items-start gap-2">
        {/* Icon */}
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isCompleted ? 'bg-neon-cyan/20' : 'bg-primary/10'
        }`}>
          <Icon className={`w-3 h-3 ${isCompleted ? 'text-neon-cyan' : 'text-primary'}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-foreground truncate leading-tight">{quest.title}</p>
          
          {/* Progress bar for in-progress quests */}
          {isInProgress && (
            <div className="mt-1">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
                <span>{quest.progress}/{quest.requirement_value}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <SciFiProgress value={progressPercent} size="sm" animated />
            </div>
          )}

          {/* Rewards preview */}
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[9px] text-accent">+{quest.credits_reward} credits</span>
            <span className="text-[9px] text-primary">+{quest.xp_reward} XP</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {isAvailable && (
            <motion.button
              onPointerDown={handleStartPointerDown}
              onClick={handleStartClick}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center hover:bg-primary/30 active:scale-95 transition-all touch-manipulation"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              aria-label="Start quest"
            >
              <Play className="w-4 h-4 text-primary" />
            </motion.button>
          )}
          {isCompleted && (
            <motion.button
              onPointerDown={handleClaimPointerDown}
              onClick={handleClaimClick}
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-neon-cyan/20 border border-neon-cyan/30 flex items-center justify-center hover:bg-neon-cyan/30 active:scale-95 transition-all touch-manipulation"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              aria-label="Claim reward"
            >
              <Gift className="w-4 h-4 text-neon-cyan" />
            </motion.button>
          )}
          {isClaimed && (
            <div className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-muted/50 flex items-center justify-center">
              <Star className="w-4 h-4 text-muted-foreground fill-current" />
            </div>
          )}
        </div>
      </div>

      {/* Completion glow */}
      {isCompleted && (
        <motion.div
          className="absolute inset-0 rounded-lg bg-neon-cyan/5 pointer-events-none"
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

export function QuestsWidget() {
  const { questsByType, startQuest, claimReward, isLoading, userLevel } = useQuests();
  const grouped = questsByType();
  
  // Get top priority quests: completed first, then in-progress, then available
  const priorityQuests = [
    ...grouped.daily.filter(q => q.status === 'completed'),
    ...grouped.weekly.filter(q => q.status === 'completed'),
    ...grouped.daily.filter(q => q.status === 'in_progress'),
    ...grouped.weekly.filter(q => q.status === 'in_progress'),
    ...grouped.daily.filter(q => q.status === 'available'),
    ...grouped.weekly.filter(q => q.status === 'available'),
  ].slice(0, 3);

  const handleStart = async (questId: string) => {
    await startQuest(questId);
  };

  const handleClaim = async (questId: string) => {
    await claimReward(questId);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  if (priorityQuests.length === 0) {
    return (
      <div className="text-center py-4">
        <Scroll className="w-6 h-6 mx-auto text-muted-foreground mb-1.5" />
        <p className="text-xs text-muted-foreground mb-2">No active quests right now</p>
        <SciFiButton asChild variant="ghost" size="sm" className="h-6 text-xs">
          <Link to="/quests">Browse Quest Journal</Link>
        </SciFiButton>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Level indicator */}
      {userLevel && (
        <div className="flex items-center justify-between text-[10px] mb-1">
          <span className="text-muted-foreground">
            Level {userLevel.current_level}
          </span>
          <span className="text-primary font-medium">
            {userLevel.quests_completed} completed
          </span>
        </div>
      )}

      {/* Quest list */}
      {priorityQuests.map((quest) => (
        <QuestItem
          key={quest.id}
          quest={quest}
          onStart={() => handleStart(quest.id)}
          onClaim={() => handleClaim(quest.id)}
        />
      ))}

      {/* View all link */}
      <Link 
        to="/quests" 
        className="flex items-center justify-center gap-1 text-[10px] text-neon-cyan hover:underline pt-1"
      >
        View Quest Journal
        <ChevronRight className="w-2.5 h-2.5" />
      </Link>
    </div>
  );
}

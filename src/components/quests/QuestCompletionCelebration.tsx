import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, Star, Zap, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ShootingStarsExplosion } from '@/components/gamification/ShootingStarsExplosion';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import type { Quest } from '@/hooks/useQuests';

interface QuestCompletionCelebrationProps {
  quest: Quest | null;
  onClaim: () => void;
  onDismiss: () => void;
}

export function QuestCompletionCelebration({ 
  quest, 
  onClaim, 
  onDismiss 
}: QuestCompletionCelebrationProps) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  const hasTriggeredRef = useRef(false);

  // Trigger haptic and sound on quest completion
  useEffect(() => {
    if (quest && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      
      const isStoryQuest = quest.quest_type === 'story';
      const isHighReward = quest.credits_reward >= 50 || quest.xp_reward >= 100;
      
      // Play celebration haptic pattern
      trigger('achievement');
      
      // Extra haptic burst for high-value quests
      if (isStoryQuest || isHighReward) {
        setTimeout(() => trigger('success'), 200);
        setTimeout(() => trigger('success'), 400);
      }
      
      // Play sound
      if (isStoryQuest) {
        playSound('levelUp');
      } else if (isHighReward) {
        playSound('achievementRare');
      } else {
        playSound('achievement');
      }
    }
    
    // Reset when quest changes
    if (!quest) {
      hasTriggeredRef.current = false;
    }
  }, [quest, trigger, playSound]);

  if (!quest) return null;

  const isStoryQuest = quest.quest_type === 'story';
  const isHighReward = quest.credits_reward >= 50 || quest.xp_reward >= 100;

  const handleClaim = () => {
    trigger('success');
    playSound('coinCollect');
    onClaim();
  };

  return (
    <>
      <ShootingStarsExplosion 
        isActive={!!quest} 
        starCount={isHighReward ? 50 : 35}
        isIntense={isStoryQuest || isHighReward}
        duration={4000}
      />
      
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div 
            className="absolute inset-0 bg-background/70 backdrop-blur-sm pointer-events-auto"
            onClick={onDismiss}
          />
          
          {/* Content */}
          <motion.div
            className="relative pointer-events-auto max-w-md mx-4"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          >
            {/* Glow effect */}
            <motion.div
              className="absolute -inset-4 rounded-3xl bg-primary/30 blur-2xl"
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            
            <div className="relative bg-card/95 backdrop-blur-md border-2 border-primary/50 rounded-2xl p-8 text-center overflow-hidden">
              {/* Story quest badge */}
              {isStoryQuest && (
                <motion.div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ scale: 0, y: -20 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="text-xs font-bold text-white">⭐ Story Quest Complete!</span>
                </motion.div>
              )}
              
              {/* Quest icon with animation */}
              <motion.div
                className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-violet-600 flex items-center justify-center mb-4"
                animate={{
                  y: [0, -10, 0],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Scroll className="w-10 h-10 text-white" />
              </motion.div>
              
              {/* Title */}
              <motion.h2
                className="text-xl font-bold bg-gradient-to-r from-primary to-violet-400 bg-clip-text text-transparent mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                Quest Complete!
              </motion.h2>
              
              <motion.p
                className="text-lg font-semibold text-foreground mb-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {quest.title}
              </motion.p>
              
              {/* Story completion text */}
              {quest.story_complete && (
                <motion.p
                  className="text-sm text-muted-foreground mb-4 italic"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  "{quest.story_complete}"
                </motion.p>
              )}
              
              {/* Rewards display */}
              <motion.div
                className="flex items-center justify-center gap-4 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20">
                  <Zap className="w-5 h-5 text-amber-400" />
                  <span className="text-amber-400 font-bold">+{quest.credits_reward}</span>
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500/20">
                  <Star className="w-5 h-5 text-violet-400" />
                  <span className="text-violet-400 font-bold">+{quest.xp_reward} XP</span>
                </div>
                
                {quest.unlock_content_type && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20">
                    <Gift className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Unlock!</span>
                  </div>
                )}
              </motion.div>
              
              {/* Claim button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  size="lg"
                  onClick={handleClaim}
                  className="w-full gap-2 bg-gradient-to-r from-primary to-violet-600 hover:from-primary/90 hover:to-violet-600/90"
                >
                  <Gift className="w-5 h-5" />
                  Claim Rewards
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

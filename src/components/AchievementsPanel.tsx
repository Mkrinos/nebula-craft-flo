import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Flame, ChevronRight } from 'lucide-react';
import { SciFiCard } from '@/components/ui/sci-fi-card';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { AchievementBadge } from './AchievementBadge';
import { useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/hooks/useAchievements';

interface AchievementsPanelProps {
  compact?: boolean;
  maxDisplay?: number;
}

export function AchievementsPanel({ compact = false, maxDisplay = 6 }: AchievementsPanelProps) {
  const { achievements, userAchievements, userStreak, loading, isUnlocked, getProgress } = useAchievements();
  const [progressMap, setProgressMap] = useState<Record<string, { current: number; target: number }>>({});

  // Load progress for all achievements
  useEffect(() => {
    const loadProgress = async () => {
      const map: Record<string, { current: number; target: number }> = {};
      for (const achievement of achievements) {
        map[achievement.id] = await getProgress(achievement);
      }
      setProgressMap(map);
    };
    if (achievements.length > 0) {
      loadProgress();
    }
  }, [achievements, getProgress]);

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  // Group achievements by category
  const grouped = achievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) acc[achievement.category] = [];
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, Achievement[]>);

  const categoryLabels: Record<string, string> = {
    creator: '🎨 Creator',
    explorer: '🔍 Explorer', 
    dedication: '🔥 Dedication',
    general: '⭐ General'
  };

  if (loading) {
    return (
      <SciFiCard className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-6 gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="w-14 h-14 rounded-xl" />
          ))}
        </div>
      </SciFiCard>
    );
  }

  if (compact) {
    // Show only unlocked achievements in a row
    const displayAchievements = achievements
      .filter(a => isUnlocked(a.id))
      .slice(0, maxDisplay);

    return (
      <SciFiCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Achievements</span>
            <SciFiBadge variant="accent" size="sm">
              {unlockedCount}/{totalCount}
            </SciFiBadge>
          </div>
          {userStreak && userStreak.current_streak > 0 && (
            <div className="flex items-center gap-1 text-orange-400">
              <Flame className="w-4 h-4" />
              <span className="text-sm font-medium">{userStreak.current_streak} day streak</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-1">
          {displayAchievements.length > 0 ? (
            displayAchievements.map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                isUnlocked={true}
                size="sm"
              />
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No achievements yet. Start creating!</p>
          )}
          {unlockedCount > maxDisplay && (
            <div className="flex items-center text-sm text-muted-foreground">
              +{unlockedCount - maxDisplay} more
            </div>
          )}
        </div>
      </SciFiCard>
    );
  }

  return (
    <SciFiCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-foreground">Achievements</h3>
            <p className="text-sm text-muted-foreground">
              {unlockedCount} of {totalCount} unlocked
            </p>
          </div>
        </div>
        {userStreak && userStreak.current_streak > 0 && (
          <motion.div 
            className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20"
            animate={{ scale: [1, 1.02, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-sm font-semibold text-orange-400">
              {userStreak.current_streak} day streak
            </span>
          </motion.div>
        )}
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).map(([category, categoryAchievements]) => (
          <div key={category}>
            <h4 className="text-sm font-medium text-muted-foreground mb-3">
              {categoryLabels[category] || category}
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {categoryAchievements.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  isUnlocked={isUnlocked(achievement.id)}
                  progress={progressMap[achievement.id]}
                  size="md"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SciFiCard>
  );
}

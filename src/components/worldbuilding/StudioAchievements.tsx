import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Trophy, Lock, Check, Star, Sparkles, 
  Home, Palette, Users, Calendar, Heart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useAchievements } from '@/hooks/useAchievements';
import { useStudioSpaces } from '@/hooks/useStudioSpaces';
import { useStudioSocial } from '@/hooks/useStudioSocial';
import { useAuth } from '@/hooks/useAuth';

interface StudioAchievementsProps {
  className?: string;
}

const STUDIO_ACHIEVEMENT_IDS = [
  'studio_first_visitor',
  'studio_popular',
  'studio_famous',
  'studio_decorator',
  'studio_master',
  'event_participant',
  'studio_liked',
];

const ACHIEVEMENT_ICONS: Record<string, React.ReactNode> = {
  studio_first_visitor: <Users className="w-5 h-5" />,
  studio_popular: <Star className="w-5 h-5" />,
  studio_famous: <Trophy className="w-5 h-5" />,
  studio_decorator: <Palette className="w-5 h-5" />,
  studio_master: <Home className="w-5 h-5" />,
  event_participant: <Calendar className="w-5 h-5" />,
  studio_liked: <Heart className="w-5 h-5" />,
};

export function StudioAchievements({ className }: StudioAchievementsProps) {
  const { user } = useAuth();
  const { achievements, userAchievements, isUnlocked: isAchievementUnlocked } = useAchievements();
  const { userStudios, placements } = useStudioSpaces();
  const { visits, likes, userParticipations } = useStudioSocial();

  // Filter to studio-related achievements
  const studioAchievements = useMemo(() => {
    return achievements.filter(a => STUDIO_ACHIEVEMENT_IDS.includes(a.id));
  }, [achievements]);

  // Calculate progress for each achievement
  const getProgress = (achievementId: string, requirementValue: number) => {
    switch (achievementId) {
      case 'studio_first_visitor':
      case 'studio_popular':
      case 'studio_famous':
        return { current: visits.length, total: requirementValue };
      case 'studio_decorator':
        return { current: placements.length, total: requirementValue };
      case 'studio_master':
        return { current: userStudios.length, total: requirementValue };
      case 'event_participant':
        return { current: userParticipations.length, total: requirementValue };
      case 'studio_liked':
        return { current: likes.length, total: requirementValue };
      default:
        return { current: 0, total: requirementValue };
    }
  };

  const unlockedCount = studioAchievements.filter(a => isAchievementUnlocked(a.id)).length;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold">Studio Achievements</h3>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Sparkles className="w-3 h-3" />
          {unlockedCount}/{studioAchievements.length}
        </Badge>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {studioAchievements.map((achievement, index) => {
          const isUnlocked = isAchievementUnlocked(achievement.id);
          const progress = getProgress(achievement.id, achievement.requirement_value);
          const progressPercent = Math.min(100, (progress.current / progress.total) * 100);
          const icon = ACHIEVEMENT_ICONS[achievement.id] || <Trophy className="w-5 h-5" />;

          return (
            <motion.div
              key={achievement.id}
              className={cn(
                "relative p-4 rounded-xl border transition-all",
                isUnlocked
                  ? "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30"
                  : "bg-muted/30 border-muted"
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    isUnlocked
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-muted text-muted-foreground"
                  )}
                >
                  {isUnlocked ? (
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {icon}
                    </motion.div>
                  ) : (
                    icon
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className={cn(
                      "font-medium text-sm truncate",
                      !isUnlocked && "text-muted-foreground"
                    )}>
                      {achievement.name}
                    </h4>
                    {isUnlocked && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center"
                      >
                        <Check className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {achievement.description}
                  </p>

                  {/* Progress */}
                  {!isUnlocked && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span>{progress.current}/{progress.total}</span>
                      </div>
                      <Progress value={progressPercent} className="h-1.5" />
                    </div>
                  )}

                  {/* Reward */}
                  <div className="flex items-center gap-1 mt-2">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span className="text-xs font-medium">
                      +{achievement.credits_reward} credits
                    </span>
                  </div>
                </div>

                {/* Lock Icon */}
                {!isUnlocked && (
                  <Lock className="w-4 h-4 text-muted-foreground opacity-50" />
                )}
              </div>

              {/* Unlocked Glow Effect */}
              {isUnlocked && (
                <motion.div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(245, 158, 11, 0.1) 0%, transparent 70%)',
                  }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Tip */}
      <motion.div
        className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <p className="text-xs text-muted-foreground">
          💡 Share your studio and participate in events to unlock more achievements!
        </p>
      </motion.div>
    </div>
  );
}

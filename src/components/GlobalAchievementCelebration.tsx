import { useAchievements } from '@/hooks/useAchievements';
import { AchievementCelebration } from './AchievementCelebration';
import { useAuth } from '@/hooks/useAuth';

export function GlobalAchievementCelebration() {
  const { user } = useAuth();
  const { celebratingAchievement, handleCelebrationComplete } = useAchievements();

  if (!user) return null;

  return (
    <AchievementCelebration 
      achievement={celebratingAchievement} 
      onComplete={handleCelebrationComplete} 
    />
  );
}

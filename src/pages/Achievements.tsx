import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Filter, Star, Sparkles, Share2 } from 'lucide-react';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { SEOHead } from '@/components/SEOHead';
import { PullToRefresh } from '@/components/PullToRefresh';
import { StreakDisplay, ProgressMilestone, AchievementCard } from '@/components/gamification';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAchievements } from '@/hooks/useAchievements';
import { Skeleton } from '@/components/ui/skeleton';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';

const categoryLabels: Record<string, { label: string; icon: typeof Trophy }> = {
  general: { label: 'General', icon: Trophy },
  creation: { label: 'Creation', icon: Sparkles },
  social: { label: 'Social', icon: Star },
  streak: { label: 'Streaks', icon: Flame },
  collection: { label: 'Collection', icon: Filter },
};

export default function Achievements() {
  const isMobile = useIsMobile();
  const { 
    achievements, 
    userAchievements, 
    userStreak, 
    loading, 
    isUnlocked, 
    getProgress 
  } = useAchievements();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, { current: number; target: number }>>({});

  // Load progress for all achievements
  useEffect(() => {
    const loadProgress = async () => {
      const progressData: Record<string, { current: number; target: number }> = {};
      for (const achievement of achievements) {
        progressData[achievement.id] = await getProgress(achievement);
      }
      setProgressMap(progressData);
    };
    if (achievements.length > 0) {
      loadProgress();
    }
  }, [achievements, getProgress]);

  // Get unique categories
  const categories = [...new Set(achievements.map(a => a.category))];
  
  // Filter achievements by category
  const filteredAchievements = selectedCategory
    ? achievements.filter(a => a.category === selectedCategory)
    : achievements;

  // Group by category for display
  const groupedAchievements = filteredAchievements.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  // Stats
  const totalUnlocked = userAchievements.length;
  const totalAchievements = achievements.length;
  const totalCreditsEarned = userAchievements.reduce((sum, ua) => {
    const achievement = achievements.find(a => a.id === ua.achievement_id);
    return sum + (achievement?.credits_reward || 0);
  }, 0);

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Achievements refreshed');
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8 pb-24">
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Skeleton key={i} className="h-40 w-full" />
              ))}
            </div>
          </div>
        </main>
        {isMobile && <MobileBottomNav />}
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="min-h-screen bg-background">
        <SEOHead 
          title="Achievements - Your Creative Milestones"
          description="Track your progress and unlock achievements as you create. Earn badges and credits for reaching creative milestones."
          breadcrumbs={[
            { name: 'Home', url: '/' },
            { name: 'Achievements', url: '/achievements' },
          ]}
        />
        <Navigation />
        
        <main className="container mx-auto px-4 py-8 pb-24">
        {/* Back Button and Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/">Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Achievements</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <SciFiFrame variant="default" className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Trophy className="w-12 h-12 text-neon-cyan" />
                  <motion.div
                    className="absolute inset-0 bg-neon-cyan/20 rounded-full blur-xl"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-foreground">Achievements</h1>
                  <p className="text-muted-foreground">Track your progress and unlock rewards</p>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="flex flex-wrap justify-center gap-4">
                <div className="bg-card/50 rounded-lg p-4 border border-border/50 text-center min-w-[100px]">
                  <p className="text-2xl font-bold text-neon-cyan">{totalUnlocked}</p>
                  <p className="text-xs text-muted-foreground">Unlocked</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border/50 text-center min-w-[100px]">
                  <p className="text-2xl font-bold text-primary">{totalAchievements}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="bg-card/50 rounded-lg p-4 border border-border/50 text-center min-w-[100px]">
                  <p className="text-2xl font-bold text-amber-400">{totalCreditsEarned}</p>
                  <p className="text-xs text-muted-foreground">Credits Earned</p>
                </div>
              </div>
            </div>

            {/* Enhanced Streak Display */}
            {userStreak && (
              <div className="mt-6">
                <StreakDisplay
                  currentStreak={userStreak.current_streak}
                  longestStreak={userStreak.longest_streak}
                  animated={true}
                />
              </div>
            )}

            {/* Overall Progress with Milestones */}
            <div className="mt-6">
              <ProgressMilestone
                current={totalUnlocked}
                max={totalAchievements}
                label="Overall Progress"
                variant="gradient"
                size="md"
                milestones={[
                  { id: '25', label: 'Starter', value: 25, icon: <Star className="w-3 h-3" />, color: 'text-blue-400' },
                  { id: '50', label: 'Explorer', value: 50, icon: <Sparkles className="w-3 h-3" />, color: 'text-yellow-400' },
                  { id: '75', label: 'Master', value: 75, icon: <Flame className="w-3 h-3" />, color: 'text-orange-400' },
                  { id: '100', label: 'Legend', value: 100, icon: <Trophy className="w-3 h-3" />, color: 'text-emerald-400' },
                ]}
              />
            </div>

            {/* Share Button */}
            <div className="mt-4 flex justify-end">
              <SciFiButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  const shareText = `I've unlocked ${totalUnlocked}/${totalAchievements} achievements on NexusTouch! 🏆`;
                  if (navigator.share) {
                    navigator.share({ text: shareText });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    toast.success('Achievement stats copied to clipboard!');
                  }
                }}
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share Progress
              </SciFiButton>
            </div>
          </SciFiFrame>
        </motion.div>

        {/* Category Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex flex-wrap gap-2">
            <SciFiButton
              variant={selectedCategory === null ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              <Filter className="w-4 h-4 mr-1" />
              All
            </SciFiButton>
            {categories.map(category => {
              const config = categoryLabels[category] || { label: category, icon: Trophy };
              const Icon = config.icon;
              const count = achievements.filter(a => a.category === category).length;
              const unlockedCount = achievements.filter(a => 
                a.category === category && isUnlocked(a.id)
              ).length;
              
              return (
                <SciFiButton
                  key={category}
                  variant={selectedCategory === category ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                >
                  <Icon className="w-4 h-4 mr-1" />
                  {config.label}
                  <SciFiBadge variant="outline" className="ml-2 text-xs">
                    {unlockedCount}/{count}
                  </SciFiBadge>
                </SciFiButton>
              );
            })}
          </div>
        </motion.div>

        {/* Achievement Grid by Category */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory || 'all'}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => {
              const config = categoryLabels[category] || { label: category, icon: Trophy };
              const Icon = config.icon;
              
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 mb-4">
                    <Icon className="w-5 h-5 text-neon-cyan" />
                    <h2 className="text-lg font-semibold text-foreground">{config.label}</h2>
                    <div className="flex-1 h-px bg-border/50" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryAchievements.map((achievement, index) => {
                      const unlocked = isUnlocked(achievement.id);
                      const progress = progressMap[achievement.id];
                      const unlockedAt = userAchievements.find(
                        ua => ua.achievement_id === achievement.id
                      )?.unlocked_at;
                      
                      return (
                        <AchievementCard
                          key={achievement.id}
                          achievement={achievement}
                          isUnlocked={unlocked}
                          progress={progress}
                          unlockedAt={unlockedAt}
                          index={index}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Empty State */}
        {filteredAchievements.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No achievements found in this category</p>
          </motion.div>
        )}
      </main>

      {isMobile && <MobileBottomNav />}
    </div>
    </PullToRefresh>
  );
}

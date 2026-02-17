import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { Scroll, Star, Flame, Clock, Trophy, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Navigation from '@/components/Navigation';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { PullToRefresh } from '@/components/PullToRefresh';
import StarfieldBackground from '@/components/StarfieldBackground';
import { QuestCard } from '@/components/quests/QuestCard';
import { LevelProgress } from '@/components/quests/LevelProgress';
import { QuestCompletionCelebration } from '@/components/quests/QuestCompletionCelebration';
import { QuestsTour } from '@/components/quests/QuestsTour';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/hooks/useAuth';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import { BackButton } from '@/components/BackButton';
import { toast } from 'sonner';

export default function Quests() {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const {
    userLevel,
    isLoading,
    completedQuest,
    startQuest,
    claimReward,
    clearCompletedQuest,
    questsByType,
    xpProgress,
  } = useQuests();

  const [activeTab, setActiveTab] = useState('daily');
  const [loadingQuestId, setLoadingQuestId] = useState<string | null>(null);

  const grouped = questsByType();

  const handleStartQuest = async (questId: string) => {
    setLoadingQuestId(questId);
    await startQuest(questId);
    setLoadingQuestId(null);
  };

  const handleClaimReward = async (questId: string) => {
    setLoadingQuestId(questId);
    await claimReward(questId);
    setLoadingQuestId(null);
    clearCompletedQuest();
  };

  const tabCounts = {
    daily: grouped.daily.filter(q => q.status !== 'claimed').length,
    weekly: grouped.weekly.filter(q => q.status !== 'claimed').length,
    story: grouped.story.filter(q => q.status !== 'claimed').length,
  };

  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success('Quests refreshed');
  }, []);

  return (
    <>
      <Helmet>
        <title>Quest Journal | NexusTouch</title>
        <meta name="description" content="Embark on creative quests, earn rewards, and level up your artistic journey!" />
      </Helmet>

      <PullToRefresh onRefresh={handleRefresh}>
        <div className="min-h-screen bg-background relative">
          <StarfieldBackground />
          <Navigation />

          <main className={`relative z-10 pt-20 ${isMobile ? 'pb-24' : 'pb-8'} px-4`}>
            <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <div className="mb-6">
              <BackButton />
            </div>
            
            {/* Header */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-4">
                <Scroll className="w-4 h-4 text-primary" />
                <span className="text-sm text-primary font-medium">Quest Journal</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary via-violet-400 to-cyan-400 bg-clip-text text-transparent mb-2">
                Your Creative Quests
              </h1>
              <p className="text-muted-foreground max-w-md mx-auto">
                Complete quests to earn credits, XP, and unlock exclusive content!
              </p>
            </motion.div>

            {/* Level Progress */}
            {user && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <LevelProgress userLevel={userLevel} xpProgress={xpProgress()} />
              </motion.div>
            )}

            {/* Quest Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-card/50 backdrop-blur-sm">
                <TabsTrigger value="daily" className="gap-2 data-[state=active]:bg-primary/20">
                  <Clock className="w-4 h-4" />
                  <span className="hidden sm:inline">Daily</span>
                  {tabCounts.daily > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/30">
                      {tabCounts.daily}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="weekly" className="gap-2 data-[state=active]:bg-primary/20">
                  <Flame className="w-4 h-4" />
                  <span className="hidden sm:inline">Weekly</span>
                  {tabCounts.weekly > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-primary/30">
                      {tabCounts.weekly}
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="story" className="gap-2 data-[state=active]:bg-primary/20">
                  <Star className="w-4 h-4" />
                  <span className="hidden sm:inline">Story</span>
                  {tabCounts.story > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-amber-500/30">
                      {tabCounts.story}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>

              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-48 rounded-xl" />
                  ))}
                </div>
              ) : (
                <>
                  <TabsContent value="daily" className="mt-0">
                    <QuestList
                      quests={grouped.daily}
                      onStart={handleStartQuest}
                      onClaim={handleClaimReward}
                      loadingQuestId={loadingQuestId}
                      emptyMessage="No daily quests available. Check back tomorrow!"
                    />
                  </TabsContent>

                  <TabsContent value="weekly" className="mt-0">
                    <QuestList
                      quests={grouped.weekly}
                      onStart={handleStartQuest}
                      onClaim={handleClaimReward}
                      loadingQuestId={loadingQuestId}
                      emptyMessage="No weekly quests available. Check back next week!"
                    />
                  </TabsContent>

                  <TabsContent value="story" className="mt-0">
                    <div className="mb-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-2 text-amber-400 mb-1">
                        <Trophy className="w-4 h-4" />
                        <span className="font-semibold">Story Quests</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Permanent progression quests that unlock as you master NexusTouch.
                      </p>
                    </div>
                    <QuestList
                      quests={grouped.story}
                      onStart={handleStartQuest}
                      onClaim={handleClaimReward}
                      loadingQuestId={loadingQuestId}
                      emptyMessage="You've completed all story quests! More coming soon."
                    />
                  </TabsContent>
                </>
              )}
            </Tabs>

            {/* Not logged in message */}
            {!user && !isLoading && (
              <motion.div
                className="text-center py-12 px-4 rounded-xl bg-card/50 border border-primary/20"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Start Your Quest Journey</h3>
                <p className="text-muted-foreground mb-4">
                  Sign in to accept quests, earn rewards, and track your progress!
                </p>
              </motion.div>
            )}
          </div>
        </main>

          {isMobile && <MobileBottomNav />}
          
          {/* Quests Tour */}
          <QuestsTour />
        </div>
      </PullToRefresh>

      {/* Quest Completion Celebration */}
      <QuestCompletionCelebration
        quest={completedQuest}
        onClaim={() => completedQuest && handleClaimReward(completedQuest.id)}
        onDismiss={clearCompletedQuest}
      />
    </>
  );
}

interface QuestListProps {
  quests: Array<any>;
  onStart: (id: string) => void;
  onClaim: (id: string) => void;
  loadingQuestId: string | null;
  emptyMessage: string;
}

function QuestList({ quests, onStart, onClaim, loadingQuestId, emptyMessage }: QuestListProps) {
  // Sort: completed first, then in_progress, then available, then claimed
  const sortedQuests = [...quests].sort((a, b) => {
    const order = { completed: 0, in_progress: 1, available: 2, claimed: 3, expired: 4 };
    return (order[a.status as keyof typeof order] ?? 5) - (order[b.status as keyof typeof order] ?? 5);
  });

  if (sortedQuests.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Scroll className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <motion.div
      className="grid gap-4 md:grid-cols-2"
      initial="hidden"
      animate="visible"
      variants={{
        visible: { transition: { staggerChildren: 0.1 } },
      }}
    >
      {sortedQuests.map((quest, index) => (
        <motion.div
          key={quest.id}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <QuestCard
            quest={quest}
            onStart={() => onStart(quest.id)}
            onClaim={() => onClaim(quest.id)}
            isLoading={loadingQuestId === quest.id}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

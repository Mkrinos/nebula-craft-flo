import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, Crown, Medal, Heart, Eye, Sparkles, 
  TrendingUp, Star, Users, ChevronRight
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  studio_name: string;
  likes: number;
  visits: number;
  decorations: number;
  is_current_user: boolean;
  change?: 'up' | 'down' | 'same';
}

type LeaderboardType = 'likes' | 'visits' | 'decorations';

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-6 h-6 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground w-6 text-center">#{rank}</span>;
  }
}

function getRankStyle(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) return 'bg-primary/20 border-primary/50 ring-2 ring-primary/30';
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/10 border-yellow-500/40';
    case 2:
      return 'bg-gradient-to-r from-gray-400/20 to-gray-300/10 border-gray-400/40';
    case 3:
      return 'bg-gradient-to-r from-amber-600/20 to-amber-700/10 border-amber-600/40';
    default:
      return 'bg-card/50 border-border/50';
  }
}

export function StudioLeaderboard() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [activeTab, setActiveTab] = useState<LeaderboardType>('likes');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const fetchLeaderboard = useCallback(async (type: LeaderboardType) => {
    setIsLoading(true);
    try {
      // Get all active studios
      const { data: studiosData } = await supabase
        .from('user_studios')
        .select(`
          studio_id,
          user_id,
          studio_spaces!inner (id, name)
        `)
        .eq('is_active', true);
      
      if (!studiosData) return;
      
      // Get profiles
      const ownerIds = [...new Set(studiosData.map(s => s.user_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', ownerIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      // Get aggregates based on type
      let aggregateData: Record<string, number> = {};
      
      if (type === 'likes') {
        const { data: likesData } = await supabase
          .from('studio_likes')
          .select('owner_id');
        
        likesData?.forEach(l => {
          aggregateData[l.owner_id] = (aggregateData[l.owner_id] || 0) + 1;
        });
      } else if (type === 'visits') {
        const { data: visitsData } = await supabase
          .from('studio_visits')
          .select('owner_id');
        
        visitsData?.forEach(v => {
          aggregateData[v.owner_id] = (aggregateData[v.owner_id] || 0) + 1;
        });
      } else if (type === 'decorations') {
        const { data: decorationsData } = await supabase
          .from('user_studio_placements')
          .select('user_id');
        
        decorationsData?.forEach(d => {
          aggregateData[d.user_id] = (aggregateData[d.user_id] || 0) + 1;
        });
      }
      
      // Build entries
      const uniqueUsers = [...new Set(studiosData.map(s => s.user_id))];
      const leaderboardEntries: LeaderboardEntry[] = uniqueUsers.map(userId => {
        const studio = studiosData.find(s => s.user_id === userId);
        const profile = profileMap.get(userId);
        const studioSpace = studio?.studio_spaces as unknown as { id: string; name: string };
        
        return {
          rank: 0,
          user_id: userId,
          display_name: profile?.display_name || 'Explorer',
          avatar_url: profile?.avatar_url || undefined,
          studio_name: studioSpace?.name || 'Studio',
          likes: 0,
          visits: 0,
          decorations: 0,
          [type]: aggregateData[userId] || 0,
          is_current_user: userId === user?.id,
        };
      });
      
      // Sort and assign ranks
      leaderboardEntries.sort((a, b) => b[type] - a[type]);
      leaderboardEntries.forEach((entry, index) => {
        entry.rank = index + 1;
      });
      
      // Get top 20 and user's position
      const top20 = leaderboardEntries.slice(0, 20);
      setEntries(top20);
      
      // Find user's rank if not in top 20
      const userEntry = leaderboardEntries.find(e => e.is_current_user);
      if (userEntry && !top20.some(e => e.is_current_user)) {
        setUserRank(userEntry);
      } else {
        setUserRank(null);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchLeaderboard(activeTab);
  }, [activeTab, fetchLeaderboard]);

  const handleTabChange = (value: string) => {
    setActiveTab(value as LeaderboardType);
    trigger('selection');
    playSound('pop');
  };

  const getScoreDisplay = (entry: LeaderboardEntry) => {
    switch (activeTab) {
      case 'likes':
        return (
          <span className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-rose-400" />
            {entry.likes}
          </span>
        );
      case 'visits':
        return (
          <span className="flex items-center gap-1">
            <Eye className="w-4 h-4 text-cyan-400" />
            {entry.visits}
          </span>
        );
      case 'decorations':
        return (
          <span className="flex items-center gap-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            {entry.decorations}
          </span>
        );
    }
  };

  return (
    <SciFiFrame glowIntensity="subtle" className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h3 className="font-display text-lg font-bold">Studio Leaderboard</h3>
        </div>
        <Button variant="ghost" size="sm" onClick={() => fetchLeaderboard(activeTab)} className="gap-1">
          <TrendingUp className="w-4 h-4" />
          Refresh
        </Button>
      </div>
      
      {/* Type Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="likes" className="gap-1 text-xs sm:text-sm">
            <Heart className="w-4 h-4" />
            <span className="hidden sm:inline">Most Liked</span>
            <span className="sm:hidden">Likes</span>
          </TabsTrigger>
          <TabsTrigger value="visits" className="gap-1 text-xs sm:text-sm">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Most Visited</span>
            <span className="sm:hidden">Visits</span>
          </TabsTrigger>
          <TabsTrigger value="decorations" className="gap-1 text-xs sm:text-sm">
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">Most Decorated</span>
            <span className="sm:hidden">Decor</span>
          </TabsTrigger>
        </TabsList>
        
        <div className="min-h-[400px]">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-lg" />
              ))}
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No entries yet</p>
              <p className="text-sm mt-1">Be the first to climb the ranks!</p>
            </div>
          ) : (
            <motion.div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {entries.map((entry, index) => (
                  <motion.div
                    key={entry.user_id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.03 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border transition-all",
                      getRankStyle(entry.rank, entry.is_current_user)
                    )}
                    whileHover={{ x: 4 }}
                  >
                    {/* Rank */}
                    <div className="w-8 flex items-center justify-center">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    {/* Avatar */}
                    <Avatar className={cn(
                      "w-10 h-10 border-2",
                      entry.rank === 1 && "border-yellow-400",
                      entry.rank === 2 && "border-gray-300",
                      entry.rank === 3 && "border-amber-600",
                      entry.rank > 3 && "border-border"
                    )}>
                      <AvatarImage src={entry.avatar_url} />
                      <AvatarFallback className="text-xs font-bold">
                        {entry.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium truncate",
                        entry.is_current_user && "text-primary"
                      )}>
                        {entry.display_name}
                        {entry.is_current_user && (
                          <Badge variant="outline" className="ml-2 text-[10px] py-0">You</Badge>
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{entry.studio_name}</p>
                    </div>
                    
                    {/* Score */}
                    <div className="text-right font-bold">
                      {getScoreDisplay(entry)}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {/* Show user's rank if not in top 20 */}
              {userRank && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-4 pt-4 border-t border-dashed"
                >
                  <p className="text-xs text-muted-foreground text-center mb-2">Your Position</p>
                  <div className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    getRankStyle(0, true)
                  )}>
                    <div className="w-8 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">#{userRank.rank}</span>
                    </div>
                    
                    <Avatar className="w-10 h-10 border-2 border-primary">
                      <AvatarImage src={userRank.avatar_url} />
                      <AvatarFallback className="text-xs font-bold">
                        {userRank.display_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-primary">
                        {userRank.display_name}
                        <Badge variant="outline" className="ml-2 text-[10px] py-0">You</Badge>
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{userRank.studio_name}</p>
                    </div>
                    
                    <div className="text-right font-bold">
                      {getScoreDisplay(userRank)}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </Tabs>
    </SciFiFrame>
  );
}

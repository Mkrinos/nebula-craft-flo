import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Star, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { ContributorBadge } from './ContributorBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface LeaderboardEntry {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  badge_count: number;
  rarity_score: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }>;
}

const RARITY_POINTS = {
  common: 1,
  rare: 3,
  epic: 5,
  legendary: 10
};

export function BadgeLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Fetch all user badges with badge details
      const { data: userBadges, error } = await supabase
        .from('user_contributor_badges')
        .select(`
          user_id,
          badge:contributor_badges(id, name, icon, rarity)
        `);

      if (error) throw error;

      // Group by user and calculate scores
      const userScores = new Map<string, { badges: any[], rarity_score: number }>();
      
      (userBadges || []).forEach(ub => {
        if (!ub.badge) return;
        
        const existing = userScores.get(ub.user_id) || { badges: [], rarity_score: 0 };
        const badge = ub.badge as { id: string; name: string; icon: string; rarity: string };
        existing.badges.push(badge);
        existing.rarity_score += RARITY_POINTS[badge.rarity as keyof typeof RARITY_POINTS] || 1;
        userScores.set(ub.user_id, existing);
      });

      // Get user profiles
      const userIds = Array.from(userScores.keys());
      if (userIds.length === 0) {
        setLeaderboard([]);
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      // Build leaderboard
      const leaderboardData: LeaderboardEntry[] = Array.from(userScores.entries())
        .map(([userId, data]) => {
          const profile = profileMap.get(userId);
          return {
            user_id: userId,
            display_name: profile?.display_name || null,
            avatar_url: profile?.avatar_url || null,
            badge_count: data.badges.length,
            rarity_score: data.rarity_score,
            badges: data.badges
          };
        })
        .sort((a, b) => b.rarity_score - a.rarity_score || b.badge_count - a.badge_count)
        .slice(0, 10);

      setLeaderboard(leaderboardData);
    } catch (error) {
      console.error('Error fetching badge leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-5 h-5 text-yellow-400" />;
      case 2: return <Medal className="w-5 h-5 text-gray-300" />;
      case 3: return <Medal className="w-5 h-5 text-amber-600" />;
      default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-r from-yellow-500/20 to-yellow-500/5 border-yellow-500/30';
      case 2: return 'bg-gradient-to-r from-gray-400/20 to-gray-400/5 border-gray-400/30';
      case 3: return 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 border-amber-600/30';
      default: return 'bg-muted/30 border-border/30';
    }
  };

  if (loading) {
    return (
      <SciFiFrame className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Badge Leaderboard</h3>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </SciFiFrame>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <SciFiFrame className="p-6 text-center">
        <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No badge earners yet. Be the first!</p>
      </SciFiFrame>
    );
  }

  return (
    <SciFiFrame className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Badge Leaderboard</h3>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Sparkles className="w-3 h-3" />
          <span>Rarity Score</span>
        </div>
      </div>

      <div className="space-y-3">
        {leaderboard.map((entry, index) => (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={cn(
              "flex items-center gap-3 p-3 rounded-lg border transition-all hover:scale-[1.02]",
              getRankBg(index + 1)
            )}
          >
            {/* Rank */}
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              {getRankIcon(index + 1)}
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 overflow-hidden">
              {entry.avatar_url ? (
                <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <Star className="w-5 h-5 text-primary" />
              )}
            </div>

            {/* Name & Badges Preview */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-foreground truncate">
                {entry.display_name || 'Anonymous Creator'}
              </p>
              <div className="flex items-center gap-1 mt-1 overflow-hidden">
                {entry.badges.slice(0, 4).map(badge => (
                  <ContributorBadge
                    key={badge.id}
                    badge={badge as any}
                    size="sm"
                    earned
                    showTooltip={false}
                  />
                ))}
                {entry.badges.length > 4 && (
                  <span className="text-xs text-muted-foreground ml-1">
                    +{entry.badges.length - 4}
                  </span>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 justify-end">
                <Sparkles className="w-3 h-3 text-primary" />
                <span className="font-bold text-foreground">{entry.rarity_score}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {entry.badge_count} badge{entry.badge_count !== 1 ? 's' : ''}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Scoring Info */}
      <div className="mt-6 p-4 rounded-lg bg-muted/30 border border-border/30">
        <h4 className="font-semibold text-foreground mb-2 text-sm">Rarity Scoring</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">Common: 1 pt</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span className="text-muted-foreground">Rare: 3 pts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span className="text-muted-foreground">Epic: 5 pts</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-muted-foreground">Legendary: 10 pts</span>
          </div>
        </div>
      </div>
    </SciFiFrame>
  );
}

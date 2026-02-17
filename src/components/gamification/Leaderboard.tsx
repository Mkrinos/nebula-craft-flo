import { motion } from 'framer-motion';
import { Trophy, Medal, Crown, TrendingUp, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface LeaderboardEntry {
  id: string;
  rank: number;
  displayName: string;
  avatarUrl?: string;
  score: number;
  change?: 'up' | 'down' | 'same';
  isCurrentUser?: boolean;
  badges?: string[];
}

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  type?: 'global' | 'friends' | 'weekly';
  currentUserId?: string;
  loading?: boolean;
}

function getRankIcon(rank: number) {
  switch (rank) {
    case 1:
      return <Crown className="w-5 h-5 text-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]" />;
    case 2:
      return <Medal className="w-5 h-5 text-gray-300" />;
    case 3:
      return <Medal className="w-5 h-5 text-amber-600" />;
    default:
      return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
}

function getRankBgClass(rank: number, isCurrentUser: boolean) {
  if (isCurrentUser) return 'bg-primary/20 border-primary/50';
  switch (rank) {
    case 1:
      return 'bg-yellow-500/10 border-yellow-500/30';
    case 2:
      return 'bg-gray-300/10 border-gray-300/30';
    case 3:
      return 'bg-amber-600/10 border-amber-600/30';
    default:
      return 'bg-card/50 border-border/50';
  }
}

export function Leaderboard({
  entries,
  title = 'Leaderboard',
  type = 'global',
  currentUserId,
  loading = false,
}: LeaderboardProps) {
  const typeIcons = {
    global: <Trophy className="w-5 h-5" />,
    friends: <Users className="w-5 h-5" />,
    weekly: <Star className="w-5 h-5" />,
  };

  return (
    <SciFiFrame glowIntensity="subtle" className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-primary">{typeIcons[type]}</span>
          <h3 className="font-display text-lg font-bold">{title}</h3>
        </div>
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          {type === 'weekly' ? 'This Week' : type === 'friends' ? 'Friends' : 'All Time'}
        </span>
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {loading ? (
          // Loading skeleton
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 animate-pulse"
            >
              <div className="w-8 h-8 rounded-full bg-muted" />
              <div className="flex-1">
                <div className="w-24 h-4 bg-muted rounded" />
              </div>
              <div className="w-12 h-4 bg-muted rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No entries yet</p>
          </div>
        ) : (
          entries.map((entry, index) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={cn(
                'flex items-center gap-3 p-3 rounded-lg border transition-all',
                getRankBgClass(entry.rank, entry.isCurrentUser || entry.id === currentUserId)
              )}
            >
              {/* Rank */}
              <div className="w-8 flex items-center justify-center">
                {getRankIcon(entry.rank)}
              </div>

              {/* Avatar */}
              <Avatar className="w-10 h-10 border-2 border-border">
                <AvatarImage src={entry.avatarUrl} alt={entry.displayName} />
                <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                  {entry.displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {/* Name & Badges */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'font-medium truncate',
                  entry.isCurrentUser || entry.id === currentUserId ? 'text-primary' : 'text-foreground'
                )}>
                  {entry.displayName}
                  {(entry.isCurrentUser || entry.id === currentUserId) && (
                    <span className="ml-2 text-xs text-primary">(You)</span>
                  )}
                </p>
                {entry.badges && entry.badges.length > 0 && (
                  <div className="flex gap-1 mt-0.5">
                    {entry.badges.slice(0, 3).map((badge, i) => (
                      <span key={i} className="text-xs">{badge}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Score & Change */}
              <div className="text-right">
                <p className="font-bold text-foreground">
                  {entry.score.toLocaleString()}
                </p>
                {entry.change && entry.change !== 'same' && (
                  <span className={cn(
                    'text-xs flex items-center justify-end gap-0.5',
                    entry.change === 'up' ? 'text-emerald-400' : 'text-red-400'
                  )}>
                    <TrendingUp className={cn(
                      'w-3 h-3',
                      entry.change === 'down' && 'rotate-180'
                    )} />
                    {entry.change === 'up' ? '+' : '-'}
                  </span>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </SciFiFrame>
  );
}

// Achievement comparison card
interface AchievementComparisonProps {
  yourCount: number;
  friendCount: number;
  friendName: string;
  totalAchievements: number;
}

export function AchievementComparison({
  yourCount,
  friendCount,
  friendName,
  totalAchievements,
}: AchievementComparisonProps) {
  const yourPercentage = (yourCount / totalAchievements) * 100;
  const friendPercentage = (friendCount / totalAchievements) * 100;
  const isAhead = yourCount > friendCount;

  return (
    <div className="p-4 rounded-xl border border-border bg-card/50">
      <h4 className="text-sm font-medium text-muted-foreground mb-3">
        Achievement Comparison
      </h4>
      
      <div className="space-y-3">
        {/* You */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-primary font-medium">You</span>
            <span>{yourCount}/{totalAchievements}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary"
              initial={{ width: 0 }}
              animate={{ width: `${yourPercentage}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
        </div>

        {/* Friend */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{friendName}</span>
            <span>{friendCount}/{totalAchievements}</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-muted-foreground"
              initial={{ width: 0 }}
              animate={{ width: `${friendPercentage}%` }}
              transition={{ duration: 0.8, delay: 0.2 }}
            />
          </div>
        </div>
      </div>

      <p className={cn(
        'mt-3 text-sm text-center font-medium',
        isAhead ? 'text-emerald-400' : 'text-muted-foreground'
      )}>
        {isAhead
          ? `You're ${yourCount - friendCount} ahead! 🎉`
          : yourCount === friendCount
          ? "You're tied! 🤝"
          : `${friendCount - yourCount} more to catch up!`}
      </p>
    </div>
  );
}

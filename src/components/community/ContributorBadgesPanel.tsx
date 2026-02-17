import { motion } from 'framer-motion';
import { Award, RefreshCw } from 'lucide-react';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { ContributorBadge } from './ContributorBadge';
import { useContributorBadges } from '@/hooks/useContributorBadges';
import { useAuth } from '@/hooks/useAuth';

export function ContributorBadgesPanel() {
  const { user } = useAuth();
  const { 
    allBadges, 
    userBadges, 
    loadingBadges, 
    checkAndAwardBadges,
    hasBadge 
  } = useContributorBadges();

  const earnedCount = userBadges.length;
  const totalCount = allBadges.length;

  if (!user) {
    return (
      <SciFiFrame className="p-6 text-center">
        <Award className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Sign in to track your contributor badges</p>
      </SciFiFrame>
    );
  }

  return (
    <SciFiFrame className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Contributor Badges
          </h3>
          <p className="text-sm text-muted-foreground">
            {earnedCount} of {totalCount} earned
          </p>
        </div>
        <SciFiButton
          variant="ghost"
          size="sm"
          onClick={() => checkAndAwardBadges()}
          title="Check for new badges"
        >
          <RefreshCw className="w-4 h-4" />
        </SciFiButton>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-muted rounded-full mb-6 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(earnedCount / totalCount) * 100}%` }}
          className="h-full bg-gradient-to-r from-primary to-cyan-400"
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </div>

      {/* Badges Grid */}
      {loadingBadges ? (
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {allBadges.map((badge, index) => {
            const earned = hasBadge(badge.id);
            return (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex flex-col items-center text-center gap-2"
              >
                <ContributorBadge badge={badge} size="lg" earned={earned} />
                <div>
                  <p className={`text-xs font-medium ${earned ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {badge.name}
                  </p>
                  <p className={`text-[10px] capitalize ${
                    badge.rarity === 'legendary' ? 'text-yellow-400' :
                    badge.rarity === 'epic' ? 'text-purple-400' :
                    badge.rarity === 'rare' ? 'text-blue-400' :
                    'text-muted-foreground'
                  }`}>
                    {badge.rarity}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Tips */}
      <div className="mt-6 p-4 rounded-lg bg-primary/10 border border-primary/20">
        <h4 className="font-semibold text-foreground mb-2">How to Earn Badges</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>🔍 Suggest new AI platforms to the directory</li>
          <li>💬 Leave kind comments on community creations</li>
          <li>📝 Submit feedback to help improve the platform</li>
          <li>🦋 Follow and connect with other creators</li>
        </ul>
      </div>
    </SciFiFrame>
  );
}

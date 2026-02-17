import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { ContributorBadge } from './ContributorBadge';
import type { ContributorBadge as BadgeType, UserContributorBadge } from '@/hooks/useContributorBadges';

interface ContributorBadgesDisplayProps {
  userId: string;
  maxDisplay?: number;
  size?: 'sm' | 'md' | 'lg';
}

export function ContributorBadgesDisplay({ 
  userId, 
  maxDisplay = 3,
  size = 'sm' 
}: ContributorBadgesDisplayProps) {
  const [badges, setBadges] = useState<UserContributorBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadges = async () => {
      const { data, error } = await supabase
        .from('user_contributor_badges')
        .select('*, badge:contributor_badges(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(maxDisplay);
      
      if (!error && data) {
        setBadges(data as UserContributorBadge[]);
      }
      setLoading(false);
    };

    fetchBadges();
  }, [userId, maxDisplay]);

  if (loading || badges.length === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-1"
    >
      {badges.map((ub, index) => (
        <motion.div
          key={ub.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.1 }}
        >
          <ContributorBadge 
            badge={ub.badge as BadgeType} 
            size={size}
          />
        </motion.div>
      ))}
      {badges.length === maxDisplay && (
        <span className="text-xs text-muted-foreground ml-1">+more</span>
      )}
    </motion.div>
  );
}

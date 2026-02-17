import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface ContributorBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  requirement_type: string;
  requirement_value: number;
  sort_order: number;
}

export interface UserContributorBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  badge?: ContributorBadge;
}

export function useContributorBadges() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all available badges
  const { data: allBadges = [], isLoading: loadingBadges } = useQuery({
    queryKey: ['contributor-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contributor_badges')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as ContributorBadge[];
    }
  });

  // Fetch user's earned badges
  const { data: userBadges = [], isLoading: loadingUserBadges } = useQuery({
    queryKey: ['user-contributor-badges', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('user_contributor_badges')
        .select('*, badge:contributor_badges(*)')
        .eq('user_id', user.id);
      if (error) throw error;
      return data as UserContributorBadge[];
    },
    enabled: !!user
  });

  // Fetch badges for a specific user (for profile display)
  const getUserBadges = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_contributor_badges')
      .select('*, badge:contributor_badges(*)')
      .eq('user_id', userId);
    if (error) throw error;
    return data as UserContributorBadge[];
  };

  // Check and award badges based on user stats
  const checkAndAwardBadges = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
      const newBadges: string[] = [];

      // Check platform suggestions
      const { count: suggestionsCount } = await supabase
        .from('platform_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((suggestionsCount || 0) >= 1 && !earnedBadgeIds.has('platform_scout')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'platform_scout'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('platform_scout');
      }

      // Check approved suggestions
      const { count: approvedCount } = await supabase
        .from('platform_suggestions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'approved');

      if ((approvedCount || 0) >= 3 && !earnedBadgeIds.has('platform_curator')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'platform_curator'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('platform_curator');
      }

      if ((approvedCount || 0) >= 10 && !earnedBadgeIds.has('platform_expert')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'platform_expert'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('platform_expert');
      }

      // Check comments
      const { count: commentsCount } = await supabase
        .from('image_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((commentsCount || 0) >= 10 && !earnedBadgeIds.has('helpful_voice')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'helpful_voice'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('helpful_voice');
      }

      if ((commentsCount || 0) >= 50 && !earnedBadgeIds.has('community_pillar')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'community_pillar'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('community_pillar');
      }

      // Check feedback
      const { count: feedbackCount } = await supabase
        .from('feedback_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if ((feedbackCount || 0) >= 1 && !earnedBadgeIds.has('feedback_champion')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'feedback_champion'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('feedback_champion');
      }

      // Check following count
      const { count: followingCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id);

      if ((followingCount || 0) >= 10 && !earnedBadgeIds.has('social_butterfly')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'social_butterfly'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('social_butterfly');
      }

      // Check followers count
      const { count: followersCount } = await supabase
        .from('user_follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);

      if ((followersCount || 0) >= 25 && !earnedBadgeIds.has('trendsetter')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'trendsetter'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('trendsetter');
      }

      if ((followersCount || 0) >= 100 && !earnedBadgeIds.has('influencer')) {
        const result = await supabase.rpc('award_contributor_badge', {
          p_user_id: user.id,
          p_badge_id: 'influencer'
        });
        const resultData = result.data as { success?: boolean } | null;
        if (resultData?.success) newBadges.push('influencer');
      }

      return newBadges;
    },
    onSuccess: (newBadges) => {
      if (newBadges.length > 0) {
        queryClient.invalidateQueries({ queryKey: ['user-contributor-badges'] });
        const badgeNames = newBadges.map(id => allBadges.find(b => b.id === id)?.name).join(', ');
        toast.success(`🏅 New badge earned: ${badgeNames}!`);
      }
    }
  });

  return {
    allBadges,
    userBadges,
    loadingBadges,
    loadingUserBadges,
    getUserBadges,
    checkAndAwardBadges: checkAndAwardBadges.mutate,
    hasBadge: (badgeId: string) => userBadges.some(ub => ub.badge_id === badgeId)
  };
}

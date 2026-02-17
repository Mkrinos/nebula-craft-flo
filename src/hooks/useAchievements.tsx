import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  credits_reward: number;
  sort_order: number;
  isFirst?: boolean; // Flag for first achievement celebration
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  unlocked_at: string;
  notified: boolean;
}

export interface UserStreak {
  current_streak: number;
  longest_streak: number;
  last_active_date: string;
}

export function useAchievements() {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [userStreak, setUserStreak] = useState<UserStreak | null>(null);
  const [loading, setLoading] = useState(true);
  const [newlyUnlocked, setNewlyUnlocked] = useState<Achievement[]>([]);

  const fetchAchievements = useCallback(async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('sort_order');

    if (!error && data) {
      setAchievements(data);
    }
  }, []);

  const fetchUserAchievements = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_achievements')
      .select('*')
      .eq('user_id', user.id);

    if (!error && data) {
      setUserAchievements(data);
    }
  }, [user]);

  const fetchUserStreak = useCallback(async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!error && data) {
      setUserStreak(data);
    }
  }, [user]);

  const updateStreak = useCallback(async () => {
    if (!user) return;

    // Use secure RPC function to update streak
    const { data, error } = await supabase.rpc('update_user_streak', {
      p_user_id: user.id
    });

    if (error) {
      console.error('Error updating streak:', error);
      return;
    }

    const result = data as { success?: boolean; current_streak?: number; longest_streak?: number; error?: string } | null;
    if (result?.success) {
      const today = new Date().toISOString().split('T')[0];
      setUserStreak({
        current_streak: result.current_streak ?? 0,
        longest_streak: result.longest_streak ?? 0,
        last_active_date: today
      });
    }
  }, [user]);

  const checkAndUnlockAchievements = useCallback(async () => {
    if (!user) return;

    const unlockedIds = userAchievements.map(ua => ua.achievement_id);
    const toCheck = achievements.filter(a => !unlockedIds.includes(a.id));

    for (const achievement of toCheck) {
      let currentValue = 0;

      switch (achievement.requirement_type) {
        case 'images_generated': {
          const { count } = await supabase
            .from('generated_images')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
        case 'personas_unlocked': {
          const { count } = await supabase
            .from('user_unlocked_personas')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
        case 'consecutive_days': {
          currentValue = userStreak?.current_streak || 0;
          break;
        }
        case 'feedback_submitted': {
          const { count } = await supabase
            .from('feedback_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
        case 'themes_unlocked': {
          const { count } = await supabase
            .from('user_unlocked_themes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
        case 'playlists_created': {
          const { count } = await supabase
            .from('playlists')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
        case 'tracks_uploaded': {
          const { count } = await supabase
            .from('music_tracks')
            .select('*', { count: 'exact', head: true })
            .eq('uploaded_by', user.id);
          currentValue = count || 0;
          break;
        }
        case 'friends_made': {
          const { count } = await supabase
            .from('user_friends')
            .select('*', { count: 'exact', head: true })
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
            .eq('status', 'accepted');
          currentValue = count || 0;
          break;
        }
        case 'favorite_prompts_saved': {
          const { count } = await supabase
            .from('favorite_prompts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);
          currentValue = count || 0;
          break;
        }
      }

      if (currentValue >= achievement.requirement_value) {
        // Check if this is the user's first achievement
        const isFirstAchievement = userAchievements.length === 0;
        
        // Use secure RPC function to unlock achievement
        const { data, error } = await supabase.rpc('unlock_achievement', {
          p_user_id: user.id,
          p_achievement_id: achievement.id
        });

        const result = data as { success?: boolean; error?: string } | null;
        if (!error && result?.success) {
          // Add isFirst flag to the achievement for celebration
          const achievementWithFlag = { ...achievement, isFirst: isFirstAchievement };
          setNewlyUnlocked(prev => [...prev, achievementWithFlag]);
          setUserAchievements(prev => [...prev, {
            id: crypto.randomUUID(),
            user_id: user.id,
            achievement_id: achievement.id,
            unlocked_at: new Date().toISOString(),
            notified: false
          }]);
          // Credits are awarded automatically by the RPC function
        }
      }
    }
  }, [user, achievements, userAchievements, userStreak]);

  const clearNewlyUnlocked = useCallback(() => {
    setNewlyUnlocked([]);
  }, []);

  const isUnlocked = useCallback((achievementId: string) => {
    return userAchievements.some(ua => ua.achievement_id === achievementId);
  }, [userAchievements]);

  const getProgress = useCallback(async (achievement: Achievement): Promise<{ current: number; target: number }> => {
    if (!user) return { current: 0, target: achievement.requirement_value };

    let currentValue = 0;

    switch (achievement.requirement_type) {
      case 'images_generated': {
        const { count } = await supabase
          .from('generated_images')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
      case 'personas_unlocked': {
        const { count } = await supabase
          .from('user_unlocked_personas')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
      case 'consecutive_days': {
        currentValue = userStreak?.current_streak || 0;
        break;
      }
      case 'feedback_submitted': {
        const { count } = await supabase
          .from('feedback_submissions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
      case 'themes_unlocked': {
        const { count } = await supabase
          .from('user_unlocked_themes')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
      case 'playlists_created': {
        const { count } = await supabase
          .from('playlists')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
      case 'tracks_uploaded': {
        const { count } = await supabase
          .from('music_tracks')
          .select('*', { count: 'exact', head: true })
          .eq('uploaded_by', user.id);
        currentValue = count || 0;
        break;
      }
      case 'friends_made': {
        const { count } = await supabase
          .from('user_friends')
          .select('*', { count: 'exact', head: true })
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq('status', 'accepted');
        currentValue = count || 0;
        break;
      }
      case 'favorite_prompts_saved': {
        const { count } = await supabase
          .from('favorite_prompts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);
        currentValue = count || 0;
        break;
      }
    }

    return { current: Math.min(currentValue, achievement.requirement_value), target: achievement.requirement_value };
  }, [user, userStreak]);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchAchievements();
      if (user) {
        await Promise.all([fetchUserAchievements(), fetchUserStreak()]);
        await updateStreak();
      }
      setLoading(false);
    };
    load();
  }, [user, fetchAchievements, fetchUserAchievements, fetchUserStreak, updateStreak]);

  // Check achievements when data changes
  useEffect(() => {
    if (achievements.length > 0 && user && !loading) {
      checkAndUnlockAchievements();
    }
  }, [achievements, userStreak, checkAndUnlockAchievements, user, loading]);

  // Track the currently celebrating achievement (first in queue)
  const [celebratingAchievement, setCelebratingAchievement] = useState<Achievement | null>(null);

  // Handle celebration queue - show one at a time
  useEffect(() => {
    if (newlyUnlocked.length > 0 && !celebratingAchievement) {
      setCelebratingAchievement(newlyUnlocked[0]);
    }
  }, [newlyUnlocked, celebratingAchievement]);

  const handleCelebrationComplete = useCallback(() => {
    setCelebratingAchievement(null);
    setNewlyUnlocked(prev => prev.slice(1));
  }, []);

  return {
    achievements,
    userAchievements,
    userStreak,
    loading,
    newlyUnlocked,
    celebratingAchievement,
    handleCelebrationComplete,
    isUnlocked,
    getProgress,
    refetch: async () => {
      await fetchAchievements();
      await fetchUserAchievements();
      await fetchUserStreak();
      await checkAndUnlockAchievements();
    }
  };
}

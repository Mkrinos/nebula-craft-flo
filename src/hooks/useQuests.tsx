import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSoundEffects } from './useSoundEffects';
import { useHapticFeedback } from './useHapticFeedback';
import { toast } from 'sonner';

export interface Quest {
  id: string;
  title: string;
  description: string;
  story_intro: string | null;
  story_complete: string | null;
  quest_type: 'daily' | 'weekly' | 'story' | 'special';
  category: 'creation' | 'exploration' | 'social' | 'mastery';
  icon: string;
  difficulty: number;
  requirement_type: string;
  requirement_value: number;
  credits_reward: number;
  xp_reward: number;
  unlock_content_type: string | null;
  unlock_content_id: string | null;
}

export interface UserQuest {
  id: string;
  quest_id: string;
  progress: number;
  status: 'available' | 'in_progress' | 'completed' | 'claimed' | 'expired';
  started_at: string | null;
  completed_at: string | null;
  claimed_at: string | null;
  quest?: Quest;
}

export interface UserLevel {
  current_xp: number;
  total_xp: number;
  current_level: number;
  quests_completed: number;
}

export function useQuests() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completedQuest, setCompletedQuest] = useState<Quest | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchQuests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      setQuests((data || []) as Quest[]);
    } catch (error) {
      console.error('Error fetching quests:', error);
    }
  }, []);

  const fetchUserQuests = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserQuests((data || []) as UserQuest[]);
    } catch (error) {
      console.error('Error fetching user quests:', error);
    }
  }, [user]);

  const fetchUserLevel = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_levels')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserLevel(data as UserLevel | null);
    } catch (error) {
      console.error('Error fetching user level:', error);
    }
  }, [user]);

  const startQuest = useCallback(async (questId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('start_quest', {
        p_user_id: user.id,
        p_quest_id: questId,
      });

      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        playSound('ding');
        trigger('light');
        await fetchUserQuests();
        
        const quest = quests.find(q => q.id === questId);
        if (quest?.story_intro) {
          toast.info(quest.story_intro, { duration: 4000 });
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error starting quest:', error);
      return { success: false, error: 'Failed to start quest' };
    }
  }, [user, quests, playSound, trigger, fetchUserQuests]);

  const updateProgress = useCallback(async (requirementType: string, increment = 1) => {
    if (!user) return { success: false };

    try {
      const { data, error } = await supabase.rpc('update_quest_progress', {
        p_user_id: user.id,
        p_requirement_type: requirementType,
        p_increment: increment,
      });

      if (error) throw error;
      
      // Refresh to check for completions
      await fetchUserQuests();
      
      // Check for newly completed quests
      const updatedQuests = userQuests.filter(uq => uq.status === 'in_progress');
      for (const uq of updatedQuests) {
        const quest = quests.find(q => q.id === uq.quest_id);
        if (quest && quest.requirement_type === requirementType) {
          if (uq.progress + increment >= quest.requirement_value) {
            setCompletedQuest(quest);
            playSound('milestone');
            trigger('success');
          }
        }
      }
      
      return data as { success: boolean; quests_updated: number };
    } catch (error) {
      console.error('Error updating quest progress:', error);
      return { success: false };
    }
  }, [user, quests, userQuests, playSound, trigger, fetchUserQuests]);

  const claimReward = useCallback(async (questId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };

    try {
      const { data, error } = await supabase.rpc('claim_quest_reward', {
        p_user_id: user.id,
        p_quest_id: questId,
      });

      if (error) throw error;
      
      const result = data as { 
        success: boolean; 
        credits_awarded?: number;
        xp_awarded?: number;
        new_level?: number;
        error?: string;
      };
      
      if (result.success) {
        playSound('coinCollect');
        trigger('success');
        
        const quest = quests.find(q => q.id === questId);
        if (quest?.story_complete) {
          toast.success(quest.story_complete, { duration: 5000 });
        }
        
        if (result.xp_awarded) {
          toast.success(`+${result.xp_awarded} XP earned!`);
        }
        
        await Promise.all([fetchUserQuests(), fetchUserLevel()]);
      }
      
      return result;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return { success: false, error: 'Failed to claim reward' };
    }
  }, [user, quests, playSound, trigger, fetchUserQuests, fetchUserLevel]);

  const clearCompletedQuest = useCallback(() => {
    setCompletedQuest(null);
  }, []);

  // Get quest with user progress
  const getQuestWithProgress = useCallback((questId: string) => {
    const quest = quests.find(q => q.id === questId);
    const userQuest = userQuests.find(uq => uq.quest_id === questId);
    
    if (!quest) return null;
    
    return {
      ...quest,
      progress: userQuest?.progress ?? 0,
      status: userQuest?.status ?? 'available',
      userQuest,
    };
  }, [quests, userQuests]);

  // Group quests by type
  const questsByType = useCallback(() => {
    const grouped: Record<Quest['quest_type'], Array<Quest & { progress: number; status: string }>> = {
      daily: [],
      weekly: [],
      story: [],
      special: [],
    };

    quests.forEach(quest => {
      const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
      grouped[quest.quest_type].push({
        ...quest,
        progress: userQuest?.progress ?? 0,
        status: userQuest?.status ?? 'available',
      });
    });

    return grouped;
  }, [quests, userQuests]);

  // XP needed for next level
  const xpForNextLevel = useCallback((level: number) => {
    return Math.pow(level, 2) * 25;
  }, []);

  const xpProgress = useCallback(() => {
    if (!userLevel) return { current: 0, needed: 25, percentage: 0 };
    
    const currentLevelXp = xpForNextLevel(userLevel.current_level - 1);
    const nextLevelXp = xpForNextLevel(userLevel.current_level);
    const progressXp = userLevel.current_xp - currentLevelXp;
    const neededXp = nextLevelXp - currentLevelXp;
    
    return {
      current: progressXp,
      needed: neededXp,
      percentage: Math.min(100, (progressXp / neededXp) * 100),
    };
  }, [userLevel, xpForNextLevel]);

  useEffect(() => {
    // Only fetch once, and skip re-fetching if already done
    if (hasFetched) return;
    
    const loadData = async () => {
      setIsLoading(true);
      // Fetch quests first (public data, faster)
      await fetchQuests();
      
      // Then fetch user-specific data in parallel if logged in
      if (user) {
        await Promise.all([fetchUserQuests(), fetchUserLevel()]);
      }
      
      setIsLoading(false);
      setHasFetched(true);
    };
    
    loadData();
  }, [user, hasFetched, fetchQuests, fetchUserQuests, fetchUserLevel]);

  return {
    quests,
    userQuests,
    userLevel,
    isLoading,
    completedQuest,
    startQuest,
    updateProgress,
    claimReward,
    clearCompletedQuest,
    getQuestWithProgress,
    questsByType,
    xpProgress,
    refetch: () => Promise.all([fetchQuests(), fetchUserQuests(), fetchUserLevel()]),
  };
}

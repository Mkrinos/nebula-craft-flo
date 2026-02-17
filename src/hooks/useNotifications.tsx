import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

export interface Notification {
  id: string;
  type: 'achievement' | 'quest' | 'social' | 'system' | 'credits';
  title: string;
  message: string;
  icon?: string;
  read: boolean;
  createdAt: Date;
  metadata?: Record<string, unknown>;
}

export function useNotifications() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const haptic = useHapticFeedback();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    // Listen for achievement unlocks
    const achievementChannel = supabase
      .channel('achievement-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_achievements',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const { data: achievement } = await supabase
            .from('achievements')
            .select('name, description, icon')
            .eq('id', payload.new.achievement_id)
            .single();

          if (achievement) {
            addNotification({
              type: 'achievement',
              title: 'Achievement Unlocked!',
              message: achievement.name,
              icon: achievement.icon,
            });
          }
        }
      )
      .subscribe();

    // Listen for quest completions
    const questChannel = supabase
      .channel('quest-notifications')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_quests',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          if (payload.new.status === 'completed' && payload.old.status !== 'completed') {
            const { data: quest } = await supabase
              .from('quests')
              .select('title, xp_reward, credits_reward')
              .eq('id', payload.new.quest_id)
              .single();

            if (quest) {
              addNotification({
                type: 'quest',
                title: 'Quest Completed!',
                message: `${quest.title} - Earned ${quest.xp_reward} XP`,
                icon: '🎯',
              });
            }
          }
        }
      )
      .subscribe();

    // Listen for studio visits (social)
    const socialChannel = supabase
      .channel('social-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_visits',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          addNotification({
            type: 'social',
            title: 'New Visitor!',
            message: 'Someone visited your studio',
            icon: '👋',
          });
        }
      )
      .subscribe();

    // Listen for studio likes
    const likesChannel = supabase
      .channel('likes-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_likes',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          addNotification({
            type: 'social',
            title: 'New Like!',
            message: 'Someone liked your studio',
            icon: '❤️',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(achievementChannel);
      supabase.removeChannel(questChannel);
      supabase.removeChannel(socialChannel);
      supabase.removeChannel(likesChannel);
    };
  }, [user]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: crypto.randomUUID(),
      read: false,
      createdAt: new Date(),
    };

    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setUnreadCount(prev => prev + 1);
    
    // Play sound and haptic
    playSound('ding');
    haptic.trigger('success');
  }, [playSound, haptic]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  };
}

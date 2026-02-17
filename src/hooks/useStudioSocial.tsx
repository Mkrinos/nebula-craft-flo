import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSoundEffects } from './useSoundEffects';
import { useHapticFeedback } from './useHapticFeedback';
import { toast } from 'sonner';

export interface StudioVisit {
  id: string;
  studio_id: string;
  visitor_id: string;
  owner_id: string;
  visited_at: string;
  visitor_name?: string;
}

export interface StudioLike {
  id: string;
  studio_id: string;
  user_id: string;
  owner_id: string;
  created_at: string;
}

export interface StudioComment {
  id: string;
  studio_id: string;
  user_id: string;
  owner_id: string;
  content: string;
  is_child_friendly: boolean;
  created_at: string;
  user_name?: string;
}

export interface StudioEvent {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  starts_at: string;
  ends_at: string;
  bonus_credits: number;
  bonus_xp: number;
  is_active: boolean;
}

export interface UserEventParticipation {
  id: string;
  event_id: string;
  user_id: string;
  joined_at: string;
  completed_at: string | null;
  rewards_claimed: boolean;
  progress: Record<string, unknown>;
}

export function useStudioSocial(studioId?: string, ownerId?: string) {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();

  const [visits, setVisits] = useState<StudioVisit[]>([]);
  const [likes, setLikes] = useState<StudioLike[]>([]);
  const [comments, setComments] = useState<StudioComment[]>([]);
  const [events, setEvents] = useState<StudioEvent[]>([]);
  const [userParticipations, setUserParticipations] = useState<UserEventParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch visits to owner's studios
  const fetchVisits = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('studio_visits')
      .select('*')
      .eq('owner_id', user.id)
      .order('visited_at', { ascending: false })
      .limit(20);
    
    if (!error && data) {
      setVisits(data as StudioVisit[]);
    }
  }, [user]);

  // Fetch likes for a specific studio
  const fetchLikes = useCallback(async () => {
    if (!studioId || !ownerId) return;
    
    const { data, error } = await supabase
      .from('studio_likes')
      .select('*')
      .eq('studio_id', studioId)
      .eq('owner_id', ownerId);
    
    if (!error && data) {
      setLikes(data as StudioLike[]);
    }
  }, [studioId, ownerId]);

  // Fetch comments for a specific studio
  const fetchComments = useCallback(async () => {
    if (!studioId || !ownerId) return;
    
    const { data, error } = await supabase
      .from('studio_comments')
      .select('*')
      .eq('studio_id', studioId)
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (!error && data) {
      setComments(data as StudioComment[]);
    }
  }, [studioId, ownerId]);

  // Fetch active events
  const fetchEvents = useCallback(async () => {
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('studio_events')
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .gte('ends_at', now)
      .order('starts_at');
    
    if (!error && data) {
      setEvents(data as StudioEvent[]);
    }
  }, []);

  // Fetch user's event participations
  const fetchUserParticipations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_event_participation')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUserParticipations(data as UserEventParticipation[]);
    }
  }, [user]);

  // Record a visit to someone's studio
  const recordVisit = useCallback(async (visitedStudioId: string, visitedOwnerId: string) => {
    if (!user || user.id === visitedOwnerId) return { success: false };
    
    try {
      const { data, error } = await supabase.rpc('record_studio_visit', {
        p_visitor_id: user.id,
        p_owner_id: visitedOwnerId,
        p_studio_id: visitedStudioId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      return result;
    } catch (error) {
      console.error('Error recording visit:', error);
      return { success: false };
    }
  }, [user]);

  // Like a studio
  const likeStudio = useCallback(async (likedStudioId: string, likedOwnerId: string) => {
    if (!user) return { success: false };
    
    try {
      const { error } = await supabase.from('studio_likes').insert({
        studio_id: likedStudioId,
        user_id: user.id,
        owner_id: likedOwnerId,
      });
      
      if (error) {
        if (error.code === '23505') { // Unique violation - already liked
          return { success: false, error: 'Already liked' };
        }
        throw error;
      }
      
      playSound('achievement');
      trigger('success');
      await fetchLikes();
      return { success: true };
    } catch (error) {
      console.error('Error liking studio:', error);
      return { success: false };
    }
  }, [user, playSound, trigger, fetchLikes]);

  // Unlike a studio
  const unlikeStudio = useCallback(async (likedStudioId: string, likedOwnerId: string) => {
    if (!user) return { success: false };
    
    try {
      const { error } = await supabase
        .from('studio_likes')
        .delete()
        .eq('studio_id', likedStudioId)
        .eq('user_id', user.id)
        .eq('owner_id', likedOwnerId);
      
      if (error) throw error;
      
      playSound('pop');
      trigger('light');
      await fetchLikes();
      return { success: true };
    } catch (error) {
      console.error('Error unliking studio:', error);
      return { success: false };
    }
  }, [user, playSound, trigger, fetchLikes]);

  // Toggle like
  const toggleLike = useCallback(async (likedStudioId: string, likedOwnerId: string) => {
    const hasLiked = likes.some(l => l.user_id === user?.id);
    
    if (hasLiked) {
      return unlikeStudio(likedStudioId, likedOwnerId);
    } else {
      return likeStudio(likedStudioId, likedOwnerId);
    }
  }, [likes, user, likeStudio, unlikeStudio]);

  // Add a comment
  const addComment = useCallback(async (
    commentStudioId: string, 
    commentOwnerId: string, 
    content: string
  ) => {
    if (!user || !content.trim()) return { success: false };
    
    try {
      const { error } = await supabase.from('studio_comments').insert({
        studio_id: commentStudioId,
        user_id: user.id,
        owner_id: commentOwnerId,
        content: content.trim(),
        is_child_friendly: true, // Would integrate with moderation
      });
      
      if (error) throw error;
      
      playSound('ding');
      trigger('success');
      toast.success('Comment added!');
      await fetchComments();
      return { success: true };
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
      return { success: false };
    }
  }, [user, playSound, trigger, fetchComments]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId: string) => {
    if (!user) return { success: false };
    
    try {
      const { error } = await supabase
        .from('studio_comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      trigger('light');
      await fetchComments();
      return { success: true };
    } catch (error) {
      console.error('Error deleting comment:', error);
      return { success: false };
    }
  }, [user, trigger, fetchComments]);

  // Join an event
  const joinEvent = useCallback(async (eventId: string) => {
    if (!user) return { success: false };
    
    try {
      const { error } = await supabase.from('user_event_participation').insert({
        event_id: eventId,
        user_id: user.id,
      });
      
      if (error) {
        if (error.code === '23505') {
          return { success: false, error: 'Already joined' };
        }
        throw error;
      }
      
      playSound('achievement');
      trigger('success');
      toast.success('Joined event! 🎉');
      await fetchUserParticipations();
      return { success: true };
    } catch (error) {
      console.error('Error joining event:', error);
      toast.error('Failed to join event');
      return { success: false };
    }
  }, [user, playSound, trigger, fetchUserParticipations]);

  // Check if user has liked
  const hasUserLiked = useCallback(() => {
    return likes.some(l => l.user_id === user?.id);
  }, [likes, user]);

  // Check if user is participating in an event
  const isParticipating = useCallback((eventId: string) => {
    return userParticipations.some(p => p.event_id === eventId);
  }, [userParticipations]);

  // Get event by ID
  const getEvent = useCallback((eventId: string) => {
    return events.find(e => e.id === eventId);
  }, [events]);

  // Calculate time remaining for an event
  const getTimeRemaining = useCallback((endsAt: string) => {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  }, []);

  // Initial fetch
  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetchEvents(),
      fetchUserParticipations(),
    ]).finally(() => setIsLoading(false));
  }, [fetchEvents, fetchUserParticipations]);

  // Fetch studio-specific data when studioId/ownerId changes
  useEffect(() => {
    if (studioId && ownerId) {
      Promise.all([fetchLikes(), fetchComments()]);
    }
  }, [studioId, ownerId, fetchLikes, fetchComments]);

  // Fetch visits for the user
  useEffect(() => {
    if (user) {
      fetchVisits();
    }
  }, [user, fetchVisits]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!user) return;

    const visitChannel = supabase
      .channel('studio-visits')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'studio_visits',
          filter: `owner_id=eq.${user.id}`,
        },
        (payload) => {
          const newVisit = payload.new as StudioVisit;
          setVisits(prev => [newVisit, ...prev].slice(0, 20));
          playSound('ding');
          toast.info('Someone visited your studio! 👀');
        }
      )
      .subscribe();

    const likeChannel = supabase
      .channel('studio-likes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'studio_likes',
        },
        () => {
          fetchLikes();
        }
      )
      .subscribe();

    const commentChannel = supabase
      .channel('studio-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'studio_comments',
        },
        () => {
          fetchComments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(visitChannel);
      supabase.removeChannel(likeChannel);
      supabase.removeChannel(commentChannel);
    };
  }, [user, fetchLikes, fetchComments, playSound]);

  return {
    visits,
    likes,
    comments,
    events,
    userParticipations,
    isLoading,
    recordVisit,
    likeStudio,
    unlikeStudio,
    toggleLike,
    addComment,
    deleteComment,
    joinEvent,
    hasUserLiked,
    isParticipating,
    getEvent,
    getTimeRemaining,
    likesCount: likes.length,
    refetch: () => Promise.all([
      fetchVisits(),
      fetchLikes(),
      fetchComments(),
      fetchEvents(),
      fetchUserParticipations(),
    ]),
  };
}

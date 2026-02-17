import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSoundEffects } from './useSoundEffects';
import { useHapticFeedback } from './useHapticFeedback';
import { toast } from 'sonner';

export interface StudioSpace {
  id: string;
  name: string;
  description: string;
  theme: string;
  background_style: string;
  unlock_method: 'achievement' | 'quest' | 'credits' | 'starter';
  unlock_requirement_id: string | null;
  credits_cost: number;
  is_starter: boolean;
  sort_order: number;
}

export interface StudioDecoration {
  id: string;
  name: string;
  description: string;
  category: 'furniture' | 'art' | 'lighting' | 'plants' | 'tech';
  icon: string;
  unlock_method: string;
  unlock_requirement_id: string | null;
  credits_cost: number;
  is_starter: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  sort_order: number;
}

export interface UserStudio {
  id: string;
  studio_id: string;
  is_active: boolean;
  unlocked_at: string;
}

export interface UserDecoration {
  id: string;
  decoration_id: string;
  unlocked_at: string;
}

export interface StudioPlacement {
  id: string;
  studio_id: string;
  decoration_id: string;
  position_x: number;
  position_y: number;
  scale: number;
  rotation: number;
}

export function useStudioSpaces() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [studios, setStudios] = useState<StudioSpace[]>([]);
  const [decorations, setDecorations] = useState<StudioDecoration[]>([]);
  const [userStudios, setUserStudios] = useState<UserStudio[]>([]);
  const [userDecorations, setUserDecorations] = useState<UserDecoration[]>([]);
  const [placements, setPlacements] = useState<StudioPlacement[]>([]);
  const [activeStudio, setActiveStudio] = useState<StudioSpace | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStudios = useCallback(async () => {
    const { data, error } = await supabase
      .from('studio_spaces')
      .select('*')
      .order('sort_order');
    
    if (!error && data) {
      setStudios(data as StudioSpace[]);
    }
  }, []);

  const fetchDecorations = useCallback(async () => {
    const { data, error } = await supabase
      .from('studio_decorations')
      .select('*')
      .order('sort_order');
    
    if (!error && data) {
      setDecorations(data as StudioDecoration[]);
    }
  }, []);

  const fetchUserStudios = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_studios')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUserStudios(data as UserStudio[]);
      
      // Find active studio
      const active = data.find(s => s.is_active);
      if (active) {
        const studioData = studios.find(s => s.id === active.studio_id);
        setActiveStudio(studioData || null);
      }
    }
  }, [user, studios]);

  const fetchUserDecorations = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_decorations')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setUserDecorations(data as UserDecoration[]);
    }
  }, [user]);

  const fetchPlacements = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_studio_placements')
      .select('*')
      .eq('user_id', user.id);
    
    if (!error && data) {
      setPlacements(data as StudioPlacement[]);
    }
  }, [user]);

  const unlockStudio = useCallback(async (studioId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    try {
      const { data, error } = await supabase.rpc('unlock_studio', {
        p_user_id: user.id,
        p_studio_id: studioId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        playSound('achievement');
        trigger('success');
        toast.success('New studio unlocked!');
        await fetchUserStudios();
      }
      
      return result;
    } catch (error) {
      console.error('Error unlocking studio:', error);
      return { success: false, error: 'Failed to unlock studio' };
    }
  }, [user, playSound, trigger, fetchUserStudios]);

  const setActiveStudioById = useCallback(async (studioId: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    try {
      const { data, error } = await supabase.rpc('set_active_studio', {
        p_user_id: user.id,
        p_studio_id: studioId,
      });
      
      if (error) throw error;
      
      const result = data as { success: boolean; error?: string };
      
      if (result.success) {
        playSound('ding');
        trigger('selection');
        const studio = studios.find(s => s.id === studioId);
        setActiveStudio(studio || null);
        await fetchUserStudios();
      }
      
      return result;
    } catch (error) {
      console.error('Error setting active studio:', error);
      return { success: false, error: 'Failed to set studio' };
    }
  }, [user, studios, playSound, trigger, fetchUserStudios]);

  const unlockStarterContent = useCallback(async () => {
    if (!user) return;
    
    // Unlock starter studios
    for (const studio of studios.filter(s => s.is_starter)) {
      const exists = userStudios.some(us => us.studio_id === studio.id);
      if (!exists) {
        await supabase.from('user_studios').insert({
          user_id: user.id,
          studio_id: studio.id,
          is_active: true,
        });
      }
    }
    
    // Unlock starter decorations
    for (const deco of decorations.filter(d => d.is_starter)) {
      const exists = userDecorations.some(ud => ud.decoration_id === deco.id);
      if (!exists) {
        await supabase.from('user_decorations').insert({
          user_id: user.id,
          decoration_id: deco.id,
        });
      }
    }
    
    await Promise.all([fetchUserStudios(), fetchUserDecorations()]);
  }, [user, studios, decorations, userStudios, userDecorations, fetchUserStudios, fetchUserDecorations]);

  const placeDecoration = useCallback(async (
    studioId: string,
    decorationId: string,
    position: { x: number; y: number },
    scale = 1,
    rotation = 0
  ) => {
    if (!user) return { success: false };
    
    const { error } = await supabase.from('user_studio_placements').insert({
      user_id: user.id,
      studio_id: studioId,
      decoration_id: decorationId,
      position_x: position.x,
      position_y: position.y,
      scale,
      rotation,
    });
    
    if (!error) {
      playSound('ding');
      trigger('light');
      await fetchPlacements();
      return { success: true };
    }
    
    return { success: false };
  }, [user, playSound, trigger, fetchPlacements]);

  const removeDecoration = useCallback(async (placementId: string) => {
    if (!user) return { success: false };
    
    const { error } = await supabase
      .from('user_studio_placements')
      .delete()
      .eq('id', placementId)
      .eq('user_id', user.id);
    
    if (!error) {
      trigger('light');
      await fetchPlacements();
      return { success: true };
    }
    
    return { success: false };
  }, [user, trigger, fetchPlacements]);

  const purchaseDecoration = useCallback(async (decorationId: string, cost: number) => {
    if (!user) return { success: false };
    
    try {
      // Deduct credits first
      const { data: creditResult, error: creditError } = await supabase.rpc('check_and_deduct_credit', {
        p_user_id: user.id,
        p_amount: cost,
      });
      
      const result = creditResult as { allowed: boolean; error?: string } | null;
      
      if (creditError || !result?.allowed) {
        toast.error(result?.error || 'Not enough credits');
        return { success: false };
      }
      
      // Unlock decoration
      const { error: unlockError } = await supabase.from('user_decorations').insert({
        user_id: user.id,
        decoration_id: decorationId,
      });
      
      if (unlockError) throw unlockError;
      
      playSound('achievement');
      trigger('success');
      toast.success('Decoration purchased!');
      await fetchUserDecorations();
      return { success: true };
    } catch (error) {
      console.error('Error purchasing decoration:', error);
      toast.error('Failed to purchase decoration');
      return { success: false };
    }
  }, [user, playSound, trigger, fetchUserDecorations]);

  const isStudioUnlocked = useCallback((studioId: string) => {
    return userStudios.some(us => us.studio_id === studioId);
  }, [userStudios]);

  const isDecorationUnlocked = useCallback((decorationId: string) => {
    return userDecorations.some(ud => ud.decoration_id === decorationId);
  }, [userDecorations]);

  const getStudioPlacements = useCallback((studioId: string) => {
    return placements.filter(p => p.studio_id === studioId);
  }, [placements]);

  useEffect(() => {
    setIsLoading(true);
    Promise.all([fetchStudios(), fetchDecorations()])
      .finally(() => setIsLoading(false));
  }, [fetchStudios, fetchDecorations]);

  useEffect(() => {
    if (user && studios.length > 0 && decorations.length > 0) {
      Promise.all([fetchUserStudios(), fetchUserDecorations(), fetchPlacements()])
        .then(() => {
          // Auto-unlock starter content for new users
          if (userStudios.length === 0) {
            unlockStarterContent();
          }
        });
    }
  }, [user, studios, decorations, fetchUserStudios, fetchUserDecorations, fetchPlacements, userStudios.length, unlockStarterContent]);

  return {
    studios,
    decorations,
    userStudios,
    userDecorations,
    placements,
    activeStudio,
    isLoading,
    unlockStudio,
    setActiveStudioById,
    unlockStarterContent,
    placeDecoration,
    removeDecoration,
    purchaseDecoration,
    isStudioUnlocked,
    isDecorationUnlocked,
    getStudioPlacements,
    refetch: () => Promise.all([
      fetchStudios(),
      fetchDecorations(),
      fetchUserStudios(),
      fetchUserDecorations(),
      fetchPlacements(),
    ]),
  };
}

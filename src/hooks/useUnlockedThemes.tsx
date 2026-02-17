import { useState, useEffect, useCallback } from 'react';
import { UITheme, starterThemes, tierThemeUnlocks, themeCreditCosts } from '@/contexts/UIThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

export function useUnlockedThemes() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [unlockedThemes, setUnlockedThemes] = useState<UITheme[]>([...starterThemes]);
  const [purchasedThemes, setPurchasedThemes] = useState<UITheme[]>([]);
  const [userTier, setUserTier] = useState<string>('starter_universe');
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Load unlocked themes from database and subscription tier
  const loadUnlockedThemes = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's subscription tier
      const { data: subscriptionData } = await supabase
        .rpc('get_user_subscription', { p_user_id: user.id });
      
      const subData = subscriptionData as { tier?: string } | null;
      const tier = subData?.tier || 'starter_universe';
      setUserTier(tier);

      // Fetch themes unlocked via credits
      const { data: unlockedData } = await supabase
        .from('user_unlocked_themes')
        .select('theme_id')
        .eq('user_id', user.id);

      const purchased = (unlockedData || []).map(row => row.theme_id as UITheme);
      setPurchasedThemes(purchased);

      // Combine: starter themes + tier unlocks + purchased themes
      const tierUnlocks = tierThemeUnlocks[tier] || [];
      const allUnlocked = [...new Set([...starterThemes, ...tierUnlocks, ...purchased])];
      setUnlockedThemes(allUnlocked);
    } catch (error) {
      console.error('Error loading unlocked themes:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Purchase a theme with credits
  const purchaseTheme = useCallback(async (themeId: UITheme): Promise<boolean> => {
    if (!user) {
      toast({
        title: 'Login required',
        description: 'Please sign in to unlock themes',
        variant: 'destructive',
      });
      return false;
    }

    const cost = themeCreditCosts[themeId];
    if (!cost) {
      toast({
        title: 'Theme not purchasable',
        description: 'This theme cannot be purchased with credits',
        variant: 'destructive',
      });
      return false;
    }

    setIsPurchasing(true);
    try {
      const { data, error } = await supabase.rpc('unlock_theme_with_credits', {
        p_user_id: user.id,
        p_theme_id: themeId,
        p_cost: cost,
      });

      if (error) throw error;

      const result = data as { success?: boolean; error?: string } | null;
      
      if (result?.success) {
        toast({
          title: 'Theme unlocked!',
          description: `You've unlocked the ${themeId} theme`,
        });
        await loadUnlockedThemes();
        return true;
      } else {
        toast({
          title: 'Failed to unlock',
          description: result?.error || 'Could not unlock theme',
          variant: 'destructive',
        });
        return false;
      }
    } catch (error) {
      console.error('Error purchasing theme:', error);
      toast({
        title: 'Error',
        description: 'Failed to purchase theme',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsPurchasing(false);
    }
  }, [user, toast, loadUnlockedThemes]);

  // Check if theme is unlocked
  const isThemeUnlocked = useCallback((themeId: UITheme): boolean => {
    return unlockedThemes.includes(themeId);
  }, [unlockedThemes]);

  // Check if theme is purchasable (not a starter, not already owned)
  const isThemePurchasable = useCallback((themeId: UITheme): boolean => {
    if (starterThemes.includes(themeId)) return false;
    if (unlockedThemes.includes(themeId)) return false;
    return themeCreditCosts[themeId] !== undefined;
  }, [unlockedThemes]);

  // Get cost to unlock a theme
  const getThemeCost = useCallback((themeId: UITheme): number | null => {
    return themeCreditCosts[themeId] || null;
  }, []);

  // Load on mount and when user changes
  useEffect(() => {
    loadUnlockedThemes();
  }, [loadUnlockedThemes]);

  return {
    unlockedThemes,
    purchasedThemes,
    userTier,
    isLoading,
    isPurchasing,
    purchaseTheme,
    isThemeUnlocked,
    isThemePurchasable,
    getThemeCost,
    refreshThemes: loadUnlockedThemes,
  };
}

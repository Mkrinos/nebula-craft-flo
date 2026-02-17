import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface FavoritePrompt {
  id: string;
  prompt_text: string;
  category: string;
  language_code: string;
  created_at: string;
}

export function useFavoritePrompts() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<FavoritePrompt[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's favorites
  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setFavorites([]);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_prompts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setFavorites(data || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Add a prompt to favorites
  const addFavorite = useCallback(async (
    promptText: string, 
    category: string = 'custom',
    languageCode: string = 'en'
  ) => {
    if (!user) {
      toast.error('Please sign in to save favorites');
      return false;
    }

    try {
      const { error } = await supabase
        .from('favorite_prompts')
        .insert({
          user_id: user.id,
          prompt_text: promptText.trim(),
          category,
          language_code: languageCode
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('This prompt is already in your favorites');
          return false;
        }
        throw error;
      }

      await fetchFavorites();
      toast.success('Added to favorites!');
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      toast.error('Failed to add favorite');
      return false;
    }
  }, [user, fetchFavorites]);

  // Remove a prompt from favorites
  const removeFavorite = useCallback(async (promptId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('favorite_prompts')
        .delete()
        .eq('id', promptId)
        .eq('user_id', user.id);

      if (error) throw error;

      setFavorites(prev => prev.filter(f => f.id !== promptId));
      toast.success('Removed from favorites');
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      toast.error('Failed to remove favorite');
      return false;
    }
  }, [user]);

  // Check if a prompt is favorited
  const isFavorite = useCallback((promptText: string) => {
    return favorites.some(f => f.prompt_text === promptText.trim());
  }, [favorites]);

  // Toggle favorite status
  const toggleFavorite = useCallback(async (
    promptText: string,
    category: string = 'custom',
    languageCode: string = 'en'
  ) => {
    const existing = favorites.find(f => f.prompt_text === promptText.trim());
    if (existing) {
      return removeFavorite(existing.id);
    } else {
      return addFavorite(promptText, category, languageCode);
    }
  }, [favorites, addFavorite, removeFavorite]);

  // Fetch favorites when user changes
  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return {
    favorites,
    loading,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    refetch: fetchFavorites
  };
}

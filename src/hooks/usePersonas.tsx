import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Persona {
  id: string;
  name: string;
  description: string;
  style: string;
  avatar_url: string | null;
  credits_to_unlock: number;
  is_starter: boolean;
  sort_order: number;
}

export interface UserCredits {
  credits_earned: number;
  credits_spent: number;
  available: number;
}

export function usePersonas() {
  const { user } = useAuth();
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [unlockedPersonaIds, setUnlockedPersonaIds] = useState<Set<string>>(new Set());
  const [userCredits, setUserCredits] = useState<UserCredits>({ credits_earned: 0, credits_spent: 0, available: 0 });
  const [loading, setLoading] = useState(true);
  const [generatingAvatarFor, setGeneratingAvatarFor] = useState<string | null>(null);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);

  // Fetch all personas
  const fetchPersonas = useCallback(async () => {
    const { data, error } = await supabase
      .from('personas')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching personas:', error);
      toast.error('Failed to load personas');
      return;
    }

    setPersonas(data || []);
  }, []);

  // Fetch user's unlocked personas
  const fetchUnlockedPersonas = useCallback(async () => {
    if (!user) {
      setUnlockedPersonaIds(new Set());
      return;
    }

    const { data, error } = await supabase
      .from('user_unlocked_personas')
      .select('persona_id')
      .eq('user_id', user.id);

    if (error) {
      console.error('Error fetching unlocked personas:', error);
      return;
    }

    const ids = new Set(data?.map(d => d.persona_id) || []);
    setUnlockedPersonaIds(ids);
  }, [user]);

  // Fetch user credits
  const fetchUserCredits = useCallback(async () => {
    if (!user) {
      setUserCredits({ credits_earned: 0, credits_spent: 0, available: 0 });
      return;
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching credits:', error);
      return;
    }

    if (data) {
      setUserCredits({
        credits_earned: data.credits_earned,
        credits_spent: data.credits_spent,
        available: data.credits_earned - data.credits_spent
      });
    }
  }, [user]);

  // Fetch user's selected persona from profile
  const fetchSelectedPersona = useCallback(async () => {
    if (!user) {
      setSelectedPersonaId(null);
      return;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('selected_persona_id')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching selected persona:', error);
      return;
    }

    setSelectedPersonaId(data?.selected_persona_id || null);
  }, [user]);

  // Set a persona as profile avatar
  const setProfilePersona = useCallback(async (personaId: string) => {
    if (!user) {
      toast.error('Please sign in to set a profile persona');
      return false;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        selected_persona_id: personaId,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error setting profile persona:', error);
      toast.error('Failed to set profile persona');
      return false;
    }

    setSelectedPersonaId(personaId);
    toast.success('Profile avatar updated!');
    return true;
  }, [user]);

  // Get selected persona details
  const getSelectedPersona = useCallback(() => {
    if (!selectedPersonaId) return null;
    return personas.find(p => p.id === selectedPersonaId) || null;
  }, [selectedPersonaId, personas]);

  // Check if persona is unlocked (starter personas are always unlocked)
  const isUnlocked = useCallback((persona: Persona) => {
    return persona.is_starter || unlockedPersonaIds.has(persona.id);
  }, [unlockedPersonaIds]);

  // Check if user can unlock a persona
  const canUnlock = useCallback((persona: Persona) => {
    if (persona.is_starter || unlockedPersonaIds.has(persona.id)) return false;
    return userCredits.available >= persona.credits_to_unlock;
  }, [unlockedPersonaIds, userCredits.available]);

  // Unlock a persona using secure RPC function
  const unlockPersona = useCallback(async (persona: Persona) => {
    if (!user) {
      toast.error('Please sign in to unlock personas');
      return false;
    }

    if (!canUnlock(persona)) {
      toast.error(`You need ${persona.credits_to_unlock} credits to unlock this persona`);
      return false;
    }

    // Use secure RPC function to unlock persona with credit validation
    const { data, error } = await supabase.rpc('unlock_persona_with_credits', {
      p_user_id: user.id,
      p_persona_id: persona.id
    });

    if (error) {
      console.error('Error unlocking persona:', error);
      toast.error('Failed to unlock persona');
      return false;
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (!result?.success) {
      toast.error(result?.error || 'Failed to unlock persona');
      return false;
    }

    // Refresh data
    await Promise.all([fetchUnlockedPersonas(), fetchUserCredits()]);
    toast.success(`${persona.name} unlocked!`);
    return true;
  }, [user, canUnlock, fetchUnlockedPersonas, fetchUserCredits]);

  // Generate avatar for a persona
  const generateAvatar = useCallback(async (persona: Persona) => {
    setGeneratingAvatarFor(persona.id);
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-persona-avatar', {
        body: {
          personaId: persona.id,
          personaName: persona.name,
          personaStyle: persona.style,
          personaDescription: persona.description
        }
      });

      if (error) throw error;
      
      if (data?.avatarUrl) {
        setPersonas(prev => prev.map(p => 
          p.id === persona.id ? { ...p, avatar_url: data.avatarUrl } : p
        ));
        toast.success(`Avatar generated for ${persona.name}`);
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast.error('Failed to generate avatar');
    } finally {
      setGeneratingAvatarFor(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchPersonas();
      await Promise.all([fetchUnlockedPersonas(), fetchUserCredits(), fetchSelectedPersona()]);
      setLoading(false);
    };
    load();
  }, [fetchPersonas, fetchUnlockedPersonas, fetchUserCredits, fetchSelectedPersona]);

  return {
    personas,
    loading,
    userCredits,
    isUnlocked,
    canUnlock,
    unlockPersona,
    generateAvatar,
    generatingAvatarFor,
    refetch: fetchPersonas,
    selectedPersonaId,
    setProfilePersona,
    getSelectedPersona
  };
}

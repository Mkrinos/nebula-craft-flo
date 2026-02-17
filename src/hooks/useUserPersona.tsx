import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Persona } from './usePersonas';

export function useUserPersona() {
  const { user } = useAuth();
  const [selectedPersona, setSelectedPersona] = useState<Persona | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserPersona = useCallback(async () => {
    if (!user) {
      setSelectedPersona(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // First get the user's selected persona ID from profiles
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('selected_persona_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData?.selected_persona_id) {
      setSelectedPersona(null);
      setLoading(false);
      return;
    }

    // Then fetch the persona details
    const { data: personaData, error: personaError } = await supabase
      .from('personas')
      .select('*')
      .eq('id', profileData.selected_persona_id)
      .single();

    if (personaError) {
      console.error('Error fetching persona:', personaError);
      setSelectedPersona(null);
    } else {
      setSelectedPersona(personaData);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchUserPersona();
  }, [fetchUserPersona]);

  return {
    selectedPersona,
    loading,
    refetch: fetchUserPersona
  };
}
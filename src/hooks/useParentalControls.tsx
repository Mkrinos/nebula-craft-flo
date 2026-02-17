import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface ParentalControl {
  id: string;
  parent_user_id: string;
  child_user_id: string;
  daily_generation_limit: number;
  daily_time_limit_minutes: number;
  content_filter_level: string;
  blocked_keywords: string[];
  allow_community_viewing: boolean;
  allow_community_posting: boolean;
  allow_comments: boolean;
  created_at: string;
  updated_at: string;
}

interface ChildActivity {
  id: string;
  child_user_id: string;
  activity_type: string;
  activity_details: unknown;
  created_at: string;
}

interface DailyUsage {
  id: string;
  user_id: string;
  usage_date: string;
  generations_count: number;
  time_spent_minutes: number;
}

interface ChildProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export const useParentalControls = () => {
  const { user } = useAuth();
  const [controls, setControls] = useState<ParentalControl[]>([]);
  const [childProfiles, setChildProfiles] = useState<Record<string, ChildProfile>>({});
  const [activities, setActivities] = useState<ChildActivity[]>([]);
  const [usageData, setUsageData] = useState<DailyUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchControls = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('parental_controls')
      .select('*')
      .eq('parent_user_id', user.id);
    
    if (error) {
      console.error('Error fetching parental controls:', error);
      return;
    }
    
    setControls(data || []);
    
    // Fetch child profiles
    if (data && data.length > 0) {
      const childIds = data.map(c => c.child_user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url')
        .in('id', childIds);
      
      if (profiles) {
        const profileMap: Record<string, ChildProfile> = {};
        profiles.forEach(p => {
          profileMap[p.id] = p;
        });
        setChildProfiles(profileMap);
      }
    }
  };

  const fetchActivities = async (childId: string) => {
    const { data, error } = await supabase
      .from('child_activity_log')
      .select('*')
      .eq('child_user_id', childId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) {
      console.error('Error fetching activities:', error);
      return;
    }
    
    setActivities(data || []);
  };

  const fetchUsageData = async (childId: string) => {
    const { data, error } = await supabase
      .from('daily_usage')
      .select('*')
      .eq('user_id', childId)
      .order('usage_date', { ascending: false })
      .limit(30);
    
    if (error) {
      console.error('Error fetching usage data:', error);
      return;
    }
    
    setUsageData(data || []);
  };

  const linkChild = async (childDisplayName: string) => {
    if (!user) return { success: false, error: 'Not authenticated' };
    
    // Find child by display name (case-insensitive)
    const { data: childProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', childDisplayName);
    
    if (profileError || !childProfiles || childProfiles.length === 0) {
      return { success: false, error: 'Child account not found' };
    }

    // Use the first match
    const childProfile = childProfiles[0];
    
    if (childProfile.id === user.id) {
      return { success: false, error: 'Cannot link to your own account' };
    }
    
    // Check if already linked
    const existing = controls.find(c => c.child_user_id === childProfile.id);
    if (existing) {
      return { success: false, error: 'Child already linked' };
    }
    
    const { error } = await supabase
      .from('parental_controls')
      .insert({
        parent_user_id: user.id,
        child_user_id: childProfile.id
      });
    
    if (error) {
      console.error('Error linking child:', error);
      return { success: false, error: error.message };
    }
    
    toast.success('Child account linked successfully');
    await fetchControls();
    return { success: true };
  };

  const unlinkChild = async (childId: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('parental_controls')
      .delete()
      .eq('parent_user_id', user.id)
      .eq('child_user_id', childId);
    
    if (error) {
      toast.error('Failed to unlink child');
      return;
    }
    
    toast.success('Child account unlinked');
    await fetchControls();
  };

  const updateControls = async (childId: string, updates: Partial<ParentalControl>) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('parental_controls')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('parent_user_id', user.id)
      .eq('child_user_id', childId);
    
    if (error) {
      toast.error('Failed to update settings');
      return;
    }
    
    toast.success('Settings updated');
    await fetchControls();
  };

  useEffect(() => {
    if (user) {
      fetchControls().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  return {
    controls,
    childProfiles,
    activities,
    usageData,
    loading,
    linkChild,
    unlinkChild,
    updateControls,
    fetchActivities,
    fetchUsageData,
    refetch: fetchControls
  };
};

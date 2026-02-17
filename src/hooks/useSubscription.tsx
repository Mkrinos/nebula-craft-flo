import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SubscriptionInfo {
  tier: string;
  credits_used: number;
  credits_limit: number;
  credits_remaining: number;
  has_voice_access: boolean;
  has_hd_quality: boolean;
  reset_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price_monthly: number;
  monthly_credits: number | null;
  has_voice_access: boolean;
  has_hd_quality: boolean;
  features: string[];
  sort_order: number;
}

export const useSubscription = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSubscription = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_user_subscription', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error fetching subscription:', error);
        return;
      }

      if (data && typeof data === 'object') {
        setSubscription(data as unknown as SubscriptionInfo);
      }
    } catch (err) {
      console.error('Error in fetchSubscription:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const fetchPlans = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('sort_order');

      if (error) {
        console.error('Error fetching plans:', error);
        return;
      }

      setPlans(data as SubscriptionPlan[]);
    } catch (err) {
      console.error('Error in fetchPlans:', err);
    }
  }, []);

  useEffect(() => {
    fetchSubscription();
    fetchPlans();
  }, [fetchSubscription, fetchPlans]);

  const getTierDisplayName = (tierId: string): string => {
    const tierNames: Record<string, string> = {
      'starter_universe': 'Starter Universe',
      'stellar': 'Stellar',
      'cosmic': 'Cosmic',
      'galactic': 'Galactic'
    };
    return tierNames[tierId] || tierId;
  };

  const getTierIcon = (tierId: string): string => {
    const tierIcons: Record<string, string> = {
      'starter_universe': '🚀',
      'stellar': '⭐',
      'cosmic': '🌟',
      'galactic': '🌌'
    };
    return tierIcons[tierId] || '🚀';
  };

  const canUseVoice = subscription?.has_voice_access ?? false;
  const canUseHD = subscription?.has_hd_quality ?? false;
  const isUnlimited = subscription?.credits_remaining === -1;

  return {
    subscription,
    plans,
    isLoading,
    refetch: fetchSubscription,
    getTierDisplayName,
    getTierIcon,
    canUseVoice,
    canUseHD,
    isUnlimited
  };
};

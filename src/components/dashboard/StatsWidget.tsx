import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { SciFiBadge } from '@/components/ui/sci-fi-badge';
import { HorizontalSwipeContainer } from '@/components/HorizontalSwipeContainer';
import { Image, Users, Zap, TrendingUp, Flame } from 'lucide-react';

interface Stats {
  imagesGenerated: number;
  activePersonas: number;
  creditsRemaining: number;
  currentStreak: number;
}

export function StatsWidget() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    imagesGenerated: 0,
    activePersonas: 0,
    creditsRemaining: 100,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    if (!user) return;

    try {
      // Fetch images count
      const { count: imagesCount } = await supabase
        .from('generated_images')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch unlocked personas
      const { count: personasCount } = await supabase
        .from('user_unlocked_personas')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      // Fetch credits
      const { data: credits } = await supabase
        .from('user_credits')
        .select('credits_spent, monthly_credit_limit')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch streak
      const { data: streak } = await supabase
        .from('user_streaks')
        .select('current_streak')
        .eq('user_id', user.id)
        .maybeSingle();

      setStats({
        imagesGenerated: imagesCount || 0,
        activePersonas: (personasCount || 0) + 4, // +4 for starter personas
        creditsRemaining: credits ? credits.monthly_credit_limit - credits.credits_spent : 100,
        currentStreak: streak?.current_streak || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statItems = [
    { label: 'Images', value: stats.imagesGenerated, icon: Image, color: 'text-neon-cyan' },
    { label: 'Personas', value: stats.activePersonas, icon: Users, color: 'text-primary' },
    { label: 'Credits', value: stats.creditsRemaining, icon: Zap, color: 'text-accent' },
    { label: 'Streak', value: stats.currentStreak, icon: Flame, color: 'text-neon-pink' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-6 h-6 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <HorizontalSwipeContainer showIndicators={false}>
      {statItems.map((stat) => {
        const Icon = stat.icon;
        return (
          <div 
            key={stat.label}
            className="flex items-center gap-2 p-2 border border-border/30 bg-space-dark/30 rounded min-w-[120px] flex-shrink-0"
          >
            <div className={`w-7 h-7 flex items-center justify-center border border-current/30 bg-current/10 ${stat.color}`}>
              <Icon className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-base font-display font-bold text-foreground leading-tight">{stat.value}</p>
              <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        );
      })}
    </HorizontalSwipeContainer>
  );
}
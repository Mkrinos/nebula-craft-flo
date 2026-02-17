import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, Sparkles, Lock, Check, Clock, Star,
  Trophy, Crown, Snowflake, Rocket, Flower2, Sun
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { ShootingStarsExplosion } from '@/components/gamification/ShootingStarsExplosion';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { toast } from 'sonner';

interface EventReward {
  id: string;
  type: 'decoration' | 'studio' | 'badge';
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  event_id: string;
  event_name: string;
  requirement: string;
  is_unlocked: boolean;
  progress: number;
  max_progress: number;
}

interface ActiveEvent {
  id: string;
  name: string;
  description: string;
  theme: string;
  icon: string;
  starts_at: string;
  ends_at: string;
  rewards: EventReward[];
  is_participating: boolean;
  bonus_credits: number;
  bonus_xp: number;
}

const THEME_ICONS: Record<string, React.ReactNode> = {
  winter: <Snowflake className="w-5 h-5" />,
  space: <Rocket className="w-5 h-5" />,
  spring: <Flower2 className="w-5 h-5" />,
  summer: <Sun className="w-5 h-5" />,
  seasonal: <Star className="w-5 h-5" />,
};

const RARITY_STYLES: Record<string, { bg: string; border: string; glow: string }> = {
  common: { bg: 'from-gray-500/20', border: 'border-gray-500/30', glow: '' },
  rare: { bg: 'from-blue-500/20', border: 'border-blue-500/30', glow: 'shadow-[0_0_15px_rgba(59,130,246,0.3)]' },
  epic: { bg: 'from-purple-500/20', border: 'border-purple-500/30', glow: 'shadow-[0_0_20px_rgba(168,85,247,0.4)]' },
  legendary: { bg: 'from-amber-500/20', border: 'border-amber-500/30', glow: 'shadow-[0_0_25px_rgba(245,158,11,0.5)]' },
};

function RewardCard({ reward, onClaim }: { reward: EventReward; onClaim: () => void }) {
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  const [showCelebration, setShowCelebration] = useState(false);
  
  const style = RARITY_STYLES[reward.rarity];
  const isClaimable = reward.progress >= reward.max_progress && !reward.is_unlocked;
  const progressPercent = Math.min((reward.progress / reward.max_progress) * 100, 100);

  const handleClaim = () => {
    playSound('achievement');
    trigger('success');
    setShowCelebration(true);
    onClaim();
    setTimeout(() => setShowCelebration(false), 2000);
  };

  return (
    <motion.div
      className={cn(
        "relative p-4 rounded-xl border bg-gradient-to-br to-transparent transition-all",
        style.bg,
        style.border,
        style.glow,
        reward.is_unlocked && "opacity-60"
      )}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <ShootingStarsExplosion isActive={showCelebration} />
      
      {/* Rarity Badge */}
      <Badge
        className={cn(
          "absolute -top-2 -right-2 text-[10px] capitalize",
          reward.rarity === 'legendary' && "bg-amber-500",
          reward.rarity === 'epic' && "bg-purple-500",
          reward.rarity === 'rare' && "bg-blue-500",
          reward.rarity === 'common' && "bg-gray-500"
        )}
      >
        {reward.rarity}
      </Badge>
      
      {/* Icon */}
      <div className="text-3xl mb-2">{reward.icon}</div>
      
      {/* Name */}
      <h4 className="font-semibold text-sm mb-1">{reward.name}</h4>
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{reward.description}</p>
      
      {/* Progress */}
      {!reward.is_unlocked && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">{reward.requirement}</span>
            <span>{reward.progress}/{reward.max_progress}</span>
          </div>
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      )}
      
      {/* Status/Action */}
      <div className="mt-3">
        {reward.is_unlocked ? (
          <div className="flex items-center gap-1 text-xs text-emerald-400">
            <Check className="w-4 h-4" />
            Claimed
          </div>
        ) : isClaimable ? (
          <Button
            size="sm"
            className="w-full gap-1 bg-gradient-to-r from-primary to-violet-500"
            onClick={handleClaim}
          >
            <Gift className="w-4 h-4" />
            Claim Reward
          </Button>
        ) : (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="w-4 h-4" />
            In Progress
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function EventExclusiveRewards() {
  const { user } = useAuth();
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  
  const [activeEvents, setActiveEvents] = useState<ActiveEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        const now = new Date().toISOString();
        
        // Fetch active events
        const { data: events } = await supabase
          .from('studio_events')
          .select('*')
          .eq('is_active', true)
          .lte('starts_at', now)
          .gte('ends_at', now);
        
        // Fetch user participations
        const { data: participations } = await supabase
          .from('user_event_participation')
          .select('event_id, progress, rewards_claimed')
          .eq('user_id', user.id);
        
        const participationMap = new Map(participations?.map(p => [p.event_id, p]) || []);
        
        // Build events with rewards
        const eventsWithRewards: ActiveEvent[] = (events || []).map(event => {
          const participation = participationMap.get(event.id);
          const progress = (participation?.progress as Record<string, number>) || {};
          
          // Generate mock rewards based on event theme
          const rewards: EventReward[] = [
            {
              id: `${event.id}-dec-1`,
              type: 'decoration',
              name: `${event.theme === 'winter' ? 'Frost Crystal' : event.theme === 'space' ? 'Nebula Lamp' : 'Blossom Vase'}`,
              description: `Exclusive ${event.name} decoration`,
              icon: event.theme === 'winter' ? '❄️' : event.theme === 'space' ? '🌌' : '🌸',
              rarity: 'rare',
              event_id: event.id,
              event_name: event.name,
              requirement: 'Complete 3 studio visits',
              is_unlocked: !!participation?.rewards_claimed,
              progress: progress['visits'] || 0,
              max_progress: 3,
            },
            {
              id: `${event.id}-dec-2`,
              type: 'decoration',
              name: `${event.theme === 'winter' ? 'Ice Throne' : event.theme === 'space' ? 'Hologram Display' : 'Garden Fountain'}`,
              description: `Premium ${event.name} piece`,
              icon: event.theme === 'winter' ? '🪑' : event.theme === 'space' ? '📺' : '⛲',
              rarity: 'epic',
              event_id: event.id,
              event_name: event.name,
              requirement: 'Earn 10 likes on your studio',
              is_unlocked: false,
              progress: progress['likes'] || 0,
              max_progress: 10,
            },
            {
              id: `${event.id}-studio`,
              type: 'studio',
              name: `${event.name} Studio`,
              description: `Exclusive themed studio space`,
              icon: event.theme === 'winter' ? '🏔️' : event.theme === 'space' ? '🚀' : '🌿',
              rarity: 'legendary',
              event_id: event.id,
              event_name: event.name,
              requirement: 'Complete all event tasks',
              is_unlocked: false,
              progress: progress['tasks'] || 0,
              max_progress: 5,
            },
          ];
          
          return {
            id: event.id,
            name: event.name,
            description: event.description,
            theme: event.theme,
            icon: event.icon,
            starts_at: event.starts_at,
            ends_at: event.ends_at,
            rewards,
            is_participating: !!participation,
            bonus_credits: event.bonus_credits || 0,
            bonus_xp: event.bonus_xp || 0,
          };
        });
        
        setActiveEvents(eventsWithRewards);
        if (eventsWithRewards.length > 0 && !selectedEvent) {
          setSelectedEvent(eventsWithRewards[0].id);
        }
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user, selectedEvent]);

  const selectedEventData = useMemo(() => 
    activeEvents.find(e => e.id === selectedEvent),
    [activeEvents, selectedEvent]
  );

  const getTimeRemaining = (endsAt: string) => {
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diff = end - now;
    
    if (diff <= 0) return 'Ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h left`;
    return `${hours}h left`;
  };

  const handleClaimReward = async (rewardId: string) => {
    toast.success('Reward claimed! Check your inventory.');
    trigger('success');
  };

  const handleJoinEvent = async (eventId: string) => {
    if (!user) return;
    
    try {
      const { error } = await supabase.from('user_event_participation').insert({
        event_id: eventId,
        user_id: user.id,
        progress: {},
      });
      
      if (error && error.code !== '23505') throw error;
      
      playSound('achievement');
      trigger('success');
      toast.success('Joined event! Start earning rewards.');
      
      // Refresh
      setActiveEvents(prev => prev.map(e => 
        e.id === eventId ? { ...e, is_participating: true } : e
      ));
    } catch {
      toast.error('Failed to join event');
    }
  };

  if (isLoading) {
    return (
      <SciFiFrame className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-primary animate-pulse" />
          <span className="font-semibold">Loading event rewards...</span>
        </div>
      </SciFiFrame>
    );
  }

  if (activeEvents.length === 0) {
    return (
      <SciFiFrame className="p-8 text-center">
        <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-1">No Active Events</h3>
        <p className="text-sm text-muted-foreground">
          Check back soon for seasonal events with exclusive rewards!
        </p>
      </SciFiFrame>
    );
  }

  return (
    <div className="space-y-6">
      {/* Event Selector */}
      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-4">
          {activeEvents.map((event) => (
            <motion.button
              key={event.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all min-w-[200px] touch-manipulation min-h-[56px]",
                selectedEvent === event.id
                  ? "bg-primary/20 border-primary/50"
                  : "bg-card/50 border-border/50 hover:border-border"
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onPointerDown={(e) => {
                if (e.pointerType === "touch") {
                  e.preventDefault();
                  setSelectedEvent(event.id);
                  trigger('selection');
                }
              }}
              onClick={(e) => {
                if (e.detail === 0) return;
                setSelectedEvent(event.id);
                trigger('selection');
              }}
            >
              <div className="text-2xl">{event.icon}</div>
              <div className="text-left">
                <p className="font-medium text-sm">{event.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {getTimeRemaining(event.ends_at)}
                </p>
              </div>
            </motion.button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
      
      {/* Selected Event Details */}
      {selectedEventData && (
        <motion.div
          key={selectedEventData.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Event Header */}
          <SciFiFrame glowIntensity="medium" className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/20 flex items-center justify-center text-3xl">
                {selectedEventData.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold">{selectedEventData.name}</h3>
                  {THEME_ICONS[selectedEventData.theme]}
                </div>
                <p className="text-muted-foreground text-sm mb-3">{selectedEventData.description}</p>
                
                <div className="flex items-center gap-4">
                  {selectedEventData.bonus_credits > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      +{selectedEventData.bonus_credits} Bonus Credits
                    </Badge>
                  )}
                  {selectedEventData.bonus_xp > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <Star className="w-3 h-3 text-cyan-400" />
                      +{selectedEventData.bonus_xp} Bonus XP
                    </Badge>
                  )}
                </div>
              </div>
              
              {!selectedEventData.is_participating ? (
                <Button
                  className="gap-1"
                  onClick={() => handleJoinEvent(selectedEventData.id)}
                >
                  <Gift className="w-4 h-4" />
                  Join Event
                </Button>
              ) : (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                  <Check className="w-3 h-3 mr-1" />
                  Participating
                </Badge>
              )}
            </div>
          </SciFiFrame>
          
          {/* Rewards Grid */}
          <div>
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Event-Exclusive Rewards
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {selectedEventData.rewards.map((reward) => (
                <RewardCard
                  key={reward.id}
                  reward={reward}
                  onClaim={() => handleClaimReward(reward.id)}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

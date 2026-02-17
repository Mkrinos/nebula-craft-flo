import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Gift, Clock, Sparkles, Trophy, 
  ChevronRight, Star, Zap, Check, PartyPopper
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useStudioSocial, StudioEvent } from '@/hooks/useStudioSocial';
import { ShootingStarsExplosion } from '@/components/gamification/ShootingStarsExplosion';

const THEME_COLORS: Record<string, { bg: string; border: string; icon: string }> = {
  winter: { bg: 'from-cyan-500/20 to-blue-500/20', border: 'border-cyan-500/30', icon: 'text-cyan-400' },
  space: { bg: 'from-violet-500/20 to-purple-500/20', border: 'border-violet-500/30', icon: 'text-violet-400' },
  spring: { bg: 'from-pink-500/20 to-rose-500/20', border: 'border-pink-500/30', icon: 'text-pink-400' },
  summer: { bg: 'from-amber-500/20 to-orange-500/20', border: 'border-amber-500/30', icon: 'text-amber-400' },
  seasonal: { bg: 'from-primary/20 to-violet-500/20', border: 'border-primary/30', icon: 'text-primary' },
};

interface SeasonalEventsProps {
  className?: string;
}

export function SeasonalEvents({ className }: SeasonalEventsProps) {
  const { events, userParticipations, isParticipating, joinEvent, getTimeRemaining, isLoading } = useStudioSocial();
  const [selectedEvent, setSelectedEvent] = useState<StudioEvent | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [joiningEvent, setJoiningEvent] = useState<string | null>(null);

  const handleJoinEvent = async (event: StudioEvent) => {
    if (isParticipating(event.id)) return;
    
    setJoiningEvent(event.id);
    const result = await joinEvent(event.id);
    
    if (result.success) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    }
    
    setJoiningEvent(null);
    setSelectedEvent(null);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        {[1, 2].map((i) => (
          <div key={i} className="h-32 rounded-xl bg-muted/50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <motion.div
        className={cn(
          "text-center py-12 rounded-xl border border-dashed",
          className
        )}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <Calendar className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
        <h3 className="font-semibold mb-1">No Active Events</h3>
        <p className="text-sm text-muted-foreground">
          Check back soon for exciting seasonal events!
        </p>
      </motion.div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      <ShootingStarsExplosion 
        isActive={showCelebration} 
        starCount={30}
        isIntense
      />

      {/* Active Events */}
      <div className="grid gap-4">
        {events.map((event, index) => {
          const colors = THEME_COLORS[event.theme] || THEME_COLORS.seasonal;
          const participating = isParticipating(event.id);
          const participation = userParticipations.find(p => p.event_id === event.id);
          
          return (
            <motion.div
              key={event.id}
              className={cn(
                "relative overflow-hidden rounded-xl border p-4",
                `bg-gradient-to-r ${colors.bg}`,
                colors.border
              )}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.01 }}
            >
              {/* Animated background elements */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className={cn("absolute w-2 h-2 rounded-full opacity-30", colors.icon)}
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${20 + (i % 3) * 20}%`,
                    }}
                    animate={{
                      y: [0, -10, 0],
                      opacity: [0.3, 0.6, 0.3],
                    }}
                    transition={{
                      duration: 2 + i * 0.5,
                      repeat: Infinity,
                      delay: i * 0.2,
                    }}
                  />
                ))}
              </div>

              <div className="relative flex items-start gap-4">
                {/* Event Icon */}
                <motion.div
                  className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-2xl",
                    "bg-background/50 backdrop-blur-sm border",
                    colors.border
                  )}
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  {event.icon}
                </motion.div>

                {/* Event Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-lg truncate">{event.name}</h3>
                    {participating && (
                      <Badge variant="secondary" className="gap-1 bg-green-500/20 text-green-400">
                        <Check className="w-3 h-3" />
                        Joined
                      </Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {event.description}
                  </p>

                  {/* Rewards */}
                  <div className="flex items-center gap-4 mb-3">
                    {event.bonus_credits > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span className="font-medium">+{event.bonus_credits} credits</span>
                      </div>
                    )}
                    {event.bonus_xp > 0 && (
                      <div className="flex items-center gap-1 text-sm">
                        <Zap className="w-4 h-4 text-violet-400" />
                        <span className="font-medium">+{event.bonus_xp} XP</span>
                      </div>
                    )}
                  </div>

                  {/* Progress (if participating) */}
                  {participating && participation && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Event Progress</span>
                        <span className="font-medium">In Progress</span>
                      </div>
                      <Progress value={30} className="h-2" />
                    </div>
                  )}

                  {/* Time Remaining & Action */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{getTimeRemaining(event.ends_at)}</span>
                    </div>

                    {!participating ? (
                      <Button
                        size="sm"
                        className="gap-1"
                        onClick={() => setSelectedEvent(event)}
                        disabled={joiningEvent === event.id}
                      >
                        {joiningEvent === event.id ? (
                          <>
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                            >
                              <Sparkles className="w-4 h-4" />
                            </motion.div>
                            Joining...
                          </>
                        ) : (
                          <>
                            <PartyPopper className="w-4 h-4" />
                            Join Event
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => setSelectedEvent(event)}
                      >
                        <Trophy className="w-4 h-4" />
                        View Details
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className="text-2xl">{selectedEvent.icon}</span>
                  {selectedEvent.name}
                </DialogTitle>
                <DialogDescription>
                  {selectedEvent.description}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Event Duration */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm">Event Duration</span>
                  </div>
                  <Badge variant="outline">
                    {getTimeRemaining(selectedEvent.ends_at)}
                  </Badge>
                </div>

                {/* Rewards */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Gift className="w-5 h-5 text-primary" />
                    Event Rewards
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {selectedEvent.bonus_credits > 0 && (
                      <motion.div
                        className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Sparkles className="w-6 h-6 text-amber-400 mb-2" />
                        <p className="font-bold text-lg">+{selectedEvent.bonus_credits}</p>
                        <p className="text-xs text-muted-foreground">Bonus Credits</p>
                      </motion.div>
                    )}
                    
                    {selectedEvent.bonus_xp > 0 && (
                      <motion.div
                        className="p-3 rounded-lg bg-violet-500/10 border border-violet-500/20"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Zap className="w-6 h-6 text-violet-400 mb-2" />
                        <p className="font-bold text-lg">+{selectedEvent.bonus_xp}</p>
                        <p className="text-xs text-muted-foreground">Bonus XP</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Exclusive Content */}
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Star className="w-5 h-5 text-primary" />
                    Exclusive Content
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Participate to unlock exclusive {selectedEvent.theme}-themed decorations and studio backgrounds!
                  </p>
                </div>

                {/* Action Button */}
                {!isParticipating(selectedEvent.id) ? (
                  <Button
                    className="w-full gap-2"
                    size="lg"
                    onClick={() => handleJoinEvent(selectedEvent)}
                    disabled={joiningEvent === selectedEvent.id}
                  >
                    {joiningEvent === selectedEvent.id ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Sparkles className="w-5 h-5" />
                        </motion.div>
                        Joining Event...
                      </>
                    ) : (
                      <>
                        <PartyPopper className="w-5 h-5" />
                        Join Event Now
                      </>
                    )}
                  </Button>
                ) : (
                  <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <Check className="w-8 h-8 mx-auto text-green-400 mb-2" />
                    <p className="font-semibold text-green-400">You're participating!</p>
                    <p className="text-sm text-muted-foreground">
                      Complete event objectives to earn rewards
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

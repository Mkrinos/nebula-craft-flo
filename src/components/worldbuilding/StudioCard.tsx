import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Lock, Check, Sparkles, Coins, Trophy, Scroll, Star } from 'lucide-react';
import type { StudioSpace } from '@/hooks/useStudioSpaces';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

const BACKGROUND_GRADIENTS: Record<string, string> = {
  gradient: 'from-amber-500/20 via-orange-500/20 to-rose-500/20',
  starfield: 'from-indigo-500/20 via-purple-500/20 to-violet-500/20',
  crystals: 'from-cyan-500/20 via-teal-500/20 to-emerald-500/20',
  clouds: 'from-sky-500/20 via-blue-400/20 to-cyan-400/20',
  neon: 'from-pink-500/20 via-fuchsia-500/20 to-violet-500/20',
  books: 'from-amber-600/20 via-yellow-500/20 to-orange-500/20',
};

const UNLOCK_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  achievement: Trophy,
  quest: Scroll,
  credits: Coins,
  starter: Star,
};

interface StudioCardProps {
  studio: StudioSpace;
  isUnlocked: boolean;
  isActive: boolean;
  onUnlock?: () => void;
  onSelect?: () => void;
  isLoading?: boolean;
}

export function StudioCard({ 
  studio, 
  isUnlocked, 
  isActive, 
  onUnlock, 
  onSelect,
  isLoading 
}: StudioCardProps) {
  const { trigger } = useHapticFeedback();
  const gradient = BACKGROUND_GRADIENTS[studio.background_style] || BACKGROUND_GRADIENTS.gradient;
  const UnlockIcon = UNLOCK_ICONS[studio.unlock_method] || Star;

  const handleClick = () => {
    trigger('medium');
    if (isUnlocked && onSelect) {
      onSelect();
    } else if (!isUnlocked && onUnlock && studio.unlock_method === 'credits') {
      onUnlock();
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") {
      e.preventDefault();
      handleClick();
    }
  };

  const handleClickEvent = (e: React.MouseEvent) => {
    if (e.detail === 0) return; // Skip if triggered by touch
    handleClick();
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl border-2 transition-all cursor-pointer touch-manipulation min-h-[80px]",
        isActive 
          ? "border-primary ring-2 ring-primary/30" 
          : isUnlocked 
            ? "border-primary/40 hover:border-primary/60" 
            : "border-muted-foreground/30 opacity-80"
      )}
      whileHover={{ scale: isUnlocked ? 1.02 : 1, y: isUnlocked ? -4 : 0 }}
      whileTap={{ scale: 0.98 }}
      onPointerDown={handlePointerDown}
      onClick={handleClickEvent}
    >
      {/* Background gradient */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-br",
        gradient
      )} />
      
      {/* Animated stars overlay for unlocked */}
      {isUnlocked && (
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 0.8, 0.3],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      )}
      
      {/* Lock overlay for locked studios */}
      {!isUnlocked && (
        <div className="absolute inset-0 bg-background/60 backdrop-blur-sm z-10 flex items-center justify-center">
          <motion.div
            className="flex flex-col items-center gap-2"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Lock className="w-8 h-8 text-muted-foreground" />
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <UnlockIcon className="w-3 h-3" />
              <span className="capitalize">{studio.unlock_method}</span>
            </div>
          </motion.div>
        </div>
      )}
      
      <div className="relative z-0 p-4">
        {/* Active indicator */}
        {isActive && (
          <motion.div
            className="absolute top-2 right-2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            <div className="bg-primary rounded-full p-1">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          </motion.div>
        )}
        
        {/* Studio preview area */}
        <div className="aspect-video mb-3 rounded-lg bg-background/30 backdrop-blur-sm border border-white/10 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center">
            <motion.div
              animate={isUnlocked ? { 
                rotate: [0, 5, -5, 0],
                scale: [1, 1.05, 1],
              } : undefined}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Sparkles className={cn(
                "w-12 h-12",
                isUnlocked ? "text-primary" : "text-muted-foreground"
              )} />
            </motion.div>
          </div>
        </div>
        
        {/* Info */}
        <h3 className="font-bold text-sm mb-1">{studio.name}</h3>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {studio.description}
        </p>
        
        {/* Action */}
        {isUnlocked ? (
          <Button
            size="sm"
            variant={isActive ? "default" : "outline"}
            className="w-full"
            disabled={isActive || isLoading}
          >
            {isActive ? (
              <>
                <Check className="w-4 h-4 mr-1" />
                Current Studio
              </>
            ) : (
              'Enter Studio'
            )}
          </Button>
        ) : studio.unlock_method === 'credits' && studio.credits_cost > 0 ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full gap-2"
            onClick={(e) => {
              e.stopPropagation();
              trigger('medium');
              onUnlock?.();
            }}
            disabled={isLoading}
          >
            <Coins className="w-4 h-4" />
            Unlock ({studio.credits_cost} credits)
          </Button>
        ) : (
          <div className="text-center text-xs text-muted-foreground py-2">
            Complete {studio.unlock_method}s to unlock
          </div>
        )}
      </div>
    </motion.div>
  );
}

import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sparkles, 
  Home, 
  Scroll, 
  Trophy,
  Plus,
  X
} from 'lucide-react';
import { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { motion, AnimatePresence } from 'framer-motion';
import { useDrag } from '@use-gesture/react';
import { useQuests } from '@/hooks/useQuests';

const quickActions = [
  { 
    id: 'create', 
    label: 'Create', 
    icon: Sparkles, 
    path: '/creative-journey',
    color: 'neon-cyan'
  },
  { 
    id: 'quests', 
    label: 'Quests', 
    icon: Scroll, 
    path: '/quests',
    color: 'neon-magenta'
  },
  { 
    id: 'dashboard', 
    label: 'Home', 
    icon: Home, 
    path: '/dashboard',
    color: 'neon-cyan'
  },
  { 
    id: 'achievements', 
    label: 'Rewards', 
    icon: Trophy, 
    path: '/achievements',
    color: 'warning'
  },
];

export function QuickActionsBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dragY, setDragY] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const haptic = useHapticFeedback();
  const menuRef = useRef<HTMLDivElement>(null);
  const { userQuests } = useQuests();

  // Check for incomplete quests (in_progress or completed but not claimed)
  const hasIncompleteQuests = useMemo(() => {
    return userQuests.some(
      uq => uq.status === 'in_progress' || uq.status === 'completed'
    );
  }, [userQuests]);

  const handleAction = useCallback((path: string) => {
    haptic.triggerNavigation('tap');
    navigate(path);
    setIsExpanded(false);
  }, [navigate, haptic]);

  const handleToggle = useCallback(() => {
    if (isExpanded) {
      haptic.trigger('light');
    } else {
      haptic.trigger('medium');
    }
    setIsExpanded(prev => !prev);
  }, [haptic, isExpanded]);

  const handleDismiss = useCallback(() => {
    haptic.triggerNavigation('swipe');
    setIsExpanded(false);
    setDragY(0);
  }, [haptic]);

  const bind = useDrag(
    ({ movement: [, my], velocity: [, vy], direction: [, dy], cancel, active }) => {
      // Only allow downward swipes
      if (my > 0) {
        setDragY(my);
        
        // Dismiss if swiped down enough or with enough velocity
        if (my > 50 || (vy > 0.5 && dy > 0)) {
          cancel();
          handleDismiss();
          return;
        }
      }
      
      // Reset on release if not dismissed
      if (!active) {
        setDragY(0);
      }
    },
    { axis: 'y', filterTaps: true }
  );

  // Don't show on landing page
  if (location.pathname === '/') return null;

  return (
    <>
      {/* Backdrop overlay */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40"
            onClick={handleDismiss}
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1 - dragY / 100, y: dragY, scale: 1 - dragY / 200 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="absolute bottom-14 left-1/2 -translate-x-1/2"
            >
              <div
                ref={menuRef}
                {...bind()}
                className="flex items-start gap-3 p-3 pb-2 bg-background/95 backdrop-blur-xl border border-border rounded-2xl shadow-lg touch-none cursor-grab active:cursor-grabbing"
                style={{ boxShadow: '0 0 30px rgba(0, 255, 255, 0.2)' }}
              >
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  const isActive = location.pathname === action.path;
                  
                  return (
                    <motion.div
                      key={action.id}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex flex-col items-center gap-1"
                    >
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleAction(action.path)}
                        className={cn(
                          "h-11 w-11 rounded-full transition-all touch-manipulation",
                          isActive 
                            ? `bg-${action.color}/20 text-${action.color} border border-${action.color}/50` 
                            : "hover:bg-muted text-foreground/70"
                        )}
                        style={isActive ? { 
                          boxShadow: `0 0 15px hsl(var(--${action.color}) / 0.3)` 
                        } : undefined}
                      >
                        <Icon className="h-5 w-5" />
                      </Button>
                      <span 
                        className={cn(
                          "text-[10px] font-medium transition-colors",
                          isActive ? `text-${action.color}` : "text-muted-foreground"
                        )}
                      >
                        {action.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Main FAB */}
      <div className="relative">
        {/* Pulsing glow ring for incomplete quests */}
        {hasIncompleteQuests && !isExpanded && (
          <motion.div
            className="absolute inset-0 rounded-full bg-neon-magenta/30"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.6, 0, 0.6],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        )}
        <motion.div
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Button
            onClick={handleToggle}
            className={cn(
              "h-12 w-12 rounded-full shadow-lg transition-all touch-manipulation",
              "border-2 relative",
              isExpanded 
                ? "bg-destructive border-destructive text-destructive-foreground" 
                : hasIncompleteQuests
                  ? "bg-neon-magenta border-neon-magenta text-white hover:bg-neon-magenta/90"
                  : "bg-neon-cyan border-neon-cyan text-space-dark hover:bg-neon-cyan/90"
            )}
            style={!isExpanded ? { 
              boxShadow: hasIncompleteQuests 
                ? '0 0 25px hsl(var(--neon-magenta) / 0.6)' 
                : '0 0 25px hsl(var(--neon-cyan) / 0.5)' 
            } : undefined}
          >
            {isExpanded ? (
              <X className="h-5 w-5" />
            ) : (
              <Plus className="h-5 w-5" />
            )}
          </Button>
        </motion.div>
      </div>
      </div>
    </>
  );
}

import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Sparkles, 
  Compass,
  Scroll,
  Home,
  MessageSquare
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { TouchLink } from '@/components/ui/touch-link';
import { HorizontalSwipeContainer } from '@/components/HorizontalSwipeContainer';

const navItems = [
  { path: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { path: '/creative-journey', label: 'Create', icon: Sparkles },
  { path: '/quests', label: 'Quests', icon: Scroll },
  { path: '/world-building', label: 'Studio', icon: Home },
  { path: '/feedback', label: 'Feedback', icon: MessageSquare, hasBadge: true },
];

export function MobileBottomNav() {
  const location = useLocation();
  const { trigger, triggerNavigation } = useHapticFeedback();
  const { isMobile, isTablet, isIOS, isAndroid, isTouchDevice } = useDeviceDetection();

  // Only show on mobile and tablet devices
  const shouldShow = isMobile || isTablet;

  const handleNavClick = (isNewRoute: boolean, itemPath: string) => {
    // Use stronger navigation haptic for route changes
    if (isNewRoute) {
      triggerNavigation('tap');
    } else {
      trigger('selection');
    }
    
    // Additional haptic for special items
    if (itemPath === '/feedback') {
      trigger('success'); // Encourage feedback
    }
  };

  if (!shouldShow) return null;

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'linear-gradient(to top, hsl(var(--space-dark) / 0.98), hsl(var(--space-dark) / 0.95))',
      }}
    >
      {/* Top glow line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" />
      
      <HorizontalSwipeContainer 
        className="px-2 py-2 backdrop-blur-xl border-t border-neon-cyan/20"
        showIndicators={true}
        indicatorVariant="neon-cyan"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showBadge = 'hasBadge' in item && item.hasBadge && !isActive;
          
          return (
            <TouchLink 
              key={item.path} 
              to={item.path}
              onClick={() => handleNavClick(location.pathname !== item.path, item.path)}
              className="flex-1 min-w-[56px] touch-feedback min-h-[48px] flex items-center justify-center active:scale-95 transition-transform"
            >
              <motion.div
                className={cn(
                  'flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg transition-colors relative pointer-events-none',
                  isActive 
                    ? 'text-neon-cyan' 
                    : 'text-muted-foreground'
                )}
                whileTap={{ scale: 0.92 }}
              >
                {/* Active indicator glow */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavGlow"
                    className="absolute inset-0 bg-neon-cyan/10 rounded-lg"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                
                {/* Icon with badge/active dot */}
                <div className="relative">
                  <Icon className={cn(
                    'w-5 h-5 transition-transform',
                    isActive && 'scale-110'
                  )} />
                  
                  {/* Pulsing badge for feedback */}
                  {showBadge && (
                    <motion.span 
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-magenta rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      style={{
                        boxShadow: '0 0 8px hsl(var(--neon-magenta))'
                      }}
                    />
                  )}
                  
                  {/* Active dot indicator */}
                  {isActive && (
                    <motion.span 
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-neon-cyan rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500 }}
                      style={{
                        boxShadow: '0 0 6px hsl(var(--neon-cyan))'
                      }}
                    />
                  )}
                </div>
                
                {/* Label */}
                <span className={cn(
                  'text-[10px] font-display uppercase tracking-wider transition-colors',
                  isActive ? 'text-neon-cyan' : 'text-muted-foreground/70'
                )}>
                  {item.label}
                </span>
                
                {/* Active underline */}
                {isActive && (
                  <motion.div
                    layoutId="activeNavUnderline"
                    className="absolute -bottom-1 left-1/4 right-1/4 h-0.5 bg-neon-cyan rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    style={{
                      boxShadow: '0 0 8px hsl(var(--neon-cyan))'
                    }}
                  />
                )}
              </motion.div>
            </TouchLink>
          );
        })}
      </HorizontalSwipeContainer>
      
      {/* Extra padding for home indicator on iOS and navigation bar on Android */}
      <div 
        className="bg-space-dark/98" 
        style={{ 
          height: isIOS 
            ? 'env(safe-area-inset-bottom, 20px)' 
            : isAndroid 
              ? 'max(env(safe-area-inset-bottom), 8px)' 
              : '0px'
        }} 
      />
    </nav>
  );
}

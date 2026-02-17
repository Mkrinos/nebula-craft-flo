import { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import NexusLogo from './NexusLogo';
import UserMenuDropdown from './UserMenuDropdown';
import SettingsPopover from './SettingsPopover';
import { AccessibilityPanel } from './accessibility/AccessibilityPanel';
import { NotificationCenter } from './notifications';
import { MusicPlayingIndicator } from './MusicPlayingIndicator';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import mx2kLogo from '@/assets/mx2k-logo-new.png';
import { 
  LayoutDashboard, 
  Sparkles, 
  Users, 
  MessageSquarePlus,
  History,
  Globe,
  Trophy,
  Shield,
  Compass,
  Scroll,
  Home
} from 'lucide-react';
// Using TouchTriggerButton from shared component for consistent touch behavior

// Removed Billing and Personas - now in user menu dropdown
const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/creative-journey', label: 'Create', icon: Sparkles },
  { path: '/quests', label: 'Quests', icon: Scroll },
  { path: '/world-building', label: 'Studio', icon: Home },
  { path: '/history', label: 'History', icon: History },
  { path: '/community', label: 'Community', icon: Globe },
  { path: '/ai-ecosystem', label: 'Explore AI', icon: Compass },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
];

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const haptic = useHapticFeedback();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMobileNavClick = useCallback(() => {
    haptic.trigger('light');
    setMobileMenuOpen(false);
  }, [haptic]);

  const handleDesktopNavClick = useCallback((path: string) => {
    haptic.trigger('light');
    navigate(path);
  }, [haptic, navigate]);

  return (
    <nav 
      id="navigation"
      role="navigation"
      aria-label="Main navigation"
      className="fixed top-0 left-0 right-0 z-50 border-b-2 border-neon-cyan/30 bg-space-dark/95 backdrop-blur-xl safe-top"
      style={{
        boxShadow: '0 4px 30px rgba(0, 255, 255, 0.1), inset 0 -1px 0 rgba(0, 255, 255, 0.2)'
      }}
    >
      {/* Top accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/60 to-transparent" aria-hidden="true" />
      
      <div className="px-2 sm:px-4">
        {/* Main header row */}
        <div className="flex items-center h-12 sm:h-14">
          {/* Mobile hamburger menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <TouchTriggerButton 
                className="sm:hidden flex items-center justify-center w-10 h-10 text-foreground/70 hover:text-neon-cyan transition-colors mr-2"
                aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              >
                <div className="relative w-5 h-5 pointer-events-none">
                  <span 
                    className={cn(
                      "absolute left-0 top-[4px] w-5 h-0.5 bg-current rounded transition-all duration-300 ease-in-out origin-center",
                      mobileMenuOpen ? "rotate-45 translate-y-[6px]" : ""
                    )}
                  />
                  <span 
                    className={cn(
                      "absolute left-0 top-[10px] w-5 h-0.5 bg-current rounded transition-all duration-300 ease-in-out",
                      mobileMenuOpen ? "opacity-0 scale-x-0" : "opacity-100"
                    )}
                  />
                  <span 
                    className={cn(
                      "absolute left-0 top-[16px] w-5 h-0.5 bg-current rounded transition-all duration-300 ease-in-out origin-center",
                      mobileMenuOpen ? "-rotate-45 -translate-y-[6px]" : ""
                    )}
                  />
                </div>
              </TouchTriggerButton>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 bg-space-dark/98 border-r border-neon-cyan/30 p-0">
              <div className="flex flex-col h-full">
                {/* Mobile menu header */}
                <div className="flex items-center justify-between p-4 border-b border-neon-cyan/20">
                  <NexusLogo size="sm" />
                </div>
                
                {/* Mobile nav items */}
                <nav className="flex-1 overflow-y-auto py-4" role="menubar">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path;
                    return (
                      <Link 
                        key={item.path} 
                        to={item.path} 
                        onClick={handleMobileNavClick}
                        role="menuitem"
                        aria-current={isActive ? 'page' : undefined}
                        className={cn(
                          'group flex items-center gap-3 px-4 py-3 font-display text-sm uppercase tracking-wider transition-all duration-300',
                          'animate-[slideInLeft_0.3s_ease-out_forwards] opacity-0',
                          isActive 
                            ? 'text-neon-cyan bg-neon-cyan/10 border-l-2 border-neon-cyan shadow-[inset_0_0_20px_hsl(var(--neon-cyan)/0.15),0_0_15px_hsl(var(--neon-cyan)/0.2)]' 
                            : 'text-foreground/70 hover:text-neon-cyan hover:bg-neon-cyan/5'
                        )}
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <Icon 
                          className={cn(
                            "w-5 h-5 transition-all duration-300",
                            isActive 
                              ? "drop-shadow-[0_0_8px_hsl(var(--neon-cyan))]" 
                              : "group-hover:drop-shadow-[0_0_6px_hsl(var(--neon-cyan)/0.7)]"
                          )} 
                          aria-hidden="true" 
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                {/* Mobile menu footer */}
                <div className="p-4 border-t border-neon-cyan/20">
                  <div className="flex items-center gap-1.5">
                    <img 
                      src={mx2kLogo} 
                      alt="MX2K Logo" 
                      className="h-5 w-auto object-contain"
                    />
                    <span className="text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                      Powered by <span className="text-neon-cyan">MX2K</span>
                    </span>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Left section: Logo and branding */}
          <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0 flex-shrink-0">
            <Link to="/dashboard" className="relative group flex-shrink-0" aria-label="Go to Dashboard">
              <NexusLogo size="sm" />
              <div className="absolute -bottom-1 left-0 right-0 h-px bg-gradient-to-r from-neon-cyan/0 via-neon-cyan/50 to-neon-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
            </Link>
            
            {/* MX2K Branding - show on tablet and above */}
            <div className="hidden sm:flex items-center gap-1.5 pl-2 md:pl-3 border-l border-neon-cyan/30 group/mx2k">
              <img 
                src={mx2kLogo} 
                alt="MX2K Logo" 
                className="h-5 md:h-6 w-auto object-contain transition-transform duration-300 group-hover/mx2k:animate-[flutter_0.4s_ease-in-out_2] gpu-accelerated"
                style={{
                  transformOrigin: 'center center'
                }}
              />
              <span className="hidden md:inline text-[10px] font-display uppercase tracking-wider text-muted-foreground">
                Powered by <span className="text-neon-cyan">MX2K</span>
              </span>
            </div>
          </div>

          {/* Right section: Music Indicator + Notifications + Accessibility + Settings + User Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 ml-auto">
            <MusicPlayingIndicator className="mr-1" />
            <NotificationCenter />
            <AccessibilityPanel />
            <SettingsPopover compact />
            <UserMenuDropdown />
          </div>
        </div>

        {/* Second row: Navigation items - visible on sm+ screens */}
        <div className="hidden sm:flex flex-wrap items-center gap-1 pb-2" role="menubar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const hasBadge = 'badge' in item && item.badge;
            return (
              <TouchTriggerButton
                key={item.path}
                onClick={() => handleDesktopNavClick(item.path)}
                role="menuitem"
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={cn(
                  'relative flex items-center gap-1 lg:gap-1.5 px-2 lg:px-3 py-1.5 font-display text-[10px] sm:text-xs uppercase tracking-wider transition-all duration-300 rounded',
                  isActive 
                    ? 'text-neon-cyan bg-neon-cyan/10' 
                    : 'text-foreground/70 hover:text-neon-cyan hover:bg-neon-cyan/5',
                  hasBadge && 'animate-pulse'
                )}
              >
                <Icon className={cn("w-3.5 h-3.5 pointer-events-none", hasBadge && !isActive && "text-primary")} aria-hidden="true" />
                <span className="pointer-events-none">{item.label}</span>
                
                {/* Badge for feedback */}
                {hasBadge && !isActive && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2 pointer-events-none" aria-label="New notification">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                  </span>
                )}
                
                {/* Active indicator */}
                {isActive && (
                  <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan))] pointer-events-none" aria-hidden="true" />
                )}
              </TouchTriggerButton>
            );
          })}
        </div>
      </div>
      
      {/* Bottom glow line */}
      <div className="absolute bottom-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent" aria-hidden="true" />
    </nav>
  );
};

export default Navigation;

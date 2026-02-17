import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { 
  LayoutDashboard, 
  Sparkles, 
  History,
  Globe,
  Trophy,
  Compass,
  Scroll,
  Home,
  ChevronLeft,
  ChevronRight,
  MessageSquare
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import NexusLogo from '@/components/NexusLogo';
import { TouchLink } from '@/components/ui/touch-link';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/creative-journey', label: 'Create', icon: Sparkles },
  { path: '/quests', label: 'Quests', icon: Scroll },
  { path: '/world-building', label: 'Studio', icon: Home },
  { path: '/history', label: 'History', icon: History },
  { path: '/community', label: 'Community', icon: Globe },
  { path: '/ai-ecosystem', label: 'Explore AI', icon: Compass },
  { path: '/achievements', label: 'Achievements', icon: Trophy },
  { path: '/feedback', label: 'Feedback', icon: MessageSquare, badge: 'Your Voice Matters!' },
];

export function AppSidebar() {
  const location = useLocation();
  const haptic = useHapticFeedback();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const handleNavClick = (path: string, isCurrentRoute: boolean) => {
    if (isCurrentRoute) {
      haptic.trigger('selection');
    } else {
      haptic.trigger('navigation');
    }
    
    // Special haptic for feedback page to encourage interaction
    if (path === '/feedback') {
      haptic.trigger('success');
    }
  };
  
  const handleToggleSidebar = () => {
    haptic.trigger('button-press');
    toggleSidebar();
  };

  return (
    <TooltipProvider delayDuration={100}>
      <Sidebar 
        collapsible="icon" 
        className="border-r border-neon-cyan/20 bg-space-dark/95 backdrop-blur-xl"
      >
        <SidebarHeader className="border-b border-neon-cyan/20 p-3">
          <div className="flex items-center justify-between">
            <TouchLink to="/dashboard" className="flex items-center gap-2 min-h-[44px]">
              <NexusLogo size="sm" />
              {!isCollapsed && (
                <span className="font-display text-sm font-bold text-gradient">
                  NexusTouch
                </span>
              )}
            </TouchLink>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleSidebar}
              className="h-9 w-9 min-h-[44px] min-w-[44px] text-muted-foreground hover:text-foreground touch-manipulation active:scale-90 transition-transform"
            >
              {isCollapsed ? (
                <ChevronRight className="h-4 w-4 pointer-events-none" />
              ) : (
                <ChevronLeft className="h-4 w-4 pointer-events-none" />
              )}
            </Button>
          </div>
        </SidebarHeader>

        <SidebarContent className="py-2">
          <SidebarGroup>
            <SidebarGroupLabel className={cn(
              "text-[10px] uppercase tracking-wider text-muted-foreground px-3",
              isCollapsed && "sr-only"
            )}>
              Navigation
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="gap-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  const hasBadge = 'badge' in item && item.badge;
                  
                  const navButton = (
                    <TouchLink
                      to={item.path}
                      onClick={() => handleNavClick(item.path, isActive)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all relative min-h-[44px] touch-manipulation active:scale-[0.98]",
                        isActive 
                          ? "bg-neon-cyan/10 text-neon-cyan border-l-2 border-neon-cyan" 
                          : "text-foreground/70 hover:text-neon-cyan hover:bg-neon-cyan/5 active:bg-neon-cyan/10"
                      )}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon className="h-5 w-5" />
                        {hasBadge && !isActive && (
                          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neon-magenta rounded-full animate-pulse" 
                            style={{ boxShadow: '0 0 8px hsl(var(--neon-magenta))' }} 
                          />
                        )}
                      </div>
                      {!isCollapsed && (
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-display text-xs uppercase tracking-wider truncate">
                            {item.label}
                          </span>
                          {hasBadge && !isActive && (
                            <span className="text-[8px] px-1.5 py-0.5 bg-neon-magenta/20 text-neon-magenta rounded-full font-display uppercase tracking-wider animate-pulse whitespace-nowrap flex-shrink-0">
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </TouchLink>
                  );

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        className="p-0"
                      >
                        {isCollapsed ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              {navButton}
                            </TooltipTrigger>
                            <TooltipContent 
                              side="right" 
                              className="bg-background/95 backdrop-blur-xl border-border"
                            >
                              <span className="font-display text-xs uppercase tracking-wider">
                                {item.label}
                              </span>
                              {hasBadge && (
                                <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-neon-magenta/20 text-neon-magenta rounded-full">
                                  New
                                </span>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          navButton
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-neon-cyan/20 p-3">
          {!isCollapsed && (
            <div className="text-[10px] text-muted-foreground text-center">
              <span className="text-neon-cyan">MX2K</span> Powered
            </div>
          )}
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}

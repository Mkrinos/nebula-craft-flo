import NexusLogo from '@/components/NexusLogo';
import UserMenuDropdown from '@/components/UserMenuDropdown';
import SettingsPopover from '@/components/SettingsPopover';
import { AccessibilityPanel } from '@/components/accessibility/AccessibilityPanel';
import { NotificationCenter } from '@/components/notifications';
import { MusicPlayingIndicator } from '@/components/MusicPlayingIndicator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import mx2kLogo from '@/assets/mx2k-logo-new.png';
import { TouchLink } from '@/components/ui/touch-link';

export function SidebarHeader() {
  return (
    <header 
      className="sticky top-0 z-40 border-b border-neon-cyan/20 bg-space-dark/95 backdrop-blur-xl"
      style={{
        boxShadow: '0 4px 30px rgba(0, 255, 255, 0.1)'
      }}
    >
      <div className="flex items-center justify-between h-14 px-4">
        {/* Left: Sidebar trigger + Logo */}
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8" />
          
          <TouchLink to="/dashboard" className="flex items-center gap-2">
            <NexusLogo size="sm" />
            <span className="font-display text-sm font-bold text-gradient hidden sm:inline">
              NexusTouch
            </span>
          </TouchLink>

          {/* MX2K Branding */}
          <div className="hidden lg:flex items-center gap-1.5 pl-3 border-l border-neon-cyan/30">
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

        {/* Right: Controls - elevated z-index for touch reliability */}
        <div className="flex items-center gap-2 relative z-50">
          <MusicPlayingIndicator className="mr-1" />
          <NotificationCenter />
          <AccessibilityPanel />
          <SettingsPopover compact />
          <UserMenuDropdown />
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGlobalPersona } from '@/contexts/GlobalPersonaContext';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import GlobalPersonaCompanion from './GlobalPersonaCompanion';
import AccountSettingsDialog from './AccountSettingsDialog';
import { SciFiBadge } from './ui/sci-fi-badge';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { cn } from '@/lib/utils';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Zap, LogOut, User, CreditCard, ChevronDown, Settings } from 'lucide-react';

const UserMenuDropdown = () => {
  const { signOut } = useAuth();
  const { persona } = useGlobalPersona();
  const haptic = useHapticFeedback();
  const navigate = useNavigate();
  const [showAccountSettings, setShowAccountSettings] = useState(false);

  const handleLogout = async () => {
    haptic.trigger('selection');
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <TouchTriggerButton
            className="flex items-center gap-2 px-3 lg:px-4 py-2 border-2 border-neon-cyan/50 bg-space-elevated/70 hover:bg-space-elevated hover:border-neon-cyan transition-all duration-150 rounded-sm shadow-[0_0_10px_rgba(0,255,255,0.2)] min-h-[44px] active:scale-95 active:shadow-[0_0_20px_rgba(0,255,255,0.4)] active:border-neon-cyan"
            style={{
              clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)'
            }}
          >
            {/* Avatar or default icon */}
            {persona?.avatar_url ? (
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full overflow-hidden border border-neon-cyan/50 pointer-events-none">
                <img src={persona.avatar_url} alt={persona.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-6 h-6 lg:w-7 lg:h-7 rounded-full bg-primary/20 border border-neon-cyan/50 flex items-center justify-center pointer-events-none">
                <User className="w-3 h-3 lg:w-4 lg:h-4 text-neon-cyan" />
              </div>
            )}
            
            {/* Credits display */}
            <div className="flex items-center gap-1.5 pointer-events-none">
              <Zap className="w-3 h-3 lg:w-3.5 lg:h-3.5 text-neon-cyan" />
              <span className="text-xs lg:text-sm font-display font-bold text-neon-cyan">100</span>
            </div>
            
            <ChevronDown className="w-3 h-3 text-muted-foreground pointer-events-none" />
          </TouchTriggerButton>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-space-dark/95 backdrop-blur-xl border-neon-cyan/30 z-50"
        >
          {/* User info header */}
          <DropdownMenuLabel className="flex items-center gap-3 py-3">
            {persona?.avatar_url ? (
              <GlobalPersonaCompanion position="header" size="sm" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-primary/20 border border-neon-cyan/50 flex items-center justify-center">
                <User className="w-5 h-5 text-neon-cyan" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-display text-foreground truncate">
                {persona?.name || 'Explorer'}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Zap className="w-3 h-3 text-neon-cyan" />
                <span className="text-xs text-muted-foreground">100 Credits</span>
                <SciFiBadge variant="accent" size="sm">PRO</SciFiBadge>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-neon-cyan/20" />
          
          <DropdownMenuItem
            onSelect={() => {
              haptic.trigger('selection');
              navigate('/personas');
            }}
            className="cursor-pointer focus:bg-neon-cyan/10 focus:text-neon-cyan min-h-[44px] touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-neon-cyan/15"
          >
            <User className="w-4 h-4 mr-2 pointer-events-none" />
            <span className="pointer-events-none">My Personas</span>
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onSelect={() => {
              haptic.trigger('selection');
              navigate('/billing');
            }}
            className="cursor-pointer focus:bg-neon-cyan/10 focus:text-neon-cyan min-h-[44px] touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-neon-cyan/15"
          >
            <CreditCard className="w-4 h-4 mr-2 pointer-events-none" />
            <span className="pointer-events-none">Billing & Credits</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => {
              haptic.trigger('selection');
              setShowAccountSettings(true);
            }}
            className="cursor-pointer focus:bg-neon-cyan/10 focus:text-neon-cyan min-h-[44px] touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-neon-cyan/15"
          >
            <Settings className="w-4 h-4 mr-2 pointer-events-none" />
            <span className="pointer-events-none">Account Settings</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-neon-cyan/20" />
          
          <DropdownMenuItem 
            onSelect={handleLogout}
            className="cursor-pointer text-destructive focus:bg-destructive/10 focus:text-destructive min-h-[44px] touch-manipulation transition-all duration-150 active:scale-[0.98] active:bg-destructive/15"
          >
            <LogOut className="w-4 h-4 mr-2 pointer-events-none" />
            <span className="pointer-events-none">Sign Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AccountSettingsDialog 
        open={showAccountSettings} 
        onOpenChange={setShowAccountSettings} 
      />
    </>
  );
};

export default UserMenuDropdown;

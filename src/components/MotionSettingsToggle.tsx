import { useState } from 'react';
import { motion } from 'framer-motion';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { SciFiFrame } from '@/components/ui/sci-fi-frame';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { TouchTriggerButton } from '@/components/ui/touch-trigger-button';
import { Settings2, Sparkles, Zap, Eye, EyeOff, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

// Animated preview icon component
function ModePreviewIcon({ mode }: { mode: 'auto' | 'full' | 'reduced' | 'minimal' }) {
  const baseClasses = "w-3 h-3 rounded-full";
  
  if (mode === 'full') {
    return (
      <motion.div
        className={cn(baseClasses, "bg-neon-cyan")}
        animate={{ 
          scale: [1, 1.3, 1],
          boxShadow: [
            "0 0 0px hsl(var(--neon-cyan))",
            "0 0 12px hsl(var(--neon-cyan))",
            "0 0 0px hsl(var(--neon-cyan))"
          ]
        }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
  
  if (mode === 'reduced') {
    return (
      <motion.div
        className={cn(baseClasses, "bg-neon-cyan/70")}
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
    );
  }
  
  if (mode === 'minimal') {
    return (
      <div className={cn(baseClasses, "bg-muted-foreground/50")} />
    );
  }
  
  // Auto mode - subtle pulse
  return (
    <motion.div
      className={cn(baseClasses, "bg-neon-cyan/50")}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

interface MotionSettingsToggleProps {
  compact?: boolean;
  className?: string;
}

export default function MotionSettingsToggle({ compact = false, className }: MotionSettingsToggleProps) {
  const { settings, setPerformanceMode, updateSettings } = useMotionSettings();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleModeChange = (mode: 'auto' | 'full' | 'reduced' | 'minimal') => {
    setPerformanceMode(mode);
    toast({
      title: `Motion: ${modeLabels[mode]}`,
      description: modeDescriptions[mode],
    });
  };

  const toggleDashboard = () => {
    updateSettings({ showPerformanceDashboard: !settings.showPerformanceDashboard });
    toast({
      title: settings.showPerformanceDashboard ? 'Dashboard Hidden' : 'Dashboard Visible',
      description: settings.showPerformanceDashboard 
        ? 'Performance dashboard is now hidden' 
        : 'View real-time FPS, memory, and device info',
    });
  };

  const modeLabels = {
    auto: 'Auto (System)',
    full: 'Full Effects',
    reduced: 'Reduced',
    minimal: 'Minimal',
  };

  const modeDescriptions = {
    auto: 'Follows your system accessibility settings',
    full: 'All animations, glow effects, and particles enabled',
    reduced: 'Fewer particles, keeps glow and transitions',
    minimal: 'Essential transitions only, best for performance',
  };

  const modeIcons = {
    auto: Settings2,
    full: Sparkles,
    reduced: Eye,
    minimal: EyeOff,
  };

  const CurrentIcon = modeIcons[settings.performanceMode];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
                <DropdownMenuTrigger asChild>
                  <TouchTriggerButton
                    title="Animation settings"
                    aria-label="Animation settings"
                    className={cn(
                      "relative inline-flex items-center justify-center gap-2 font-display font-semibold uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 touch-manipulation active:scale-95 [&_svg]:pointer-events-none",
                      "h-11 w-11 min-h-[44px] min-w-[44px]",
                      settings.reducedMotion
                        ? "border-2 border-transparent text-foreground hover:border-neon-cyan/40 hover:text-neon-cyan hover:bg-neon-cyan/10"
                        : "bg-space-elevated border-2 border-neon-cyan/60 text-neon-cyan shadow-[0_0_15px_hsl(var(--neon-cyan)/0.3)] hover:bg-neon-cyan/20 hover:shadow-[0_0_25px_hsl(var(--neon-cyan)/0.5)] hover:border-neon-cyan",
                      className
                    )}
                  >
                    <CurrentIcon className="w-4 h-4" />
                  </TouchTriggerButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-64 bg-space-elevated border-neon-cyan/30"
                >
                  {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map((mode) => {
                    const Icon = modeIcons[mode];
                    return (
                      <DropdownMenuItem
                        key={mode}
                        onClick={() => handleModeChange(mode)}
                        className={cn(
                          'flex flex-col items-start gap-0.5 cursor-pointer py-2',
                          settings.performanceMode === mode && 'bg-neon-cyan/10'
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <ModePreviewIcon mode={mode} />
                          <Icon className="w-4 h-4" />
                          <span className="flex-1">{modeLabels[mode]}</span>
                          {settings.performanceMode === mode && (
                            <div className="w-2 h-2 bg-neon-cyan rounded-full" />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground/70 pl-7">
                          {modeDescriptions[mode]}
                        </span>
                      </DropdownMenuItem>
                    );
                  })}
                  
                  {/* Separator */}
                  <div className="h-px bg-neon-cyan/20 my-2" />
                  
                  {/* Dashboard Toggle */}
                  <DropdownMenuItem
                    onClick={toggleDashboard}
                    className={cn(
                      'flex flex-col items-start gap-0.5 cursor-pointer py-2',
                      settings.showPerformanceDashboard && 'bg-neon-cyan/10'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Activity className={cn(
                        'w-4 h-4',
                        settings.showPerformanceDashboard ? 'text-neon-cyan' : 'text-muted-foreground'
                      )} />
                      <span className="flex-1">Performance Dashboard</span>
                      {settings.showPerformanceDashboard && (
                        <div className="w-2 h-2 bg-neon-cyan rounded-full" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/70 pl-6">
                      Show real-time FPS, memory & device info
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Animation & performance settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <SciFiFrame size="sm" glowIntensity="subtle" className={cn('p-4', className)}>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-neon-cyan" />
          <h3 className="font-display text-sm uppercase tracking-wider text-foreground">
            Motion Settings
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(modeLabels) as Array<keyof typeof modeLabels>).map((mode) => {
            const Icon = modeIcons[mode];
            const isActive = settings.performanceMode === mode;
            
            return (
              <motion.button
                key={mode}
                onPointerDown={(e) => {
                  if (e.pointerType === "touch") {
                    e.preventDefault();
                    handleModeChange(mode);
                  }
                }}
                onClick={(e) => {
                  if (e.detail === 0) return;
                  handleModeChange(mode);
                }}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 border transition-all touch-manipulation min-h-[80px]',
                  isActive 
                    ? 'border-neon-cyan bg-neon-cyan/10 text-neon-cyan' 
                    : 'border-neon-cyan/30 bg-space-dark/50 text-muted-foreground hover:border-neon-cyan/50 hover:text-foreground'
                )}
                whileHover={!settings.reducedMotion ? { scale: 1.02 } : undefined}
                whileTap={!settings.reducedMotion ? { scale: 0.98 } : undefined}
                style={{
                  clipPath: 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))'
                }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-display uppercase tracking-wider">
                  {modeLabels[mode]}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Status indicators */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-neon-cyan/20">
          <span className={cn(
            'text-xs px-2 py-1 rounded',
            settings.enableGlow ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted text-muted-foreground'
          )}>
            Glow {settings.enableGlow ? 'ON' : 'OFF'}
          </span>
          <span className={cn(
            'text-xs px-2 py-1 rounded',
            settings.enableParticles ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-muted text-muted-foreground'
          )}>
            Particles {settings.enableParticles ? 'ON' : 'OFF'}
          </span>
        </div>
      </div>
    </SciFiFrame>
  );
}

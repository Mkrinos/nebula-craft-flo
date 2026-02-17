import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface MotionSettings {
  // Master toggle for reduced motion
  reducedMotion: boolean;
  // Specific motion categories
  enableGlow: boolean;
  enableParticles: boolean;
  enableTransitions: boolean;
  enableHoverEffects: boolean;
  // Timing settings
  transitionDuration: 'fast' | 'normal' | 'slow';
  // Performance mode
  performanceMode: 'auto' | 'full' | 'reduced' | 'minimal';
  // Developer tools
  showPerformanceDashboard: boolean;
  // Auto-adjustment settings
  autoAdjustEnabled: boolean;
  latencyThreshold: number;
}

const defaultSettings: MotionSettings = {
  reducedMotion: false,
  enableGlow: true,
  enableParticles: true,
  enableTransitions: true,
  enableHoverEffects: true,
  transitionDuration: 'normal',
  performanceMode: 'auto',
  showPerformanceDashboard: false,
  autoAdjustEnabled: true,
  latencyThreshold: 120,
};

const reducedSettings: MotionSettings = {
  reducedMotion: true,
  enableGlow: false,
  enableParticles: false,
  enableTransitions: true, // Keep essential transitions
  enableHoverEffects: true,
  transitionDuration: 'fast',
  performanceMode: 'minimal',
  showPerformanceDashboard: false,
  autoAdjustEnabled: true,
  latencyThreshold: 120,
};

// Timing presets in milliseconds
export const timingPresets = {
  fast: { duration: 150, ease: 'ease-out' },
  normal: { duration: 300, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slow: { duration: 500, ease: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

// Interaction state classes
export const interactionStates = {
  idle: 'transition-all',
  hover: 'hover:scale-[1.02] hover:brightness-110',
  active: 'active:scale-[0.98] active:brightness-95',
  focus: 'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  disabled: 'opacity-50 pointer-events-none',
  loading: 'animate-pulse pointer-events-none',
};

interface MotionSettingsContextType {
  settings: MotionSettings;
  updateSettings: (partial: Partial<MotionSettings>) => void;
  toggleReducedMotion: () => void;
  setPerformanceMode: (mode: MotionSettings['performanceMode']) => void;
  getTransitionProps: () => { duration: number; ease: string };
  shouldAnimate: (type: 'glow' | 'particles' | 'transitions' | 'hover') => boolean;
}

const MotionSettingsContext = createContext<MotionSettingsContextType | undefined>(undefined);

export function MotionSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<MotionSettings>(() => {
    // Check localStorage for saved preferences
    const saved = localStorage.getItem('motionSettings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Auto-detect optimal performance mode on mount
  useEffect(() => {
    if (settings.performanceMode !== 'auto') return;

    const detectOptimalMode = () => {
      const nav = navigator as any;
      const cores = nav.hardwareConcurrency || 4;
      const memory = nav.deviceMemory || 4;
      const connection = nav.connection || nav.mozConnection || nav.webkitConnection;
      const connectionType = connection?.effectiveType;
      
      // Check for low-end indicators
      const isLowEnd = cores <= 2 || memory <= 2;
      const isSlowConnection = connectionType === 'slow-2g' || connectionType === '2g';
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      if (isLowEnd || isSlowConnection || prefersReducedMotion) {
        setSettings(prev => ({
          ...prev,
          reducedMotion: true,
          enableGlow: false,
          enableParticles: false,
        }));
      }
    };

    detectOptimalMode();
  }, [settings.performanceMode]);

  // Detect system preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      if (settings.performanceMode === 'auto') {
        setSettings(prev => ({
          ...prev,
          reducedMotion: e.matches,
          enableGlow: !e.matches,
          enableParticles: !e.matches,
        }));
      }
    };

    // Check initial state
    if (settings.performanceMode === 'auto') {
      handleChange(mediaQuery);
    }

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [settings.performanceMode]);

  // Save settings to localStorage and apply CSS classes
  useEffect(() => {
    localStorage.setItem('motionSettings', JSON.stringify(settings));
    
    // Apply CSS custom properties
    const root = document.documentElement;
    root.style.setProperty('--motion-duration', 
      settings.transitionDuration === 'fast' ? '150ms' :
      settings.transitionDuration === 'slow' ? '500ms' : '300ms'
    );
    
    // Apply performance mode data attribute
    root.setAttribute('data-performance-mode', settings.performanceMode);
    
    // Apply reduced motion class
    if (settings.reducedMotion) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Apply glow settings via CSS custom property
    root.style.setProperty('--enable-glow', settings.enableGlow ? '1' : '0');
    root.style.setProperty('--enable-particles', settings.enableParticles ? '1' : '0');
  }, [settings]);

  const updateSettings = useCallback((partial: Partial<MotionSettings>) => {
    setSettings(prev => ({ ...prev, ...partial }));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setSettings(prev => {
      if (prev.reducedMotion) {
        return { ...defaultSettings, performanceMode: 'full' };
      } else {
        return { ...reducedSettings, performanceMode: 'minimal' };
      }
    });
  }, []);

  const setPerformanceMode = useCallback((mode: MotionSettings['performanceMode']) => {
    switch (mode) {
      case 'full':
        setSettings({ ...defaultSettings, performanceMode: 'full' });
        break;
      case 'reduced':
        setSettings({
          ...defaultSettings,
          performanceMode: 'reduced',
          enableParticles: false,
          enableGlow: true,
        });
        break;
      case 'minimal':
        setSettings({ ...reducedSettings, performanceMode: 'minimal' });
        break;
      case 'auto':
      default:
        setSettings({ ...defaultSettings, performanceMode: 'auto' });
        break;
    }
  }, []);

  const getTransitionProps = useCallback(() => {
    return timingPresets[settings.transitionDuration];
  }, [settings.transitionDuration]);

  const shouldAnimate = useCallback((type: 'glow' | 'particles' | 'transitions' | 'hover') => {
    if (settings.reducedMotion && type !== 'transitions') return false;
    
    switch (type) {
      case 'glow': return settings.enableGlow;
      case 'particles': return settings.enableParticles;
      case 'transitions': return settings.enableTransitions;
      case 'hover': return settings.enableHoverEffects;
      default: return true;
    }
  }, [settings]);

  return (
    <MotionSettingsContext.Provider value={{
      settings,
      updateSettings,
      toggleReducedMotion,
      setPerformanceMode,
      getTransitionProps,
      shouldAnimate,
    }}>
      {children}
    </MotionSettingsContext.Provider>
  );
}

export function useMotionSettings() {
  const context = useContext(MotionSettingsContext);
  if (!context) {
    throw new Error('useMotionSettings must be used within MotionSettingsProvider');
  }
  return context;
}

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AccessibilitySettings {
  highContrastEnabled: boolean;
  reducedMotionEnabled: boolean;
  screenReaderOptimized: boolean;
  fontSizeScale: number;
  keyboardNavigationEnhanced: boolean;
  focusIndicatorsEnhanced: boolean;
  audioDescriptionsEnabled: boolean;
}

interface AccessibilityContextValue {
  settings: AccessibilitySettings;
  updateSetting: <K extends keyof AccessibilitySettings>(key: K, value: AccessibilitySettings[K]) => void;
  resetSettings: () => void;
  isLoading: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrastEnabled: false,
  reducedMotionEnabled: false,
  screenReaderOptimized: false,
  fontSizeScale: 1.0,
  keyboardNavigationEnhanced: true,
  focusIndicatorsEnhanced: true,
  audioDescriptionsEnabled: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

export const useAccessibilitySettings = () => {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibilitySettings must be used within AccessibilityProvider');
  }
  return context;
};

// Safe hook for components outside provider
export const useAccessibilitySettingsSafe = () => {
  const context = useContext(AccessibilityContext);
  return context || {
    settings: defaultSettings,
    updateSetting: () => {},
    resetSettings: () => {},
    isLoading: false,
  };
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  // Load settings from localStorage and database
  useEffect(() => {
    const loadSettings = async () => {
      // First, check localStorage for guest settings
      const storedSettings = localStorage.getItem('accessibility-settings');
      if (storedSettings) {
        try {
          const parsed = JSON.parse(storedSettings);
          setSettings({ ...defaultSettings, ...parsed });
        } catch (e) {
          console.error('Failed to parse accessibility settings:', e);
        }
      }

      // Check system preferences
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const prefersHighContrast = window.matchMedia('(prefers-contrast: more)').matches;
      
      if (prefersReducedMotion || prefersHighContrast) {
        setSettings(prev => ({
          ...prev,
          reducedMotionEnabled: prefersReducedMotion || prev.reducedMotionEnabled,
          highContrastEnabled: prefersHighContrast || prev.highContrastEnabled,
        }));
      }

      // If user is logged in, fetch from database
      if (user) {
        const { data, error } = await supabase
          .from('user_accessibility_settings')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setSettings({
            highContrastEnabled: data.high_contrast_enabled,
            reducedMotionEnabled: data.reduced_motion_enabled,
            screenReaderOptimized: data.screen_reader_optimized,
            fontSizeScale: Number(data.font_size_scale),
            keyboardNavigationEnhanced: data.keyboard_navigation_enhanced,
            focusIndicatorsEnhanced: data.focus_indicators_enhanced,
            audioDescriptionsEnabled: data.audio_descriptions_enabled,
          });
        }
      }

      setIsLoading(false);
    };

    loadSettings();
  }, [user]);

  // Apply settings to document
  useEffect(() => {
    const root = document.documentElement;

    // High contrast
    root.setAttribute('data-high-contrast', settings.highContrastEnabled ? 'true' : 'false');
    
    // Reduced motion
    if (settings.reducedMotionEnabled) {
      root.classList.add('reduce-motion');
    } else {
      root.classList.remove('reduce-motion');
    }

    // Font size scale
    root.style.setProperty('--font-scale', settings.fontSizeScale.toString());
    
    // Enhanced focus indicators
    root.setAttribute('data-enhanced-focus', settings.focusIndicatorsEnhanced ? 'true' : 'false');
    
    // Screen reader optimizations
    root.setAttribute('data-sr-optimized', settings.screenReaderOptimized ? 'true' : 'false');

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = useCallback(async <K extends keyof AccessibilitySettings>(
    key: K, 
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));

    // Persist to database if logged in
    if (user) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase() as string;
      const { error } = await supabase
        .from('user_accessibility_settings')
        .upsert({
          user_id: user.id,
          [dbKey]: value,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      if (error) {
        console.error('Failed to save accessibility setting:', error);
      }
    }
  }, [user]);

  const resetSettings = useCallback(async () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');

    if (user) {
      await supabase
        .from('user_accessibility_settings')
        .delete()
        .eq('user_id', user.id);
    }
  }, [user]);

  return (
    <AccessibilityContext.Provider value={{ settings, updateSetting, resetSettings, isLoading }}>
      {children}
    </AccessibilityContext.Provider>
  );
};

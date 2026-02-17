import React, { ReactNode, useEffect } from 'react';
import { useAdaptivePerformance } from '@/hooks/useAdaptivePerformance';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { toast } from 'sonner';

interface AdaptivePerformanceProviderProps {
  children: ReactNode;
  showNotifications?: boolean;
}

/**
 * Provider component that enables automatic performance mode switching
 * based on real-time touch latency and device performance metrics.
 */
export function AdaptivePerformanceProvider({ 
  children, 
  showNotifications = false 
}: AdaptivePerformanceProviderProps) {
  const { settings } = useMotionSettings();
  const { 
    isAutoMode, 
    currentMode, 
    hasTouchLatencyIssue,
    metrics 
  } = useAdaptivePerformance({
    latencyThreshold: settings.latencyThreshold,
    enabled: settings.autoAdjustEnabled,
  });

  // Show notification when mode changes automatically
  useEffect(() => {
    if (!showNotifications || !isAutoMode) return;

    // Only notify on mode changes (not initial render)
    const lastMode = sessionStorage.getItem('lastPerformanceMode');
    
    if (lastMode && lastMode !== currentMode) {
      const modeLabels = {
        full: 'Full Effects',
        reduced: 'Reduced Effects',
        minimal: 'Minimal Effects',
        auto: 'Auto'
      };

      if (currentMode === 'minimal' || currentMode === 'reduced') {
        toast.info(`Switched to ${modeLabels[currentMode]}`, {
          description: 'Automatically adjusted for better responsiveness',
          duration: 3000,
        });
      }
    }

    sessionStorage.setItem('lastPerformanceMode', currentMode);
  }, [currentMode, isAutoMode, showNotifications]);

  return <>{children}</>;
}

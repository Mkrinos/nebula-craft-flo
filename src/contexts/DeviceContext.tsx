import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useDeviceDetection, DeviceInfo } from '@/hooks/useDeviceDetection';
import { usePerformanceMonitor, PerformanceMetrics } from '@/hooks/usePerformanceMonitor';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';

interface DeviceContextType {
  device: DeviceInfo;
  performance: PerformanceMetrics;
  isPerformanceIssue: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const device = useDeviceDetection();
  const { metrics, getSuggestedMode, isPerformanceIssue } = usePerformanceMonitor();
  const { settings, setPerformanceMode } = useMotionSettings();

  // Apply device-specific CSS classes and properties
  useEffect(() => {
    const root = document.documentElement;
    
    // Device type classes
    root.classList.toggle('is-mobile', device.isMobile);
    root.classList.toggle('is-tablet', device.isTablet);
    root.classList.toggle('is-desktop', device.isDesktop);
    root.classList.toggle('is-touch', device.isTouchDevice);
    root.classList.toggle('is-ios', device.isIOS);
    root.classList.toggle('is-android', device.isAndroid);
    root.classList.toggle('is-standalone', device.isStandalone);
    
    // Orientation
    root.setAttribute('data-orientation', device.orientation);
    
    // Safe area insets as CSS custom properties
    root.style.setProperty('--sat', `env(safe-area-inset-top, 0px)`);
    root.style.setProperty('--sab', `env(safe-area-inset-bottom, 0px)`);
    root.style.setProperty('--sal', `env(safe-area-inset-left, 0px)`);
    root.style.setProperty('--sar', `env(safe-area-inset-right, 0px)`);
    
    // Screen dimensions
    root.style.setProperty('--screen-width', `${device.screenWidth}px`);
    root.style.setProperty('--screen-height', `${device.screenHeight}px`);
    
    // Touch-friendly sizing on mobile
    if (device.isMobile || device.isTablet) {
      root.style.setProperty('--touch-target-size', '44px');
      root.style.setProperty('--spacing-scale', '1.1');
    } else {
      root.style.setProperty('--touch-target-size', '32px');
      root.style.setProperty('--spacing-scale', '1');
    }
  }, [device]);

  // Auto-adjust performance mode based on detected issues
  useEffect(() => {
    if (settings.performanceMode === 'auto' && isPerformanceIssue) {
      const suggestedMode = getSuggestedMode();
      if (suggestedMode !== 'full') {
        setPerformanceMode(suggestedMode);
      }
    }
  }, [isPerformanceIssue, getSuggestedMode, settings.performanceMode, setPerformanceMode]);

  // Prevent iOS bounce/rubber-band scrolling on body
  useEffect(() => {
    if (device.isIOS) {
      document.body.style.overscrollBehavior = 'none';
      document.documentElement.style.overscrollBehavior = 'none';
    }
    
    return () => {
      document.body.style.overscrollBehavior = '';
      document.documentElement.style.overscrollBehavior = '';
    };
  }, [device.isIOS]);

  return (
    <DeviceContext.Provider value={{
      device,
      performance: metrics,
      isPerformanceIssue,
    }}>
      {children}
    </DeviceContext.Provider>
  );
}

export function useDevice() {
  const context = useContext(DeviceContext);
  if (!context) {
    throw new Error('useDevice must be used within DeviceProvider');
  }
  return context;
}

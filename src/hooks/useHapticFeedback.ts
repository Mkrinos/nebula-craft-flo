/**
 * Enhanced Cross-platform haptic feedback utility
 * Provides consistent haptic patterns across iOS, Android, and desktop devices
 * with configurable intensity multipliers and navigation-specific patterns
 * 
 * IMPORTANT: iOS Safari does NOT support navigator.vibrate() at all.
 * This module handles that gracefully with visual/audio fallbacks.
 */

export type HapticIntensity = 
  | 'light' 
  | 'medium' 
  | 'heavy' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'selection'
  // Enhanced navigation patterns
  | 'navigation'
  | 'button-press'
  | 'swipe'
  | 'long-press'
  | 'double-tap'
  | 'tour-step'
  | 'achievement';

interface HapticPattern {
  vibration: number | number[];
  fallbackDuration: number;
  // Intensity multiplier for Android (1.0 = normal, 2.0 = double strength)
  intensityMultiplier?: number;
}

// Enhanced device-specific vibration patterns optimized for iOS/Android
const hapticPatterns: Record<HapticIntensity, HapticPattern> = {
  // Basic patterns
  light: {
    vibration: 15,
    fallbackDuration: 15,
    intensityMultiplier: 1.0,
  },
  medium: {
    vibration: 35,
    fallbackDuration: 35,
    intensityMultiplier: 1.2,
  },
  heavy: {
    vibration: 60,
    fallbackDuration: 60,
    intensityMultiplier: 1.5,
  },
  success: {
    vibration: [15, 60, 25, 60, 15],
    fallbackDuration: 175,
    intensityMultiplier: 1.3,
  },
  warning: {
    vibration: [40, 60, 40, 60, 40],
    fallbackDuration: 240,
    intensityMultiplier: 1.4,
  },
  error: {
    vibration: [60, 40, 60, 40, 60, 40, 60],
    fallbackDuration: 360,
    intensityMultiplier: 1.5,
  },
  selection: {
    vibration: 8,
    fallbackDuration: 8,
    intensityMultiplier: 0.8,
  },
  // Enhanced navigation patterns
  navigation: {
    vibration: [20, 30, 20],
    fallbackDuration: 70,
    intensityMultiplier: 1.2,
  },
  'button-press': {
    vibration: 25,
    fallbackDuration: 25,
    intensityMultiplier: 1.1,
  },
  swipe: {
    vibration: [10, 20, 10],
    fallbackDuration: 40,
    intensityMultiplier: 1.0,
  },
  'long-press': {
    vibration: [30, 50, 30, 50],
    fallbackDuration: 160,
    intensityMultiplier: 1.3,
  },
  'double-tap': {
    vibration: [15, 30, 15],
    fallbackDuration: 60,
    intensityMultiplier: 1.1,
  },
  'tour-step': {
    vibration: [20, 40, 20, 40, 20],
    fallbackDuration: 140,
    intensityMultiplier: 1.2,
  },
  achievement: {
    vibration: [20, 50, 30, 50, 40, 50, 30],
    fallbackDuration: 270,
    intensityMultiplier: 1.5,
  },
};

// Global intensity setting (can be adjusted by user preferences)
let globalIntensityMultiplier = 1.0;

// Visual feedback enabled flag (for iOS and devices without haptics)
let visualFeedbackEnabled = true;

/**
 * Set the global haptic intensity multiplier
 * @param multiplier - Value from 0 (off) to 2.0 (maximum)
 */
export const setHapticIntensity = (multiplier: number): void => {
  globalIntensityMultiplier = Math.max(0, Math.min(2.0, multiplier));
};

/**
 * Get the current global haptic intensity multiplier
 */
export const getHapticIntensity = (): number => globalIntensityMultiplier;

/**
 * Enable/disable visual feedback fallback for devices without haptics
 */
export const setVisualFeedbackEnabled = (enabled: boolean): void => {
  visualFeedbackEnabled = enabled;
};

// Check if device supports native haptic feedback via Vibration API
const supportsVibrationAPI = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  // Check both vibrate existence AND functionality
  return 'vibrate' in navigator && typeof navigator.vibrate === 'function';
};

// Check if this is an iOS device (no vibration API support)
const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || 
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Check if this is an Android device
const isAndroidDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent);
};

// Comprehensive haptics support check
const supportsHaptics = (): boolean => {
  // iOS Safari does NOT support navigator.vibrate() at all
  if (isIOSDevice()) return false;
  return supportsVibrationAPI();
};

/**
 * Apply intensity multiplier to a pattern
 */
const applyIntensity = (
  pattern: number | number[], 
  patternMultiplier: number
): number | number[] => {
  const totalMultiplier = globalIntensityMultiplier * patternMultiplier;
  
  if (totalMultiplier === 0) return 0;
  
  if (typeof pattern === 'number') {
    return Math.round(pattern * totalMultiplier);
  }
  
  return pattern.map((value, index) => {
    // Only multiply vibration durations (even indices), not pauses (odd indices)
    if (index % 2 === 0) {
      return Math.round(value * totalMultiplier);
    }
    return value;
  });
};

/**
 * Trigger visual feedback as a fallback for devices without haptic support
 * This creates a subtle visual pulse on the document
 */
const triggerVisualFeedback = (intensity: HapticIntensity): void => {
  if (!visualFeedbackEnabled || typeof document === 'undefined') return;
  
  // Create a subtle pulse effect on the active element
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.style) {
    const originalTransform = activeElement.style.transform;
    const originalTransition = activeElement.style.transition;
    
    // Intensity determines the scale
    const scaleAmount = intensity === 'heavy' || intensity === 'error' ? 0.97 :
                       intensity === 'medium' || intensity === 'warning' ? 0.98 :
                       0.99;
    
    activeElement.style.transition = 'transform 50ms ease-out';
    activeElement.style.transform = `scale(${scaleAmount})`;
    
    requestAnimationFrame(() => {
      setTimeout(() => {
        activeElement.style.transform = originalTransform;
        activeElement.style.transition = originalTransition;
      }, 50);
    });
  }
};

/**
 * Trigger haptic feedback with specified intensity
 * Falls back gracefully on unsupported devices (iOS, older browsers)
 * Returns true if native haptic was triggered, false if fallback was used
 */
export const triggerHaptic = (intensity: HapticIntensity = 'light'): boolean => {
  if (globalIntensityMultiplier === 0) {
    return false;
  }

  const pattern = hapticPatterns[intensity];
  if (!pattern) return false;
  
  // Try native vibration API first (Android, some desktop browsers)
  if (supportsHaptics()) {
    try {
      const adjustedPattern = applyIntensity(
        pattern.vibration, 
        pattern.intensityMultiplier || 1.0
      );
      
      navigator.vibrate(adjustedPattern);
      return true;
    } catch {
      // Fall through to visual feedback
    }
  }
  
  // Use visual feedback as fallback for iOS and unsupported devices
  triggerVisualFeedback(intensity);
  return false;
};

/**
 * Trigger a custom vibration pattern
 * Pattern is array of [vibrate, pause, vibrate, pause, ...]
 */
export const triggerCustomPattern = (pattern: number[]): boolean => {
  if (globalIntensityMultiplier === 0) {
    return false;
  }

  if (supportsHaptics()) {
    try {
      const adjustedPattern = applyIntensity(pattern, 1.0);
      navigator.vibrate(adjustedPattern);
      return true;
    } catch {
      return false;
    }
  }
  
  return false;
};

/**
 * Stop any ongoing vibration
 */
export const stopHaptic = (): void => {
  if (supportsHaptics()) {
    navigator.vibrate(0);
  }
};

/**
 * Haptic feedback for navigation actions
 */
export const triggerNavigationHaptic = (action: 'tap' | 'swipe' | 'back' | 'forward'): boolean => {
  switch (action) {
    case 'tap':
      return triggerHaptic('button-press');
    case 'swipe':
      return triggerHaptic('swipe');
    case 'back':
    case 'forward':
      return triggerHaptic('navigation');
    default:
      return triggerHaptic('light');
  }
};

/**
 * Get detailed haptic support information for debugging/UI display
 */
export const getHapticSupportInfo = () => ({
  supportsNativeHaptics: supportsHaptics(),
  supportsVibrationAPI: supportsVibrationAPI(),
  isIOS: isIOSDevice(),
  isAndroid: isAndroidDevice(),
  visualFeedbackEnabled,
  currentIntensity: globalIntensityMultiplier,
  reason: isIOSDevice() 
    ? 'iOS Safari does not support Vibration API' 
    : supportsHaptics() 
      ? 'Full haptic support available'
      : 'Vibration API not available in this browser',
});

/**
 * React hook for haptic feedback with enhanced controls
 */
export const useHapticFeedback = () => {
  return {
    trigger: triggerHaptic,
    triggerCustom: triggerCustomPattern,
    triggerNavigation: triggerNavigationHaptic,
    stop: stopHaptic,
    setIntensity: setHapticIntensity,
    getIntensity: getHapticIntensity,
    setVisualFeedback: setVisualFeedbackEnabled,
    getSupportInfo: getHapticSupportInfo,
    // Convenience boolean flags
    isSupported: supportsHaptics(),
    hasVisualFallback: !supportsHaptics() && visualFeedbackEnabled,
    isIOS: isIOSDevice(),
    isAndroid: isAndroidDevice(),
  };
};

export default useHapticFeedback;

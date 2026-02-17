import { useCallback } from 'react';
import { useHapticFeedback, HapticIntensity } from './useHapticFeedback';

interface TouchHandlerOptions {
  /** Haptic pattern to trigger on interaction */
  haptic?: HapticIntensity;
  /** Disable haptic feedback */
  noHaptic?: boolean;
  /** Whether the element is disabled */
  disabled?: boolean;
}

/**
 * A hook that provides touch-optimized event handlers with haptic feedback.
 * Uses standard click events with CSS active states for immediate visual response.
 * 
 * @example
 * const { handlers } = useTouchHandler(() => doSomething(), { haptic: 'selection' });
 * <div {...handlers}>Tap me</div>
 */
export function useTouchHandler(
  callback: () => void,
  options: TouchHandlerOptions = {}
) {
  const { haptic = 'light', noHaptic = false, disabled = false } = options;
  const { trigger } = useHapticFeedback();

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    
    if (!noHaptic) {
      trigger(haptic);
    }
    callback();
  }, [callback, disabled, haptic, noHaptic, trigger]);

  return {
    handlers: {
      onClick: handleClick,
    },
    // Spread-friendly props including touch-manipulation and visual feedback
    touchProps: {
      onClick: handleClick,
      className: 'touch-manipulation active:scale-[0.98] min-h-[44px] min-w-[44px]',
    },
  };
}

/**
 * Creates touch-optimized props for motion.div or motion.button elements
 * that use Framer Motion's handlers.
 */
export function createMotionTouchProps(
  callback: () => void,
  options: TouchHandlerOptions & { trigger: (intensity: HapticIntensity) => void }
) {
  const { haptic = 'light', noHaptic = false, disabled = false, trigger } = options;

  return {
    onClick: () => {
      if (disabled) return;
      if (!noHaptic) trigger(haptic);
      callback();
    },
    className: 'touch-manipulation active:scale-[0.98] min-h-[44px] min-w-[44px]',
  };
}

/**
 * Utility to wrap any click handler with haptic feedback.
 * For use in components that can't use hooks directly.
 */
export function withTouchOptimization<T extends HTMLElement>(
  onClick: (e: React.MouseEvent<T>) => void,
  trigger: (intensity: HapticIntensity) => void,
  haptic: HapticIntensity = 'light'
) {
  return {
    onClick: (e: React.MouseEvent<T>) => {
      trigger(haptic);
      onClick(e);
    },
  };
}

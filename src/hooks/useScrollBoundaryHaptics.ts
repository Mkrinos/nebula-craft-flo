import { useCallback, useRef, useEffect } from 'react';
import { triggerHaptic, HapticIntensity } from './useHapticFeedback';

interface ScrollBoundaryOptions {
  enabled?: boolean;
  intensity?: 'light' | 'medium' | 'heavy';
  cooldown?: number; // ms between haptic triggers
  threshold?: number; // pixels of overscroll before triggering
}

const DEFAULT_OPTIONS: ScrollBoundaryOptions = {
  enabled: true,
  intensity: 'light',
  cooldown: 200,
  threshold: 10,
};

// Storage key for settings
const STORAGE_KEY = 'scroll-boundary-haptics';

export const getScrollBoundarySettings = (): ScrollBoundaryOptions => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_OPTIONS;
};

export const saveScrollBoundarySettings = (settings: Partial<ScrollBoundaryOptions>) => {
  const current = getScrollBoundarySettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
};

/**
 * Hook to add haptic feedback when scrolling hits boundaries (rubber band effect)
 * Attach the returned ref to a scrollable container
 */
export const useScrollBoundaryHaptics = (options: Partial<ScrollBoundaryOptions> = {}) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const scrollRef = useRef<HTMLElement | null>(null);
  const lastHapticTimeRef = useRef<number>(0);
  const lastScrollTopRef = useRef<number>(0);
  const lastScrollLeftRef = useRef<number>(0);
  const atTopRef = useRef<boolean>(false);
  const atBottomRef = useRef<boolean>(false);
  const atLeftRef = useRef<boolean>(false);
  const atRightRef = useRef<boolean>(false);

  const triggerBoundaryHaptic = useCallback((boundary: 'top' | 'bottom' | 'left' | 'right') => {
    if (!mergedOptions.enabled) return;

    const now = Date.now();
    if (now - lastHapticTimeRef.current < (mergedOptions.cooldown ?? 200)) return;
    
    lastHapticTimeRef.current = now;
    
    // Use lighter haptic for scroll boundaries
    const intensity: HapticIntensity = mergedOptions.intensity ?? 'light';
    triggerHaptic(intensity);
  }, [mergedOptions.enabled, mergedOptions.cooldown, mergedOptions.intensity]);

  const handleScroll = useCallback((e: Event) => {
    if (!mergedOptions.enabled) return;
    
    const target = e.target as HTMLElement;
    if (!target) return;

    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = target;
    const threshold = mergedOptions.threshold ?? 10;

    // Check vertical boundaries
    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    
    // Check horizontal boundaries
    const isAtLeft = scrollLeft <= 0;
    const isAtRight = scrollLeft + clientWidth >= scrollWidth - 1;

    // Detect boundary hits (transition from not-at-boundary to at-boundary while still scrolling in that direction)
    
    // Top boundary - scrolling up and hit top
    if (isAtTop && !atTopRef.current && lastScrollTopRef.current > scrollTop) {
      triggerBoundaryHaptic('top');
    }
    
    // Bottom boundary - scrolling down and hit bottom
    if (isAtBottom && !atBottomRef.current && lastScrollTopRef.current < scrollTop) {
      triggerBoundaryHaptic('bottom');
    }
    
    // Left boundary - scrolling left and hit left
    if (isAtLeft && !atLeftRef.current && lastScrollLeftRef.current > scrollLeft) {
      triggerBoundaryHaptic('left');
    }
    
    // Right boundary - scrolling right and hit right
    if (isAtRight && !atRightRef.current && lastScrollLeftRef.current < scrollLeft) {
      triggerBoundaryHaptic('right');
    }

    // Update refs
    atTopRef.current = isAtTop;
    atBottomRef.current = isAtBottom;
    atLeftRef.current = isAtLeft;
    atRightRef.current = isAtRight;
    lastScrollTopRef.current = scrollTop;
    lastScrollLeftRef.current = scrollLeft;
  }, [mergedOptions.enabled, mergedOptions.threshold, triggerBoundaryHaptic]);

  // Attach scroll listener to ref
  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !mergedOptions.enabled) return;

    element.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      element.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll, mergedOptions.enabled]);

  const setScrollRef = useCallback((element: HTMLElement | null) => {
    scrollRef.current = element;
    
    if (element) {
      // Initialize refs
      lastScrollTopRef.current = element.scrollTop;
      lastScrollLeftRef.current = element.scrollLeft;
      atTopRef.current = element.scrollTop <= 0;
      atBottomRef.current = element.scrollTop + element.clientHeight >= element.scrollHeight - 1;
      atLeftRef.current = element.scrollLeft <= 0;
      atRightRef.current = element.scrollLeft + element.clientWidth >= element.scrollWidth - 1;
    }
  }, []);

  return {
    scrollRef: setScrollRef,
    triggerBoundaryHaptic,
  };
};

/**
 * HOC-style function to wrap any scroll event handler with boundary haptics
 */
export const withScrollBoundaryHaptics = (
  onScroll?: (e: React.UIEvent<HTMLElement>) => void,
  options: Partial<ScrollBoundaryOptions> = {}
) => {
  const mergedOptions = { ...getScrollBoundarySettings(), ...options };
  let lastHapticTime = 0;
  let lastScrollTop = 0;
  let lastScrollLeft = 0;
  let atTop = false;
  let atBottom = false;
  let atLeft = false;
  let atRight = false;

  return (e: React.UIEvent<HTMLElement>) => {
    if (!mergedOptions.enabled) {
      onScroll?.(e);
      return;
    }

    const target = e.currentTarget;
    const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = target;

    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
    const isAtLeft = scrollLeft <= 0;
    const isAtRight = scrollLeft + clientWidth >= scrollWidth - 1;

    const now = Date.now();
    const canTrigger = now - lastHapticTime >= (mergedOptions.cooldown ?? 200);

    if (canTrigger) {
      if (isAtTop && !atTop && lastScrollTop > scrollTop) {
        triggerHaptic(mergedOptions.intensity ?? 'light');
        lastHapticTime = now;
      } else if (isAtBottom && !atBottom && lastScrollTop < scrollTop) {
        triggerHaptic(mergedOptions.intensity ?? 'light');
        lastHapticTime = now;
      } else if (isAtLeft && !atLeft && lastScrollLeft > scrollLeft) {
        triggerHaptic(mergedOptions.intensity ?? 'light');
        lastHapticTime = now;
      } else if (isAtRight && !atRight && lastScrollLeft < scrollLeft) {
        triggerHaptic(mergedOptions.intensity ?? 'light');
        lastHapticTime = now;
      }
    }

    atTop = isAtTop;
    atBottom = isAtBottom;
    atLeft = isAtLeft;
    atRight = isAtRight;
    lastScrollTop = scrollTop;
    lastScrollLeft = scrollLeft;

    onScroll?.(e);
  };
};

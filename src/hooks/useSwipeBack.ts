import { useNavigate } from 'react-router-dom';
import { useDrag } from '@use-gesture/react';
import { useDeviceDetection } from './useDeviceDetection';
import { useHapticFeedback } from './useHapticFeedback';
import { useState, useCallback, useRef } from 'react';

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 0.5;
const EDGE_WIDTH = 20; // Reduced from 30px to avoid button conflicts

// Interactive elements that should never be intercepted by swipe-back
const INTERACTIVE_SELECTORS = [
  'button',
  'a',
  '[role="button"]',
  '[role="link"]',
  'input',
  'textarea',
  'select',
  '[data-no-swipe]',
  '.touch-manipulation',
];

function isInteractiveElement(element: EventTarget | null): boolean {
  if (!element || !(element instanceof Element)) return false;
  
  // Check if the element or any ancestor matches interactive selectors
  let current: Element | null = element;
  while (current) {
    for (const selector of INTERACTIVE_SELECTORS) {
      if (current.matches(selector)) {
        return true;
      }
    }
    current = current.parentElement;
  }
  return false;
}

export function useSwipeBack() {
  const navigate = useNavigate();
  const { isMobile, isTablet, isTouchDevice } = useDeviceDetection();
  const { trigger, triggerNavigation } = useHapticFeedback();
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const isGestureBlocked = useRef(false);

  const canSwipeBack = isTouchDevice && (isMobile || isTablet) && window.history.length > 1;

  const handleSwipeBack = useCallback(() => {
    triggerNavigation('back');
    navigate(-1);
  }, [navigate, triggerNavigation]);

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], last, active, initial: [ix], event }) => {
      if (!canSwipeBack) return;

      // Check if gesture started on an interactive element - block the entire gesture
      if (!active && !last) {
        // First event of gesture - check target
        isGestureBlocked.current = isInteractiveElement(event?.target ?? null);
      }

      // If gesture is blocked, don't process it at all
      if (isGestureBlocked.current) {
        if (last) {
          isGestureBlocked.current = false;
        }
        return;
      }

      // Only allow swipe from left edge of screen
      const isFromLeftEdge = ix < EDGE_WIDTH;
      if (!isFromLeftEdge) return;

      // Only track rightward swipes
      if (mx < 0) {
        setSwipeProgress(0);
        setIsSwiping(false);
        return;
      }

      if (active) {
        setIsSwiping(true);
        // Calculate progress (0 to 1)
        const progress = Math.min(mx / SWIPE_THRESHOLD, 1);
        setSwipeProgress(progress);

        // Haptic feedback at threshold
        if (progress >= 1 && swipeProgress < 1) {
          trigger('heavy');
        }
      }

      if (last) {
        setIsSwiping(false);
        setSwipeProgress(0);
        isGestureBlocked.current = false;

        const shouldNavigateBack = 
          mx > SWIPE_THRESHOLD || 
          (vx > VELOCITY_THRESHOLD && dx > 0);

        if (shouldNavigateBack) {
          handleSwipeBack();
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
      bounds: { left: 0 },
    }
  );

  return {
    bind,
    canSwipeBack,
    swipeProgress,
    isSwiping,
  };
}

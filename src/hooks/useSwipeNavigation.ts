import { useNavigate, useLocation } from 'react-router-dom';
import { useDrag } from '@use-gesture/react';
import { useDeviceDetection } from './useDeviceDetection';
import { useHapticFeedback } from './useHapticFeedback';

const PAGE_ORDER = [
  '/dashboard',
  '/creative-journey',
  '/personas',
  '/billing',
  '/feedback',
];

const SWIPE_THRESHOLD = 80;
const VELOCITY_THRESHOLD = 0.3;

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, isTablet, isTouchDevice } = useDeviceDetection();
  const { trigger, triggerNavigation } = useHapticFeedback();

  const currentIndex = PAGE_ORDER.indexOf(location.pathname);
  const canSwipe = isTouchDevice && (isMobile || isTablet);

  const navigateToPage = (direction: 'left' | 'right') => {
    if (currentIndex === -1) return;

    const newIndex = direction === 'left' 
      ? currentIndex + 1 
      : currentIndex - 1;

    if (newIndex >= 0 && newIndex < PAGE_ORDER.length) {
      // Use enhanced navigation haptic pattern
      triggerNavigation(direction === 'left' ? 'forward' : 'back');
      navigate(PAGE_ORDER[newIndex]);
    }
  };

  const bind = useDrag(
    ({ movement: [mx], velocity: [vx], direction: [dx], last, active }) => {
      if (!canSwipe) return;

      // Provide haptic feedback during active swipe
      if (active && Math.abs(mx) > 20 && Math.abs(mx) < 30) {
        trigger('selection');
      }

      if (last) {
        const swipedLeft = mx < -SWIPE_THRESHOLD || (vx > VELOCITY_THRESHOLD && dx < 0);
        const swipedRight = mx > SWIPE_THRESHOLD || (vx > VELOCITY_THRESHOLD && dx > 0);

        if (swipedLeft && currentIndex < PAGE_ORDER.length - 1) {
          navigateToPage('left');
        } else if (swipedRight && currentIndex > 0) {
          navigateToPage('right');
        }
      }
    },
    {
      axis: 'x',
      filterTaps: true,
      pointer: { touch: true },
    }
  );

  return {
    bind,
    canSwipe,
    currentIndex,
    totalPages: PAGE_ORDER.length,
    canSwipeLeft: currentIndex < PAGE_ORDER.length - 1,
    canSwipeRight: currentIndex > 0,
  };
}

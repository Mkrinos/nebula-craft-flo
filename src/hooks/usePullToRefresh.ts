import { useState, useCallback, useRef } from 'react';
import { useDeviceDetection } from './useDeviceDetection';
import { triggerHaptic } from './useHapticFeedback';

interface UsePullToRefreshOptions {
  onRefresh?: () => Promise<void> | void;
  threshold?: number;
  maxPull?: number;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  maxPull = 120,
}: UsePullToRefreshOptions = {}) {
  const { isMobile, isTablet, isTouchDevice } = useDeviceDetection();
  
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const startY = useRef(0);
  const currentY = useRef(0);
  const isAtTop = useRef(true);
  const hasTriggeredHaptic = useRef(false);
  const lastProgress = useRef(0);

  const canPull = (isMobile || isTablet) && isTouchDevice;

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!canPull || isRefreshing) return;
    
    // Check if we're at the top of the scroll container
    const target = e.currentTarget as HTMLElement;
    isAtTop.current = target.scrollTop <= 0;
    
    if (isAtTop.current) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      hasTriggeredHaptic.current = false;
      lastProgress.current = 0;
    }
  }, [canPull, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!canPull || isRefreshing || !isPulling || !isAtTop.current) return;
    
    currentY.current = e.touches[0].clientY;
    const diff = currentY.current - startY.current;
    
    if (diff > 0) {
      // Apply resistance to make it feel more natural
      const resistance = 0.5;
      const distance = Math.min(diff * resistance, maxPull);
      setPullDistance(distance);
      
      const progress = distance / threshold;
      
      // Provide incremental haptic feedback at 25%, 50%, 75%, and 100%
      const milestones = [0.25, 0.5, 0.75, 1.0];
      for (const milestone of milestones) {
        if (progress >= milestone && lastProgress.current < milestone) {
          triggerHaptic(milestone === 1.0 ? 'medium' : 'selection');
        }
      }
      lastProgress.current = progress;
    }
  }, [canPull, isRefreshing, isPulling, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!canPull || isRefreshing) return;
    
    setIsPulling(false);
    
    if (pullDistance >= threshold && onRefresh) {
      setIsRefreshing(true);
      // Strong haptic feedback for refresh trigger
      triggerHaptic('success');
      
      try {
        await onRefresh();
        // Success feedback after refresh completes
        triggerHaptic('success');
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
        lastProgress.current = 0;
      }
    } else {
      setPullDistance(0);
      lastProgress.current = 0;
    }
  }, [canPull, isRefreshing, pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const isReady = pullDistance >= threshold;

  return {
    pullDistance,
    isRefreshing,
    isPulling,
    progress,
    isReady,
    canPull,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  };
}

import { ReactNode, useCallback } from 'react';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { RefreshCw } from 'lucide-react';

interface SwipeablePageWrapperProps {
  children: ReactNode;
  className?: string;
  onRefresh?: () => Promise<void> | void;
}

export function SwipeablePageWrapper({ 
  children, 
  className = '',
  onRefresh 
}: SwipeablePageWrapperProps) {
  const { bind, canSwipe } = useSwipeNavigation();
  
  const defaultRefresh = useCallback(async () => {
    // Default: reload the current page data by triggering a small delay
    await new Promise(resolve => setTimeout(resolve, 800));
    window.location.reload();
  }, []);

  const { 
    pullDistance, 
    isRefreshing, 
    progress, 
    isReady,
    canPull,
    handlers 
  } = usePullToRefresh({
    onRefresh: onRefresh || defaultRefresh,
  });

  const showIndicator = canPull && (pullDistance > 0 || isRefreshing);

  return (
    <div 
      {...(canSwipe ? bind() : {})}
      {...handlers}
      className={`relative touch-pan-y ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {/* Pull to refresh indicator */}
      {showIndicator && (
        <div 
          className="absolute left-1/2 -translate-x-1/2 z-50 flex items-center justify-center transition-all duration-200"
          style={{ 
            top: Math.max(8, pullDistance - 40),
            opacity: Math.min(progress, 1),
          }}
        >
          <div 
            className={`
              flex items-center justify-center w-10 h-10 rounded-full 
              bg-background/80 backdrop-blur-sm border border-primary/30
              shadow-lg shadow-primary/20
              ${isRefreshing ? 'animate-pulse' : ''}
            `}
          >
            <RefreshCw 
              className={`w-5 h-5 text-primary transition-transform duration-200 ${
                isRefreshing ? 'animate-spin' : ''
              }`}
              style={{ 
                transform: isRefreshing 
                  ? undefined 
                  : `rotate(${progress * 360}deg) scale(${0.8 + progress * 0.2})`,
                color: isReady ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
              }}
            />
          </div>
        </div>
      )}

      {/* Content with pull offset */}
      <div 
        style={{ 
          transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : undefined,
        }}
      >
        {children}
      </div>
    </div>
  );
}

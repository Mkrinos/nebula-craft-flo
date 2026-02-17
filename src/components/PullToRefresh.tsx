import { ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void> | void;
  className?: string;
}

export function PullToRefresh({ children, onRefresh, className }: PullToRefreshProps) {
  const { 
    pullDistance, 
    isRefreshing, 
    progress, 
    isReady, 
    canPull,
    handlers 
  } = usePullToRefresh({ onRefresh });

  return (
    <div 
      className={cn("relative", className)}
      {...handlers}
    >
      {/* Pull indicator */}
      {canPull && (pullDistance > 0 || isRefreshing) && (
        <div 
          className="absolute left-0 right-0 flex justify-center pointer-events-none z-50"
          style={{ 
            top: 0,
            transform: `translateY(${Math.min(pullDistance, 80)}px)`,
            opacity: Math.min(progress, 1)
          }}
        >
          <div 
            className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full",
              "bg-background/90 border border-border/50 shadow-lg backdrop-blur-sm",
              isReady && "border-primary bg-primary/10",
              isRefreshing && "animate-pulse"
            )}
          >
            <RefreshCw 
              className={cn(
                "w-5 h-5 text-muted-foreground transition-all duration-200",
                isReady && "text-primary",
                isRefreshing && "animate-spin"
              )}
              style={{
                transform: `rotate(${progress * 360}deg)`
              }}
            />
          </div>
        </div>
      )}

      {/* Content with pull offset */}
      <div 
        style={{ 
          transform: canPull && pullDistance > 0 ? `translateY(${pullDistance * 0.3}px)` : undefined,
          transition: pullDistance === 0 ? 'transform 0.2s ease-out' : undefined
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;

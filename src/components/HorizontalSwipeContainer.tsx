import React, { useRef, useEffect, useState, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDevice } from '@/contexts/DeviceContext';

interface HorizontalSwipeContainerProps {
  children: ReactNode;
  className?: string;
  showIndicators?: boolean;
  snapToItems?: boolean;
  indicatorVariant?: 'default' | 'neon-cyan';
}

export function HorizontalSwipeContainer({ 
  children, 
  className,
  showIndicators = true,
  snapToItems = false,
  indicatorVariant = 'default'
}: HorizontalSwipeContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const { device } = useDevice();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [showScrollHint, setShowScrollHint] = useState(false);
  const scrollX = useMotionValue(0);
  
  // Check scroll boundaries
  const checkScrollBounds = () => {
    if (!containerRef.current) return;
    
    const { scrollLeft, scrollWidth, clientWidth } = containerRef.current;
    const hasOverflow = scrollWidth > clientWidth;
    
    setCanScrollLeft(scrollLeft > 5);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    setShowScrollHint(hasOverflow);
  };

  useEffect(() => {
    checkScrollBounds();
    
    const container = containerRef.current;
    if (!container) return;
    
    const handleScroll = () => {
      checkScrollBounds();
      scrollX.set(container.scrollLeft);
    };
    
    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Recheck on resize
    const resizeObserver = new ResizeObserver(() => {
      checkScrollBounds();
    });
    resizeObserver.observe(container);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [scrollX]);

  // Scroll by page width
  const scrollTo = (direction: 'left' | 'right') => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = container.scrollLeft + (direction === 'left' ? -scrollAmount : scrollAmount);
    
    container.scrollTo({
      left: targetScroll,
      behavior: 'smooth'
    });
  };

  // Indicator opacity based on scroll position
  const leftIndicatorOpacity = useTransform(scrollX, [0, 50], [0, 1]);
  const rightIndicatorOpacity = useTransform(
    scrollX, 
    (v) => {
      if (!containerRef.current) return 1;
      const maxScroll = containerRef.current.scrollWidth - containerRef.current.clientWidth;
      return v >= maxScroll - 50 ? 0 : 1;
    }
  );

  // Only show on mobile/tablet with overflow
  if (!device.isMobile && !device.isTablet) {
    return <div className={className}>{children}</div>;
  }

  const indicatorStyles = indicatorVariant === 'neon-cyan' 
    ? 'bg-space-dark/90 border-neon-cyan/40 text-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.3)]'
    : 'bg-background/80 border-border/50 text-foreground';

  const gradientStyles = indicatorVariant === 'neon-cyan'
    ? 'from-space-dark'
    : 'from-background';

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll indicator */}
      {showIndicators && showScrollHint && (
        <motion.button
          style={{ opacity: leftIndicatorOpacity }}
          className={cn(
            'absolute left-0 top-1/2 -translate-y-1/2 z-10',
            'w-8 h-8 flex items-center justify-center',
            'backdrop-blur-sm border rounded-full',
            'shadow-lg touch-manipulation',
            'transition-transform active:scale-95',
            indicatorStyles,
            canScrollLeft ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          )}
          onClick={() => scrollTo('left')}
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>
      )}

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className={cn(
          'overflow-x-auto scrollbar-hide',
          'scroll-smooth touch-pan-x',
          snapToItems && 'snap-x snap-mandatory',
          '-mx-2 px-2' // Padding for edge items
        )}
        style={{
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <div 
          ref={contentRef}
          className="inline-flex gap-3 min-w-max"
        >
          {children}
        </div>
      </div>

      {/* Right scroll indicator */}
      {showIndicators && showScrollHint && (
        <motion.button
          style={{ opacity: rightIndicatorOpacity }}
          className={cn(
            'absolute right-0 top-1/2 -translate-y-1/2 z-10',
            'w-8 h-8 flex items-center justify-center',
            'backdrop-blur-sm border rounded-full',
            'shadow-lg touch-manipulation',
            'transition-transform active:scale-95',
            indicatorStyles,
            canScrollRight ? 'pointer-events-auto' : 'pointer-events-none opacity-0'
          )}
          onClick={() => scrollTo('right')}
          aria-label="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      )}

      {/* Scroll hint gradient overlays */}
      {showScrollHint && (
        <>
          <motion.div
            style={{ opacity: leftIndicatorOpacity }}
            className={cn(
              'absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r to-transparent pointer-events-none',
              gradientStyles
            )}
          />
          <motion.div
            style={{ opacity: rightIndicatorOpacity }}
            className={cn(
              'absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l to-transparent pointer-events-none',
              gradientStyles
            )}
          />
        </>
      )}
    </div>
  );
}

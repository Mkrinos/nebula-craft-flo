import React, { forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { SciFiButton } from '@/components/ui/sci-fi-button';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useDevice } from '@/contexts/DeviceContext';
import { cn } from '@/lib/utils';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: string;
  position: 'center' | 'top' | 'bottom';
}

interface ResponsiveTourCardProps {
  step: TourStep;
  steps: TourStep[];
  currentStep: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  finalButtonText?: string;
}

export const ResponsiveTourCard = forwardRef<HTMLDivElement, ResponsiveTourCardProps>(function ResponsiveTourCard({
  step,
  steps,
  currentStep,
  onNext,
  onPrev,
  onSkip,
  finalButtonText = 'Done!'
}: ResponsiveTourCardProps) {
  const haptic = useHapticFeedback();
  const { device } = useDevice();
  const Icon = step.icon;

  const handleNext = () => {
    haptic.trigger('selection');
    onNext();
  };

  const handlePrev = () => {
    haptic.trigger('light');
    onPrev();
  };

  const handleSkip = () => {
    haptic.trigger('light');
    onSkip();
  };

  // Responsive positioning that accounts for safe areas and different screen sizes
  const getPositionClasses = () => {
    const isMobileOrTablet = device.isMobile || device.isTablet;
    
    // Adjust positions based on device type and orientation
    if (step.position === 'top') {
      return cn(
        "top-20",
        isMobileOrTablet && "top-24 sm:top-28",
        device.isStandalone && "top-28" // PWA mode needs more space
      );
    }
    if (step.position === 'bottom') {
      return cn(
        "bottom-24",
        isMobileOrTablet && "bottom-28 sm:bottom-32",
        device.isStandalone && "bottom-32"
      );
    }
    return "top-1/2 -translate-y-1/2";
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step.id}
        initial={{ 
          opacity: 0, 
          y: step.position === 'bottom' ? 20 : step.position === 'top' ? -20 : 0, 
          scale: 0.95 
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className={cn(
          "fixed left-1/2 -translate-x-1/2 z-50 w-full px-3 sm:px-4",
          // Responsive max-width
          "max-w-[calc(100vw-24px)] sm:max-w-sm md:max-w-md",
          getPositionClasses()
        )}
      >
        <div 
          className={cn(
            "bg-card/95 backdrop-blur-md border border-primary/30 rounded-xl shadow-2xl shadow-primary/10",
            // Responsive padding
            "p-4 sm:p-5"
          )}
        >
          {/* Progress dots - responsive size */}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5 mb-3 sm:mb-4">
            {steps.map((_, idx) => (
              <motion.div
                key={idx}
                initial={false}
                animate={{
                  width: idx === currentStep ? 16 : 8,
                  backgroundColor: idx === currentStep 
                    ? 'hsl(var(--primary))' 
                    : idx < currentStep 
                      ? 'hsl(var(--primary) / 0.6)' 
                      : 'hsl(var(--muted-foreground) / 0.3)'
                }}
                className="h-2 rounded-full transition-all"
              />
            ))}
          </div>

          {/* Icon - responsive size */}
          <motion.div 
            className={cn(
              "mx-auto mb-3 sm:mb-4 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center",
              "w-12 h-12 sm:w-14 sm:h-14"
            )}
            whileTap={{ scale: 0.95 }}
          >
            <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
          </motion.div>

          {/* Content - responsive text sizes */}
          <h3 className="text-base sm:text-lg font-bold text-center text-foreground mb-1.5 sm:mb-2">
            {step.title}
          </h3>
          <p className="text-xs sm:text-sm text-center text-muted-foreground mb-4 sm:mb-5 leading-relaxed">
            {step.description}
          </p>

          {/* Navigation - touch-friendly buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 ? (
              <SciFiButton
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                className="flex-1 min-h-[44px] touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                <span className="hidden xs:inline">Back</span>
              </SciFiButton>
            ) : (
              <SciFiButton
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                className="flex-1 min-h-[44px] touch-manipulation"
              >
                <X className="w-4 h-4 mr-1" />
                Skip
              </SciFiButton>
            )}
            
            <SciFiButton
              variant="primary"
              size="sm"
              onClick={handleNext}
              className="flex-1 min-h-[44px] touch-manipulation"
            >
              {currentStep === steps.length - 1 ? (
                finalButtonText
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </>
              )}
            </SciFiButton>
          </div>

          {/* Step counter */}
          <p className="text-[10px] sm:text-xs text-center text-muted-foreground mt-2 sm:mt-3">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Arrow pointer for highlighted elements */}
        {step.highlight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, y: [0, -8, 0] }}
            transition={{ y: { repeat: Infinity, duration: 1.5 } }}
            className={cn(
              "absolute left-1/2 -translate-x-1/2 w-0 h-0",
              step.position === 'top' && "bottom-0 translate-y-full border-l-8 border-r-8 border-t-8 border-transparent border-t-primary/60",
              step.position === 'bottom' && "top-0 -translate-y-full border-l-8 border-r-8 border-b-8 border-transparent border-b-primary/60"
            )}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
});

// Backdrop component for tour overlays
export function TourBackdrop({ 
  onClose,
  className 
}: { 
  onClose: () => void;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 bg-background/50 backdrop-blur-sm z-40",
        className
      )}
      onClick={onClose}
    />
  );
}

// Restart tour button component
export function TourRestartButton({
  onClick,
  icon: Icon,
  position = 'bottom-right'
}: {
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  position?: 'bottom-right' | 'bottom-left';
}) {
  const haptic = useHapticFeedback();
  const { device } = useDevice();

  const handleClick = () => {
    haptic.trigger('selection');
    onClick();
  };

  // Adjust position based on device (account for mobile nav)
  const positionClasses = position === 'bottom-right'
    ? cn(
        "right-4",
        device.isMobile || device.isTablet ? "bottom-28" : "bottom-8"
      )
    : cn(
        "left-4",
        device.isMobile || device.isTablet ? "bottom-28" : "bottom-8"
      );

  return (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={cn(
        "fixed z-30 p-3 rounded-full bg-primary/20 border border-primary/40 text-primary hover:bg-primary/30 transition-colors touch-manipulation",
        "min-w-[44px] min-h-[44px] flex items-center justify-center",
        positionClasses
      )}
      title="Restart tutorial"
    >
      <Icon className="w-5 h-5" />
    </motion.button>
  );
}

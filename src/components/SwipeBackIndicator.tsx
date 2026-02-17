import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface SwipeBackIndicatorProps {
  progress: number;
  isActive: boolean;
}

export const SwipeBackIndicator: React.FC<SwipeBackIndicatorProps> = ({
  progress,
  isActive,
}) => {
  const isReady = progress >= 1;

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ 
            opacity: Math.min(progress * 1.5, 1), 
            x: 0,
            scale: isReady ? 1.1 : 1,
          }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="fixed left-2 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
        >
          <div 
            className={`
              flex items-center justify-center w-10 h-10 rounded-full 
              backdrop-blur-md border transition-colors duration-150
              ${isReady 
                ? 'bg-primary/30 border-primary/50 text-primary' 
                : 'bg-background/60 border-border/40 text-muted-foreground'
              }
            `}
          >
            <ArrowLeft className="h-5 w-5" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

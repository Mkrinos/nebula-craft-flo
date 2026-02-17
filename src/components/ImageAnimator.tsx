import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Sparkles, Zap, Wind, Heart, Waves, RotateCcw, Camera, Move } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface ImageAnimatorProps {
  imageUrl: string;
  prompt: string;
}

type AnimationEffect = 'none' | 'zoom' | 'pan' | 'pulse' | 'float' | 'glow' | 'cinematic';

const animationEffects: { id: AnimationEffect; name: string; icon: React.ReactNode; description: string }[] = [
  { id: 'none', name: 'Static', icon: <Pause className="w-4 h-4" />, description: 'No animation' },
  { id: 'zoom', name: 'Zoom', icon: <Zap className="w-4 h-4" />, description: 'Slow zoom in' },
  { id: 'pan', name: 'Pan', icon: <Wind className="w-4 h-4" />, description: 'Gentle pan across' },
  { id: 'pulse', name: 'Pulse', icon: <Heart className="w-4 h-4" />, description: 'Breathing effect' },
  { id: 'float', name: 'Float', icon: <Waves className="w-4 h-4" />, description: 'Floating motion' },
  { id: 'glow', name: 'Glow', icon: <Sparkles className="w-4 h-4" />, description: 'Magical glow' },
  { id: 'cinematic', name: 'Cinematic', icon: <Camera className="w-4 h-4" />, description: 'Smart camera movement' },
];

const ImageAnimator = ({ imageUrl, prompt }: ImageAnimatorProps) => {
  const isMobile = useIsMobile();
  const [activeEffect, setActiveEffect] = useState<AnimationEffect>('none');
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGestureHint, setShowGestureHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Gesture state
  const scale = useMotionValue(1);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [isGestureActive, setIsGestureActive] = useState(false);

  // Camera position for cinematic effect (simulates analyzing image composition)
  const [cameraFocus, setCameraFocus] = useState({ x: 0, y: 0 });

  // Hide gesture hint after 3 seconds
  useEffect(() => {
    if (isMobile && showGestureHint) {
      const timer = setTimeout(() => setShowGestureHint(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isMobile, showGestureHint]);

  // Simulate image composition analysis for cinematic camera
  useEffect(() => {
    // Randomize focus point to simulate finding interesting areas
    // In a real app, you could use AI vision to detect focal points
    const focusPoints = [
      { x: -5, y: -5 },  // Top-left area
      { x: 5, y: -5 },   // Top-right area
      { x: 0, y: 0 },    // Center
      { x: -5, y: 5 },   // Bottom-left
      { x: 5, y: 5 },    // Bottom-right
    ];
    const randomFocus = focusPoints[Math.floor(Math.random() * focusPoints.length)];
    setCameraFocus(randomFocus);
  }, [imageUrl]);

  // Gesture handlers
  const bind = useGesture(
    {
      onPinch: ({ offset: [s], memo = scale.get() }) => {
        setIsGestureActive(true);
        const newScale = Math.min(Math.max(memo * s, 0.5), 4);
        scale.set(newScale);
        return memo;
      },
      onPinchEnd: () => {
        setIsGestureActive(false);
      },
      onDrag: ({ offset: [ox, oy], pinching }) => {
        if (!pinching) {
          setIsGestureActive(true);
          x.set(ox);
          y.set(oy);
        }
      },
      onDragEnd: () => {
        setIsGestureActive(false);
      },
    },
    {
      drag: {
        from: () => [x.get(), y.get()],
        bounds: { left: -200, right: 200, top: -200, bottom: 200 },
        rubberband: true,
      },
      pinch: {
        scaleBounds: { min: 0.5, max: 4 },
        rubberband: true,
      },
    }
  );

  // Double-tap to zoom
  const handleDoubleTap = () => {
    const currentScale = scale.get();
    if (currentScale > 1.5) {
      // Reset to normal
      scale.set(1);
      x.set(0);
      y.set(0);
    } else {
      // Zoom in
      scale.set(2.5);
    }
  };

  // Reset gesture transforms
  const resetGestures = () => {
    scale.set(1);
    x.set(0);
    y.set(0);
  };

  const getAnimationClasses = () => {
    if (!isPlaying || activeEffect === 'none' || isGestureActive) return '';
    
    switch (activeEffect) {
      case 'zoom':
        return 'animate-[zoom_8s_ease-in-out_infinite_alternate]';
      case 'pan':
        return 'animate-[pan_10s_ease-in-out_infinite_alternate]';
      case 'pulse':
        return 'animate-[pulse-gentle_3s_ease-in-out_infinite]';
      case 'float':
        return 'animate-[float_4s_ease-in-out_infinite]';
      case 'cinematic':
        return '';
      case 'glow':
        return '';
      default:
        return '';
    }
  };

  const getCinematicAnimation = () => {
    if (activeEffect !== 'cinematic' || !isPlaying || isGestureActive) return {};
    
    return {
      animate: {
        scale: [1, 1.15, 1.1, 1.2, 1],
        x: [0, cameraFocus.x * 3, -cameraFocus.x * 2, cameraFocus.x, 0],
        y: [0, cameraFocus.y * 2, cameraFocus.y * 3, -cameraFocus.y, 0],
      },
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut" as const,
      },
    };
  };

  const getContainerStyles = () => {
    if (!isPlaying || activeEffect !== 'glow' || isGestureActive) return {};
    
    return {
      filter: 'drop-shadow(0 0 20px hsl(var(--primary) / 0.5))',
      animation: 'glow-pulse 2s ease-in-out infinite alternate',
    };
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Animation Preview with Touch Gestures */}
      <div 
        ref={containerRef}
        className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-secondary/30 border border-border/50 touch-none"
        style={getContainerStyles()}
        onDoubleClick={handleDoubleTap}
        {...bind()}
      >
        <motion.img
          src={imageUrl}
          alt="Animated artwork"
          className={cn(
            "w-full h-full object-contain transition-all",
            getAnimationClasses()
          )}
          style={{
            scale: isGestureActive || activeEffect === 'none' ? scale : undefined,
            x: isGestureActive || activeEffect === 'none' ? x : undefined,
            y: isGestureActive || activeEffect === 'none' ? y : undefined,
          }}
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
            ...(activeEffect === 'cinematic' ? getCinematicAnimation().animate : {}),
          }}
          transition={activeEffect === 'cinematic' ? getCinematicAnimation().transition : { duration: 0.3 }}
          drag={false}
        />
        
        {/* Gesture hint for mobile */}
        <AnimatePresence>
          {isMobile && showGestureHint && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-background/90 border border-border flex items-center gap-2"
            >
              <Move className="w-4 h-4 text-primary" />
              <span className="text-xs text-foreground">Pinch to zoom • Swipe to pan • Double-tap to reset</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Overlay with prompt on hover (desktop) / tap (mobile) */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 hover:opacity-100 active:opacity-100 transition-opacity flex items-end p-4 pointer-events-none">
          <p className="text-sm text-foreground">{prompt}</p>
        </div>

        {/* Play/Pause indicator */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/30 flex items-center justify-center pointer-events-none"
            >
              <div className="w-16 h-16 rounded-full bg-background/80 flex items-center justify-center">
                <Pause className="w-8 h-8 text-foreground" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Animation Controls - Larger for Touch */}
      <div className="space-y-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn(
            "font-medium text-foreground flex items-center gap-2",
            isMobile ? "text-base" : "text-sm"
          )}>
            <Play className="w-4 h-4 text-primary" />
            Animate Your Image
          </p>
          <div className="flex items-center gap-2">
            {(scale.get() !== 1 || x.get() !== 0 || y.get() !== 0) && (
              <Button
                variant="ghost"
                size={isMobile ? "default" : "sm"}
                onClick={resetGestures}
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset View
              </Button>
            )}
            <Button
              variant="ghost"
              size={isMobile ? "default" : "sm"}
              onClick={() => setIsPlaying(!isPlaying)}
              className="gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4" />
                  {!isMobile && "Pause"}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  {!isMobile && "Play"}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Effect Selector - Bigger buttons on mobile */}
        <div className="flex flex-wrap gap-2">
          {animationEffects.map((effect) => (
            <Button
              key={effect.id}
              variant={activeEffect === effect.id ? "neon" : "outline"}
              size={isMobile ? "default" : "sm"}
              onClick={() => {
                setActiveEffect(effect.id);
                resetGestures();
              }}
              className={cn(
                "gap-1.5",
                isMobile && "min-h-[44px] px-4",
                activeEffect !== effect.id && "hover:border-primary hover:text-primary"
              )}
              title={effect.description}
            >
              {effect.icon}
              {effect.name}
            </Button>
          ))}
        </div>

        {activeEffect !== 'none' && (
          <p className="text-xs text-muted-foreground">
            {activeEffect === 'cinematic' 
              ? "Smart camera movement based on image composition" 
              : animationEffects.find(e => e.id === activeEffect)?.description}
          </p>
        )}

        {/* Reset animation button */}
        {activeEffect !== 'none' && (
          <Button
            variant="ghost"
            size={isMobile ? "default" : "sm"}
            onClick={() => setActiveEffect('none')}
            className={cn("gap-2 text-muted-foreground", isMobile && "min-h-[44px]")}
          >
            <RotateCcw className="w-4 h-4" />
            Remove Animation
          </Button>
        )}
      </div>

      {/* CSS for custom animations */}
      <style>{`
        @keyframes zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        
        @keyframes pan {
          0% { transform: translateX(0) scale(1.1); }
          100% { transform: translateX(-5%) scale(1.1); }
        }
        
        @keyframes pulse-gentle {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.02); opacity: 0.95; }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes glow-pulse {
          0% { filter: drop-shadow(0 0 10px hsl(var(--primary) / 0.3)); }
          100% { filter: drop-shadow(0 0 30px hsl(var(--primary) / 0.6)); }
        }
      `}</style>
    </div>
  );
};

export default ImageAnimator;

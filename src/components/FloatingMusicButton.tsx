import React, { useState, useCallback, useRef, useEffect, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music, Headphones, Volume, Volume1, Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

interface VolumePreset {
  label: string;
  value: number;
  icon: React.ReactNode;
}

const volumePresets: VolumePreset[] = [
  { label: 'Mute', value: 0, icon: <VolumeX className="w-4 h-4" /> },
  { label: '25%', value: 0.25, icon: <Volume className="w-4 h-4" /> },
  { label: '50%', value: 0.5, icon: <Volume1 className="w-4 h-4" /> },
  { label: '75%', value: 0.75, icon: <Volume2 className="w-4 h-4" /> },
  { label: 'Max', value: 1, icon: <Volume2 className="w-4 h-4" /> },
];

interface FloatingMusicButtonProps {
  isPlaying: boolean;
  onClick: () => void;
  className?: string;
  volume?: number;
  onVolumeChange?: (volume: number) => void;
}

export const FloatingMusicButton = forwardRef<HTMLDivElement, FloatingMusicButtonProps>(({
  isPlaying,
  onClick,
  className,
  volume = 0.5,
  onVolumeChange
}, ref) => {
  const [isDragging, setIsDragging] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; angle: number }[]>([]);
  const [particles, setParticles] = useState<{ id: number; angle: number; distance: number; size: number; color: 'primary' | 'accent' }[]>([]);
  const [showPresets, setShowPresets] = useState(false);
  const arcRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rippleIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const lastVolumeRef = useRef(volume);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  
  // Arc configuration - increased size for better touch targets
  const size = 140;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2 - 10;
  const center = size / 2;
  
  // Arc spans from 135 degrees to 405 degrees (270 degree arc, bottom-centered gap)
  const startAngle = 135;
  const endAngle = 405;
  const arcLength = endAngle - startAngle;

  // Prevent scroll interference on touch devices
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => {
      container.removeEventListener('touchmove', preventScroll);
    };
  }, [isDragging]);

  // Close presets when clicking outside
  useEffect(() => {
    if (!showPresets) return;
    
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowPresets(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showPresets]);

  // Long press handlers
  const handleLongPressStart = useCallback(() => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      triggerHaptic('heavy');
      setShowPresets(true);
    }, 500); // 500ms for long press
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const handlePresetSelect = useCallback((presetValue: number) => {
    if (onVolumeChange) {
      onVolumeChange(presetValue);
      triggerHaptic('success');
    }
    setShowPresets(false);
  }, [onVolumeChange]);

  // Cleanup long-press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);
  
  // Convert angle to coordinates
  const polarToCartesian = (angle: number) => {
    const radian = (angle - 90) * (Math.PI / 180);
    return {
      x: center + radius * Math.cos(radian),
      y: center + radius * Math.sin(radian)
    };
  };
  
  // Generate arc path
  const describeArc = (startA: number, endA: number) => {
    const start = polarToCartesian(endA);
    const end = polarToCartesian(startA);
    const largeArcFlag = endA - startA <= 180 ? '0' : '1';
    
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };
  
  // Volume arc path (partial based on volume)
  const volumeAngle = startAngle + (volume * arcLength);

  // Calculate volume from pointer position
  const calculateVolumeFromPointer = useCallback((clientX: number, clientY: number): number | null => {
    if (!arcRef.current) return null;
    
    const rect = arcRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const dx = clientX - centerX;
    const dy = clientY - centerY;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (angle < 0) angle += 360;
    
    let normalizedAngle = angle;
    if (angle < startAngle) normalizedAngle = angle + 360;
    
    if (normalizedAngle >= startAngle && normalizedAngle <= endAngle) {
      return Math.max(0, Math.min(1, (normalizedAngle - startAngle) / arcLength));
    }
    return null;
  }, [startAngle, endAngle, arcLength]);

  // Enhanced pointer move with haptic feedback at thresholds
  const handlePointerMoveWithHaptic = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!isDragging || !onVolumeChange) return;
    
    const newVolume = calculateVolumeFromPointer(e.clientX, e.clientY);
    if (newVolume === null) return;
    
    // Haptic feedback and ripple every 10% change - stronger feedback for mobile
    const lastTenth = Math.floor(lastVolumeRef.current * 10);
    const newTenth = Math.floor(newVolume * 10);
    if (lastTenth !== newTenth) {
      // Use stronger haptic at volume boundaries (0%, 50%, 100%)
      if (newTenth === 0 || newTenth === 5 || newTenth === 10) {
        triggerHaptic('medium');
      } else {
        triggerHaptic('selection');
      }
      // Add ripple at current position
      const rippleAngle = startAngle + (newVolume * arcLength);
      const newRippleId = rippleIdRef.current++;
      setRipples(prev => [...prev, { id: newRippleId, angle: rippleAngle }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRippleId));
      }, 600);
    }
    
    lastVolumeRef.current = newVolume;
    onVolumeChange(newVolume);
  }, [isDragging, onVolumeChange, startAngle, arcLength, calculateVolumeFromPointer]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!onVolumeChange) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    // Stronger haptic feedback on initial touch for better mobile feel
    triggerHaptic('heavy');
    
    // Calculate initial volume from touch point
    const newVolume = calculateVolumeFromPointer(e.clientX, e.clientY);
    if (newVolume !== null) {
      lastVolumeRef.current = newVolume;
      onVolumeChange(newVolume);
    }
  };
  
  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      // Confirmation haptic on release
      triggerHaptic('success');
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    setIsDragging(false);
  };


  // Generate tick marks for sci-fi ring effect
  const tickMarks = Array.from({ length: 24 }, (_, i) => i);
  const outerDots = Array.from({ length: 12 }, (_, i) => i);
  
  // Knob position on the arc
  const knobPos = polarToCartesian(volumeAngle);

  return (
    <div 
      ref={containerRef}
      className={cn("relative flex items-center justify-center select-none", className)} 
      style={{ width: size, height: size + 24, touchAction: 'none' }}
    >
      {/* Volume Arc SVG */}
      {onVolumeChange && (
        <svg
          ref={arcRef}
          width={size}
          height={size}
          className="absolute top-0 left-0 cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMoveWithHaptic}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ 
            touchAction: 'none',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
          }}
        >
          {/* Background arc */}
          <path
            d={describeArc(startAngle, endAngle)}
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            opacity={0.3}
          />
          
          {/* Tick marks around the arc */}
          {Array.from({ length: 13 }, (_, i) => {
            const tickAngle = startAngle + (i / 12) * arcLength;
            const innerRadius = radius - 12;
            const outerRadius = radius - 6;
            const inner = polarToCartesian(tickAngle);
            const outer = {
              x: center + innerRadius * Math.cos((tickAngle - 90) * (Math.PI / 180)),
              y: center + innerRadius * Math.sin((tickAngle - 90) * (Math.PI / 180))
            };
            return (
              <line
                key={i}
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="hsl(var(--accent))"
                strokeWidth={i % 3 === 0 ? 2 : 1}
                opacity={i % 3 === 0 ? 0.8 : 0.4}
              />
            );
          })}
          
          {/* Volume level arc */}
          <motion.path
            d={describeArc(startAngle, volumeAngle)}
            fill="none"
            stroke="url(#volumeGradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            animate={{
              filter: isPlaying 
                ? ['drop-shadow(0 0 4px hsl(var(--primary)))', 'drop-shadow(0 0 12px hsl(var(--primary)))', 'drop-shadow(0 0 4px hsl(var(--primary)))']
                : 'drop-shadow(0 0 4px hsl(var(--primary)))'
            }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          
          {/* Gradient definition */}
          <defs>
            <linearGradient id="volumeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="50%" stopColor="hsl(var(--accent))" />
              <stop offset="100%" stopColor="hsl(var(--primary))" />
            </linearGradient>
          </defs>
          
          {/* Ripple effects at 10% thresholds */}
          {ripples.map(ripple => {
            const ripplePos = polarToCartesian(ripple.angle);
            return (
              <React.Fragment key={ripple.id}>
                <motion.circle
                  cx={ripplePos.x}
                  cy={ripplePos.y}
                  r={8}
                  fill="none"
                  stroke="hsl(var(--accent))"
                  strokeWidth={3}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 3, opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
                <motion.circle
                  cx={ripplePos.x}
                  cy={ripplePos.y}
                  r={5}
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  initial={{ scale: 0.5, opacity: 1 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
                />
              </React.Fragment>
            );
          })}
          
          {/* Draggable knob with larger touch target */}
          <motion.circle
            cx={knobPos.x}
            cy={knobPos.y}
            r={isDragging ? 14 : 12}
            fill="hsl(var(--primary-foreground))"
            stroke="hsl(var(--primary))"
            strokeWidth={3}
            className="cursor-grab active:cursor-grabbing"
            style={{ touchAction: 'none' }}
            animate={{
              scale: isDragging ? 1.15 : 1,
              filter: isDragging 
                ? 'drop-shadow(0 0 12px hsl(var(--accent)))'
                : 'drop-shadow(0 0 6px hsl(var(--primary)))'
            }}
          />
        </svg>
      )}

      {/* Outer ring decorations */}
      <motion.div
        className="absolute rounded-full"
        style={{ width: size - 20, height: size - 20, top: 10, left: 10 }}
        animate={{ rotate: isPlaying ? 360 : 0 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      >
        {outerDots.map((i) => (
          <motion.div
            key={`dot-${i}`}
            className="absolute w-1.5 h-1.5 rounded-full bg-accent"
            style={{
              top: '50%',
              left: '50%',
              transform: `rotate(${i * 30}deg) translateY(-${(size - 20) / 2 - 4}px) translateX(-50%)`,
            }}
            animate={{
              opacity: isPlaying ? [0.4, 1, 0.4] : 0.5,
              scale: isPlaying ? [0.8, 1.2, 0.8] : 1,
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.1,
            }}
          />
        ))}
      </motion.div>

      {/* Inner rotating tick ring */}
      <motion.div
        className="absolute rounded-full border border-accent/40"
        style={{ width: size - 40, height: size - 40, top: 20, left: 20 }}
        animate={{ rotate: isPlaying ? -360 : 0 }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
      >
        {tickMarks.map((i) => (
          <div
            key={`tick-${i}`}
            className="absolute bg-accent"
            style={{
              width: i % 4 === 0 ? '4px' : '2px',
              height: '1.5px',
              top: '50%',
              left: '50%',
              transformOrigin: 'left center',
              transform: `rotate(${i * 15}deg) translateX(${(size - 40) / 2 - 6}px)`,
              opacity: i % 4 === 0 ? 0.8 : 0.4,
            }}
          />
        ))}
      </motion.div>

      {/* Particle burst effects - Star shaped */}
      {particles.map(particle => {
        const rad = (particle.angle - 90) * (Math.PI / 180);
        const starSize = particle.size * 2;
        return (
          <motion.svg
            key={particle.id}
            width={starSize}
            height={starSize}
            viewBox="0 0 24 24"
            className="absolute"
            style={{
              left: '50%',
              top: '50%',
              marginLeft: -starSize / 2,
              marginTop: -starSize / 2 - 12,
            }}
            initial={{ 
              x: 0, 
              y: 0, 
              opacity: 1,
              scale: 1,
              rotate: 0
            }}
            animate={{ 
              x: Math.cos(rad) * particle.distance,
              y: Math.sin(rad) * particle.distance,
              opacity: 0,
              scale: 0.2,
              rotate: 180
            }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <path
              d="M12 2L14.09 8.26L20.18 8.26L15.54 12.14L17.63 18.4L12 14.52L6.37 18.4L8.46 12.14L3.82 8.26L9.91 8.26L12 2Z"
              fill={particle.color === 'primary' ? 'hsl(var(--primary))' : 'hsl(var(--accent))'}
              filter="drop-shadow(0 0 4px currentColor)"
            />
          </motion.svg>
        );
      })}

      {/* Volume Presets Popup */}
      <AnimatePresence>
        {showPresets && onVolumeChange && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full z-50"
          >
            <div className="bg-space-dark/95 backdrop-blur-xl border border-neon-cyan/40 rounded-xl p-2 shadow-[0_0_20px_hsl(var(--neon-cyan)/0.3)]">
              <div className="flex gap-1">
                {volumePresets.map((preset, index) => (
                  <motion.button
                    key={preset.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handlePresetSelect(preset.value)}
                    className={cn(
                      "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-200",
                      "hover:bg-neon-cyan/20 active:scale-95",
                      Math.abs(volume - preset.value) < 0.05 
                        ? "bg-neon-cyan/30 text-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)/0.4)]" 
                        : "text-foreground/70 hover:text-neon-cyan"
                    )}
                  >
                    <span className="text-current">{preset.icon}</span>
                    <span className="text-[10px] font-display uppercase tracking-wider">{preset.label}</span>
                  </motion.button>
                ))}
              </div>
              {/* Arrow pointer */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 bg-space-dark/95 border-r border-b border-neon-cyan/40" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main button */}
      <motion.button
        onClick={() => {
          // Only trigger click if not a long press
          if (!isLongPressRef.current) {
            onClick();
            // Trigger particle burst with strong haptic for toggle action
            triggerHaptic('heavy');
            const newParticles = Array.from({ length: 12 }, (_, i) => ({
              id: particleIdRef.current++,
              angle: i * 30 + Math.random() * 15,
              distance: 40 + Math.random() * 30,
              size: 4 + Math.random() * 6,
              color: (Math.random() > 0.5 ? 'primary' : 'accent') as 'primary' | 'accent'
            }));
            setParticles(prev => [...prev, ...newParticles]);
            // Clean up particles after animation
            setTimeout(() => {
              setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
            }, 700);
          }
          isLongPressRef.current = false;
        }}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        className={cn(
          "relative w-14 h-14 rounded-full z-10",
          "bg-gradient-to-br from-primary via-primary/80 to-accent",
          "shadow-lg shadow-primary/40",
          "flex items-center justify-center",
          "hover:scale-110 active:scale-95 transition-transform",
          "overflow-hidden group"
        )}
        style={{ marginTop: -12 }}
        whileHover={{ rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {/* Animated pulse rings when playing */}
        {isPlaying && (
          <>
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-primary-foreground/40"
              animate={{ scale: [1, 1.8, 1.8], opacity: [0.8, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
            />
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-accent/40"
              animate={{ scale: [1, 1.8, 1.8], opacity: [0.8, 0, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
            />
          </>
        )}

        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 rounded-full bg-primary/50 blur-xl"
          animate={isPlaying ? { 
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Icon with bounce */}
        <motion.div
          className="relative z-10"
          animate={isPlaying ? { 
            y: [0, -3, 0],
            scale: [1, 1.1, 1],
          } : {}}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          {isPlaying ? (
            <Headphones className="w-6 h-6 text-primary-foreground" />
          ) : (
            <Music className="w-6 h-6 text-primary-foreground" />
          )}
        </motion.div>

        {/* Music bars animation when playing */}
        {isPlaying && (
          <motion.div 
            className="absolute bottom-1.5 flex gap-0.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[1, 2, 3].map(i => (
              <motion.div
                key={i}
                className="w-1 bg-primary-foreground/90 rounded-full"
                animate={{ height: ['3px', '8px', '3px'] }}
                transition={{ 
                  duration: 0.3 + i * 0.1, 
                  repeat: Infinity,
                  delay: i * 0.1 
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.button>

      {/* Volume indicator and label */}
      <motion.div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5"
        animate={{ opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        {onVolumeChange && (
          <span className="text-[10px] font-bold text-accent tabular-nums">
            {Math.round(volume * 100)}%
          </span>
        )}
        <span className="text-xs font-medium text-accent drop-shadow-[0_0_8px_hsl(var(--accent))]">
          {isPlaying ? '♪ Playing' : '♪ Music'}
        </span>
      </motion.div>
    </div>
  );
});

FloatingMusicButton.displayName = 'FloatingMusicButton';

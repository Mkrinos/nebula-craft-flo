import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface Star {
  id: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  delay: number;
  duration: number;
  size: 'sm' | 'md' | 'lg';
  color: string;
  angle: number;
}

interface Explosion {
  id: number;
  x: number;
  y: number;
  delay: number;
  size: number;
}

const STAR_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--neon-cyan))',
  '#FFD700', // Gold
  '#FF6B6B', // Coral
  '#4ECDC4', // Teal
  '#E040FB', // Pink/Magenta
  '#00E5FF', // Bright cyan
];

function generateStars(count: number, isIntense: boolean): Star[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.random() * 360);
    const distance = 300 + Math.random() * 400;
    const centerX = 50; // percentage
    const centerY = 50;
    
    return {
      id: i,
      startX: centerX + (Math.random() - 0.5) * 20,
      startY: centerY + (Math.random() - 0.5) * 20,
      endX: centerX + Math.cos((angle * Math.PI) / 180) * (distance / 5),
      endY: centerY + Math.sin((angle * Math.PI) / 180) * (distance / 5),
      delay: Math.random() * (isIntense ? 0.8 : 0.5),
      duration: 0.8 + Math.random() * 0.6,
      size: (['sm', 'md', 'lg'] as const)[Math.floor(Math.random() * 3)],
      color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      angle,
    };
  });
}

function generateExplosions(count: number): Explosion[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: 30 + Math.random() * 40,
    delay: 0.3 + Math.random() * 0.6,
    size: 40 + Math.random() * 60,
  }));
}

function ShootingStar({ star }: { star: Star }) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  const tailLength = star.size === 'lg' ? 60 : star.size === 'md' ? 40 : 25;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${star.startX}%`,
        top: `${star.startY}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        x: `${(star.endX - star.startX) * 10}px`,
        y: `${(star.endY - star.startY) * 10}px`,
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1.2, 1, 0],
      }}
      transition={{
        duration: star.duration,
        delay: star.delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    >
      {/* Star core with glow */}
      <div
        className={`${sizeClasses[star.size]} rounded-full relative`}
        style={{
          backgroundColor: star.color,
          boxShadow: `0 0 ${star.size === 'lg' ? 12 : 8}px ${star.color}, 0 0 ${star.size === 'lg' ? 20 : 14}px ${star.color}`,
        }}
      />
      
      {/* Star tail */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: tailLength,
          height: star.size === 'lg' ? 3 : 2,
          background: `linear-gradient(90deg, ${star.color}, transparent)`,
          transformOrigin: 'right center',
          right: '50%',
          top: '50%',
          transform: `translateY(-50%) rotate(${star.angle + 180}deg)`,
          opacity: 0.8,
        }}
        animate={{
          scaleX: [0, 1, 0.5],
          opacity: [0, 0.9, 0],
        }}
        transition={{
          duration: star.duration * 0.8,
          delay: star.delay,
        }}
      />
    </motion.div>
  );
}

function ExplosionBurst({ explosion }: { explosion: Explosion }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: `${explosion.x}%`,
        top: `${explosion.y}%`,
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1.5, 2, 2.5],
      }}
      transition={{
        duration: 0.8,
        delay: explosion.delay,
        ease: 'easeOut',
      }}
    >
      {/* Outer ring */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2"
        style={{
          width: explosion.size,
          height: explosion.size,
          borderColor: 'hsl(var(--primary))',
          boxShadow: `0 0 20px hsl(var(--primary) / 0.5), inset 0 0 20px hsl(var(--primary) / 0.3)`,
        }}
        animate={{
          scale: [0.5, 1.2],
          opacity: [1, 0],
        }}
        transition={{
          duration: 0.6,
          delay: explosion.delay,
        }}
      />
      
      {/* Inner flash */}
      <motion.div
        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: explosion.size * 0.4,
          height: explosion.size * 0.4,
          background: 'radial-gradient(circle, white 0%, hsl(var(--neon-cyan)) 40%, transparent 70%)',
        }}
        animate={{
          scale: [0, 2, 3],
          opacity: [1, 0.8, 0],
        }}
        transition={{
          duration: 0.5,
          delay: explosion.delay,
        }}
      />
      
      {/* Sparkle rays */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute -translate-x-1/2 -translate-y-1/2 bg-white"
          style={{
            width: 2,
            height: explosion.size * 0.3,
            transformOrigin: 'center bottom',
            transform: `rotate(${i * 45}deg)`,
          }}
          animate={{
            scaleY: [0, 1, 0],
            opacity: [1, 0.8, 0],
          }}
          transition={{
            duration: 0.4,
            delay: explosion.delay + 0.1,
          }}
        />
      ))}
    </motion.div>
  );
}

interface ShootingStarsExplosionProps {
  isActive: boolean;
  duration?: number;
  starCount?: number;
  isIntense?: boolean;
}

export function ShootingStarsExplosion({
  isActive,
  duration = 3000,
  starCount = 30,
  isIntense = false,
}: ShootingStarsExplosionProps) {
  const [stars, setStars] = useState<Star[]>([]);
  const [explosions, setExplosions] = useState<Explosion[]>([]);
  const { trigger } = useHapticFeedback();

  useEffect(() => {
    if (isActive) {
      const actualCount = isIntense ? starCount * 1.5 : starCount;
      setStars(generateStars(Math.floor(actualCount), isIntense));
      setExplosions(generateExplosions(isIntense ? 6 : 4));
      
      // Trigger haptic bursts
      trigger('success');
      if (isIntense) {
        setTimeout(() => trigger('medium'), 400);
        setTimeout(() => trigger('light'), 800);
      }
      
      const timer = setTimeout(() => {
        setStars([]);
        setExplosions([]);
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isActive, duration, starCount, isIntense, trigger]);

  if (!isActive || (stars.length === 0 && explosions.length === 0)) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[101] overflow-hidden">
      {/* Background flash */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.15, 0] }}
        transition={{ duration: 0.4 }}
        style={{
          background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3), transparent 70%)',
        }}
      />
      
      {/* Explosions */}
      {explosions.map((explosion) => (
        <ExplosionBurst key={explosion.id} explosion={explosion} />
      ))}
      
      {/* Shooting stars */}
      {stars.map((star) => (
        <ShootingStar key={star.id} star={star} />
      ))}
      
      {/* Central starburst for intense mode */}
      {isIntense && (
        <motion.div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          initial={{ scale: 0, opacity: 0 }}
          animate={{
            scale: [0, 1.5, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className="w-32 h-32 rounded-full"
            style={{
              background: 'radial-gradient(circle, white 0%, hsl(var(--neon-cyan)) 30%, hsl(var(--primary)) 60%, transparent 80%)',
              filter: 'blur(2px)',
            }}
          />
        </motion.div>
      )}
    </div>
  );
}

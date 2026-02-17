import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnimatedPersonaAvatarProps {
  avatarUrl: string | null;
  personaName: string;
  personaStyle: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animate?: boolean;
  showEntryAnimation?: boolean;
}

// Style-specific animation configurations
const styleAnimations: Record<string, {
  glow: string;
  particles: string;
  motion: object;
  particleColors: string[];
}> = {
  'Cyberpunk': {
    glow: 'from-cyan-500/40 to-pink-500/40',
    particles: 'bg-cyan-400',
    motion: { 
      scale: [1, 1.02, 1],
      filter: ['hue-rotate(0deg)', 'hue-rotate(10deg)', 'hue-rotate(0deg)']
    },
    particleColors: ['bg-cyan-400', 'bg-pink-400', 'bg-purple-400']
  },
  'Surreal': {
    glow: 'from-purple-500/40 to-blue-500/40',
    particles: 'bg-purple-400',
    motion: { 
      scale: [1, 1.03, 1],
      rotate: [0, 1, -1, 0]
    },
    particleColors: ['bg-purple-400', 'bg-blue-400', 'bg-indigo-400']
  },
  'Pixel Art': {
    glow: 'from-green-500/40 to-yellow-500/40',
    particles: 'bg-green-400',
    motion: { 
      scale: [1, 1.01, 1]
    },
    particleColors: ['bg-green-400', 'bg-yellow-400', 'bg-red-400']
  },
  'Fantasy': {
    glow: 'from-emerald-500/40 to-teal-500/40',
    particles: 'bg-emerald-400',
    motion: { 
      scale: [1, 1.02, 1],
      y: [0, -2, 0]
    },
    particleColors: ['bg-emerald-400', 'bg-teal-400', 'bg-lime-400']
  },
  'Minimalist': {
    glow: 'from-slate-400/30 to-zinc-400/30',
    particles: 'bg-slate-400',
    motion: { 
      opacity: [0.9, 1, 0.9]
    },
    particleColors: ['bg-slate-300', 'bg-zinc-300']
  },
  'Abstract': {
    glow: 'from-orange-500/40 to-red-500/40',
    particles: 'bg-orange-400',
    motion: { 
      rotate: [0, 2, -2, 0],
      scale: [1, 1.02, 1]
    },
    particleColors: ['bg-orange-400', 'bg-red-400', 'bg-yellow-400']
  },
  'Vintage': {
    glow: 'from-amber-500/40 to-orange-500/40',
    particles: 'bg-amber-400',
    motion: { 
      filter: ['sepia(0.1)', 'sepia(0.2)', 'sepia(0.1)']
    },
    particleColors: ['bg-amber-400', 'bg-orange-300']
  },
  'Anime': {
    glow: 'from-pink-500/40 to-purple-500/40',
    particles: 'bg-pink-400',
    motion: { 
      scale: [1, 1.03, 1],
      y: [0, -3, 0]
    },
    particleColors: ['bg-pink-400', 'bg-purple-400', 'bg-rose-400']
  },
  'Steampunk': {
    glow: 'from-amber-600/40 to-brown-500/40',
    particles: 'bg-amber-500',
    motion: { 
      rotate: [0, 1, 0]
    },
    particleColors: ['bg-amber-500', 'bg-orange-500', 'bg-yellow-600']
  },
  'Gothic': {
    glow: 'from-purple-900/40 to-slate-800/40',
    particles: 'bg-purple-600',
    motion: { 
      opacity: [0.85, 1, 0.85]
    },
    particleColors: ['bg-purple-600', 'bg-slate-600', 'bg-violet-600']
  },
  'Watercolor': {
    glow: 'from-blue-400/40 to-pink-400/40',
    particles: 'bg-blue-300',
    motion: { 
      opacity: [0.9, 1, 0.9],
      scale: [1, 1.01, 1]
    },
    particleColors: ['bg-blue-300', 'bg-pink-300', 'bg-purple-300']
  },
  'Art Nouveau': {
    glow: 'from-emerald-400/40 to-gold-400/40',
    particles: 'bg-emerald-400',
    motion: { 
      scale: [1, 1.02, 1]
    },
    particleColors: ['bg-emerald-400', 'bg-yellow-400', 'bg-green-400']
  },
  'Pop Art': {
    glow: 'from-yellow-500/40 to-red-500/40',
    particles: 'bg-yellow-400',
    motion: { 
      scale: [1, 1.04, 1]
    },
    particleColors: ['bg-yellow-400', 'bg-red-400', 'bg-blue-400']
  },
  'Psychedelic': {
    glow: 'from-fuchsia-500/40 to-cyan-500/40',
    particles: 'bg-fuchsia-400',
    motion: { 
      rotate: [0, 3, -3, 0],
      filter: ['hue-rotate(0deg)', 'hue-rotate(20deg)', 'hue-rotate(0deg)']
    },
    particleColors: ['bg-fuchsia-400', 'bg-cyan-400', 'bg-lime-400']
  },
  'Noir': {
    glow: 'from-slate-600/40 to-zinc-700/40',
    particles: 'bg-slate-400',
    motion: { 
      opacity: [0.8, 1, 0.8]
    },
    particleColors: ['bg-slate-400', 'bg-zinc-400']
  },
  'Biomechanical': {
    glow: 'from-zinc-500/40 to-emerald-500/40',
    particles: 'bg-zinc-400',
    motion: { 
      scale: [1, 1.02, 1]
    },
    particleColors: ['bg-zinc-400', 'bg-emerald-400', 'bg-slate-400']
  },
  'Impressionist': {
    glow: 'from-blue-400/40 to-yellow-400/40',
    particles: 'bg-blue-300',
    motion: { 
      opacity: [0.9, 1, 0.9]
    },
    particleColors: ['bg-blue-300', 'bg-yellow-300', 'bg-green-300']
  },
  'Vaporwave': {
    glow: 'from-pink-500/40 to-cyan-500/40',
    particles: 'bg-pink-400',
    motion: { 
      filter: ['hue-rotate(0deg)', 'hue-rotate(15deg)', 'hue-rotate(0deg)']
    },
    particleColors: ['bg-pink-400', 'bg-cyan-400', 'bg-purple-400']
  },
  'Ukiyo-e': {
    glow: 'from-red-500/40 to-blue-500/40',
    particles: 'bg-red-400',
    motion: { 
      scale: [1, 1.01, 1]
    },
    particleColors: ['bg-red-400', 'bg-blue-400', 'bg-indigo-400']
  },
  'Afrofuturism': {
    glow: 'from-amber-500/40 to-violet-500/40',
    particles: 'bg-amber-400',
    motion: { 
      scale: [1, 1.03, 1],
      y: [0, -2, 0]
    },
    particleColors: ['bg-amber-400', 'bg-violet-400', 'bg-gold-400']
  }
};

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16',
  lg: 'w-24 h-24',
  xl: 'w-32 h-32'
};

const defaultAnimation = {
  glow: 'from-primary/40 to-accent/40',
  particles: 'bg-primary',
  motion: { scale: [1, 1.02, 1] },
  particleColors: ['bg-primary', 'bg-accent']
};

export default function AnimatedPersonaAvatar({
  avatarUrl,
  personaName,
  personaStyle,
  size = 'md',
  className,
  animate = true,
  showEntryAnimation = true
}: AnimatedPersonaAvatarProps) {
  const [isVisible, setIsVisible] = useState(!showEntryAnimation);
  const [isHovered, setIsHovered] = useState(false);
  
  const styleConfig = styleAnimations[personaStyle] || defaultAnimation;

  useEffect(() => {
    if (showEntryAnimation) {
      const timer = setTimeout(() => setIsVisible(true), 100);
      return () => clearTimeout(timer);
    }
  }, [showEntryAnimation]);

  if (!avatarUrl) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          "rounded-full bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center",
          className
        )}
      >
        <span className="text-muted-foreground text-sm font-medium">
          {personaName.charAt(0).toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <motion.div
      className={cn("relative", className)}
      initial={showEntryAnimation ? { opacity: 0, scale: 0.8 } : false}
      animate={isVisible ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Animated glow background */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-full bg-gradient-to-br blur-xl",
          styleConfig.glow
        )}
        animate={animate ? {
          opacity: isHovered ? [0.6, 0.8, 0.6] : [0.3, 0.5, 0.3],
          scale: isHovered ? [1.1, 1.2, 1.1] : [1, 1.05, 1]
        } : {}}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main avatar container */}
      <motion.div
        className={cn(
          sizeClasses[size],
          "relative rounded-full overflow-hidden ring-2 ring-border/50"
        )}
        animate={animate ? styleConfig.motion as any : undefined}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={avatarUrl}
          alt={personaName}
          className="w-full h-full object-cover"
        />
        
        {/* Shimmer overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{
            x: ['-100%', '100%']
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 2,
            ease: "easeInOut"
          }}
        />
      </motion.div>

      {/* Floating particles */}
      {animate && isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className={cn(
                "absolute w-1 h-1 rounded-full",
                styleConfig.particleColors[i % styleConfig.particleColors.length]
              )}
              initial={{ 
                opacity: 0, 
                scale: 0,
                x: '50%',
                y: '50%'
              }}
              animate={{
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
                x: `${50 + Math.cos((i * Math.PI * 2) / 6) * 60}%`,
                y: `${50 + Math.sin((i * Math.PI * 2) / 6) * 60}%`
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      {/* Orbiting ring */}
      {animate && (
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full border border-dashed",
            styleConfig.particles.replace('bg-', 'border-').replace('-400', '-400/30')
          )}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ 
            width: '120%', 
            height: '120%', 
            top: '-10%', 
            left: '-10%' 
          }}
        />
      )}
    </motion.div>
  );
}
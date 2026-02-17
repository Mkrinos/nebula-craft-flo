import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Achievement } from '@/hooks/useAchievements';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { ShootingStarsExplosion } from './gamification/ShootingStarsExplosion';

interface RocketProps {
  delay: number;
  startX: number;
  color: 'primary' | 'cyan' | 'orange';
}

function Rocket({ delay, startX, color }: RocketProps) {
  const colorClasses = {
    primary: {
      body: 'fill-muted stroke-primary',
      nose: 'fill-primary',
      fins: 'fill-primary',
      window: 'fill-cyan-400',
      flame: 'fill-orange-500',
      flameInner: 'fill-yellow-300'
    },
    cyan: {
      body: 'fill-muted stroke-cyan-400',
      nose: 'fill-cyan-500',
      fins: 'fill-cyan-500',
      window: 'fill-purple-400',
      flame: 'fill-orange-400',
      flameInner: 'fill-yellow-200'
    },
    orange: {
      body: 'fill-muted stroke-orange-400',
      nose: 'fill-orange-500',
      fins: 'fill-orange-500',
      window: 'fill-cyan-300',
      flame: 'fill-red-500',
      flameInner: 'fill-orange-300'
    }
  };

  const colors = colorClasses[color];

  return (
    <motion.div
      className="absolute bottom-0 pointer-events-none"
      style={{ left: `${startX}%` }}
      initial={{ y: 100, opacity: 0, scale: 0.5 }}
      animate={{ 
        y: -800, 
        opacity: [0, 1, 1, 0],
        scale: [0.5, 1, 1, 0.8],
        rotate: [-5, 5, -3, 2, 0]
      }}
      transition={{ 
        duration: 2.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
    >
      <svg 
        width="60" 
        height="100" 
        viewBox="0 0 60 100" 
        className="drop-shadow-lg"
      >
        {/* Smoke trail */}
        <motion.ellipse
          cx="30" cy="95"
          rx="20" ry="8"
          className="fill-muted-foreground/30"
          animate={{ 
            rx: [15, 25, 20],
            ry: [5, 10, 7],
            opacity: [0.5, 0.3, 0.1]
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        
        {/* Flame outer */}
        <motion.path
          d="M22 75 L30 100 L38 75 Q30 85 22 75"
          className={colors.flame}
          animate={{ 
            d: [
              "M22 75 L30 100 L38 75 Q30 85 22 75",
              "M20 75 L30 105 L40 75 Q30 90 20 75",
              "M22 75 L30 95 L38 75 Q30 82 22 75"
            ]
          }}
          transition={{ duration: 0.15, repeat: Infinity }}
        />
        
        {/* Flame inner */}
        <motion.path
          d="M25 75 L30 90 L35 75 Q30 80 25 75"
          className={colors.flameInner}
          animate={{ 
            d: [
              "M25 75 L30 90 L35 75 Q30 80 25 75",
              "M24 75 L30 95 L36 75 Q30 82 24 75",
              "M26 75 L30 85 L34 75 Q30 78 26 75"
            ]
          }}
          transition={{ duration: 0.1, repeat: Infinity }}
        />
        
        {/* Engine */}
        <rect x="22" y="70" width="16" height="8" rx="1" className="fill-muted-foreground stroke-border" strokeWidth="1" />
        
        {/* Left fin */}
        <path 
          d="M15 50 L22 55 L22 75 L10 75 Z" 
          className={cn(colors.fins, "stroke-border/50")}
          strokeWidth="1"
        />
        
        {/* Right fin */}
        <path 
          d="M45 50 L38 55 L38 75 L50 75 Z" 
          className={cn(colors.fins, "stroke-border/50")}
          strokeWidth="1"
        />
        
        {/* Rocket body */}
        <path 
          d="M22 30 Q22 70 22 75 L38 75 Q38 70 38 30 Q30 5 22 30" 
          className={cn(colors.body)}
          strokeWidth="2"
        />
        
        {/* Nose cone */}
        <path 
          d="M22 30 Q30 5 38 30" 
          className={colors.nose}
        />
        
        {/* Windows */}
        <circle cx="30" cy="40" r="5" className={cn(colors.window, "stroke-border")} strokeWidth="1" />
        <circle cx="30" cy="55" r="4" className={cn(colors.window, "stroke-border")} strokeWidth="1" />
        
        {/* Window shine */}
        <ellipse cx="28" cy="38" rx="1.5" ry="2" className="fill-white/60" />
        <ellipse cx="28" cy="53" rx="1" ry="1.5" className="fill-white/60" />
        
        {/* Body details */}
        <line x1="22" y1="65" x2="38" y2="65" className="stroke-border/50" strokeWidth="1" />
      </svg>
      
      {/* Particle trail */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-gradient-to-br from-orange-400 to-yellow-300"
          style={{ 
            left: 25 + Math.random() * 10,
            top: 85 + i * 8
          }}
          animate={{
            y: [0, 30],
            opacity: [0.8, 0],
            scale: [1, 0.3]
          }}
          transition={{
            duration: 0.4,
            delay: delay + i * 0.05,
            repeat: Infinity,
            repeatDelay: 0.1
          }}
        />
      ))}
    </motion.div>
  );
}

function StarBurst({ delay }: { delay: number }) {
  return (
    <>
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 w-1 h-1 rounded-full bg-primary"
          initial={{ scale: 0, opacity: 1 }}
          animate={{
            x: Math.cos((i * 30 * Math.PI) / 180) * 150,
            y: Math.sin((i * 30 * Math.PI) / 180) * 150,
            scale: [0, 1.5, 0],
            opacity: [1, 1, 0]
          }}
          transition={{ duration: 1, delay: delay + 0.5 }}
        />
      ))}
    </>
  );
}

interface AchievementCelebrationProps {
  achievement: Achievement | null;
  onComplete?: () => void;
}

export function AchievementCelebration({ achievement, onComplete }: AchievementCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSecondConfetti, setShowSecondConfetti] = useState(false);
  const { playSound } = useSoundEffects();
  const { trigger } = useHapticFeedback();
  const hasPlayedSoundRef = useRef(false);
  
  const isFirstAchievement = achievement?.isFirst || false;

  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setShowConfetti(true);
      
      // For first achievement, trigger extra confetti bursts
      if (isFirstAchievement) {
        setTimeout(() => setShowSecondConfetti(true), 800);
      }
      
      // Play celebration sounds and haptics based on achievement rarity
      if (!hasPlayedSoundRef.current) {
        hasPlayedSoundRef.current = true;
        
        // Determine rarity based on credits reward
        const creditsReward = achievement.credits_reward || 0;
        if (creditsReward >= 100) {
          // Legendary achievement
          playSound('achievementLegendary');
        } else if (creditsReward >= 25) {
          // Rare achievement
          playSound('achievementRare');
        } else {
          // Common achievement
          playSound('achievement');
        }
        
        // Haptic feedback based on rarity
        if (creditsReward >= 100) {
          // Legendary - intense multi-burst
          trigger('achievement');
          setTimeout(() => trigger('success'), 150);
          setTimeout(() => trigger('success'), 300);
          setTimeout(() => trigger('heavy'), 500);
        } else if (creditsReward >= 25) {
          // Rare - double burst
          trigger('achievement');
          setTimeout(() => trigger('success'), 200);
        } else {
          // Common
          trigger('success');
        }
        
        // Play celebration fanfare after a short delay
        setTimeout(() => playSound('celebration'), 400);
        
        // Extra fanfare for first achievement
        if (isFirstAchievement) {
          setTimeout(() => playSound('levelUp'), 1000);
        }
      }
      
      const timer = setTimeout(() => {
        setIsVisible(false);
        setShowConfetti(false);
        setShowSecondConfetti(false);
        hasPlayedSoundRef.current = false;
        onComplete?.();
      }, isFirstAchievement ? 5000 : 4000); // Longer celebration for first
      return () => clearTimeout(timer);
    }
  }, [achievement, onComplete, playSound, trigger, isFirstAchievement]);

  // Determine intensity based on rarity
  const isLegendary = (achievement?.credits_reward || 0) >= 100;
  const isRare = (achievement?.credits_reward || 0) >= 25;

  return (
    <>
      {/* Shooting stars explosion - enhanced for first/rare achievements */}
      <ShootingStarsExplosion 
        isActive={showConfetti} 
        starCount={isFirstAchievement ? 60 : isLegendary ? 50 : isRare ? 40 : 30} 
        duration={isFirstAchievement ? 5000 : 4000}
        isIntense={isFirstAchievement || isLegendary}
      />
      
      {/* Second wave for first achievement */}
      {isFirstAchievement && (
        <ShootingStarsExplosion 
          isActive={showSecondConfetti} 
          starCount={45} 
          duration={4000}
          isIntense={true}
        />
      )}
      
      <AnimatePresence>
        {isVisible && achievement && (
        <motion.div
          className="fixed inset-0 z-[100] pointer-events-none overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Dark overlay with glow */}
          <motion.div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          
          {/* Rockets launching from different positions */}
          <Rocket delay={0} startX={20} color="primary" />
          <Rocket delay={0.3} startX={50} color="cyan" />
          <Rocket delay={0.6} startX={80} color="orange" />
          <Rocket delay={0.15} startX={35} color="cyan" />
          <Rocket delay={0.45} startX={65} color="primary" />
          
          {/* Star bursts */}
          <StarBurst delay={0.2} />
          <StarBurst delay={0.5} />
          
          {/* Achievement announcement */}
          <motion.div
            className="absolute inset-0 flex items-center justify-center"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 200, 
              damping: 15,
              delay: 0.3
            }}
          >
            <div className="relative">
              {/* Glow effect */}
              <motion.div
                className="absolute inset-0 bg-primary/30 rounded-3xl blur-3xl"
                animate={{ 
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              
              <motion.div 
                className="relative bg-card/95 backdrop-blur-md border-2 border-primary rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl"
                animate={{ 
                  boxShadow: [
                    '0 0 20px hsl(var(--primary) / 0.3)',
                    '0 0 40px hsl(var(--primary) / 0.5)',
                    '0 0 20px hsl(var(--primary) / 0.3)'
                  ]
                }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                {/* First Achievement Banner */}
                {isFirstAchievement && (
                  <motion.div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", delay: 0.2 }}
                  >
                    <span className="text-xs font-bold text-white whitespace-nowrap">
                      🌟 First Achievement! 🌟
                    </span>
                  </motion.div>
                )}
                
                {/* Trophy icon with animation */}
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ 
                    y: [0, -10, 0],
                    rotate: [0, -5, 5, 0],
                    scale: isFirstAchievement ? [1, 1.2, 1] : 1
                  }}
                  transition={{ duration: 0.5, repeat: isFirstAchievement ? 5 : 3 }}
                >
                  {isFirstAchievement ? '🎉' : '🏆'}
                </motion.div>
                
                <motion.h2 
                  className="text-xl font-bold text-primary mb-2"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                >
                  {isFirstAchievement ? 'Your First Achievement!' : 'Achievement Unlocked!'}
                </motion.h2>
                
                <motion.p 
                  className="text-lg font-semibold text-foreground mb-1"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {achievement.name}
                </motion.p>
                
                <motion.p 
                  className="text-sm text-muted-foreground"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  {achievement.description}
                </motion.p>
                
                {achievement.credits_reward > 0 && (
                  <motion.div 
                    className="mt-4 py-2 px-4 bg-emerald-500/20 rounded-lg inline-block"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 1 }}
                  >
                    <span className="text-emerald-400 font-bold">
                      +{achievement.credits_reward} Credits!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

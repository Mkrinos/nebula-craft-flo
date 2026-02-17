import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, MessageCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import avatarImage from '@/assets/ai-avatar-character.png';

interface SciFiAIAvatarProps {
  onGreetingComplete?: () => void;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  autoGreet?: boolean;
}

const WELCOME_MESSAGES = [
  "Welcome, traveler. You stand at the threshold of infinite creativity.",
  "Greetings, creator. Your journey through the cosmos of imagination begins now.",
  "Welcome to Nexus. Together, we shall craft visions beyond the stars.",
];

const INTERACTION_RESPONSES = [
  "I sense your curiosity. What shall we create today?",
  "The creative cosmos awaits your command.",
  "Ready to transform imagination into reality.",
];

// Personality states
type MoodState = 'idle' | 'curious' | 'happy' | 'thinking' | 'speaking' | 'listening';

// Mouth shapes for lip sync
type MouthShape = 'closed' | 'slightly_open' | 'open' | 'wide';

const SciFiAIAvatar = ({ onGreetingComplete, size = 'lg', autoGreet = true }: SciFiAIAvatarProps) => {
  const { settings } = useMotionSettings();
  const reducedMotion = settings.reducedMotion;
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mood, setMood] = useState<MoodState>('idle');
  const [mouthShape, setMouthShape] = useState<MouthShape>('closed');
  const [voiceAvailable, setVoiceAvailable] = useState<boolean | null>(null);
  const [headRotation, setHeadRotation] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const headRotationRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-32 h-32',
    lg: 'w-40 h-40',
    xl: 'w-52 h-52',
  };

  // Audio analysis for lip sync
  const setupAudioAnalysis = useCallback((audio: HTMLAudioElement) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    
    const audioContext = audioContextRef.current;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateMouthShape = () => {
      if (!analyserRef.current) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Calculate average volume from lower frequencies (voice range)
      const voiceRange = dataArray.slice(0, 20);
      const average = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
      
      // Map volume to mouth shapes
      if (average < 30) {
        setMouthShape('closed');
      } else if (average < 80) {
        setMouthShape('slightly_open');
      } else if (average < 140) {
        setMouthShape('open');
      } else {
        setMouthShape('wide');
      }

      if (isSpeaking) {
        animationFrameRef.current = requestAnimationFrame(updateMouthShape);
      }
    };

    updateMouthShape();
  }, [isSpeaking]);

  // Cleanup audio analysis
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset mouth and head when not speaking
  useEffect(() => {
    if (!isSpeaking) {
      setMouthShape('closed');
      setHeadRotation(0);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (headRotationRef.current) {
        clearInterval(headRotationRef.current);
        headRotationRef.current = null;
      }
    } else if (!reducedMotion) {
      // Start head movement when speaking
      headRotationRef.current = setInterval(() => {
        // Gentle head turning between -8 and 8 degrees
        setHeadRotation(prev => {
          const target = (Math.random() - 0.5) * 16;
          return prev + (target - prev) * 0.3;
        });
      }, 800);
    }
    
    return () => {
      if (headRotationRef.current) {
        clearInterval(headRotationRef.current);
      }
    };
  }, [isSpeaking, reducedMotion]);

  // Curious reaction on hover
  useEffect(() => {
    if (isHovered && !isSpeaking) {
      setMood('curious');
    } else if (!isSpeaking) {
      setMood('idle');
    }
  }, [isHovered, isSpeaking]);

  useEffect(() => {
    if (autoGreet) {
      const randomGreeting = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
      setGreeting(randomGreeting);
    }
  }, [autoGreet]);

  // Keyboard controls
  const handleInteractionRef = useRef<() => void>(() => {});
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'm' || e.key === 'M') {
        setIsMuted(prev => {
          if (audioRef.current) {
            audioRef.current.muted = !prev;
          }
          return !prev;
        });
      } else if (e.key === ' ' && !isSpeaking) {
        e.preventDefault();
        handleInteractionRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpeaking]);

  const speakText = useCallback(async (text: string) => {
    setIsSpeaking(true);
    setMood('speaking');
    
    // Typewriter effect
    let currentIndex = 0;
    const typeInterval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayedText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 40);

    const fallbackDuration = text.length * 50 + 1500;
    
    if (!isMuted) {
      try {
        const { data, error } = await supabase.functions.invoke('public-greeting', {
          body: { 
            text,
            voiceId: 'JBFqnCBsd6RMkjVDRZzb'
          }
        });

        if (!error && data?.audioContent) {
          setVoiceAvailable(true);
          const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          // Setup audio analysis for lip sync
          audio.onplay = () => {
            setupAudioAnalysis(audio);
          };
          
          audio.onended = () => {
            setIsSpeaking(false);
            setMood('happy');
            setMouthShape('closed');
            setTimeout(() => setMood('idle'), 2000);
            onGreetingComplete?.();
          };
          audio.onerror = () => {
            setVoiceAvailable(false);
            setTimeout(() => {
              setIsSpeaking(false);
              setMood('happy');
              setTimeout(() => setMood('idle'), 2000);
              onGreetingComplete?.();
            }, Math.max(0, fallbackDuration - 1000));
          };

          await audio.play();
          return;
        }
        
        setVoiceAvailable(false);
        console.log('Voice unavailable, using text-only mode');
      } catch (err) {
        setVoiceAvailable(false);
        console.log('Voice service error, using text-only mode');
      }
    }

    // Fallback: simulate lip movement for text-only mode
    let mouthInterval: NodeJS.Timeout | null = null;
    if (!reducedMotion) {
      const shapes: MouthShape[] = ['closed', 'slightly_open', 'open', 'wide', 'open', 'slightly_open'];
      let shapeIndex = 0;
      mouthInterval = setInterval(() => {
        setMouthShape(shapes[shapeIndex % shapes.length]);
        shapeIndex++;
      }, 120);
    }

    setTimeout(() => {
      if (mouthInterval) clearInterval(mouthInterval);
      setIsSpeaking(false);
      setMood('happy');
      setMouthShape('closed');
      setTimeout(() => setMood('idle'), 2000);
      onGreetingComplete?.();
    }, fallbackDuration);
  }, [isMuted, onGreetingComplete, setupAudioAnalysis, reducedMotion]);

  useEffect(() => {
    if (!greeting || hasGreeted || !autoGreet) return;

    const timer = setTimeout(() => {
      setHasGreeted(true);
      speakText(greeting);
    }, 800);

    return () => clearTimeout(timer);
  }, [greeting, hasGreeted, autoGreet, speakText]);

  const handleInteraction = useCallback(() => {
    if (isSpeaking) return;
    setMood('thinking');
    setTimeout(() => {
      const response = INTERACTION_RESPONSES[Math.floor(Math.random() * INTERACTION_RESPONSES.length)];
      speakText(response);
    }, 500);
  }, [isSpeaking, speakText]);

  useEffect(() => {
    handleInteractionRef.current = handleInteraction;
  }, [handleInteraction]);

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Get mouth overlay style based on shape - positioned for character's face
  const getMouthOverlayStyle = (): React.CSSProperties => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      bottom: '28%',
      width: '18%',
      borderRadius: '40% 40% 50% 50%',
      background: 'radial-gradient(ellipse at center, rgba(10,10,20,0.95) 0%, rgba(5,5,15,0.98) 100%)',
      border: '1px solid rgba(100,200,255,0.15)',
      boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.9), inset 0 -1px 3px rgba(100,200,255,0.1)',
      transition: 'all 0.06s ease-out',
    };

    switch (mouthShape) {
      case 'closed':
        return { ...baseStyle, height: '1.5%', width: '12%', borderRadius: '50%', opacity: 0.7 };
      case 'slightly_open':
        return { ...baseStyle, height: '4%', width: '14%', opacity: 0.95 };
      case 'open':
        return { ...baseStyle, height: '7%', width: '16%', opacity: 1 };
      case 'wide':
        return { ...baseStyle, height: '10%', width: '20%', borderRadius: '35% 35% 50% 50%', opacity: 1 };
      default:
        return baseStyle;
    }
  };

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center mb-6"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Avatar Container */}
      <div 
        className="relative cursor-pointer group touch-manipulation min-h-[44px] min-w-[44px]"
        onPointerDown={(e) => {
          if (e.pointerType === "touch") {
            e.preventDefault();
            handleInteraction();
          }
        }}
        onClick={(e) => {
          if (e.detail === 0) return;
          handleInteraction();
        }}
      >
        {/* Animated background elements */}
        {!reducedMotion && (
          <>
            {/* Floating holographic panels */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`panel-${i}`}
                animate={{
                  x: [0, Math.sin(i * 1.5) * 20, 0],
                  y: [0, Math.cos(i * 1.2) * 15, 0],
                  opacity: isSpeaking ? [0.3, 0.6, 0.3] : [0.15, 0.25, 0.15],
                  rotateY: [0, 10, -10, 0],
                }}
                transition={{
                  duration: 4 + i * 0.5,
                  repeat: Infinity,
                  delay: i * 0.7,
                  ease: "easeInOut"
                }}
                className="absolute w-8 h-6 border border-neon-cyan/30 bg-gradient-to-br from-neon-cyan/10 to-primary/5 rounded-sm backdrop-blur-sm"
                style={{
                  left: `${15 + i * 20}%`,
                  top: `${10 + (i % 2) * 70}%`,
                  transform: `rotate(${-15 + i * 10}deg)`,
                }}
              />
            ))}
            
            {/* Orbiting data streams */}
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={`stream-${i}`}
                animate={{
                  rotate: [0, 360],
                }}
                transition={{
                  duration: 8 + i * 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute inset-0 pointer-events-none"
                style={{ opacity: isSpeaking ? 0.6 : 0.3 }}
              >
                <motion.div
                  animate={{
                    scale: isSpeaking ? [1, 1.2, 1] : 1,
                  }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_hsl(var(--neon-cyan))]"
                  style={{
                    left: '50%',
                    top: `${-10 - i * 8}%`,
                    transform: 'translateX(-50%)',
                  }}
                />
              </motion.div>
            ))}

            {/* Floating binary/code particles */}
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={`code-${i}`}
                initial={{ opacity: 0 }}
                animate={{
                  opacity: [0, 0.6, 0],
                  y: [-20, -60],
                  x: Math.sin(i) * 30,
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: i * 0.8,
                }}
                className="absolute text-[8px] font-mono text-neon-cyan/60 pointer-events-none"
                style={{
                  left: `${20 + i * 12}%`,
                  bottom: '0%',
                }}
              >
                {['01', '10', '>>>', ':::', '{ }', '< >'][i]}
              </motion.div>
            ))}
          </>
        )}

        {/* Outer holographic glow */}
        <motion.div
          animate={isSpeaking && !reducedMotion ? {
            opacity: [0.4, 0.8, 0.4],
            scale: [1, 1.15, 1],
          } : { opacity: 0.3 }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="absolute -inset-8 rounded-full bg-gradient-to-t from-neon-cyan/40 via-primary/30 to-transparent blur-2xl"
        />

        {/* Pulsing ring when speaking */}
        <AnimatePresence>
          {isSpeaking && !reducedMotion && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: [0.6, 0], scale: [1, 1.5] }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
                  className="absolute -inset-4 rounded-full border-2 border-neon-cyan/50"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Main avatar with character image */}
        <motion.div
          animate={!reducedMotion ? {
            y: [0, -6, 0],
            scale: mood === 'curious' ? 1.03 : mood === 'happy' ? 1.02 : 1,
            rotateY: headRotation,
            rotateZ: headRotation * 0.15,
          } : {}}
          transition={{ 
            y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: 0.3 },
            rotateY: { duration: 0.6, ease: "easeOut" },
            rotateZ: { duration: 0.6, ease: "easeOut" },
          }}
          style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          className={`relative ${sizeClasses[size]} rounded-full overflow-hidden`}
        >
          {/* Glowing border */}
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-neon-cyan via-primary to-neon-cyan opacity-70 blur-sm" />
          
          {/* Character image container with head movement */}
          <motion.div 
            className="relative w-full h-full rounded-full overflow-hidden border-2 border-neon-cyan/60 shadow-[0_0_30px_rgba(0,255,255,0.3)]"
            style={{ 
              transform: `perspective(500px) rotateY(${headRotation * 0.5}deg)`,
              transition: 'transform 0.4s ease-out'
            }}
          >
            <img 
              src={avatarImage} 
              alt="AI Avatar" 
              className="w-full h-full object-cover"
              style={{
                transform: `translateX(${headRotation * 0.3}px)`,
                transition: 'transform 0.4s ease-out'
              }}
            />
            
            {/* Mouth overlay for lip sync - moves with head */}
            <motion.div
              style={{
                ...getMouthOverlayStyle(),
                transform: `translateX(calc(-50% + ${headRotation * 0.2}px))`,
              }}
              animate={isSpeaking ? {
                scaleY: mouthShape === 'wide' ? [1, 1.1, 1] : 1,
              } : {}}
              transition={{ duration: 0.1 }}
            />

            {/* Visor glow overlay - subtle, changes with mood */}
            <motion.div 
              animate={{
                opacity: mood === 'happy' ? 0.15 : mood === 'curious' ? 0.12 : mood === 'speaking' ? 0.2 : 0.08,
              }}
              className="absolute inset-0 bg-gradient-to-t from-neon-cyan/30 via-transparent to-primary/20 pointer-events-none"
            />

            {/* Scan line effect */}
            {!reducedMotion && (
              <motion.div
                animate={{ top: ['-10%', '110%'] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-neon-cyan/40 to-transparent pointer-events-none"
              />
            )}
          </motion.div>

          {/* Holographic shimmer */}
          {!reducedMotion && (
            <motion.div
              animate={{ x: ['-100%', '100%'] }}
              transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 3 }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none"
            />
          )}
        </motion.div>

        {/* Floating particles when speaking or happy */}
        <AnimatePresence>
          {(isSpeaking || mood === 'happy') && !reducedMotion && (
            <>
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = mood === 'happy' ? 55 + Math.random() * 15 : 65 + Math.random() * 20;
                const duration = mood === 'happy' ? 2.5 + Math.random() : 2 + Math.random() * 1.5;
                
                return (
                  <motion.div
                    key={`particle-${i}`}
                    initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
                    animate={{ 
                      opacity: mood === 'happy' ? [0, 0.6, 0.8, 0.6, 0] : [0, 0.8, 0],
                      x: [0, Math.cos(angle) * radius],
                      y: [0, Math.sin(angle) * radius - 20],
                      scale: mood === 'happy' ? [0, 1.2, 1, 1.2, 0.5] : [0, 1, 0.5],
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration, repeat: Infinity, delay: i * 0.15, ease: "easeOut" }}
                    className={`absolute left-1/2 top-1/2 rounded-full ${
                      mood === 'happy' 
                        ? 'w-2 h-2 bg-neon-cyan shadow-[0_0_10px_hsl(var(--neon-cyan)),0_0_20px_hsl(var(--neon-cyan)/0.5)]' 
                        : 'w-1.5 h-1.5 bg-neon-cyan shadow-[0_0_6px_hsl(var(--neon-cyan))]'
                    }`}
                  />
                );
              })}
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                const radius = mood === 'happy' ? 40 + Math.random() * 10 : 45 + Math.random() * 15;
                const duration = mood === 'happy' ? 2 + Math.random() : 1.5 + Math.random();
                
                return (
                  <motion.div
                    key={`sparkle-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: mood === 'happy' ? [0, 0.9, 1, 0.9, 0] : [0, 1, 0],
                      x: [0, Math.cos(angle) * radius],
                      y: [0, Math.sin(angle) * radius - 15],
                      scale: mood === 'happy' ? [0, 1, 0.9, 1, 0] : [0, 0.8, 0]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration, repeat: Infinity, delay: i * 0.2 + 0.1, ease: "easeOut" }}
                    className={`absolute left-1/2 top-1/2 rounded-full ${
                      mood === 'happy'
                        ? 'w-1.5 h-1.5 bg-primary shadow-[0_0_8px_hsl(var(--primary)),0_0_16px_hsl(var(--primary)/0.4)]'
                        : 'w-1 h-1 bg-primary/80 shadow-[0_0_4px_hsl(var(--primary))]'
                    }`}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Curious mood particles */}
        <AnimatePresence>
          {mood === 'curious' && !reducedMotion && (
            <>
              {[...Array(6)].map((_, i) => {
                const angle = (i / 6) * Math.PI * 2;
                const radius = 50 + Math.random() * 20;
                const duration = 3 + Math.random() * 2;
                const isEven = i % 2 === 0;
                
                return (
                  <motion.div
                    key={`curious-orb-${i}`}
                    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                    animate={{ 
                      opacity: [0, 0.7, 0.5, 0.7, 0],
                      x: [0, Math.cos(angle) * radius * 0.5, Math.cos(angle) * radius],
                      y: [0, Math.sin(angle) * radius * 0.5 - 10, Math.sin(angle) * radius - 25],
                      scale: [0, 1.1, 0.9, 1, 0],
                      rotate: [0, isEven ? 180 : -180]
                    }}
                    exit={{ opacity: 0, scale: 0 }}
                    transition={{ duration, repeat: Infinity, delay: i * 0.3, ease: "easeInOut" }}
                    className={`absolute left-1/2 top-1/2 w-2 h-2 rounded-full ${
                      isEven 
                        ? 'bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.8),0_0_16px_rgba(167,139,250,0.4)]'
                        : 'bg-pink-400 shadow-[0_0_8px_rgba(244,114,182,0.8),0_0_16px_rgba(244,114,182,0.4)]'
                    }`}
                  />
                );
              })}
              {[...Array(5)].map((_, i) => {
                const angle = (i / 5) * Math.PI * 2 + Math.PI / 5;
                const radius = 35 + Math.random() * 15;
                
                return (
                  <motion.div
                    key={`curious-star-${i}`}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 0.6, 1, 0],
                      x: [0, Math.cos(angle) * radius],
                      y: [0, Math.sin(angle) * radius - 10],
                      scale: [0, 0.8, 1.2, 0.8, 0],
                      rotate: [0, 90, 180, 270, 360]
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 2.5 + Math.random(), repeat: Infinity, delay: i * 0.25, ease: "easeInOut" }}
                    className="absolute left-1/2 top-1/2 w-1 h-1 bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.9)]"
                    style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}
                  />
                );
              })}
            </>
          )}
        </AnimatePresence>

        {/* Interaction hint */}
        <AnimatePresence>
          {isHovered && !isSpeaking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-neon-cyan whitespace-nowrap"
            >
              <MessageCircle className="w-3 h-3" />
              Click to interact
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mute button with voice status */}
        <div className="absolute -bottom-1 -right-1 flex items-center gap-1.5 z-10">
          <AnimatePresence>
            {voiceAvailable !== null && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, x: 10 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`px-2 py-0.5 rounded-full text-[10px] font-display uppercase tracking-wider border backdrop-blur-sm ${
                  voiceAvailable 
                    ? 'bg-neon-cyan/20 border-neon-cyan/40 text-neon-cyan' 
                    : 'bg-muted/50 border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {voiceAvailable ? 'Voice' : 'Text Only'}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={toggleMute}
            className="w-7 h-7 rounded-full bg-background/90 border border-neon-cyan/50 flex items-center justify-center hover:bg-neon-cyan/20 transition-colors"
            title={isMuted ? 'Unmute voice' : 'Mute voice'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-neon-cyan" />
            )}
          </button>
        </div>
      </div>

      {/* AI Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-6 px-4 py-1.5 rounded-full border border-neon-cyan/30 bg-neon-cyan/10"
      >
        <span className="text-xs font-display uppercase tracking-wider text-neon-cyan">
          NEXUS AI Guide
        </span>
      </motion.div>

      {/* Speech bubble */}
      <AnimatePresence>
        {displayedText && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="mt-4 max-w-sm text-center"
          >
            <div className="relative px-5 py-4 rounded-xl border border-neon-cyan/30 bg-background/70 backdrop-blur-md shadow-[0_0_20px_rgba(0,255,255,0.1)]">
              <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rotate-45 border-l border-t border-neon-cyan/30 bg-background/70" />
              
              <p className="text-sm text-foreground/90 font-display leading-relaxed relative z-10">
                {displayedText}
                {displayedText.length < greeting.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="inline-block w-0.5 h-4 bg-neon-cyan ml-1 align-middle"
                  />
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SciFiAIAvatar;

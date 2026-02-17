import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, type Easing } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';

interface WelcomeAvatarProps {
  onGreetingComplete?: () => void;
}

const WELCOME_MESSAGES = [
  "Welcome, traveler. You stand at the threshold of infinite creativity.",
  "Greetings, creator. Your journey through the cosmos of imagination begins now.",
  "Welcome to Nexus. Together, we shall craft visions beyond the stars.",
];

const WelcomeAvatar = ({ onGreetingComplete }: WelcomeAvatarProps) => {
  const { settings } = useMotionSettings();
  const reducedMotion = settings.reducedMotion;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingVoice, setIsLoadingVoice] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [displayedText, setDisplayedText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Pick a random greeting
    const randomGreeting = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
    setGreeting(randomGreeting);
  }, []);

  useEffect(() => {
    if (!greeting || hasGreeted) return;

    const startGreeting = async () => {
      setHasGreeted(true);
      setIsSpeaking(true);

      // Typewriter effect
      let currentIndex = 0;
      const typeInterval = setInterval(() => {
        if (currentIndex <= greeting.length) {
          setDisplayedText(greeting.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);

      // Generate voice greeting using public endpoint (no auth required)
      if (!isMuted) {
        setIsLoadingVoice(true);
        try {
          const { data, error } = await supabase.functions.invoke('public-greeting', {
            body: { 
              text: greeting,
              voiceId: 'JBFqnCBsd6RMkjVDRZzb' // George - deep sci-fi voice
            }
          });

          setIsLoadingVoice(false);

          if (error) {
            console.error('TTS error:', error);
            return;
          }

          if (data?.audioContent) {
            const audioUrl = `data:audio/mpeg;base64,${data.audioContent}`;
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            
            audio.onplay = () => setIsPlaying(true);
            audio.onended = () => {
              setIsPlaying(false);
              setIsSpeaking(false);
              onGreetingComplete?.();
            };
            audio.onerror = () => {
              setIsPlaying(false);
              setIsSpeaking(false);
            };

            await audio.play();
          }
        } catch (err) {
          console.error('Failed to generate voice:', err);
          setIsLoadingVoice(false);
          // Still complete the greeting after text finishes
          setTimeout(() => {
            setIsSpeaking(false);
            onGreetingComplete?.();
          }, greeting.length * 50 + 1000);
        }
      } else {
        // If muted, just wait for text to finish
        setTimeout(() => {
          setIsSpeaking(false);
          onGreetingComplete?.();
        }, greeting.length * 50 + 1000);
      }
    };

    const timer = setTimeout(startGreeting, 500);
    return () => clearTimeout(timer);
  }, [greeting, isMuted, hasGreeted, onGreetingComplete]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
  };

  // Avatar pulse animation based on speaking state
  const easeInOut: Easing = "easeInOut";
  
  const pulseVariants = {
    idle: {
      scale: [1, 1.02, 1],
      transition: { duration: 3, repeat: Infinity, ease: easeInOut }
    },
    speaking: {
      scale: [1, 1.05, 0.98, 1.03, 1],
      transition: { duration: 0.4, repeat: Infinity, ease: easeInOut }
    }
  };

  const glowVariants = {
    idle: {
      opacity: [0.3, 0.6, 0.3],
      transition: { duration: 3, repeat: Infinity, ease: easeInOut }
    },
    speaking: {
      opacity: [0.5, 1, 0.5],
      transition: { duration: 0.3, repeat: Infinity, ease: easeInOut }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="flex flex-col items-center mb-6"
    >
      {/* Avatar Container */}
      <div className="relative">
        {/* Outer glow ring */}
        <motion.div
          variants={reducedMotion ? undefined : glowVariants}
          animate={isSpeaking ? "speaking" : "idle"}
          className="absolute -inset-4 rounded-full bg-gradient-to-r from-neon-cyan/30 via-primary/30 to-neon-cyan/30 blur-xl"
        />
        
        {/* Middle ring */}
        <motion.div
          variants={reducedMotion ? undefined : glowVariants}
          animate={isSpeaking ? "speaking" : "idle"}
          className="absolute -inset-2 rounded-full border-2 border-neon-cyan/40"
          style={{ animationDelay: '0.1s' }}
        />

        {/* Avatar orb */}
        <motion.div
          variants={reducedMotion ? undefined : pulseVariants}
          animate={isSpeaking ? "speaking" : "idle"}
          className="relative w-24 h-24 rounded-full overflow-hidden"
        >
          {/* Sci-fi core gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-neon-cyan to-primary animate-pulse" />
          
          {/* Inner glow */}
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm" />
          
          {/* Central eye/core */}
          <motion.div 
            className="absolute inset-4 rounded-full bg-gradient-to-br from-neon-cyan via-primary to-neon-cyan flex items-center justify-center"
            animate={isSpeaking && !reducedMotion ? {
              boxShadow: ['0 0 20px hsl(var(--neon-cyan))', '0 0 40px hsl(var(--neon-cyan))', '0 0 20px hsl(var(--neon-cyan))']
            } : {}}
            transition={{ duration: 0.5, repeat: Infinity }}
          >
            {/* Inner core detail */}
            <div className="w-6 h-6 rounded-full bg-background/90 flex items-center justify-center">
              <motion.div
                className="w-3 h-3 rounded-full bg-neon-cyan"
                animate={isSpeaking && !reducedMotion ? { scale: [1, 1.5, 1] } : {}}
                transition={{ duration: 0.3, repeat: Infinity }}
              />
            </div>
          </motion.div>

          {/* Scanning line effect */}
          {!reducedMotion && (
            <motion.div
              className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent"
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>

        {/* Sound waves when speaking */}
        <AnimatePresence>
          {isSpeaking && !reducedMotion && (
            <>
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: [0.6, 0], scale: [1, 1.8] }}
                  exit={{ opacity: 0 }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    delay: i * 0.3,
                    ease: "easeOut"
                  }}
                  className="absolute -inset-2 rounded-full border border-neon-cyan/40"
                />
              ))}
            </>
          )}
        </AnimatePresence>

        {/* Mute button */}
        <button
          onClick={toggleMute}
          className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-background/80 border border-neon-cyan/50 flex items-center justify-center hover:bg-neon-cyan/20 transition-colors"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Volume2 className="w-4 h-4 text-neon-cyan" />
          )}
        </button>
      </div>

      {/* AI Label */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 px-3 py-1 rounded-full border border-neon-cyan/30 bg-neon-cyan/10"
      >
        <span className="text-xs font-display uppercase tracking-wider text-neon-cyan">
          NEXUS AI Guide
        </span>
      </motion.div>

      {/* Loading indicator */}
      <AnimatePresence>
        {isLoadingVoice && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-3 h-3 border-2 border-neon-cyan/30 border-t-neon-cyan rounded-full"
            />
            <span className="text-xs text-muted-foreground">Generating voice...</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech bubble with greeting text */}
      <AnimatePresence>
        {displayedText && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 max-w-xs text-center"
          >
            <div className="relative px-4 py-3 rounded-lg border border-neon-cyan/30 bg-background/60 backdrop-blur-sm">
              {/* Speech bubble pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rotate-45 border-l border-t border-neon-cyan/30 bg-background/60" />
              
              <p className="text-sm text-foreground/90 font-display leading-relaxed relative z-10">
                {displayedText}
                {displayedText.length < greeting.length && (
                  <motion.span
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
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

export default WelcomeAvatar;

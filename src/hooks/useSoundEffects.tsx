import { useCallback, useRef, useEffect } from 'react';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';

type SoundEffect = 
  | 'achievement' 
  | 'achievementRare'
  | 'achievementLegendary'
  | 'milestone'
  | 'milestoneComplete'
  | 'streakUp'
  | 'levelUp'
  | 'mascotAppear' 
  | 'mascotSpeak' 
  | 'stepComplete' 
  | 'celebration' 
  | 'whoosh'
  | 'ding'
  | 'pop'
  | 'coinCollect'
  | 'progressTick';

interface SoundConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  envelope?: {
    attack: number;
    decay: number;
    sustain: number;
    release: number;
  };
}

const SOUND_CONFIGS: Record<SoundEffect, SoundConfig | SoundConfig[]> = {
  // Basic achievement unlock - ascending chime
  achievement: [
    { frequency: 523.25, duration: 0.15, type: 'sine', volume: 0.3 }, // C5
    { frequency: 659.25, duration: 0.15, type: 'sine', volume: 0.3 }, // E5
    { frequency: 783.99, duration: 0.25, type: 'sine', volume: 0.4 }, // G5
    { frequency: 1046.50, duration: 0.4, type: 'sine', volume: 0.35 }, // C6
  ],
  // Rare achievement - more elaborate fanfare
  achievementRare: [
    { frequency: 392, duration: 0.1, type: 'sine', volume: 0.25 }, // G4
    { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.3 }, // C5
    { frequency: 659.25, duration: 0.1, type: 'sine', volume: 0.3 }, // E5
    { frequency: 783.99, duration: 0.15, type: 'sine', volume: 0.35 }, // G5
    { frequency: 987.77, duration: 0.15, type: 'sine', volume: 0.35 }, // B5
    { frequency: 1046.50, duration: 0.4, type: 'sine', volume: 0.4 }, // C6
  ],
  // Legendary achievement - epic fanfare with harmonics
  achievementLegendary: [
    { frequency: 261.63, duration: 0.12, type: 'triangle', volume: 0.3 }, // C4
    { frequency: 329.63, duration: 0.12, type: 'triangle', volume: 0.3 }, // E4
    { frequency: 392, duration: 0.12, type: 'sine', volume: 0.3 }, // G4
    { frequency: 523.25, duration: 0.12, type: 'sine', volume: 0.35 }, // C5
    { frequency: 659.25, duration: 0.12, type: 'sine', volume: 0.35 }, // E5
    { frequency: 783.99, duration: 0.15, type: 'sine', volume: 0.4 }, // G5
    { frequency: 1046.50, duration: 0.2, type: 'sine', volume: 0.45 }, // C6
    { frequency: 1318.51, duration: 0.5, type: 'sine', volume: 0.4 }, // E6
  ],
  // Milestone reached - satisfying "ping"
  milestone: [
    { frequency: 880, duration: 0.08, type: 'sine', volume: 0.25 },
    { frequency: 1108.73, duration: 0.12, type: 'sine', volume: 0.3 },
  ],
  // Milestone complete - triumphant
  milestoneComplete: [
    { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.3 },
    { frequency: 659.25, duration: 0.1, type: 'sine', volume: 0.35 },
    { frequency: 783.99, duration: 0.1, type: 'sine', volume: 0.35 },
    { frequency: 1046.50, duration: 0.3, type: 'sine', volume: 0.4 },
  ],
  // Streak increase - fire crackling up
  streakUp: [
    { frequency: 200, duration: 0.05, type: 'sawtooth', volume: 0.15 },
    { frequency: 350, duration: 0.08, type: 'sine', volume: 0.2 },
    { frequency: 500, duration: 0.1, type: 'sine', volume: 0.25 },
    { frequency: 700, duration: 0.15, type: 'sine', volume: 0.3 },
  ],
  // Level up - epic ascending
  levelUp: [
    { frequency: 261.63, duration: 0.08, type: 'square', volume: 0.2 },
    { frequency: 329.63, duration: 0.08, type: 'square', volume: 0.22 },
    { frequency: 392, duration: 0.08, type: 'sine', volume: 0.25 },
    { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.3 },
    { frequency: 659.25, duration: 0.1, type: 'sine', volume: 0.32 },
    { frequency: 783.99, duration: 0.15, type: 'sine', volume: 0.35 },
    { frequency: 1046.50, duration: 0.3, type: 'sine', volume: 0.4 },
  ],
  // Coin collect - quick satisfying clink
  coinCollect: [
    { frequency: 1200, duration: 0.05, type: 'sine', volume: 0.2 },
    { frequency: 1800, duration: 0.08, type: 'sine', volume: 0.25 },
  ],
  // Progress tick - subtle increment
  progressTick: { frequency: 600, duration: 0.03, type: 'sine', volume: 0.1 },
  celebration: [
    { frequency: 392, duration: 0.1, type: 'square', volume: 0.2 }, // G4
    { frequency: 523.25, duration: 0.1, type: 'square', volume: 0.25 }, // C5
    { frequency: 659.25, duration: 0.15, type: 'square', volume: 0.3 }, // E5
    { frequency: 783.99, duration: 0.2, type: 'sine', volume: 0.35 }, // G5
    { frequency: 1046.50, duration: 0.35, type: 'sine', volume: 0.3 }, // C6
  ],
  mascotAppear: [
    { frequency: 440, duration: 0.08, type: 'sine', volume: 0.2 },
    { frequency: 554.37, duration: 0.08, type: 'sine', volume: 0.25 },
    { frequency: 659.25, duration: 0.15, type: 'sine', volume: 0.3 },
  ],
  mascotSpeak: { frequency: 300, duration: 0.05, type: 'sine', volume: 0.1 },
  stepComplete: [
    { frequency: 523.25, duration: 0.1, type: 'sine', volume: 0.25 },
    { frequency: 659.25, duration: 0.15, type: 'sine', volume: 0.3 },
  ],
  whoosh: { frequency: 200, duration: 0.3, type: 'sawtooth', volume: 0.15, envelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.2 } },
  ding: { frequency: 880, duration: 0.2, type: 'sine', volume: 0.25 },
  pop: { frequency: 600, duration: 0.08, type: 'sine', volume: 0.2 },
};

export function useSoundEffects() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { settings } = useMotionSettings();
  const soundEnabledRef = useRef(true);

  // Check localStorage for sound preference
  useEffect(() => {
    const saved = localStorage.getItem('soundEffectsEnabled');
    soundEnabledRef.current = saved !== 'false';
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((config: SoundConfig, startTime: number, ctx: AudioContext) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, startTime);
    
    // Apply envelope
    const envelope = config.envelope || { attack: 0.01, decay: 0.05, sustain: 0.8, release: 0.1 };
    const attackEnd = startTime + envelope.attack;
    const decayEnd = attackEnd + envelope.decay;
    const releaseStart = startTime + config.duration - envelope.release;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(config.volume, attackEnd);
    gainNode.gain.linearRampToValueAtTime(config.volume * envelope.sustain, decayEnd);
    gainNode.gain.setValueAtTime(config.volume * envelope.sustain, releaseStart);
    gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + config.duration + 0.01);
    
    return config.duration;
  }, []);

  const playSound = useCallback((effect: SoundEffect) => {
    // Don't play if reduced motion or sounds disabled
    if (settings.reducedMotion || !soundEnabledRef.current) return;
    
    try {
      const ctx = getAudioContext();
      
      // Resume context if suspended (required for autoplay policies)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const config = SOUND_CONFIGS[effect];
      let currentTime = ctx.currentTime;
      
      if (Array.isArray(config)) {
        // Play sequence of tones
        config.forEach((toneConfig) => {
          const duration = playTone(toneConfig, currentTime, ctx);
          currentTime += duration * 0.7; // Slight overlap for smoother sound
        });
      } else {
        playTone(config, currentTime, ctx);
      }
    } catch (error) {
      console.warn('Sound playback failed:', error);
    }
  }, [settings.reducedMotion, getAudioContext, playTone]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    soundEnabledRef.current = enabled;
    localStorage.setItem('soundEffectsEnabled', String(enabled));
  }, []);

  const isSoundEnabled = useCallback(() => soundEnabledRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    playSound,
    setSoundEnabled,
    isSoundEnabled,
  };
}

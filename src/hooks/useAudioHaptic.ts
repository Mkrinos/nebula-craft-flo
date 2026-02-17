import { useCallback, useRef, useEffect, useState } from 'react';
import { useMotionSettings } from '@/contexts/MotionSettingsContext';
import { HapticIntensity, triggerHaptic, getHapticIntensity } from '@/hooks/useHapticFeedback';

interface AudioHapticConfig {
  frequency: number;
  duration: number;
  type: OscillatorType;
  volume: number;
  detune?: number;
}

// Audio configurations that complement each haptic pattern
const HAPTIC_AUDIO_CONFIGS: Record<HapticIntensity, AudioHapticConfig | AudioHapticConfig[]> = {
  // Basic patterns - subtle clicks/taps
  light: { frequency: 1200, duration: 0.02, type: 'sine', volume: 0.08 },
  medium: { frequency: 800, duration: 0.04, type: 'sine', volume: 0.12 },
  heavy: { frequency: 400, duration: 0.08, type: 'triangle', volume: 0.15 },
  selection: { frequency: 1400, duration: 0.015, type: 'sine', volume: 0.06 },
  
  // Navigation patterns - whoosh/swipe sounds
  navigation: [
    { frequency: 600, duration: 0.03, type: 'sine', volume: 0.08 },
    { frequency: 800, duration: 0.04, type: 'sine', volume: 0.1 },
    { frequency: 700, duration: 0.03, type: 'sine', volume: 0.06 },
  ],
  'button-press': { frequency: 900, duration: 0.03, type: 'sine', volume: 0.1 },
  swipe: [
    { frequency: 300, duration: 0.02, type: 'sawtooth', volume: 0.05 },
    { frequency: 500, duration: 0.03, type: 'sine', volume: 0.08 },
    { frequency: 400, duration: 0.02, type: 'sine', volume: 0.04 },
  ],
  'long-press': [
    { frequency: 200, duration: 0.05, type: 'sine', volume: 0.08 },
    { frequency: 300, duration: 0.08, type: 'sine', volume: 0.1 },
    { frequency: 400, duration: 0.05, type: 'sine', volume: 0.08 },
    { frequency: 350, duration: 0.05, type: 'sine', volume: 0.06 },
  ],
  'double-tap': [
    { frequency: 1000, duration: 0.02, type: 'sine', volume: 0.08 },
    { frequency: 1200, duration: 0.02, type: 'sine', volume: 0.1 },
    { frequency: 1000, duration: 0.02, type: 'sine', volume: 0.06 },
  ],
  'tour-step': [
    { frequency: 523, duration: 0.04, type: 'sine', volume: 0.1 }, // C5
    { frequency: 659, duration: 0.04, type: 'sine', volume: 0.12 }, // E5
    { frequency: 523, duration: 0.04, type: 'sine', volume: 0.1 },
    { frequency: 659, duration: 0.04, type: 'sine', volume: 0.08 },
    { frequency: 523, duration: 0.04, type: 'sine', volume: 0.06 },
  ],
  
  // Feedback patterns - distinctive tones
  success: [
    { frequency: 523, duration: 0.06, type: 'sine', volume: 0.12 }, // C5
    { frequency: 659, duration: 0.08, type: 'sine', volume: 0.14 }, // E5
    { frequency: 784, duration: 0.1, type: 'sine', volume: 0.12 }, // G5
  ],
  warning: [
    { frequency: 440, duration: 0.08, type: 'triangle', volume: 0.12 },
    { frequency: 349, duration: 0.08, type: 'triangle', volume: 0.14 },
    { frequency: 440, duration: 0.08, type: 'triangle', volume: 0.12 },
  ],
  error: [
    { frequency: 200, duration: 0.1, type: 'sawtooth', volume: 0.12 },
    { frequency: 180, duration: 0.1, type: 'sawtooth', volume: 0.14 },
    { frequency: 160, duration: 0.15, type: 'sawtooth', volume: 0.12 },
  ],
  achievement: [
    { frequency: 523, duration: 0.08, type: 'sine', volume: 0.1 }, // C5
    { frequency: 659, duration: 0.08, type: 'sine', volume: 0.12 }, // E5
    { frequency: 784, duration: 0.1, type: 'sine', volume: 0.14 }, // G5
    { frequency: 1047, duration: 0.15, type: 'sine', volume: 0.16 }, // C6
    { frequency: 1319, duration: 0.2, type: 'sine', volume: 0.12 }, // E6
  ],
};

interface UseAudioHapticOptions {
  audioEnabled?: boolean;
  hapticEnabled?: boolean;
  audioVolume?: number; // 0-1 multiplier
}

export function useAudioHaptic(options: UseAudioHapticOptions = {}) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const { settings } = useMotionSettings();
  
  const [audioEnabled, setAudioEnabled] = useState(() => {
    const saved = localStorage.getItem('audioHapticEnabled');
    return saved !== 'false';
  });
  
  const [audioVolume, setAudioVolume] = useState(() => {
    const saved = localStorage.getItem('audioHapticVolume');
    return saved ? parseFloat(saved) : 0.5;
  });

  // Persist settings
  useEffect(() => {
    localStorage.setItem('audioHapticEnabled', String(audioEnabled));
  }, [audioEnabled]);

  useEffect(() => {
    localStorage.setItem('audioHapticVolume', String(audioVolume));
  }, [audioVolume]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((config: AudioHapticConfig, startTime: number, ctx: AudioContext, volumeMultiplier: number) => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.type = config.type;
    oscillator.frequency.setValueAtTime(config.frequency, startTime);
    if (config.detune) {
      oscillator.detune.setValueAtTime(config.detune, startTime);
    }
    
    const volume = config.volume * volumeMultiplier;
    const attackTime = 0.005;
    const releaseTime = config.duration * 0.3;
    
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + attackTime);
    gainNode.gain.setValueAtTime(volume, startTime + config.duration - releaseTime);
    gainNode.gain.linearRampToValueAtTime(0, startTime + config.duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.start(startTime);
    oscillator.stop(startTime + config.duration + 0.01);
    
    return config.duration;
  }, []);

  const playHapticAudio = useCallback((pattern: HapticIntensity) => {
    if (!audioEnabled || settings.reducedMotion) return;
    
    try {
      const ctx = getAudioContext();
      
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      
      const config = HAPTIC_AUDIO_CONFIGS[pattern];
      let currentTime = ctx.currentTime;
      
      if (Array.isArray(config)) {
        config.forEach((toneConfig) => {
          const duration = playTone(toneConfig, currentTime, ctx, audioVolume);
          currentTime += duration * 0.6; // Overlap for smoother sound
        });
      } else {
        playTone(config, currentTime, ctx, audioVolume);
      }
    } catch (error) {
      console.warn('Audio-haptic playback failed:', error);
    }
  }, [audioEnabled, audioVolume, settings.reducedMotion, getAudioContext, playTone]);

  // Combined trigger that fires both haptic and audio
  const trigger = useCallback((pattern: HapticIntensity) => {
    const hapticIntensity = getHapticIntensity();
    
    // Trigger haptic
    if (hapticIntensity > 0) {
      triggerHaptic(pattern);
    }
    
    // Trigger synced audio
    playHapticAudio(pattern);
  }, [playHapticAudio]);

  // Preview specific pattern with audio
  const preview = useCallback((pattern: HapticIntensity, options?: { audioOnly?: boolean; hapticOnly?: boolean }) => {
    if (!options?.audioOnly) {
      triggerHaptic(pattern);
    }
    if (!options?.hapticOnly) {
      playHapticAudio(pattern);
    }
  }, [playHapticAudio]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    trigger,
    preview,
    playHapticAudio,
    audioEnabled,
    setAudioEnabled,
    audioVolume,
    setAudioVolume,
  };
}

// Export audio configs for visualizer
export const getHapticAudioConfig = (pattern: HapticIntensity) => HAPTIC_AUDIO_CONFIGS[pattern];

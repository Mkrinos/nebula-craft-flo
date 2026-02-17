import { useEffect, useRef, useCallback, useState } from 'react';
import { triggerHaptic, HapticIntensity } from './useHapticFeedback';

interface RhythmHapticsOptions {
  enabled: boolean;
  intensity: 'gentle' | 'normal' | 'strong';
  sensitivity: number; // 0-1, higher = more beats detected
}

interface BeatInfo {
  isBeat: boolean;
  energy: number;
  lowFreqEnergy: number;
  highFreqEnergy: number;
}

const DEFAULT_OPTIONS: RhythmHapticsOptions = {
  enabled: true,
  intensity: 'normal',
  sensitivity: 0.5,
};

// Map intensity to haptic patterns
const intensityMap: Record<string, HapticIntensity> = {
  gentle: 'light',
  normal: 'medium',
  strong: 'heavy',
};

// Beat detection thresholds based on sensitivity
const getThreshold = (sensitivity: number): number => {
  // Higher sensitivity = lower threshold = more beats detected
  return 1.3 - (sensitivity * 0.5); // Range: 0.8 to 1.3
};

export const useRhythmHaptics = (
  audioRef: React.RefObject<HTMLAudioElement>,
  isPlaying: boolean,
  options: Partial<RhythmHapticsOptions> = {}
) => {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options };
  const [isConnected, setIsConnected] = useState(false);
  const [currentBeat, setCurrentBeat] = useState<BeatInfo | null>(null);
  const [bpm, setBpm] = useState<number | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);
  
  // Energy history for beat detection
  const energyHistoryRef = useRef<number[]>([]);
  const lastBeatTimeRef = useRef<number>(0);
  const beatTimesRef = useRef<number[]>([]);
  
  // Cooldown to prevent too frequent haptics
  const lastHapticTimeRef = useRef<number>(0);
  const minHapticInterval = 100; // ms between haptic triggers

  const initializeAudioContext = useCallback(() => {
    if (!audioRef.current || isConnectedRef.current) return false;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return false;

      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.4;

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      isConnectedRef.current = true;
      setIsConnected(true);
      return true;
    } catch (error) {
      console.warn('Rhythm haptics initialization failed:', error);
      return false;
    }
  }, [audioRef]);

  const detectBeat = useCallback((): BeatInfo => {
    if (!analyserRef.current) {
      return { isBeat: false, energy: 0, lowFreqEnergy: 0, highFreqEnergy: 0 };
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Calculate energy in different frequency bands
    const lowBandEnd = Math.floor(bufferLength * 0.1); // Bass frequencies
    const midBandEnd = Math.floor(bufferLength * 0.5);
    
    let lowFreqSum = 0;
    let midFreqSum = 0;
    let highFreqSum = 0;
    
    for (let i = 0; i < bufferLength; i++) {
      if (i < lowBandEnd) {
        lowFreqSum += dataArray[i];
      } else if (i < midBandEnd) {
        midFreqSum += dataArray[i];
      } else {
        highFreqSum += dataArray[i];
      }
    }

    const lowFreqEnergy = lowFreqSum / lowBandEnd;
    const highFreqEnergy = highFreqSum / (bufferLength - midBandEnd);
    
    // Total energy with bass emphasis for beat detection
    const totalEnergy = (lowFreqSum * 1.5 + midFreqSum + highFreqSum) / bufferLength;
    
    // Update energy history
    energyHistoryRef.current.push(totalEnergy);
    if (energyHistoryRef.current.length > 43) { // ~1 second of history at 60fps
      energyHistoryRef.current.shift();
    }

    // Calculate average energy
    const avgEnergy = energyHistoryRef.current.reduce((a, b) => a + b, 0) / energyHistoryRef.current.length;
    
    // Beat detection: current energy significantly above average
    const threshold = getThreshold(mergedOptions.sensitivity);
    const now = Date.now();
    const minBeatInterval = 200; // Minimum ms between beats (300 BPM max)
    
    const isBeat = 
      totalEnergy > avgEnergy * threshold &&
      totalEnergy > 50 && // Minimum energy threshold
      now - lastBeatTimeRef.current > minBeatInterval;

    if (isBeat) {
      lastBeatTimeRef.current = now;
      
      // Track beat times for BPM calculation
      beatTimesRef.current.push(now);
      if (beatTimesRef.current.length > 8) {
        beatTimesRef.current.shift();
      }
      
      // Calculate BPM from recent beats
      if (beatTimesRef.current.length >= 4) {
        const intervals = [];
        for (let i = 1; i < beatTimesRef.current.length; i++) {
          intervals.push(beatTimesRef.current[i] - beatTimesRef.current[i - 1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);
        if (calculatedBpm >= 60 && calculatedBpm <= 200) {
          setBpm(calculatedBpm);
        }
      }
    }

    return {
      isBeat,
      energy: totalEnergy / 255,
      lowFreqEnergy: lowFreqEnergy / 255,
      highFreqEnergy: highFreqEnergy / 255,
    };
  }, [mergedOptions.sensitivity]);

  const triggerBeatHaptic = useCallback((beatInfo: BeatInfo) => {
    if (!mergedOptions.enabled) return;
    
    const now = Date.now();
    if (now - lastHapticTimeRef.current < minHapticInterval) return;
    
    lastHapticTimeRef.current = now;
    
    // Choose haptic pattern based on beat characteristics and settings
    const baseIntensity = intensityMap[mergedOptions.intensity];
    
    // Strong bass = heavier haptic
    if (beatInfo.lowFreqEnergy > 0.7) {
      triggerHaptic(mergedOptions.intensity === 'strong' ? 'heavy' : 'medium');
    } else if (beatInfo.highFreqEnergy > 0.6) {
      // High frequency emphasis = lighter, snappier haptic
      triggerHaptic('light');
    } else {
      triggerHaptic(baseIntensity);
    }
  }, [mergedOptions.enabled, mergedOptions.intensity]);

  const analyze = useCallback(() => {
    if (!isPlaying || !mergedOptions.enabled) {
      animationFrameRef.current = requestAnimationFrame(analyze);
      return;
    }

    const beatInfo = detectBeat();
    setCurrentBeat(beatInfo);
    
    if (beatInfo.isBeat) {
      triggerBeatHaptic(beatInfo);
    }

    animationFrameRef.current = requestAnimationFrame(analyze);
  }, [isPlaying, mergedOptions.enabled, detectBeat, triggerBeatHaptic]);

  // Initialize audio context when playing starts
  useEffect(() => {
    if (isPlaying && audioRef.current && !isConnectedRef.current && mergedOptions.enabled) {
      initializeAudioContext();
    }
  }, [isPlaying, audioRef, initializeAudioContext, mergedOptions.enabled]);

  // Resume audio context if suspended
  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  // Start/stop analysis loop
  useEffect(() => {
    if (mergedOptions.enabled && isConnected) {
      animationFrameRef.current = requestAnimationFrame(analyze);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [analyze, mergedOptions.enabled, isConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Reset beat tracking when track changes or playback stops
  useEffect(() => {
    if (!isPlaying) {
      energyHistoryRef.current = [];
      beatTimesRef.current = [];
      setBpm(null);
      setCurrentBeat(null);
    }
  }, [isPlaying]);

  return {
    isConnected,
    currentBeat,
    bpm,
  };
};

// Standalone function to get saved rhythm haptic settings
export const getRhythmHapticSettings = (): RhythmHapticsOptions => {
  try {
    const saved = localStorage.getItem('rhythm-haptics-settings');
    if (saved) {
      return { ...DEFAULT_OPTIONS, ...JSON.parse(saved) };
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_OPTIONS;
};

// Save rhythm haptic settings
export const saveRhythmHapticSettings = (settings: Partial<RhythmHapticsOptions>) => {
  const current = getRhythmHapticSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem('rhythm-haptics-settings', JSON.stringify(merged));
  return merged;
};

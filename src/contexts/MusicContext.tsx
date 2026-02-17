import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';
import { MusicTrack } from '@/hooks/useMusicTracks';
import { useRhythmHaptics, getRhythmHapticSettings } from '@/hooks/useRhythmHaptics';

export type VisualizerMode = 'bars' | 'wave' | 'circular';

interface RhythmHapticsState {
  isConnected: boolean;
  currentBeat: { isBeat: boolean; energy: number; lowFreqEnergy: number; highFreqEnergy: number } | null;
  bpm: number | null;
}

interface MusicContextType {
  // Playback state
  isPlaying: boolean;
  currentTrack: MusicTrack | null;
  volume: number;
  isMuted: boolean;
  progress: number;
  
  // Visualizer
  visualizerMode: VisualizerMode;
  setVisualizerMode: (mode: VisualizerMode) => void;
  
  // Rhythm haptics
  rhythmHaptics: RhythmHapticsState;
  
  // Actions
  playTrack: (track: MusicTrack) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  seekTo: (progress: number) => void;
  playNext: () => void;
  playPrevious: () => void;
  setPlaylist: (tracks: MusicTrack[]) => void;
  
  // Audio ref for advanced control
  audioRef: React.RefObject<HTMLAudioElement>;
  
  // Current playlist
  playlist: MusicTrack[];
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const useMusicContext = () => {
  const context = useContext(MusicContext);
  if (!context) {
    throw new Error('useMusicContext must be used within a MusicProvider');
  }
  return context;
};

interface MusicProviderProps {
  children: React.ReactNode;
}

export const MusicProvider: React.FC<MusicProviderProps> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('music-volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const saved = localStorage.getItem('music-muted');
    return saved === 'true';
  });
  const [visualizerMode, setVisualizerModeState] = useState<VisualizerMode>(() => {
    const saved = localStorage.getItem('visualizer-mode');
    return (saved as VisualizerMode) || 'bars';
  });
  const [progress, setProgress] = useState(0);
  const [playlist, setPlaylistState] = useState<MusicTrack[]>([]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  
  // Rhythm haptics - get settings from localStorage
  const rhythmSettings = getRhythmHapticSettings();
  const rhythmHapticsResult = useRhythmHaptics(audioRef, isPlaying, rhythmSettings);
  
  const rhythmHaptics: RhythmHapticsState = {
    isConnected: rhythmHapticsResult.isConnected,
    currentBeat: rhythmHapticsResult.currentBeat,
    bpm: rhythmHapticsResult.bpm,
  };

  // Persist visualizer mode
  const setVisualizerMode = useCallback((mode: VisualizerMode) => {
    setVisualizerModeState(mode);
    localStorage.setItem('visualizer-mode', mode);
  }, []);

  // Persist volume and mute settings
  useEffect(() => {
    localStorage.setItem('music-volume', volume.toString());
  }, [volume]);

  useEffect(() => {
    localStorage.setItem('music-muted', isMuted.toString());
  }, [isMuted]);

  // Apply volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Track progress and handle ended
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleEnded = () => {
      playNextTrack();
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [currentTrack, playlist]);

  const playTrack = useCallback((track: MusicTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    const audio = audioRef.current;
    const url = track.file_url || '';
    if (!audio || !url) return;

    // Ensure volume/mute are applied before play
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : volume;

    // Set source directly for immediate effect (avoid relying on React re-render timing)
    audio.src = url;
    audio.load();

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((error) => {
        console.warn('Audio playback failed:', error);
        setIsPlaying(false);
      });
    }
  }, [isMuted, volume]);

  const togglePlay = useCallback(() => {
    if (!currentTrack && playlist.length > 0) {
      playTrack(playlist[0]);
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    // Keep element in sync with current settings
    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : volume;

    if (isPlaying) {
      audio.pause();
      return;
    }

    // If src was cleared/never set, restore it from currentTrack
    if (!audio.src && currentTrack?.file_url) {
      audio.src = currentTrack.file_url;
      audio.load();
    }

    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch((error) => {
        console.warn('Audio resume failed:', error);
      });
    }
  }, [currentTrack, isMuted, isPlaying, playlist, playTrack, volume]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.muted = isMuted;
    audio.volume = isMuted ? 0 : volume;

    if (!audio.src && currentTrack?.file_url) {
      audio.src = currentTrack.file_url;
      audio.load();
    }

    const playPromise = audio.play();
    if (playPromise) {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((error) => {
          console.warn('Audio resume failed:', error);
        });
    } else {
      setIsPlaying(true);
    }
  }, [currentTrack, isMuted, volume]);

  const setVolume = useCallback((newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)));
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const seekTo = useCallback((newProgress: number) => {
    if (audioRef.current && audioRef.current.duration) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setProgress(newProgress);
    }
  }, []);

  const playNextTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(playlist[nextIndex]);
  }, [currentTrack, playlist, playTrack]);

  const playPreviousTrack = useCallback(() => {
    if (!currentTrack || playlist.length === 0) return;
    const currentIndex = playlist.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(playlist[prevIndex]);
  }, [currentTrack, playlist, playTrack]);

  const setPlaylist = useCallback((tracks: MusicTrack[]) => {
    setPlaylistState((prev) => {
      // Prevent redundant updates that can cause render loops in consumers.
      if (prev.length === tracks.length && prev.every((t, i) => t.id === tracks[i]?.id)) {
        return prev;
      }
      return tracks;
    });
  }, []);

  const value: MusicContextType = {
    isPlaying,
    currentTrack,
    volume,
    isMuted,
    progress,
    visualizerMode,
    setVisualizerMode,
    rhythmHaptics,
    playTrack,
    togglePlay,
    pause,
    resume,
    setVolume,
    toggleMute,
    seekTo,
    playNext: playNextTrack,
    playPrevious: playPreviousTrack,
    setPlaylist,
    audioRef,
    playlist,
  };

  return (
    <MusicContext.Provider value={value}>
      {children}
      {/* Global audio element - persists across all page navigations */}
      <audio
        ref={audioRef}
        preload="auto"
        style={{ display: 'none' }}
      />
    </MusicContext.Provider>
  );
};

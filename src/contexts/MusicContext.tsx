import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Track {
  id: string;
  title: string;
  artist: string | null;
  file_path: string;
  category: string;
  duration_seconds: number | null;
}

interface MusicContextType {
  isPlaying: boolean;
  currentTrack: Track | null;
  tracks: Track[];
  volume: number;
  currentTime: number;
  duration: number;
  analyserNode: AnalyserNode | null;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  next: () => void;
  previous: () => void;
  setVolume: (v: number) => void;
  seekTo: (t: number) => void;
  selectTrack: (track: Track) => void;
}

const MusicContext = createContext<MusicContextType | null>(null);

export function useMusic() {
  const ctx = useContext(MusicContext);
  if (!ctx) throw new Error('useMusic must be used within MusicProvider');
  return ctx;
}

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(() => {
    const saved = localStorage.getItem('nexus-volume');
    return saved ? parseFloat(saved) : 0.5;
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analyserNode, setAnalyserNode] = useState<AnalyserNode | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Fetch tracks from database
  useEffect(() => {
    const fetchTracks = async () => {
      const { data } = await supabase
        .from('music_tracks')
        .select('*')
        .order('sort_order', { ascending: true });
      if (data && data.length > 0) {
        setTracks(data);
        const savedTrackId = localStorage.getItem('nexus-current-track');
        const savedTrack = data.find((t) => t.id === savedTrackId);
        setCurrentTrack(savedTrack || data[0]);
      }
    };
    fetchTracks();
  }, []);

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }
    const audio = audioRef.current;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onDurationChange = () => setDuration(audio.duration || 0);
    const onEnded = () => next();

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  // Setup Web Audio API analyser
  const setupAnalyser = useCallback(() => {
    if (!audioRef.current || audioContextRef.current) return;
    try {
      const ctx = new AudioContext();
      const source = ctx.createMediaElementSource(audioRef.current);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyser.connect(ctx.destination);
      audioContextRef.current = ctx;
      sourceRef.current = source;
      setAnalyserNode(analyser);
    } catch (e) {
      console.warn('Web Audio API not available:', e);
    }
  }, []);

  // Load track when currentTrack changes
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;
    const audio = audioRef.current;
    audio.src = currentTrack.file_path;
    audio.load();
    localStorage.setItem('nexus-current-track', currentTrack.id);
    if (isPlaying) {
      audio.play().catch(() => {});
    }
  }, [currentTrack]);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
    localStorage.setItem('nexus-volume', String(volume));
  }, [volume]);

  const play = useCallback(() => {
    if (!audioRef.current || !currentTrack) return;
    setupAnalyser();
    if (audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
    audioRef.current.play().catch(() => {});
    setIsPlaying(true);
  }, [currentTrack, setupAnalyser]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const next = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    setCurrentTrack(tracks[(idx + 1) % tracks.length]);
  }, [tracks, currentTrack]);

  const previous = useCallback(() => {
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === currentTrack?.id);
    setCurrentTrack(tracks[(idx - 1 + tracks.length) % tracks.length]);
  }, [tracks, currentTrack]);

  const setVolume = useCallback((v: number) => setVolumeState(v), []);

  const seekTo = useCallback((t: number) => {
    if (audioRef.current) audioRef.current.currentTime = t;
  }, []);

  const selectTrack = useCallback(
    (track: Track) => {
      setCurrentTrack(track);
      setIsPlaying(true);
      setTimeout(() => {
        setupAnalyser();
        audioRef.current?.play().catch(() => {});
      }, 100);
    },
    [setupAnalyser]
  );

  const value = useMemo(
    () => ({
      isPlaying,
      currentTrack,
      tracks,
      volume,
      currentTime,
      duration,
      analyserNode,
      play,
      pause,
      toggle,
      next,
      previous,
      setVolume,
      seekTo,
      selectTrack,
    }),
    [isPlaying, currentTrack, tracks, volume, currentTime, duration, analyserNode, play, pause, toggle, next, previous, setVolume, seekTo, selectTrack]
  );

  return <MusicContext.Provider value={value}>{children}</MusicContext.Provider>;
}

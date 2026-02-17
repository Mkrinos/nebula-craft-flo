import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { VisualizerMode } from '@/contexts/MusicContext';

interface AudioVisualizerProps {
  audioRef: React.RefObject<HTMLAudioElement>;
  isPlaying: boolean;
  mode?: VisualizerMode;
  barCount?: number;
  className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioRef,
  isPlaying,
  mode = 'bars',
  barCount = 12,
  className,
}) => {
  const [bars, setBars] = useState<number[]>(new Array(barCount).fill(0.2));
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isConnectedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initializeAudioContext = useCallback(() => {
    if (!audioRef.current || isConnectedRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;

      audioContextRef.current = new AudioContextClass();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.8;

      sourceRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      sourceRef.current.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
      
      isConnectedRef.current = true;
    } catch (error) {
      console.warn('Audio visualizer initialization failed:', error);
    }
  }, [audioRef]);

  const animate = useCallback(() => {
    if (!analyserRef.current || !isPlaying) {
      setBars(prev => prev.map((bar, i) => {
        const idleHeight = 0.15 + Math.sin(Date.now() / 500 + i * 0.5) * 0.1;
        return bar + (idleHeight - bar) * 0.1;
      }));
      animationFrameRef.current = requestAnimationFrame(animate);
      return;
    }

    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    analyserRef.current.getByteFrequencyData(dataArray);

    const newBars: number[] = [];
    const step = Math.floor(bufferLength / barCount);
    
    for (let i = 0; i < barCount; i++) {
      const start = i * step;
      let sum = 0;
      for (let j = start; j < start + step && j < bufferLength; j++) {
        sum += dataArray[j];
      }
      const average = sum / step;
      const height = Math.max(0.15, average / 255);
      newBars.push(height);
    }

    setBars(newBars);

    // Draw canvas-based visualizers
    if (canvasRef.current && (mode === 'wave' || mode === 'circular')) {
      drawCanvas(dataArray, bufferLength);
    }

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [isPlaying, barCount, mode]);

  const drawCanvas = (dataArray: Uint8Array, bufferLength: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);

    if (mode === 'wave') {
      drawWave(ctx, dataArray, bufferLength, width, height);
    } else if (mode === 'circular') {
      drawCircular(ctx, dataArray, bufferLength, width, height);
    }
  };

  const drawWave = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    bufferLength: number,
    width: number,
    height: number
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, 'hsl(270, 100%, 60%)');
    gradient.addColorStop(0.5, 'hsl(280, 100%, 70%)');
    gradient.addColorStop(1, 'hsl(190, 100%, 60%)');

    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const sliceWidth = width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 255;
      const y = (1 - v) * height * 0.8 + height * 0.1;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
      x += sliceWidth;
    }

    ctx.stroke();

    // Add glow effect
    ctx.shadowColor = 'hsl(270, 100%, 60%)';
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    dataArray: Uint8Array,
    bufferLength: number,
    width: number,
    height: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) * 0.3;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2);
    gradient.addColorStop(0, 'hsl(270, 100%, 70%)');
    gradient.addColorStop(0.5, 'hsl(280, 100%, 60%)');
    gradient.addColorStop(1, 'hsl(190, 100%, 50%)');

    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;

    const step = Math.floor(bufferLength / 32);
    
    for (let i = 0; i < 32; i++) {
      const dataIndex = i * step;
      const v = dataArray[dataIndex] / 255;
      const barHeight = v * radius * 0.8 + radius * 0.2;
      
      const angle = (i / 32) * Math.PI * 2 - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius * 0.5;
      const y1 = centerY + Math.sin(angle) * radius * 0.5;
      const x2 = centerX + Math.cos(angle) * barHeight;
      const y2 = centerY + Math.sin(angle) * barHeight;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Inner circle glow
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius * 0.4, 0, Math.PI * 2);
    ctx.strokeStyle = 'hsl(270, 100%, 60%)';
    ctx.shadowColor = 'hsl(270, 100%, 60%)';
    ctx.shadowBlur = 15;
    ctx.stroke();
    ctx.shadowBlur = 0;
  };

  useEffect(() => {
    if (isPlaying && audioRef.current && !isConnectedRef.current) {
      initializeAudioContext();
    }
  }, [isPlaying, audioRef, initializeAudioContext]);

  useEffect(() => {
    if (isPlaying && audioContextRef.current?.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, [isPlaying]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Bars mode
  if (mode === 'bars') {
    return (
      <div className={cn("flex items-end justify-center gap-0.5 h-full", className)}>
        {bars.map((height, index) => (
          <motion.div
            key={index}
            className={cn(
              "w-1 rounded-full",
              isPlaying 
                ? "bg-gradient-to-t from-primary via-violet-500 to-cyan-400" 
                : "bg-primary/40"
            )}
            animate={{
              height: `${height * 100}%`,
              opacity: isPlaying ? 0.8 + height * 0.2 : 0.5,
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              mass: 0.5,
            }}
            style={{
              boxShadow: isPlaying && height > 0.5 
                ? '0 0 8px hsl(var(--primary) / 0.5)' 
                : 'none',
            }}
          />
        ))}
      </div>
    );
  }

  // Wave and Circular modes use canvas
  return (
    <canvas
      ref={canvasRef}
      width={200}
      height={80}
      className={cn("w-full h-full", className)}
      style={{ imageRendering: 'crisp-edges' }}
    />
  );
};

// Fallback animated visualizer when Web Audio API is not available
export const AnimatedVisualizer: React.FC<{
  isPlaying: boolean;
  mode?: VisualizerMode;
  barCount?: number;
  className?: string;
}> = ({ isPlaying, mode = 'bars', barCount = 12, className }) => {
  if (mode === 'circular') {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <motion.div
          className="w-8 h-8 rounded-full border-2 border-primary/60"
          animate={isPlaying ? {
            scale: [1, 1.2, 1],
            opacity: [0.6, 1, 0.6],
            borderWidth: ['2px', '3px', '2px'],
          } : {
            scale: 1,
            opacity: 0.4,
          }}
          transition={isPlaying ? {
            duration: 1,
            repeat: Infinity,
            ease: 'easeInOut',
          } : { duration: 0.3 }}
        >
          <motion.div
            className="w-full h-full rounded-full border border-violet-500/40"
            animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
            transition={isPlaying ? { duration: 3, repeat: Infinity, ease: 'linear' } : {}}
          />
        </motion.div>
      </div>
    );
  }

  if (mode === 'wave') {
    return (
      <div className={cn("flex items-center justify-center gap-1 h-full", className)}>
        {Array.from({ length: 20 }).map((_, index) => (
          <motion.div
            key={index}
            className="w-0.5 bg-gradient-to-t from-primary to-cyan-400"
            animate={isPlaying ? {
              height: ['20%', `${30 + Math.sin(index * 0.5) * 40}%`, '20%'],
              opacity: [0.4, 0.8, 0.4],
            } : {
              height: '15%',
              opacity: 0.3,
            }}
            transition={isPlaying ? {
              duration: 0.8 + Math.sin(index) * 0.3,
              repeat: Infinity,
              delay: index * 0.02,
              ease: 'easeInOut',
            } : { duration: 0.3 }}
          />
        ))}
      </div>
    );
  }

  // Default bars mode
  return (
    <div className={cn("flex items-end justify-center gap-0.5 h-full", className)}>
      {Array.from({ length: barCount }).map((_, index) => (
        <motion.div
          key={index}
          className={cn(
            "w-1 rounded-full",
            isPlaying 
              ? "bg-gradient-to-t from-primary via-violet-500 to-cyan-400" 
              : "bg-primary/40"
          )}
          animate={isPlaying ? {
            height: ['30%', `${40 + Math.random() * 60}%`, '30%'],
            opacity: [0.6, 1, 0.6],
          } : {
            height: '20%',
            opacity: 0.4,
          }}
          transition={isPlaying ? {
            duration: 0.4 + Math.random() * 0.3,
            repeat: Infinity,
            repeatType: 'reverse',
            delay: index * 0.05,
            ease: 'easeInOut',
          } : {
            duration: 0.3,
          }}
        />
      ))}
    </div>
  );
};

// Mode toggle button component
export const VisualizerModeToggle: React.FC<{
  mode: VisualizerMode;
  onModeChange: (mode: VisualizerMode) => void;
  className?: string;
}> = ({ mode, onModeChange, className }) => {
  const modes: { id: VisualizerMode; icon: string; label: string }[] = [
    { id: 'bars', icon: '▮▮▮', label: 'Bars' },
    { id: 'wave', icon: '〜', label: 'Wave' },
    { id: 'circular', icon: '◎', label: 'Circular' },
  ];

  const currentIndex = modes.findIndex(m => m.id === mode);
  const nextMode = modes[(currentIndex + 1) % modes.length];

  return (
    <button
      onClick={() => onModeChange(nextMode.id)}
      className={cn(
        "p-1.5 rounded-md text-xs font-medium transition-colors",
        "text-muted-foreground hover:text-foreground hover:bg-muted/50",
        className
      )}
      title={`Switch to ${nextMode.label} visualizer`}
    >
      <span className="text-sm">{modes.find(m => m.id === mode)?.icon}</span>
    </button>
  );
};

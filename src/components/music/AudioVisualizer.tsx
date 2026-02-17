import { useEffect, useRef, useState } from 'react';

type VisualizerMode = 'bars' | 'wave' | 'circular';

interface AudioVisualizerProps {
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  mode?: VisualizerMode;
  className?: string;
}

export function AudioVisualizer({
  analyserNode,
  isPlaying,
  mode = 'bars',
  className = '',
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      if (analyserNode && isPlaying) {
        const bufferLength = analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserNode.getByteFrequencyData(dataArray);

        if (mode === 'bars') {
          const barCount = 16;
          const barWidth = w / barCount - 2;
          for (let i = 0; i < barCount; i++) {
            const idx = Math.floor((i / barCount) * bufferLength);
            const val = dataArray[idx] / 255;
            const barH = val * h * 0.9;
            const hue = 263 + (i / barCount) * 60;
            ctx.fillStyle = `hsla(${hue}, 100%, 65%, 0.8)`;
            ctx.fillRect(i * (barWidth + 2), h - barH, barWidth, barH);
          }
        } else if (mode === 'wave') {
          ctx.beginPath();
          ctx.strokeStyle = 'hsla(263, 100%, 65%, 0.8)';
          ctx.lineWidth = 2;
          const sliceWidth = w / bufferLength;
          let x = 0;
          for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 255;
            const y = h - v * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
          }
          ctx.stroke();
        } else if (mode === 'circular') {
          const cx = w / 2;
          const cy = h / 2;
          const radius = Math.min(w, h) * 0.35;
          const points = 32;
          ctx.beginPath();
          for (let i = 0; i <= points; i++) {
            const idx = Math.floor((i / points) * bufferLength);
            const val = dataArray[idx] / 255;
            const angle = (i / points) * Math.PI * 2 - Math.PI / 2;
            const r = radius + val * radius * 0.5;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.strokeStyle = 'hsla(190, 100%, 50%, 0.7)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.fillStyle = 'hsla(263, 100%, 65%, 0.1)';
          ctx.fill();
        }
      } else {
        // Idle animation
        const barCount = 16;
        const barWidth = w / barCount - 2;
        for (let i = 0; i < barCount; i++) {
          const val = Math.sin(Date.now() / 1000 + i * 0.5) * 0.15 + 0.15;
          const barH = val * h;
          ctx.fillStyle = 'hsla(263, 100%, 65%, 0.3)';
          ctx.fillRect(i * (barWidth + 2), h - barH, barWidth, barH);
        }
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [analyserNode, isPlaying, mode]);

  return (
    <canvas
      ref={canvasRef}
      width={160}
      height={32}
      className={`${className}`}
    />
  );
}

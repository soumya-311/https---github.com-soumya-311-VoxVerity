
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  stream?: MediaStream | null;
  audioElement?: HTMLAudioElement | null;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, audioElement, isActive }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const audioCtxRef = useRef<AudioContext>();
  const analyserRef = useRef<AnalyserNode>();

  useEffect(() => {
    if (!isActive || (!stream && !audioElement)) return;

    const initAudio = () => {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;

      let source;
      if (stream) {
        source = audioCtxRef.current.createMediaStreamSource(stream);
      } else if (audioElement) {
        source = audioCtxRef.current.createMediaElementSource(audioElement);
      }

      if (source && analyserRef.current) {
        source.connect(analyserRef.current);
        if (audioElement) analyserRef.current.connect(audioCtxRef.current.destination);
      }
    };

    initAudio();

    const draw = () => {
      if (!canvasRef.current || !analyserRef.current) return;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height;
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, 0);
        gradient.addColorStop(0, '#18181b');
        gradient.addColorStop(0.5, '#3b82f6');
        gradient.addColorStop(1, '#60a5fa');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [isActive, stream, audioElement]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-32 bg-zinc-900/50 rounded-lg border border-zinc-800"
      width={600}
      height={128}
    />
  );
};

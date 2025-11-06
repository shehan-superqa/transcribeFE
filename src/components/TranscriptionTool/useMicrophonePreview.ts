import { useEffect, useRef } from 'react';
import { drawWaveform } from './waveformUtils';

export const useMicrophonePreview = (
  mode: string,
  isRecording: boolean,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const previewStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let previewActive = false;
    let previewAudioContext: AudioContext | null = null;
    let previewAnalyser: AnalyserNode | null = null;
    let previewAnimationFrame: number | null = null;

    const startPreview = async () => {
      if (previewActive || isRecording || mode !== 'recording') return;
      
      try {
        previewActive = true;
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        previewStreamRef.current = stream;

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        previewAudioContext = audioContext;
        previewAnalyser = analyser;

        const drawPreview = () => {
          const canvas = canvasRef.current;
          
          if (!canvas || !previewAnalyser || isRecording || mode !== 'recording' || !previewActive) {
            if (previewAnimationFrame) {
              cancelAnimationFrame(previewAnimationFrame);
              previewAnimationFrame = null;
            }
            return;
          }

          previewAnimationFrame = requestAnimationFrame(drawPreview);

          const canvasCtx = canvas.getContext('2d');
          if (!canvasCtx) return;

          const rect = canvas.getBoundingClientRect();
          if (canvas.width !== rect.width) {
            canvas.width = rect.width;
          }
          if (canvas.height !== 120) {
            canvas.height = 120;
          }

          const bufferLength = previewAnalyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          previewAnalyser.getByteTimeDomainData(dataArray);

          const rms = Math.sqrt(
            Array.from(dataArray).reduce((sum, val) => {
              const normalized = (val - 128) / 128.0;
              return sum + normalized * normalized;
            }, 0) / bufferLength
          );

          const audioThreshold = 0.05;
          const hasAudio = rms > audioThreshold;

          canvasCtx.fillStyle = '#0a0a0a';
          canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

          // Always draw the waveform
          const sliceWidth = (canvas.width * 1.0) / bufferLength;
          const centerY = canvas.height / 2;
          const maxAmplitude = centerY * 0.85;

          // Use different opacity and colors based on audio level
          const waveformOpacity = hasAudio ? 1.0 : 0.3;
          const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(0.5, '#8b5cf6');
          gradient.addColorStop(1, '#06b6d4');

          canvasCtx.save();
          canvasCtx.globalAlpha = waveformOpacity;
          canvasCtx.strokeStyle = gradient;
          canvasCtx.lineWidth = 3;
          canvasCtx.lineCap = 'round';
          canvasCtx.lineJoin = 'round';
          canvasCtx.shadowBlur = hasAudio ? 20 : 5;
          canvasCtx.shadowColor = '#3b82f6';
          
          canvasCtx.beginPath();
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const v = (dataArray[i] - 128) / 128.0;
            const amplitude = v * maxAmplitude;
            const y = centerY + amplitude;

            if (i === 0) {
              canvasCtx.moveTo(x, y);
            } else {
              const prevX = x - sliceWidth;
              const prevV = (dataArray[Math.max(0, i - 1)] - 128) / 128.0;
              const prevY = centerY + (prevV * maxAmplitude);
              
              const cpX = (prevX + x) / 2;
              const cpY = (prevY + y) / 2;
              canvasCtx.quadraticCurveTo(cpX, cpY, x, y);
            }

            x += sliceWidth;
          }

          canvasCtx.stroke();
          canvasCtx.restore();

          // Overlay text when audio is below threshold
          if (!hasAudio) {
            // Draw semi-transparent background for text readability
            canvasCtx.fillStyle = 'rgba(10, 10, 10, 0.7)';
            canvasCtx.fillRect(0, centerY - 20, canvas.width, 40);
            
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            canvasCtx.font = '14px sans-serif';
            canvasCtx.textAlign = 'center';
            canvasCtx.fillText('Microphone Preview - Speak to test your mic', canvas.width / 2, centerY + 5);
          }
        };

        drawPreview();
      } catch (err) {
        console.error('Failed to start microphone preview:', err);
        previewActive = false;
      }
    };

    const stopPreview = () => {
      previewActive = false;
      
      if (previewAnimationFrame) {
        cancelAnimationFrame(previewAnimationFrame);
        previewAnimationFrame = null;
      }
      
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop());
        previewStreamRef.current = null;
      }
      
      if (previewAudioContext) {
        previewAudioContext.close();
        previewAudioContext = null;
      }
      
      previewAnalyser = null;

      // Clear preview canvas if not recording
      const canvas = canvasRef.current;
      if (canvas && !isRecording) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#0a0a0a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('Click "Start Recording" to begin', canvas.width / 2, canvas.height / 2);
        }
      }
    };

    if (mode === 'recording' && !isRecording) {
      startPreview();
    } else {
      stopPreview();
    }

    return () => {
      stopPreview();
    };
  }, [mode, isRecording, canvasRef]);

  return { previewStreamRef };
};


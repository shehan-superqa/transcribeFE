import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { convertYouTubeToM4A, isValidYouTubeUrl, ConversionProgress } from '../lib/youtubeConverter';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

type InputMode = 'file' | 'youtube' | 'recording';

interface TranscriptionToolProps {
  onTranscriptionStart?: () => void;
}

export default function TranscriptionTool({ onTranscriptionStart }: TranscriptionToolProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<InputMode>('file');
  const [file, setFile] = useState<File | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [loading, setLoading] = useState(false);
  const [energyPoints, setEnergyPoints] = useState(0);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const [recordings, setRecordings] = useState<Array<{ id: string; blob: Blob; url: string; wavesurfer: WaveSurfer | null }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const totalWaveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<RecordPlugin | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewStreamRef = useRef<MediaStream | null>(null); // For microphone preview
  const recordingsContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (user) {
      fetchEnergyPoints();
    }
  }, [user]);


  // Start microphone preview when recording mode is selected
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
  }, [mode, isRecording]);

  // Handle canvas resize (for real-time preview only)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width) {
        canvas.width = rect.width;
      }
      if (canvas.height !== 120) {
        canvas.height = 120;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Initialize wavesurfer when recording mode is selected
  useEffect(() => {
    if (mode === 'recording' && totalWaveformRef.current && !wavesurferRef.current) {
      // Small delay to ensure DOM is ready
      const initWavesurfer = () => {
        if (!totalWaveformRef.current || wavesurferRef.current) return;
        
        const wavesurfer = WaveSurfer.create({
          container: totalWaveformRef.current,
          waveColor: '#3b82f6',
          progressColor: '#8b5cf6',
          cursorColor: '#06b6d4',
          barWidth: 2,
          barRadius: 1,
          height: 80,
          normalize: true,
          interact: false, // Disable interaction during recording
        });

        // Initialize Record plugin with scrolling waveform
        const record = wavesurfer.registerPlugin(
          RecordPlugin.create({
            renderRecordedAudio: false,
            scrollingWaveform: true, // Enable scrolling waveform
            continuousWaveform: false, // Disable continuous waveform
          })
        );
        
        recordRef.current = record;
        wavesurferRef.current = wavesurfer;

        // Handle recording events
        record.on('record-progress', (time: number) => {
          setRecordingTime(Math.floor(time / 1000)); // Convert milliseconds to seconds
        });

        // Handle recording end - create a new waveform for the recorded audio
        record.on('record-end', (blob: Blob) => {
          // Store the recorded blob for transcription
          audioChunksRef.current = [blob];
          
          // Create a URL for the recorded audio
          const recordedUrl = URL.createObjectURL(blob);
          const recordingId = `recording-${Date.now()}`;
          
          // Store in state first - this will trigger the container to render
          setRecordings((prev) => [
            ...prev,
            {
              id: recordingId,
              blob,
              url: recordedUrl,
              wavesurfer: null,
            },
          ]);
        });
      };

      // Try immediately, then with a small delay if needed
      if (totalWaveformRef.current) {
        initWavesurfer();
      } else {
        setTimeout(initWavesurfer, 100);
      }

      return () => {
        if (wavesurferRef.current) {
          wavesurferRef.current.destroy();
          wavesurferRef.current = null;
        }
        recordRef.current = null;
      };
    } else if (mode !== 'recording' && wavesurferRef.current) {
      // Clean up when switching away from recording mode
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
      recordRef.current = null;
    }
  }, [mode]);

  // Create waveforms for new recordings
  useEffect(() => {
    if (recordings.length === 0 || !recordingsContainerRef.current) return;

    // Use setTimeout to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      recordings.forEach((recording) => {
        // Skip if waveform already created
        if (recording.wavesurfer) return;

        // Find the container element for this recording
        const containerElement = document.getElementById(recording.id);
        if (!containerElement) {
          console.warn('Container element not found for recording:', recording.id);
          return;
        }

        const waveformDiv = containerElement.querySelector('[data-waveform]') as HTMLDivElement;
        if (!waveformDiv) {
          console.warn('Waveform div not found for recording:', recording.id);
          return;
        }

        // Create wavesurfer instance
        let recordingWaveform: WaveSurfer | null = null;
        try {
          // Verify the URL is valid
          if (!recording.url || !recording.url.startsWith('blob:')) {
            console.warn('Invalid recording URL:', recording.url);
            return;
          }

          recordingWaveform = WaveSurfer.create({
            container: waveformDiv,
            waveColor: 'rgb(200, 100, 0)',
            progressColor: 'rgb(100, 50, 0)',
            url: recording.url,
            height: 60,
            barWidth: 2,
            normalize: true,
            backend: 'WebAudio', // Explicitly use WebAudio backend
          });

          // Handle errors during loading
          recordingWaveform.on('error', (error) => {
            console.warn('Waveform loading error:', error);
          });

          // Log when waveform is ready
          recordingWaveform.on('ready', () => {
            console.log('Waveform ready for recording:', recording.id);
          });

          // Log when waveform starts loading
          recordingWaveform.on('loading', (progress) => {
            console.log('Waveform loading progress:', progress, 'for recording:', recording.id);
          });
        } catch (error) {
          console.warn('Error creating wavesurfer:', error);
          return; // Skip this recording if we can't create the waveform
        }

        if (!recordingWaveform) return;

        // Set up play button handlers
        const playButton = containerElement.querySelector('[data-play-button]') as HTMLButtonElement;
        if (playButton && recordingWaveform) {
          playButton.onclick = () => {
            if (recordingWaveform) {
              recordingWaveform.playPause();
            }
          };

          recordingWaveform.on('pause', () => {
            if (playButton) {
              playButton.textContent = 'Play';
            }
          });
          recordingWaveform.on('play', () => {
            if (playButton) {
              playButton.textContent = 'Pause';
            }
          });
        }

        // Update state with wavesurfer instance
        setRecordings((prev) => {
          const updated = [...prev];
          const index = updated.findIndex((r) => r.id === recording.id);
          if (index !== -1) {
            updated[index] = { ...updated[index], wavesurfer: recordingWaveform };
          }
          return updated;
        });
      });
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timeoutId);
  }, [recordings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (previewStreamRef.current) {
        previewStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {
          // Ignore errors when closing AudioContext
        });
      }
      // Clean up all recording waveforms
      recordings.forEach((recording) => {
        if (recording.wavesurfer) {
          try {
            recording.wavesurfer.destroy();
          } catch (error) {
            // Ignore errors when destroying wavesurfer (e.g., if already destroyed)
            console.warn('Error destroying wavesurfer:', error);
          }
        }
        if (recording.url) {
          URL.revokeObjectURL(recording.url);
        }
      });
    };
  }, [recordings]);

  const fetchEnergyPoints = async () => {
    if (!user) return;

    // If Supabase is not configured, set default energy points
    if (!supabase) {
      setEnergyPoints(100); // Default free tier points
      return;
    }

    // Note: JWT auth uses user_id (email) instead of UUID id
    // Supabase profiles table expects UUID from auth.users
    // Since we're using JWT auth, we need to handle this differently
    // For now, try to find by email, but this may not work if email column doesn't exist
    try {
    const { data } = await supabase
      .from('profiles')
      .select('energy_points')
        .eq('email', user.user_id) // Try email first
      .maybeSingle();

    if (data) {
      setEnergyPoints(data.energy_points);
        return;
      }
    } catch (err) {
      // If email column doesn't exist or query fails, use default
      console.warn('Could not fetch energy points from Supabase:', err);
    }
    
    // Fallback: use default energy points if Supabase query fails
    setEnergyPoints(100);
  };


  const drawWaveform = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    
    if (!canvas || !analyser) return;

    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    // Ensure canvas is properly sized
    const rect = canvas.getBoundingClientRect();
    if (canvas.width !== rect.width) {
      canvas.width = rect.width;
    }
    if (canvas.height !== 120) {
      canvas.height = 120;
    }

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Check if we should continue drawing
      if (!analyserRef.current || !canvasRef.current) {
        return;
      }

      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      // Calculate RMS to detect if there's actual audio
      const rms = Math.sqrt(
        Array.from(dataArray).reduce((sum, val) => {
          const normalized = (val - 128) / 128.0;
          return sum + normalized * normalized;
        }, 0) / bufferLength
      );

      const audioThreshold = 0.05;
      const hasAudio = rms > audioThreshold;

      // Clear canvas with dark background
      canvasCtx.fillStyle = '#0a0a0a';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      const sliceWidth = (canvas.width * 1.0) / bufferLength;
      const centerY = canvas.height / 2;
      const maxAmplitude = centerY * 0.85;

      // Use different opacity based on audio level
      const waveformOpacity = hasAudio ? 1.0 : 0.3;

      // Create gradient for the waveform
      const gradient = canvasCtx.createLinearGradient(0, 0, canvas.width, 0);
      gradient.addColorStop(0, '#3b82f6'); // Blue
      gradient.addColorStop(0.5, '#8b5cf6'); // Purple
      gradient.addColorStop(1, '#06b6d4'); // Cyan

      // Draw multiple layers for depth effect
      const layers = [
        { opacity: hasAudio ? 0.3 : 0.1, lineWidth: 8, offset: 0 },
        { opacity: hasAudio ? 0.5 : 0.15, lineWidth: 6, offset: 0 },
        { opacity: hasAudio ? 0.7 : 0.2, lineWidth: 4, offset: 0 },
        { opacity: waveformOpacity, lineWidth: 3, offset: 0 },
      ];

      layers.forEach((layer, layerIndex) => {
        canvasCtx.save();
        canvasCtx.globalAlpha = layer.opacity;
        canvasCtx.strokeStyle = gradient;
        canvasCtx.lineWidth = layer.lineWidth;
        canvasCtx.lineCap = 'round';
        canvasCtx.lineJoin = 'round';
        
        // Add glow effect using shadow (reduced when no audio)
        canvasCtx.shadowBlur = hasAudio ? 15 : 5;
        canvasCtx.shadowColor = layerIndex === layers.length - 1 ? '#3b82f6' : '#8b5cf6';
        
        canvasCtx.beginPath();
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = (dataArray[i] - 128) / 128.0;
          const amplitude = v * maxAmplitude;
          
          // Apply smoothing for more fluid curves
          let y = centerY + amplitude;
          
          // Add slight offset for layered effect
          if (layerIndex > 0) {
            y += Math.sin(i * 0.1) * 2 * layerIndex;
          }

          if (i === 0) {
            canvasCtx.moveTo(x, y);
          } else {
            // Use quadratic curves for smoother lines
            const prevX = x - sliceWidth;
            const prevV = (dataArray[Math.max(0, i - 1)] - 128) / 128.0;
            let prevY = centerY + (prevV * maxAmplitude);
            if (layerIndex > 0) {
              prevY += Math.sin((i - 1) * 0.1) * 2 * layerIndex;
            }
            
            const cpX = (prevX + x) / 2;
            const cpY = (prevY + y) / 2;
            canvasCtx.quadraticCurveTo(cpX, cpY, x, y);
          }

          x += sliceWidth;
        }

        canvasCtx.stroke();
        canvasCtx.restore();
      });

      // Draw main waveform with enhanced glow
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
          // Smooth curves using quadratic bezier
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

      // Add subtle particles/sparkles for extra visual appeal (only when audio is present)
      if (hasAudio) {
        canvasCtx.save();
        canvasCtx.globalAlpha = 0.6;
        for (let i = 0; i < bufferLength; i += 10) {
          const v = (dataArray[i] - 128) / 128.0;
          if (Math.abs(v) > 0.3) {
            const x = (i / bufferLength) * canvas.width;
            const y = centerY + (v * maxAmplitude);
            
            const sparkleGradient = canvasCtx.createRadialGradient(x, y, 0, x, y, 3);
            sparkleGradient.addColorStop(0, '#ffffff');
            sparkleGradient.addColorStop(1, 'transparent');
            
            canvasCtx.fillStyle = sparkleGradient;
            canvasCtx.fillRect(x - 3, y - 3, 6, 6);
          }
        }
        canvasCtx.restore();
      }

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

    draw();
  };


  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up Web Audio API for waveform visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start wavesurfer recording
      if (recordRef.current) {
        recordRef.current.startRecording();
      }

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      // Start drawing real-time waveform
      drawWaveform();
    } catch (err: any) {
      setError('Could not access microphone. Please check permissions.');
      console.error('Recording error:', err);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      // Stop wavesurfer recording first
      // The blob will be available via the 'record-end' event handler we set up
      if (recordRef.current) {
        recordRef.current.stopRecording();
      }
      
      mediaRecorderRef.current.stop();
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

        // Clean up audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {
            // Ignore errors when closing AudioContext
          });
          audioContextRef.current = null;
        }
      analyserRef.current = null;

      // Stop animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Clear real-time canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to use transcription');
      return;
    }

    if (energyPoints < 10) {
      setError('Not enough energy points. Please upgrade your plan.');
      return;
    }

    if (mode === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (mode === 'youtube' && !isValidYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (mode === 'recording' && audioChunksRef.current.length === 0) {
      setError('Please record audio first');
      return;
    }

    setLoading(true);
    setError('');
    onTranscriptionStart?.();

    try {
      // Check if Supabase is configured
      if (!supabase) {
        setError('Transcription service is not configured. Please configure Supabase or integrate with transcription API.');
        setLoading(false);
        return;
      }

      let inputSource = '';
      let inputType: InputMode = mode;
      let fileToUpload: File | null = null;

      // Handle YouTube conversion
      if (mode === 'youtube' && youtubeUrl) {
        try {
          setConverting(true);
          setConversionProgress({ progress: 0, stage: 'loading' });
          
          // Convert YouTube video to M4A
          fileToUpload = await convertYouTubeToM4A(youtubeUrl, (progress) => {
            setConversionProgress(progress);
          });
          
          setConverting(false);
          setConversionProgress(null);
          
          // Use the converted file for transcription
        inputSource = youtubeUrl;
          inputType = 'file'; // Treat as file after conversion
        } catch (conversionError: any) {
          setConverting(false);
          setConversionProgress(null);
          setError(conversionError.message || 'Failed to convert YouTube video. Please check your backend proxy configuration.');
          setLoading(false);
          return;
        }
      } else if (mode === 'file' && file) {
        fileToUpload = file;
        inputSource = file.name;
      } else if (mode === 'recording') {
        // For recording, create file from audio chunks
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          fileToUpload = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        }
        inputSource = 'live_recording';
      }

      const energyCost = 10;

      // Note: This Supabase integration expects UUID user_id
      // JWT auth uses email as user_id, so this may need backend API integration instead
      if (!supabase) {
        setError('Transcription service requires Supabase configuration or transcription API integration.');
        setLoading(false);
        return;
      }

      // For JWT users, we need to find or create a profile by email
      // This is a workaround - ideally use transcription API instead
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', user.user_id)
        .maybeSingle();

      let profileId = profile?.id;
      
      // If no profile exists, create one (this is a workaround)
      if (!profileId) {
        // Generate a UUID for the profile (this is not ideal but works for now)
        const uuid = crypto.randomUUID();
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: uuid,
            email: user.user_id,
            full_name: user.name,
            energy_points: 100,
          })
          .select('id')
          .single();
        
        if (createError) {
          throw new Error(`Failed to create profile: ${createError.message}`);
        }
        profileId = newProfile.id;
      }

      const { error: insertError } = await supabase
        .from('transcriptions')
        .insert({
          user_id: profileId,
          input_type: inputType,
          input_source: inputSource,
          energy_cost: energyCost,
          status: 'processing',
        });

      if (insertError) throw insertError;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ energy_points: energyPoints - energyCost })
        .eq('id', profileId);

      if (updateError) throw updateError;

      setEnergyPoints(energyPoints - energyCost);

      setFile(null);
      setYoutubeUrl('');
      setRecordingTime(0);
      audioChunksRef.current = [];

      setTimeout(async () => {
        if (!supabase) return;
        
        // Get profile ID first
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', user.user_id)
          .maybeSingle();

        if (!profile) return;

        const { data: transcriptions } = await supabase
          .from('transcriptions')
          .select('id')
          .eq('user_id', profile.id)
          .eq('status', 'processing')
          .order('created_at', { ascending: false })
          .limit(1);

        if (transcriptions && transcriptions.length > 0) {
          await supabase
            .from('transcriptions')
            .update({
              status: 'completed',
              transcription_text: 'This is a sample transcription. In production, this would be processed by a transcription service.',
              duration_seconds: Math.floor(Math.random() * 180) + 30,
            })
            .eq('id', transcriptions[0].id);
        }
      }, 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.energyBadge}>
        <span style={styles.energyIcon}>⚡</span>
        <span style={styles.energyText}>{energyPoints} Energy Points</span>
      </div>

      <div style={styles.modeSelector}>
        <button
          style={{ ...styles.modeButton, ...(mode === 'file' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('file')}
          type="button"
        >
          Upload File
        </button>
        <button
          style={{ ...styles.modeButton, ...(mode === 'youtube' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('youtube')}
          type="button"
        >
          YouTube Link
        </button>
        <button
          style={{ ...styles.modeButton, ...(mode === 'recording' ? styles.modeButtonActive : {}) }}
          onClick={() => setMode('recording')}
          type="button"
        >
          Record Audio
        </button>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        {mode === 'file' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <input
                type="file"
                accept="audio/*,video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={styles.fileInput}
              />
              <div style={styles.fileUploadBox}>
                <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={styles.uploadIcon}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p style={styles.uploadText}>{file ? file.name : 'Click to upload or drag and drop'}</p>
                <p style={styles.uploadSubtext}>MP3, WAV, M4A, or video files</p>
              </div>
            </label>
          </div>
        )}

        {mode === 'youtube' && (
          <div style={styles.inputGroup}>
            <label style={styles.label}>YouTube URL</label>
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              style={styles.input}
              disabled={converting}
            />
            {converting && conversionProgress && (
              <div style={styles.conversionProgress}>
                <div style={styles.progressBarContainer}>
                  <div 
                    style={{
                      ...styles.progressBar,
                      width: `${conversionProgress.progress}%`,
                    }}
                  />
                </div>
                <div style={styles.progressText}>
                  {conversionProgress.stage === 'loading' && 'Loading FFmpeg...'}
                  {conversionProgress.stage === 'fetching' && 'Fetching video...'}
                  {conversionProgress.stage === 'converting' && 'Converting to M4A...'}
                  {conversionProgress.stage === 'complete' && 'Conversion complete!'}
                  <span style={styles.progressPercent}>
                    {' '}({Math.round(conversionProgress.progress)}%)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'recording' && (
          <div style={styles.recordingSection}>
            <div style={styles.recordingDisplay}>
              <div style={{ ...styles.recordingIndicator, ...(isRecording ? styles.recordingIndicatorActive : {}) }}></div>
              <span style={styles.recordingTime}>{formatTime(recordingTime)}</span>
            </div>
            <div style={styles.waveformContainer}>
              <div style={styles.waveformLabel}>Total Waveform</div>
              <div
                ref={totalWaveformRef}
                style={styles.totalWaveformCanvas}
              />
            </div>
            <canvas
              ref={canvasRef}
              width={600}
              height={120}
              style={styles.waveformCanvas}
            />
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              style={{ ...styles.recordButton, ...(isRecording ? styles.recordButtonActive : {}) }}
            >
              {isRecording ? 'Stop Recording' : 'Start Recording'}
            </button>
            
            {/* Recordings list */}
            {recordings.length > 0 && (
              <div style={styles.recordingsContainer}>
                <div style={styles.recordingsTitle}>Recorded Audio ({recordings.length})</div>
                <div ref={recordingsContainerRef} style={styles.recordingsList}>
                  {recordings.map((recording) => (
                    <div key={recording.id} id={recording.id} style={styles.recordingItem}>
                      <div 
                        data-waveform 
                        style={{ 
                          marginBottom: '0.5rem', 
                          minHeight: '60px',
                          width: '100%',
                          backgroundColor: '#0a0a0a',
                          borderRadius: 'var(--border-radius-sm)',
                        }} 
                      />
                      <div style={styles.recordingControls}>
                        <button
                          data-play-button
                          style={styles.playButton}
                        >
                          Play
                        </button>
                        <a
                          href={recording.url}
                          download={`recording-${recording.id}.webm`}
                          style={styles.downloadLink}
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        <button
          type="submit"
          disabled={loading || converting || !user || energyPoints < 10}
          style={{
            ...styles.submitButton,
            ...(loading || converting || !user || energyPoints < 10 ? styles.submitButtonDisabled : {}),
          }}
        >
          {converting 
            ? 'Converting...' 
            : loading 
            ? 'Processing...' 
            : `Transcribe (10 points)`}
        </button>

        {!user && (
          <p style={styles.signInPrompt}>
            Please <a href="/login" style={styles.link}>sign in</a> to use transcription
          </p>
        )}
      </form>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-xl)',
    padding: '2rem',
    boxShadow: 'var(--shadow-lg)',
    maxWidth: '600px',
    margin: '0 auto',
  },
  energyBadge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: 'var(--color-gray-100)',
    borderRadius: 'var(--border-radius-lg)',
    marginBottom: '1.5rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  energyIcon: {
    fontSize: '1.5rem',
  },
  energyText: {
    fontSize: '1rem',
  },
  modeSelector: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    marginBottom: '2rem',
  },
  modeButton: {
    padding: '0.75rem 1rem',
    backgroundColor: 'var(--color-gray-100)',
    color: 'var(--color-gray-700)',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '0.875rem',
    transition: 'all var(--transition-fast)',
  },
  modeButtonActive: {
    backgroundColor: 'var(--color-primary)',
    color: 'white',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '2px solid var(--color-gray-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '1rem',
    transition: 'border-color var(--transition-fast)',
  },
  fileInput: {
    display: 'none',
  },
  fileUploadBox: {
    border: '2px dashed var(--color-gray-300)',
    borderRadius: 'var(--border-radius-lg)',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all var(--transition-fast)',
  },
  uploadIcon: {
    color: 'var(--color-gray-400)',
    margin: '0 auto 1rem',
  },
  uploadText: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
    marginBottom: '0.25rem',
  },
  uploadSubtext: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-500)',
  },
  recordingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '1.5rem',
    padding: '2rem',
  },
  recordingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  recordingIndicator: {
    width: '1rem',
    height: '1rem',
    borderRadius: '50%',
    backgroundColor: 'var(--color-gray-300)',
    transition: 'all var(--transition-fast)',
  },
  recordingIndicatorActive: {
    backgroundColor: 'var(--color-error)',
    animation: 'pulse 1.5s infinite',
  },
  recordingTime: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-gray-700)',
    fontVariantNumeric: 'tabular-nums',
  },
  waveformContainer: {
    width: '100%',
    marginBottom: '1rem',
  },
  waveformLabel: {
    fontSize: '0.75rem',
    color: 'var(--color-gray-600)',
    marginBottom: '0.5rem',
    textAlign: 'center' as const,
    fontWeight: 500,
  },
  totalWaveformCanvas: {
    width: '100%',
    maxWidth: '600px',
    height: '80px',
    backgroundColor: '#0a0a0a',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 0 15px rgba(59, 130, 246, 0.15)',
  },
  recordingsContainer: {
    width: '100%',
    maxWidth: '600px',
    marginTop: '2rem',
    padding: '1rem',
    backgroundColor: 'rgba(10, 10, 10, 0.3)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid rgba(59, 130, 246, 0.2)',
  },
  recordingsTitle: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
    marginBottom: '1rem',
    textAlign: 'center' as const,
  },
  recordingsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },
  recordingItem: {
    marginBottom: '1rem',
    padding: '1rem',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'rgba(10, 10, 10, 0.5)',
  },
  recordingControls: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
  },
  playButton: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
  },
  downloadLink: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--border-radius-md)',
    backgroundColor: 'var(--color-gray-200)',
    color: 'var(--color-gray-700)',
    textDecoration: 'none',
    display: 'inline-block',
  },
  waveformCanvas: {
    width: '100%',
    maxWidth: '600px',
    height: '120px',
    backgroundColor: '#0a0a0a',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)',
    marginBottom: '1rem',
  },
  recordButton: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all var(--transition-fast)',
  },
  recordButtonActive: {
    backgroundColor: 'var(--color-error)',
  },
  error: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    color: 'var(--color-error)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '0.875rem',
    border: '1px solid #fee2e2',
  },
  submitButton: {
    padding: '1rem 2rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    fontWeight: 600,
    fontSize: '1.125rem',
    transition: 'all var(--transition-fast)',
    marginTop: '0.5rem',
  },
  submitButtonDisabled: {
    backgroundColor: 'var(--color-gray-300)',
    cursor: 'not-allowed',
  },
  signInPrompt: {
    textAlign: 'center' as const,
    color: 'var(--color-gray-600)',
    fontSize: '0.875rem',
  },
  link: {
    color: 'var(--color-primary)',
    fontWeight: 600,
  },
  conversionProgress: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: 'var(--color-gray-50)',
    borderRadius: 'var(--border-radius-md)',
    border: '1px solid var(--color-gray-200)',
  },
  progressBarContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: 'var(--color-gray-200)',
    borderRadius: 'var(--border-radius-sm)',
    overflow: 'hidden',
    marginBottom: '0.5rem',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'var(--color-primary)',
    borderRadius: 'var(--border-radius-sm)',
    transition: 'width 0.3s ease',
    background: 'linear-gradient(90deg, var(--color-primary), #8b5cf6)',
  },
  progressText: {
    fontSize: '0.875rem',
    color: 'var(--color-gray-700)',
    fontWeight: 500,
    textAlign: 'center' as const,
  },
  progressPercent: {
    color: 'var(--color-gray-600)',
    fontWeight: 600,
  },
};

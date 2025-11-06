import { useState, useRef, useEffect } from 'react';
import WaveSurfer from 'wavesurfer.js';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';
import { Recording } from './types';
import { drawWaveform } from './waveformUtils';

export const useRecording = (
  mode: string,
  totalWaveformRef: React.RefObject<HTMLDivElement>,
  canvasRef: React.RefObject<HTMLCanvasElement>
) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<RecordPlugin | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize wavesurfer when recording mode is selected
  useEffect(() => {
    if (mode === 'recording' && totalWaveformRef.current && !wavesurferRef.current) {
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
          interact: false,
        });

        const record = wavesurfer.registerPlugin(
          RecordPlugin.create({
            renderRecordedAudio: false,
            scrollingWaveform: true,
            continuousWaveform: false,
          })
        );
        
        recordRef.current = record;
        wavesurferRef.current = wavesurfer;

        record.on('record-progress', (time: number) => {
          setRecordingTime(Math.floor(time / 1000));
        });

        record.on('record-end', (blob: Blob) => {
          audioChunksRef.current = [blob];
          const recordedUrl = URL.createObjectURL(blob);
          const recordingId = `recording-${Date.now()}`;
          
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
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
      recordRef.current = null;
    }
  }, [mode, totalWaveformRef]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

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

      if (recordRef.current) {
        recordRef.current.startRecording();
      }

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsPaused(false);
      drawWaveform(canvasRef.current, analyser, animationFrameRef);
    } catch (err: any) {
      console.error('Recording error:', err);
      throw new Error('Could not access microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    if (recordRef.current && isRecording && !isPaused) {
      recordRef.current.pauseRecording();
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.pause();
      }

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (recordRef.current && isRecording && isPaused) {
      recordRef.current.resumeRecording();
      
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }

      timerRef.current = window.setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      setIsPaused(false);
    }
  };

  const stopRecording = async () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordRef.current) {
        recordRef.current.stopRecording();
      }
      
      mediaRecorderRef.current.stop();
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      analyserRef.current = null;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      setIsRecording(false);
      setIsPaused(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

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
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  return {
    isRecording,
    isPaused,
    recordingTime,
    recordings,
    setRecordings,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    audioChunksRef,
  };
};


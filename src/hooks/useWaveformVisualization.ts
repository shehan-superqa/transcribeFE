/**
 * Hook for real-time waveform visualization using WaveSurfer.js with React wrapper
 * Uses @wavesurfer/react hook similar to the official example
 */

import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useWavesurfer } from '@wavesurfer/react';
import RecordPlugin from 'wavesurfer.js/dist/plugins/record.esm.js';

export interface UseWaveformVisualizationReturn {
  waveformRef: React.RefObject<HTMLDivElement>;
  audioLevel: number;
  startVisualization: (stream: MediaStream) => void;
  stopVisualization: () => void;
}

export function useWaveformVisualization(): UseWaveformVisualizationReturn {
  const waveformRef = useRef<HTMLDivElement>(null);
  const recordPluginRef = useRef<RecordPlugin | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<{ onDestroy: () => void; onEnd: () => void } | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  // Create RecordPlugin instance with smaller scrolling window
  const recordPlugin = useMemo(() => RecordPlugin.create({
    scrollingWaveform: true,
    scrollingWaveformWindow: 1, // Very small window (1 second) - shows minimal time at once
    continuousWaveform: true,
    renderRecordedAudio: false,
    mediaRecorderTimeslice: 50,
  }), []);

  // Use @wavesurfer/react hook - similar to the official example
  const { wavesurfer } = useWavesurfer({
    container: waveformRef,
    height: 200,
    waveColor: '#00c6ff',
    progressColor: '#00c6ff',
    cursorColor: '#00c6ff',
    barWidth: 1,
    barRadius: 0,
    barGap: 0,
    normalize: true,
    interact: false,
    fillParent: true,
    // Ensure the waveform fills the container properly
    minPxPerSec: 50, // Controls the zoom level - smaller value = more compressed
    plugins: useMemo(() => [recordPlugin], [recordPlugin]),
  });

  // Store record plugin reference
  useEffect(() => {
    if (recordPlugin && wavesurfer) {
      recordPluginRef.current = recordPlugin;
    }
  }, [recordPlugin, wavesurfer]);

  // Update audio level periodically
  useEffect(() => {
    if (!streamRef.current) return;

    const updateAudioLevel = () => {
      try {
        // Create analyser from the stream
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(streamRef.current!);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255);

        // Cleanup
        source.disconnect();
        analyser.disconnect();
        audioContext.close();
      } catch (error) {
        // Silently handle errors
      }
    };

    const levelInterval = setInterval(updateAudioLevel, 100);
    return () => clearInterval(levelInterval);
  }, [streamRef.current]);

  const startVisualization = useCallback(async (stream: MediaStream) => {
    if (streamRef.current === stream && micStreamRef.current) {
      return; // Already visualizing this stream
    }

    stopVisualization();

    if (!recordPluginRef.current || !wavesurfer) {
      console.log('Waiting for WaveSurfer to be ready...');
      // Retry after a short delay
      setTimeout(() => {
        if (recordPluginRef.current && wavesurfer) {
          startVisualization(stream);
        }
      }, 200);
      return;
    }

    streamRef.current = stream;

    try {
      // Use renderMicStream to visualize the microphone stream
      // This creates a real-time scrolling waveform with filled appearance
      const micStream = recordPluginRef.current.renderMicStream(stream);
      micStreamRef.current = micStream;
      console.log('WaveSurfer.js microphone visualization started with stream:', stream.id);
    } catch (error) {
      console.error('Error starting WaveSurfer.js microphone visualization:', error);
    }
  }, [wavesurfer]);

  const stopVisualization = useCallback(() => {
    // Clean up MicStream if it exists
    if (micStreamRef.current) {
      try {
        micStreamRef.current.onDestroy();
      } catch (error) {
        console.error('Error destroying mic stream:', error);
      }
      micStreamRef.current = null;
    }

    // Stop microphone monitoring if active
    if (recordPluginRef.current?.isActive()) {
      try {
        recordPluginRef.current.stopMic();
      } catch (error) {
        console.error('Error stopping microphone:', error);
      }
    }

    streamRef.current = null;
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, [stopVisualization]);

  return {
    waveformRef,
    audioLevel,
    startVisualization,
    stopVisualization,
  };
}

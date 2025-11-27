/**
 * Hook for real-time waveform visualization using WaveSurfer.js with React wrapper
 */

import { useEffect, useRef, useState, useMemo } from 'react';
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
  const [audioLevel, setAudioLevel] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Create record plugin instance with scrolling waveform enabled
  const recordPlugin = useMemo(() => RecordPlugin.create({
    scrollingWaveform: true,
    scrollingWaveformWindow: 5,
    continuousWaveform: true,
    renderRecordedAudio: false, // We don't want to render recorded audio, just visualize
  }), []);

  // Initialize WaveSurfer with record plugin
  const { wavesurfer } = useWavesurfer({
    container: waveformRef,
    height: 200,
    waveColor: '#00c6ff',
    progressColor: '#00c6ff',
    cursorColor: '#00c6ff',
    barWidth: 2,
    barRadius: 2,
    normalize: true,
    interact: false,
    plugins: useMemo(() => [recordPlugin], [recordPlugin]),
  });

  // Store record plugin reference
  useEffect(() => {
    if (recordPlugin && wavesurfer) {
      recordPluginRef.current = recordPlugin;
      setIsReady(true);
    }
  }, [recordPlugin, wavesurfer]);

  // Update audio level periodically
  useEffect(() => {
    if (!isReady || !streamRef.current) return;

    const updateAudioLevel = () => {
      try {
        // Create analyser from the stream to get audio level
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioContext = new AudioContextClass();
        const source = audioContext.createMediaStreamSource(streamRef.current!);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1

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
  }, [isReady]);

  const startVisualization = async (stream: MediaStream) => {
    if (streamRef.current === stream && recordPluginRef.current?.isActive()) {
      return; // Already visualizing this stream
    }

    stopVisualization();

    if (!recordPluginRef.current || !wavesurfer || !isReady) {
      console.error('WaveSurfer or record plugin not ready');
      return;
    }

    streamRef.current = stream;

    try {
      // Use renderMicStream to visualize the microphone stream
      recordPluginRef.current.renderMicStream(stream);
      console.log('Microphone visualization started');
    } catch (error) {
      console.error('Error starting microphone visualization:', error);
    }
  };

  const stopVisualization = () => {
    if (recordPluginRef.current?.isActive()) {
      try {
        recordPluginRef.current.stopMic();
      } catch (error) {
        console.error('Error stopping microphone:', error);
      }
    }

    streamRef.current = null;
    setAudioLevel(0);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVisualization();
    };
  }, []);

  return {
    waveformRef,
    audioLevel,
    startVisualization,
    stopVisualization,
  };
}

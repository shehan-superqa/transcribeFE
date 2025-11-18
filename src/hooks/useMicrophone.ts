/**
 * Hook for microphone audio capture with timer-based chunking
 */

import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseMicrophoneReturn {
  isRecording: boolean;
  error: string | null;
  startRecording: (onChunkReady?: (audioBuffer: ArrayBuffer) => void, chunkInterval?: number) => Promise<void>;
  stopRecording: () => void;
  getAudioDevices: () => Promise<MediaDeviceInfo[]>;
  selectedDeviceId: string | null;
  setSelectedDeviceId: (deviceId: string) => void;
  audioStream: MediaStream | null;
  getAudioData: () => Promise<ArrayBuffer | null>;
}

/**
 * Hook for microphone audio capture using Web Audio API
 */
export function useMicrophone(): UseMicrophoneReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const audioChunksRef = useRef<Int16Array[]>([]);
  const chunkCallbackRef = useRef<((audioBuffer: ArrayBuffer) => void) | null>(null);
  const intervalIdRef = useRef<number | null>(null);
  const isRecordingRef = useRef<boolean>(false);
  const sampleRate = 16000;
  const defaultChunkInterval = 2000; // 2 seconds

  /**
   * Get available audio input devices
   */
  const getAudioDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((device) => device.kind === 'audioinput');
    } catch (err: any) {
      setError(err.message || 'Failed to get audio devices');
      return [];
    }
  }, []);

  /**
   * Convert Float32 audio to Int16 PCM
   */
  const float32ToInt16 = useCallback((float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);
    for (let i = 0; i < float32Array.length; i++) {
      // Clamp value between -1 and 1
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      // Convert to 16-bit PCM
      int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return int16Array;
  }, []);

  /**
   * Send accumulated audio chunks
   */
  const sendAudioChunk = useCallback(() => {
    if (audioChunksRef.current.length === 0 || !chunkCallbackRef.current) {
      return;
    }

    // Combine all buffered chunks
    const totalSamples = audioChunksRef.current.reduce(
      (sum, chunk) => sum + chunk.length,
      0
    );

    const combined = new Int16Array(totalSamples);
    let offset = 0;

    for (const chunk of audioChunksRef.current) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    // Send chunk via callback
    chunkCallbackRef.current(combined.buffer);

    // Clear buffer after sending to prevent memory leaks
    audioChunksRef.current = [];
  }, []);

  /**
   * Start timer-based chunk sending
   */
  const startChunkSending = useCallback((chunkInterval: number) => {
    // Clear any existing interval
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
    }

    // Start sending chunks at regular intervals
    intervalIdRef.current = window.setInterval(() => {
      sendAudioChunk();
    }, chunkInterval);
  }, [sendAudioChunk]);

  /**
   * Start recording from microphone
   */
  const startRecording = useCallback(async (
    onChunkReady?: (audioBuffer: ArrayBuffer) => void,
    chunkInterval: number = defaultChunkInterval
  ) => {
    try {
      setError(null);
      audioChunksRef.current = [];
      chunkCallbackRef.current = onChunkReady || null;

      // Request microphone access
      const constraints: MediaStreamConstraints = {
        audio: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : true,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setAudioStream(stream);

      // Create audio context with 16kHz sample rate
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ 
        sampleRate: sampleRate 
      });
      audioContextRef.current = audioContext;

      // Create source node
      const source = audioContext.createMediaStreamSource(stream);

      // Create processor node for audio data
      // Buffer size: 4096 samples (approximately 0.25 seconds at 16kHz)
      const bufferSize = 4096;
      const processor = audioContext.createScriptProcessor(
        bufferSize,
        1, // input channels
        1  // output channels
      );
      processorNodeRef.current = processor;

      // Process audio chunks as they arrive
      processor.onaudioprocess = (event) => {
        if (!isRecordingRef.current) return;

        const inputData = event.inputBuffer.getChannelData(0); // Float32Array

        // Convert Float32 (-1.0 to 1.0) to Int16 PCM immediately
        const int16Data = float32ToInt16(inputData);

        // Add to buffer
        audioChunksRef.current.push(int16Data);
      };

      source.connect(processor);
      processor.connect(audioContext.destination);

      isRecordingRef.current = true;
      setIsRecording(true);

      // Start timer-based chunk sending if callback is provided
      if (onChunkReady) {
        startChunkSending(chunkInterval);
      }
    } catch (err: any) {
      isRecordingRef.current = false;
      setError(err.message || 'Failed to start recording');
      setIsRecording(false);
      throw err;
    }
  }, [selectedDeviceId, float32ToInt16, startChunkSending]);

  /**
   * Stop recording
   */
  const stopRecording = useCallback(() => {
    isRecordingRef.current = false;
    setIsRecording(false);

    // Clear interval timer
    if (intervalIdRef.current !== null) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    // Send any remaining chunks before stopping
    if (audioChunksRef.current.length > 0 && chunkCallbackRef.current) {
      sendAudioChunk();
    }

    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
      setAudioStream(null);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    // Clear buffers and callback
    audioChunksRef.current = [];
    chunkCallbackRef.current = null;
  }, [sendAudioChunk]);

  /**
   * Get recorded audio data as ArrayBuffer
   */
  const getAudioData = useCallback(async (): Promise<ArrayBuffer | null> => {
    if (audioChunksRef.current.length === 0) {
      return null;
    }

    // Combine all chunks (already Int16Array)
    const totalLength = audioChunksRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const combined = new Int16Array(totalLength);
    let offset = 0;

    for (const chunk of audioChunksRef.current) {
      combined.set(chunk, offset);
      offset += chunk.length;
    }

    return combined.buffer;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, [stopRecording]);

  return {
    isRecording,
    error,
    startRecording,
    stopRecording,
    getAudioDevices,
    selectedDeviceId,
    setSelectedDeviceId,
    audioStream,
    getAudioData,
  };
}


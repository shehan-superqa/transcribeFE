/**
 * Integrated hook for live transcription combining microphone and WebSocket
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useMicrophone } from './useMicrophone';
import { websocketClient } from '../lib/api/websocketClient';
import { liveTranscriptionStore } from '../stores/liveTranscriptionStore';
import type { LiveTranscriptionConfig } from '../types/transcription';

export interface UseLiveTranscriptionReturn {
  isActive: boolean;
  isConnected: boolean;
  isRecording: boolean;
  transcription: string;
  vadStatus: 'speaking' | 'silent';
  error: string | null;
  sessionId: string | null;
  start: (config: LiveTranscriptionConfig & { deviceId?: string; chunkInterval?: number }) => Promise<void>;
  stop: () => Promise<void>;
  clearResults: () => void;
}

/**
 * Integrated hook for live transcription
 * Properly sequences: connect → start transcription → start audio capture → send chunks
 */
export function useLiveTranscription(): UseLiveTranscriptionReturn {
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const {
    isRecording,
    error: micError,
    startRecording,
    stopRecording,
    setSelectedDeviceId,
  } = useMicrophone();

  const results = liveTranscriptionStore((state) => state.results);
  const vadState = liveTranscriptionStore((state) => state.vadState);
  const clearResults = liveTranscriptionStore((state) => state.clearResults);
  const appendResult = liveTranscriptionStore((state) => state.appendResult);
  const setVADState = liveTranscriptionStore((state) => state.setVADState);
  const setErrorStore = liveTranscriptionStore((state) => state.setError);

  const transcriptionCallbackRef = useRef<((data: any) => void) | null>(null);
  const vadCallbackRef = useRef<((data: any) => void) | null>(null);
  const errorCallbackRef = useRef<((error: any) => void) | null>(null);
  const audioReceivedCallbackRef = useRef<((data: any) => void) | null>(null);

  // Set up WebSocket event listeners
  useEffect(() => {
    const transcriptionCallback = (data: any) => {
      if (data.text) {
        appendResult(data.text);
      }
    };

    const vadCallback = (data: any) => {
      if (data.status) {
        setVADState(data.status);
      }
    };

    const errorCallback = (errorData: any) => {
      const errorMessage = errorData.error || 'WebSocket error';
      setError(errorMessage);
      setErrorStore(errorMessage);
    };

    const audioReceivedCallback = (data: any) => {
      // Log acknowledgment (optional, for debugging)
      console.log(`Audio chunk received: ${data.samples} samples`);
    };

    transcriptionCallbackRef.current = transcriptionCallback;
    vadCallbackRef.current = vadCallback;
    errorCallbackRef.current = errorCallback;
    audioReceivedCallbackRef.current = audioReceivedCallback;

    websocketClient.on('transcription', transcriptionCallback);
    websocketClient.on('vad_status', vadCallback);
    websocketClient.on('error', errorCallback);
    websocketClient.on('audio_received', audioReceivedCallback);

    // Check initial connection status
    setIsConnected(websocketClient.isConnected());
    setSessionId(websocketClient.getSessionId());

    return () => {
      if (transcriptionCallbackRef.current) {
        websocketClient.off('transcription', transcriptionCallbackRef.current);
      }
      if (vadCallbackRef.current) {
        websocketClient.off('vad_status', vadCallbackRef.current);
      }
      if (errorCallbackRef.current) {
        websocketClient.off('error', errorCallbackRef.current);
      }
      if (audioReceivedCallbackRef.current) {
        websocketClient.off('audio_received', audioReceivedCallbackRef.current);
      }
    };
  }, [appendResult, setVADState, setErrorStore]);

  // Update error state from microphone errors
  useEffect(() => {
    if (micError) {
      setError(micError);
      setErrorStore(micError);
    }
  }, [micError, setErrorStore]);

  /**
   * Start live transcription
   */
  const start = useCallback(async (config: LiveTranscriptionConfig & { deviceId?: string; chunkInterval?: number }) => {
    try {
      setError(null);
      setErrorStore(null);

      // 1. Connect to WebSocket if not connected
      if (!websocketClient.isConnected()) {
        await websocketClient.connect();
        setIsConnected(true);
        setSessionId(websocketClient.getSessionId());
      }

      // 2. Start transcription session
      await websocketClient.startTranscription({
        engine: config.engine || 'replicate',
        language: config.language || 'en',
        model: config.model || 'base',
        vad_threshold: config.vad_threshold || 0.01,
      });

      setIsActive(true);
      setSessionId(websocketClient.getSessionId());

      // 3. Set selected device if provided
      if (config.deviceId) {
        setSelectedDeviceId(config.deviceId);
      }

      // 4. Start audio capture with chunk callback
      const chunkInterval = config.chunkInterval || 2000; // Default 2 seconds
      await startRecording(
        (audioBuffer: ArrayBuffer) => {
          // Send audio chunk via WebSocket
          try {
            websocketClient.sendAudio(audioBuffer, 'base64', 16000, 1);
          } catch (err: any) {
            console.error('Error sending audio chunk:', err);
            setError(err.message || 'Failed to send audio chunk');
          }
        },
        chunkInterval
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start live transcription';
      setError(errorMessage);
      setErrorStore(errorMessage);
      setIsActive(false);
      
      // Cleanup on error
      try {
        await stop();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
      
      throw err;
    }
  }, [startRecording, setSelectedDeviceId, setErrorStore]);

  /**
   * Stop live transcription
   */
  const stop = useCallback(async () => {
    try {
      // 1. Stop audio capture
      stopRecording();

      // 2. Stop transcription session
      if (websocketClient.isConnected()) {
        await websocketClient.stopTranscription();
      }

      setIsActive(false);
      setError(null);
    } catch (err: any) {
      console.error('Error stopping transcription:', err);
      setError(err.message || 'Error stopping transcription');
    }
  }, [stopRecording]);

  return {
    isActive,
    isConnected: websocketClient.isConnected() || isConnected,
    isRecording,
    transcription: results,
    vadStatus: vadState,
    error,
    sessionId,
    start,
    stop,
    clearResults,
  };
}


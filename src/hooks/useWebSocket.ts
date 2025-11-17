/**
 * Hook for WebSocket live transcription
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { websocketClient } from '../lib/api/websocketClient';
import type { LiveTranscriptionConfig, LiveTranscriptionResult, VADStatus } from '../types/transcription';

export interface UseWebSocketReturn {
  isConnected: boolean;
  isActive: boolean;
  sessionId: string | null;
  transcriptionResults: LiveTranscriptionResult[];
  vadStatus: VADStatus | null;
  error: string | null;
  connect: () => Promise<void>;
  startTranscription: (config: LiveTranscriptionConfig) => Promise<void>;
  sendAudio: (audio: string | ArrayBuffer, format?: 'base64' | 'raw') => void;
  stopTranscription: () => Promise<void>;
  disconnect: () => void;
}

/**
 * Hook for WebSocket live transcription
 */
export function useWebSocket(): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcriptionResults, setTranscriptionResults] = useState<LiveTranscriptionResult[]>([]);
  const [vadStatus, setVADStatus] = useState<VADStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transcriptionCallbackRef = useRef<((data: LiveTranscriptionResult) => void) | null>(null);
  const vadCallbackRef = useRef<((data: VADStatus) => void) | null>(null);
  const errorCallbackRef = useRef<((error: any) => void) | null>(null);

  useEffect(() => {
    // Set up event listeners
    const transcriptionCallback = (data: LiveTranscriptionResult) => {
      setTranscriptionResults((prev) => [...prev, data]);
    };

    const vadCallback = (data: VADStatus) => {
      setVADStatus(data);
    };

    const errorCallback = (errorData: any) => {
      setError(errorData.error || 'WebSocket error');
    };

    transcriptionCallbackRef.current = transcriptionCallback;
    vadCallbackRef.current = vadCallback;
    errorCallbackRef.current = errorCallback;

    websocketClient.on('transcription', transcriptionCallback);
    websocketClient.on('vad_status', vadCallback);
    websocketClient.on('error', errorCallback);

    // Check connection status
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
    };
  }, []);

  const connect = useCallback(async () => {
    try {
      await websocketClient.connect();
      setIsConnected(true);
      setSessionId(websocketClient.getSessionId());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      throw err;
    }
  }, []);

  const startTranscription = useCallback(async (config: LiveTranscriptionConfig) => {
    try {
      if (!websocketClient.isConnected()) {
        await connect();
      }
      await websocketClient.startTranscription(config);
      setIsActive(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
      setIsActive(false);
      throw err;
    }
  }, [connect]);

  const sendAudio = useCallback((audio: string | ArrayBuffer, format: 'base64' | 'raw' = 'base64') => {
    try {
      websocketClient.sendAudio(audio, format);
    } catch (err: any) {
      setError(err.message || 'Failed to send audio');
    }
  }, []);

  const stopTranscription = useCallback(async () => {
    try {
      await websocketClient.stopTranscription();
      setIsActive(false);
    } catch (err: any) {
      console.error('Error stopping transcription:', err);
    }
  }, []);

  const disconnect = useCallback(() => {
    websocketClient.disconnect();
    setIsConnected(false);
    setIsActive(false);
    setSessionId(null);
    setTranscriptionResults([]);
    setVADStatus(null);
  }, []);

  return {
    isConnected,
    isActive,
    sessionId,
    transcriptionResults,
    vadStatus,
    error,
    connect,
    startTranscription,
    sendAudio,
    stopTranscription,
    disconnect,
  };
}


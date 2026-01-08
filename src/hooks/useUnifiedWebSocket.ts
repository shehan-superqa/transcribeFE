/**
 * Enhanced hook for unified WebSocket features
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { unifiedWebSocketClient } from '../lib/api/websocket';
import type { LiveTranscriptionConfig, LiveTranscriptionResult } from '../types/transcription';

export interface UseUnifiedWebSocketReturn {
  // Connection
  isConnected: boolean;
  sessionId: string | null;
  connect: (token?: string) => Promise<void>;
  disconnect: () => void;

  // Transcription
  isTranscribing: boolean;
  transcriptionResults: LiveTranscriptionResult[];
  startTranscription: (config: LiveTranscriptionConfig, token?: string) => Promise<void>;
  sendAudio: (audio: string | ArrayBuffer, format?: 'base64' | 'raw') => void;
  stopTranscription: () => Promise<void>;

  // GPT-5 Streaming
  isGPT5Streaming: boolean;
  gpt5Chunks: string[];
  gpt5FullText: string;
  startGPT5Stream: (config: {
    job_id?: string;
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    reasoning_effort?: 'minimal' | 'medium' | 'high';
    verbosity?: 'low' | 'medium' | 'high';
    token?: string;
  }) => Promise<void>;
  stopGPT5Stream: () => Promise<void>;

  // Progress Updates
  subscribedJobId: string | null;
  progress: {
    status: string;
    progress: number;
    message: string;
    details: any;
  } | null;
  subscribeProgress: (jobId: string) => Promise<void>;
  unsubscribeProgress: () => Promise<void>;

  // Errors
  error: string | null;
}

export function useUnifiedWebSocket(): UseUnifiedWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcriptionResults, setTranscriptionResults] = useState<LiveTranscriptionResult[]>([]);
  const [isGPT5Streaming, setIsGPT5Streaming] = useState(false);
  const [gpt5Chunks, setGpt5Chunks] = useState<string[]>([]);
  const [gpt5FullText, setGpt5FullText] = useState('');
  const [subscribedJobId, setSubscribedJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    progress: number;
    message: string;
    details: any;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Set up event listeners
  useEffect(() => {
    // Transcription listeners
    const transcriptionStartedCallback = (data: {
      session_id: string;
      status: string;
      engine: string;
      language: string;
      model: string;
    }) => {
      setIsTranscribing(true);
      setError(null);
    };

    const transcriptionCallback = (data: {
      session_id: string;
      text: string;
      confidence?: number;
      timestamp?: number;
    }) => {
      // Convert to LiveTranscriptionResult format for compatibility
      setTranscriptionResults((prev) => [...prev, {
        text: data.text,
        confidence: data.confidence,
        timestamp: data.timestamp,
      } as LiveTranscriptionResult]);
    };

    const transcriptionStoppedCallback = (data: {
      session_id: string;
      status: string;
    }) => {
      setIsTranscribing(false);
    };

    const transcriptionErrorCallback = (errorData: {
      error: string;
      error_code?: string;
      session_id?: string;
    }) => {
      const errorMessage = errorData.error || 'Transcription error';
      // Handle specific error codes
      if (errorData.error_code === 'AUTH_ERROR') {
        setError('Authentication error. Please reconnect.');
      } else if (errorData.error_code === 'NO_SESSION') {
        setError('No active session. Please start transcription again.');
      } else {
        setError(errorMessage);
      }
      setIsTranscribing(false);
    };

    // GPT-5 listeners
    const gpt5StartedCallback = (data: {
      job_id: string;
      status: string;
      timestamp?: number;
    }) => {
      setIsGPT5Streaming(true);
      setGpt5Chunks([]);
      setGpt5FullText('');
      setError(null);
    };

    const gpt5ChunkCallback = (data: {
      job_id: string;
      chunk: string;
      done: boolean;
      timestamp?: number;
    }) => {
      if (!data.done) {
        setGpt5Chunks((prev) => [...prev, data.chunk]);
        setGpt5FullText((prev) => prev + data.chunk);
      }
    };

    const gpt5CompleteCallback = (data: {
      job_id: string;
      status: string;
      text: string;
      timestamp?: number;
    }) => {
      setIsGPT5Streaming(false);
      setGpt5FullText(data.text);
      // Note: chunks array not provided in gpt5_complete, only full text
    };

    const gpt5StreamStoppedCallback = (data: {
      job_id: string;
      status: string;
      timestamp?: number;
    }) => {
      setIsGPT5Streaming(false);
    };

    const gpt5ErrorCallback = (errorData: {
      job_id?: string;
      error: string;
      error_code?: string;
    }) => {
      const errorMessage = errorData.error || 'GPT-5 streaming error';
      // Handle specific error codes
      if (errorData.error_code === 'AUTH_ERROR') {
        setError('Authentication error. Please reconnect.');
      } else if (errorData.error_code === 'SERVICE_UNAVAILABLE') {
        setError('GPT-5 service is currently unavailable.');
      } else {
        setError(errorMessage);
      }
      setIsGPT5Streaming(false);
    };

    // Progress listeners
    const progressSubscribedCallback = (data: {
      job_id: string;
      status: string;
    }) => {
      setSubscribedJobId(data.job_id);
      setError(null);
    };

    const progressCallback = (data: {
      job_id: string;
      status: string;
      progress: number;
      message: string;
      details?: any;
      timestamp?: number;
    }) => {
      setProgress({
        status: data.status,
        progress: data.progress,
        message: data.message,
        details: data.details,
      });
    };

    const progressUnsubscribedCallback = (data: {
      status: string;
    }) => {
      setSubscribedJobId(null);
      setProgress(null);
    };

    const progressErrorCallback = (errorData: {
      error: string;
      error_code?: string;
    }) => {
      const errorMessage = errorData.error || 'Progress update error';
      if (errorData.error_code === 'MISSING_JOB_ID') {
        setError('Job ID is required for progress subscription.');
      } else {
        setError(errorMessage);
      }
    };

    // Register listeners
    unifiedWebSocketClient.onTranscriptionStarted(transcriptionStartedCallback);
    unifiedWebSocketClient.onTranscriptionResult(transcriptionCallback);
    unifiedWebSocketClient.onTranscriptionStopped(transcriptionStoppedCallback);
    unifiedWebSocketClient.onTranscriptionError(transcriptionErrorCallback);
    unifiedWebSocketClient.onGPT5Started(gpt5StartedCallback);
    unifiedWebSocketClient.onGPT5Chunk(gpt5ChunkCallback);
    unifiedWebSocketClient.onGPT5Complete(gpt5CompleteCallback);
    unifiedWebSocketClient.onGPT5StreamStopped(gpt5StreamStoppedCallback);
    unifiedWebSocketClient.onGPT5Error(gpt5ErrorCallback);
    unifiedWebSocketClient.onProgressSubscribed(progressSubscribedCallback);
    unifiedWebSocketClient.onProgressUpdate(progressCallback);
    unifiedWebSocketClient.onProgressUnsubscribed(progressUnsubscribedCallback);
    unifiedWebSocketClient.onProgressError(progressErrorCallback);

    // Check connection status
    setIsConnected(unifiedWebSocketClient.isConnectedToServer());
    setSessionId(unifiedWebSocketClient.getSessionId());

    return () => {
      // Cleanup listeners
      unifiedWebSocketClient.off('transcription_started', transcriptionStartedCallback);
      unifiedWebSocketClient.off('transcription_result', transcriptionCallback);
      unifiedWebSocketClient.off('transcription_stopped', transcriptionStoppedCallback);
      unifiedWebSocketClient.off('transcription_error', transcriptionErrorCallback);
      unifiedWebSocketClient.off('gpt5_started', gpt5StartedCallback);
      unifiedWebSocketClient.off('gpt5_chunk', gpt5ChunkCallback);
      unifiedWebSocketClient.off('gpt5_complete', gpt5CompleteCallback);
      unifiedWebSocketClient.off('gpt5_stream_stopped', gpt5StreamStoppedCallback);
      unifiedWebSocketClient.off('gpt5_error', gpt5ErrorCallback);
      unifiedWebSocketClient.off('progress_subscribed', progressSubscribedCallback);
      unifiedWebSocketClient.off('progress_update', progressCallback);
      unifiedWebSocketClient.off('progress_unsubscribed', progressUnsubscribedCallback);
      unifiedWebSocketClient.off('progress_error', progressErrorCallback);
    };
  }, []);

  const connect = useCallback(async (token?: string) => {
    try {
      await unifiedWebSocketClient.connect(token);
      setIsConnected(true);
      setSessionId(unifiedWebSocketClient.getSessionId());
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to connect');
      throw err;
    }
  }, []);

  const disconnect = useCallback(() => {
    unifiedWebSocketClient.disconnect();
    setIsConnected(false);
    setSessionId(null);
    setIsTranscribing(false);
    setIsGPT5Streaming(false);
    setTranscriptionResults([]);
    setGpt5Chunks([]);
    setGpt5FullText('');
    setSubscribedJobId(null);
    setProgress(null);
  }, []);

  const startTranscription = useCallback(async (config: LiveTranscriptionConfig, token?: string) => {
    try {
      if (!unifiedWebSocketClient.isConnectedToServer()) {
        await connect(token);
      }
      await unifiedWebSocketClient.startTranscription(config, token);
      setIsTranscribing(true);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
      setIsTranscribing(false);
      throw err;
    }
  }, [connect]);

  const sendAudio = useCallback((audio: string | ArrayBuffer, format: 'base64' | 'raw' = 'base64') => {
    try {
      unifiedWebSocketClient.sendAudio(audio, format);
    } catch (err: any) {
      setError(err.message || 'Failed to send audio');
    }
  }, []);

  const stopTranscription = useCallback(async () => {
    try {
      await unifiedWebSocketClient.stopTranscription();
      setIsTranscribing(false);
    } catch (err: any) {
      console.error('Error stopping transcription:', err);
    }
  }, []);

  const startGPT5Stream = useCallback(async (config: {
    job_id?: string;
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    reasoning_effort?: 'minimal' | 'medium' | 'high';
    verbosity?: 'low' | 'medium' | 'high';
    token?: string;
  }) => {
    try {
      if (!unifiedWebSocketClient.isConnectedToServer()) {
        await connect(config.token);
      }
      await unifiedWebSocketClient.startGPT5Stream(config);
      setIsGPT5Streaming(true);
      setGpt5Chunks([]);
      setGpt5FullText('');
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to start GPT-5 stream');
      setIsGPT5Streaming(false);
      throw err;
    }
  }, [connect]);

  const stopGPT5Stream = useCallback(async () => {
    try {
      await unifiedWebSocketClient.stopGPT5Stream();
      setIsGPT5Streaming(false);
    } catch (err: any) {
      console.error('Error stopping GPT-5 stream:', err);
    }
  }, []);

  const subscribeProgress = useCallback(async (jobId: string) => {
    try {
      if (!unifiedWebSocketClient.isConnectedToServer()) {
        await connect();
      }
      await unifiedWebSocketClient.subscribeProgress(jobId);
      setSubscribedJobId(jobId);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe to progress');
      throw err;
    }
  }, [connect]);

  const unsubscribeProgress = useCallback(async () => {
    try {
      await unifiedWebSocketClient.unsubscribeProgress();
      setSubscribedJobId(null);
      setProgress(null);
    } catch (err: any) {
      console.error('Error unsubscribing from progress:', err);
    }
  }, []);

  return {
    isConnected,
    sessionId,
    connect,
    disconnect,
    isTranscribing,
    transcriptionResults,
    startTranscription,
    sendAudio,
    stopTranscription,
    isGPT5Streaming,
    gpt5Chunks,
    gpt5FullText,
    startGPT5Stream,
    stopGPT5Stream,
    subscribedJobId,
    progress,
    subscribeProgress,
    unsubscribeProgress,
    error,
  };
}


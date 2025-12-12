/**
 * Hook for GPT-5 WebSocket streaming
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { gpt5WebSocketClient } from '../lib/api/gpt5WebSocketClient';
import type {
  GPT5StartStreamRequest,
  GPT5WebSocketChunkEvent,
  GPT5WebSocketCompleteEvent,
  GPT5WebSocketErrorEvent,
} from '../types/gpt5';

export interface UseGPT5WebSocketReturn {
  text: string;
  chunks: string[];
  isConnected: boolean;
  isStreaming: boolean;
  error: string | null;
  startStream: (request: GPT5StartStreamRequest) => Promise<void>;
  stopStream: (jobId: string) => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to use GPT-5 WebSocket streaming
 * @param jobId - Job ID to track (optional, can be set when starting stream)
 */
export function useGPT5WebSocket(jobId: string | null = null): UseGPT5WebSocketReturn {
  const [text, setText] = useState('');
  const [chunks, setChunks] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chunkCallbackRef = useRef<((data: GPT5WebSocketChunkEvent) => void) | null>(null);
  const completeCallbackRef = useRef<((data: GPT5WebSocketCompleteEvent) => void) | null>(null);
  const errorCallbackRef = useRef<((data: GPT5WebSocketErrorEvent) => void) | null>(null);
  const currentJobIdRef = useRef<string | null>(null);

  // Set up event listeners
  useEffect(() => {
    const chunkCallback = (data: GPT5WebSocketChunkEvent) => {
      // Only process chunks for the current job
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        setText((prev) => prev + data.chunk);
        setChunks((prev) => [...prev, data.chunk]);
        setIsStreaming(true);
        setError(null);
      }
    };

    const completeCallback = (data: GPT5WebSocketCompleteEvent) => {
      // Only process completion for the current job
      if (currentJobIdRef.current && data.job_id === currentJobIdRef.current) {
        setText(data.text);
        setChunks(data.chunks);
        setIsStreaming(false);
        setError(null);
      }
    };

    const errorCallback = (data: GPT5WebSocketErrorEvent) => {
      // Process errors for current job or global errors
      if (!data.job_id || (currentJobIdRef.current && data.job_id === currentJobIdRef.current)) {
        setIsStreaming(false);
        
        // Map error codes to user-friendly messages
        let errorMessage = data.error;
        switch (data.error_code) {
          case 'MISSING':
            errorMessage = 'Authentication required. Please log in.';
            break;
          case 'INVALID':
            errorMessage = 'Authentication failed. Please log in again.';
            break;
          case 'MISSING_JOB_ID':
            errorMessage = 'Job ID is required.';
            break;
          case 'MISSING_INPUT':
            errorMessage = 'Either messages or prompt must be provided.';
            break;
          case 'SERVICE_UNAVAILABLE':
            errorMessage = 'GPT-5 service is currently unavailable. Please try again later.';
            break;
          case 'NO_RESULT':
            errorMessage = 'No response received from GPT-5.';
            break;
          case 'STREAM_ERROR':
            errorMessage = `Streaming error: ${data.error}`;
            break;
          case 'START_ERROR':
            errorMessage = `Failed to start stream: ${data.error}`;
            break;
          case 'STOP_ERROR':
            errorMessage = `Failed to stop stream: ${data.error}`;
            break;
          case 'NO_SESSION':
            errorMessage = 'No active streaming session.';
            break;
          default:
            errorMessage = data.error || 'An unknown error occurred.';
        }
        
        setError(errorMessage);
      }
    };

    chunkCallbackRef.current = chunkCallback;
    completeCallbackRef.current = completeCallback;
    errorCallbackRef.current = errorCallback;

    gpt5WebSocketClient.on('gpt5_chunk', chunkCallback);
    gpt5WebSocketClient.on('gpt5_complete', completeCallback);
    gpt5WebSocketClient.on('gpt5_error', errorCallback);

    // Check connection status
    setIsConnected(gpt5WebSocketClient.isConnected());

    // Connect if not connected
    if (!gpt5WebSocketClient.isConnected()) {
      gpt5WebSocketClient.connect().then(() => {
        setIsConnected(true);
      }).catch((err) => {
        setError(err.message || 'Failed to connect to WebSocket');
        setIsConnected(false);
      });
    }

    return () => {
      if (chunkCallbackRef.current) {
        gpt5WebSocketClient.off('gpt5_chunk', chunkCallbackRef.current);
      }
      if (completeCallbackRef.current) {
        gpt5WebSocketClient.off('gpt5_complete', completeCallbackRef.current);
      }
      if (errorCallbackRef.current) {
        gpt5WebSocketClient.off('gpt5_error', errorCallbackRef.current);
      }
    };
  }, []);

  const startStream = useCallback(async (request: GPT5StartStreamRequest) => {
    try {
      // Stop any existing stream for this job or previous job
      if (currentJobIdRef.current && currentJobIdRef.current !== request.job_id) {
        try {
          await gpt5WebSocketClient.stopStream(currentJobIdRef.current);
        } catch (stopError) {
          // Ignore stop errors, continue with new stream
          console.warn('Error stopping previous stream:', stopError);
        }
      }

      // Ensure connected
      if (!gpt5WebSocketClient.isConnected()) {
        await gpt5WebSocketClient.connect();
        setIsConnected(true);
      }

      // Reset state for new stream
      setText('');
      setChunks([]);
      setError(null);
      setIsStreaming(true);
      currentJobIdRef.current = request.job_id;

      await gpt5WebSocketClient.startStream(request);
    } catch (err: any) {
      setIsStreaming(false);
      setError(err.message || 'Failed to start stream');
      throw err;
    }
  }, []);

  const stopStream = useCallback(async (jobId: string) => {
    try {
      await gpt5WebSocketClient.stopStream(jobId);
      setIsStreaming(false);
      if (currentJobIdRef.current === jobId) {
        currentJobIdRef.current = null;
      }
    } catch (err: any) {
      setError(err.message || 'Failed to stop stream');
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Update connection status when it changes
  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(gpt5WebSocketClient.isConnected());
    };

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (currentJobIdRef.current) {
        gpt5WebSocketClient.clearStream(currentJobIdRef.current);
      }
    };
  }, []);

  return {
    text,
    chunks,
    isConnected,
    isStreaming,
    error,
    startStream,
    stopStream,
    clearError,
  };
}


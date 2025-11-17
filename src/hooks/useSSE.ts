/**
 * Hook for Server-Sent Events (SSE) progress streaming
 */

import { useEffect, useState, useRef } from 'react';
import { sseClient } from '../lib/api/sseClient';
import type { ProgressEvent } from '../types/api';

export interface UseSSEReturn {
  progress: number;
  status: string;
  message: string;
  result: any | null;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook to listen to SSE progress stream for a job
 */
export function useSSE(jobId: string | null): UseSSEReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const callbackRef = useRef<((event: ProgressEvent) => void) | null>(null);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    // Connect to SSE stream
    sseClient.connect(jobId);
    setIsConnected(true);

    // Set up progress callback
    const callback = (event: ProgressEvent) => {
      setProgress(event.progress || 0);
      setStatus(event.status);
      setMessage(event.message || '');
      
      if (event.result) {
        setResult(event.result);
      }
      
      if (event.error) {
        setError(event.error);
      }

      // If completed or failed, we can optionally close the connection
      if (event.status === 'completed' || event.status === 'failed' || event.status === 'error') {
        // Keep connection open for a bit in case of retries
        setTimeout(() => {
          sseClient.close();
          setIsConnected(false);
        }, 5000);
      }
    };

    callbackRef.current = callback;
    sseClient.onProgress(callback);

    // Cleanup
    return () => {
      if (callbackRef.current) {
        sseClient.offProgress(callbackRef.current);
      }
      sseClient.close();
      setIsConnected(false);
    };
  }, [jobId]);

  return {
    progress,
    status,
    message,
    result,
    error,
    isConnected,
  };
}


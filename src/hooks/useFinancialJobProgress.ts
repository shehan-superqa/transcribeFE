/**
 * Hook for financial job progress using unified WebSocket
 * Connects to the unified socket server for real-time progress updates
 */

import { useEffect, useState, useRef } from 'react';
import { unifiedWebSocketClient } from '../lib/api/websocket';
import { sseClient } from '../lib/api/sseClient';

export interface FinancialProgressData {
  status: 'idle' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  details: {
    step?: 'uploading' | 'ocr' | 'parsing' | 'normalization' | 'validation' | 'embeddings' | 'merchant' | 'duplicate' | 'categorization' | 'anomaly' | 'saving' | 'complete';
    [key: string]: any;
  };
  timestamp: string;
  job_id: string;
}

export interface UseFinancialJobProgressReturn {
  progress: number;
  status: string;
  message: string;
  step: string | null;
  details: FinancialProgressData['details'] | null;
  error: string | null;
  isConnected: boolean;
  data: FinancialProgressData | null;
}

/**
 * Hook to listen to progress stream for a financial job
 * Tries WebSocket first (port 5002), falls back to SSE if WebSocket is not available
 * @param jobId - Job ID to stream progress for
 * @param streamUrl - Optional stream URL from API response (e.g., from uploadBill response)
 */
export function useFinancialJobProgress(
  jobId: string | null,
  streamUrl?: string
): UseFinancialJobProgressReturn {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [step, setStep] = useState<string | null>(null);
  const [details, setDetails] = useState<FinancialProgressData['details'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [data, setData] = useState<FinancialProgressData | null>(null);
  const connectionTypeRef = useRef<'websocket' | 'sse' | null>(null);
  const progressCallbackRef = useRef<((event: any) => void) | null>(null);
  const progressErrorCallbackRef = useRef<((error: any) => void) | null>(null);

  useEffect(() => {
    if (!jobId) {
      setProgress(0);
      setStatus('');
      setMessage('');
      setStep(null);
      setDetails(null);
      setError(null);
      setIsConnected(false);
      setData(null);
      connectionTypeRef.current = null;
      // Unsubscribe from progress if we were subscribed
      if (unifiedWebSocketClient.isConnectedToServer()) {
        unifiedWebSocketClient.unsubscribeProgress().catch(() => {});
      }
      return;
    }

    // Set up progress callback for unified socket
    const progressCallback = (event: {
      job_id: string;
      status: string;
      progress: number;
      message: string;
      details: any;
      timestamp: number;
    }) => {
      try {
        // Only process if job_id matches
        if (event.job_id === jobId) {
          const progressData: FinancialProgressData = {
            status: (event.status as any) || 'processing',
            progress: event.progress || 0,
            message: event.message || '',
            details: event.details || {},
            timestamp: event.timestamp ? new Date(event.timestamp).toISOString() : new Date().toISOString(),
            job_id: event.job_id || jobId,
          };

          setProgress(Math.min(100, Math.max(0, progressData.progress)));
          setStatus(progressData.status);
          setMessage(progressData.message);
          setStep(progressData.details?.step || null);
          setDetails(progressData.details);
          setData(progressData);

          if (progressData.status === 'error' || progressData.status === 'failed') {
            setError(progressData.message || 'Job failed');
          } else {
            setError(null);
          }

          // If completed or failed, unsubscribe after a delay
          if (progressData.status === 'completed' || progressData.status === 'error' || progressData.status === 'failed') {
            setTimeout(() => {
              unifiedWebSocketClient.unsubscribeProgress().catch(() => {});
              setIsConnected(false);
            }, 5000);
          }
        }
      } catch (err: any) {
        console.error('Error parsing financial progress event:', err);
        setError(err.message || 'Failed to parse progress data');
      }
    };

    // Set up progress error callback
    const progressErrorCallback = (errorData: any) => {
      setError(errorData.error || 'Progress update error');
      setIsConnected(false);
    };

    progressCallbackRef.current = progressCallback;
    progressErrorCallbackRef.current = progressErrorCallback;

    // Try unified WebSocket first
    const tryUnifiedWebSocket = async () => {
      try {
        // Connect if not already connected
        if (!unifiedWebSocketClient.isConnectedToServer()) {
          await unifiedWebSocketClient.connect();
        }

        // Set up listeners
        unifiedWebSocketClient.onProgressUpdate(progressCallback);
        unifiedWebSocketClient.onProgressError(progressErrorCallback);

        // Subscribe to progress updates
        await unifiedWebSocketClient.subscribeProgress(jobId);
        
        connectionTypeRef.current = 'websocket';
        setIsConnected(true);

        if (import.meta.env.DEV) {
          console.log('[Progress] Using unified WebSocket connection');
        }

        return () => {
          unifiedWebSocketClient.off('progress_update', progressCallback);
          unifiedWebSocketClient.off('progress_error', progressErrorCallback);
          unifiedWebSocketClient.unsubscribeProgress().catch(() => {});
        };
      } catch (err) {
        console.error('[Progress] Unified WebSocket error, trying SSE:', err);
        trySSE();
        return () => {};
      }
    };

    // Fallback to SSE
    const trySSE = () => {
      sseClient.connect(jobId, streamUrl);
      
      // Use the same callback format for SSE
      const sseCallback = (event: any) => {
        const progressData: FinancialProgressData = {
          status: event.status || 'processing',
          progress: event.progress || 0,
          message: event.message || '',
          details: event.details || event.progress_details || {},
          timestamp: event.timestamp || new Date().toISOString(),
          job_id: event.job_id || jobId,
        };

        if (progressData.job_id === jobId) {
          setProgress(Math.min(100, Math.max(0, progressData.progress)));
          setStatus(progressData.status);
          setMessage(progressData.message);
          setStep(progressData.details?.step || null);
          setDetails(progressData.details);
          setData(progressData);

          if (progressData.status === 'error' || progressData.status === 'failed') {
            setError(progressData.message || 'Job failed');
          } else {
            setError(null);
          }

          if (progressData.status === 'completed' || progressData.status === 'error' || progressData.status === 'failed') {
            setTimeout(() => {
              sseClient.close();
              setIsConnected(false);
            }, 5000);
          }
        }
      };

      sseClient.onProgress(sseCallback);
      connectionTypeRef.current = 'sse';
      setIsConnected(sseClient.isConnected());

      if (import.meta.env.DEV) {
        console.log('[Progress] Using SSE connection');
      }

      // Monitor SSE connection
      const sseCheck = setInterval(() => {
        setIsConnected(sseClient.isConnected());
      }, 1000);

      return () => {
        clearInterval(sseCheck);
        sseClient.offProgress(sseCallback);
        sseClient.close();
      };
    };

    // Start with unified WebSocket
    let cleanup: (() => void) | null = null;
    let isMounted = true;

    tryUnifiedWebSocket().then((cleanupFn) => {
      if (isMounted && cleanupFn) {
        cleanup = cleanupFn;
      }
    }).catch(() => {
      // If unified socket fails, try SSE
      if (isMounted) {
        cleanup = trySSE();
      }
    });

    // Cleanup on unmount
    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup();
      }
      setIsConnected(false);
      connectionTypeRef.current = null;
    };
  }, [jobId, streamUrl]);

  return {
    progress,
    status,
    message,
    step,
    details,
    error,
    isConnected,
    data,
  };
}



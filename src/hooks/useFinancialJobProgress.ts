/**
 * Hook for financial job progress using SSE (Server-Sent Events)
 * Connects to the SSE stream endpoint for real-time progress updates
 */

import { useEffect, useState, useRef } from 'react';
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
 * Hook to listen to SSE progress stream for a financial job
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
  const callbackRef = useRef<((event: any) => void) | null>(null);

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
      return;
    }

    // Connect to SSE stream
    sseClient.connect(jobId, streamUrl);
    setIsConnected(true);

    // Set up progress callback
    const callback = (event: any) => {
      try {
        // Parse the event data - it might be a ProgressEvent or FinancialProgressData
        const progressData: FinancialProgressData = {
          status: event.status || 'processing',
          progress: event.progress || 0,
          message: event.message || '',
          details: event.details || event.progress_details || {},
          timestamp: event.timestamp || new Date().toISOString(),
          job_id: event.job_id || jobId,
        };

        // Only process if job_id matches
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

          // If completed or failed, close connection after a delay
          if (progressData.status === 'completed' || progressData.status === 'error' || progressData.status === 'failed') {
            setTimeout(() => {
              sseClient.close();
              setIsConnected(false);
            }, 5000);
          }
        }
      } catch (err: any) {
        console.error('Error parsing financial progress event:', err);
        setError(err.message || 'Failed to parse progress data');
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



/**
 * Hook for GPT-5 job polling (non-streaming mode)
 */

import { useEffect, useState, useRef } from 'react';
import { getGPT5JobStatus } from '../lib/api/gpt5Api';
import type { GPT5JobStatus, GPT5Job } from '../types/gpt5';

export interface UseGPT5Return {
  job: GPT5JobStatus | null;
  status: string;
  result: string | null;
  streamingText: string | null;
  chunks: string[];
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook to poll GPT-5 job status with real-time streaming support
 * @param jobId - Job ID to poll
 * @param pollInterval - Polling interval in milliseconds (default: 500ms for better UX)
 */
export function useGPT5(jobId: string | null, pollInterval: number = 500): UseGPT5Return {
  const [job, setJob] = useState<GPT5JobStatus | null>(null);
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string | null>(null);
  const [chunks, setChunks] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);

  useEffect(() => {
    if (!jobId) {
      // Clear any existing polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPollingRef.current = false;
      setJob(null);
      setStatus('');
      setResult(null);
      setStreamingText(null);
      setChunks([]);
      setError(null);
      setIsLoading(false);
      return;
    }

    // Start polling
    isPollingRef.current = true;
    setIsLoading(true);

    const pollJobStatus = async () => {
      if (!isPollingRef.current || !jobId) {
        return;
      }

      try {
        const response = await getGPT5JobStatus(jobId);

        if (response.success && response.job) {
          const jobData: GPT5Job = response.job;
          setJob(response);
          setStatus(jobData.status);

          // Handle different statuses
          if (jobData.status === 'processing' && jobData.result) {
            // Check for streaming text or chunks during processing
            const streaming = jobData.result.streaming_text || 
              (jobData.result.streaming_chunks?.join('') || '');
            
            if (streaming) {
              setStreamingText(streaming);
              // Also update chunks if available
              if (jobData.result.streaming_chunks) {
                setChunks(jobData.result.streaming_chunks);
              }
            }
            // Continue polling
          } else if (jobData.status === 'completed' && jobData.result) {
            // Final result when completed
            const finalText = jobData.result.text || 
              (jobData.result.chunks?.join('') || '');
            
            setResult(finalText);
            setStreamingText(null); // Clear streaming text
            
            // Update chunks if available
            if (jobData.result.chunks) {
              setChunks(jobData.result.chunks);
            } else if (finalText) {
              // If we have text but no chunks, treat entire text as single chunk
              setChunks([finalText]);
            }
            
            // Stop polling when completed
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            isPollingRef.current = false;
            setIsLoading(false);
          } else if (jobData.status === 'error') {
            setError(jobData.error || 'Job failed');
            setStreamingText(null);
            setChunks([]);
            // Stop polling when error
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
              intervalRef.current = null;
            }
            isPollingRef.current = false;
            setIsLoading(false);
          } else if (jobData.status === 'queued' || jobData.status === 'starting') {
            // Job is queued or starting, continue polling
            setStreamingText(null);
          }
        } else {
          setError('Failed to get job status');
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error polling job status:', err);
        setError(err.message || 'Failed to get job status');
        // Don't stop polling on error, might be temporary network issue
      }
    };

    // Poll immediately, then at intervals
    pollJobStatus();
    intervalRef.current = setInterval(pollJobStatus, pollInterval);

    // Cleanup
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, [jobId, pollInterval]);

  return {
    job,
    status,
    result,
    streamingText,
    chunks,
    error,
    isLoading,
  };
}


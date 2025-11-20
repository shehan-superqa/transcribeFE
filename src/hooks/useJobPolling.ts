/**
 * Hook for polling job status using GET /api/jobs/{job_id}
 */

import { useEffect, useState, useRef } from 'react';
import { getJobStatus } from '../lib/api/jobsApi';
import type { Job } from '../types/api';

export interface UseJobPollingReturn {
  job: Job | null;
  status: string;
  progress: number;
  message: string;
  result: any | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Hook to poll job status for a transcription job
 * Polls GET /api/jobs/{job_id} endpoint at regular intervals
 */
export function useJobPolling(jobId: string | null, pollInterval: number = 2000): UseJobPollingReturn {
  const [job, setJob] = useState<Job | null>(null);
  const [status, setStatus] = useState<string>('');
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [result, setResult] = useState<any | null>(null);
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
      setProgress(0);
      setMessage('');
      setResult(null);
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
        const response = await getJobStatus(jobId);
        
        // Log response for debugging (remove in production)
        console.log('Job status response:', response);
        
        if (response.success && response.job) {
          const jobData = response.job;
          setJob(jobData as Job);
          setStatus(jobData.status || '');
          
          // Calculate progress based on actual API response
          // Check multiple possible locations for progress information
          let calculatedProgress = 0;
          let statusMessage = '';

          // 1. Check if response has a state field with progress info
          if (response.state && typeof response.state === 'object') {
            const state = response.state as any;
            if (typeof state.progress === 'number') {
              calculatedProgress = Math.min(Math.max(state.progress, 0), 100);
              statusMessage = state.message || state.status || 'Processing...';
            }
          }

          // 2. Check if job object has a progress field directly
          if (!calculatedProgress && (jobData as any).progress !== undefined) {
            calculatedProgress = Math.min(Math.max((jobData as any).progress, 0), 100);
          }

          // 3. Check if job has a percentage field
          if (!calculatedProgress && (jobData as any).percentage !== undefined) {
            calculatedProgress = Math.min(Math.max((jobData as any).percentage, 0), 100);
          }

          // Check if replicate_data contains progress information
          if (!calculatedProgress && jobData.replicate_data) {
            const replicateData = jobData.replicate_data;
            
            // Replicate API often provides status and progress
            if (replicateData.status) {
              const replicateStatus = replicateData.status;
              
              if (replicateStatus === 'starting') {
                calculatedProgress = 5;
                statusMessage = 'Initializing transcription model...';
              } else if (replicateStatus === 'processing') {
                // If replicate provides logs or progress, use it
                if (replicateData.logs && Array.isArray(replicateData.logs)) {
                  // Estimate progress based on log entries
                  const logCount = replicateData.logs.length;
                  calculatedProgress = Math.min(10 + (logCount * 2), 90);
                  statusMessage = `Processing audio (${logCount} steps completed)`;
                } else {
                  // Estimate based on elapsed time if started_at is available
                  if (jobData.started_at) {
                    const started = new Date(jobData.started_at).getTime();
                    const now = Date.now();
                    const elapsedSeconds = (now - started) / 1000;
                    // Estimate: typical transcription takes 30-120 seconds
                    // Use a conservative estimate
                    calculatedProgress = Math.min(20 + Math.floor((elapsedSeconds / 60) * 60), 90);
                    statusMessage = `Processing audio (${Math.floor(elapsedSeconds)}s elapsed)`;
                  } else {
                    calculatedProgress = 30;
                    statusMessage = 'Processing audio...';
                  }
                }
              } else if (replicateStatus === 'succeeded') {
                calculatedProgress = 95;
                statusMessage = 'Finalizing transcription...';
              } else if (replicateStatus === 'failed' || replicateStatus === 'canceled') {
                calculatedProgress = 0;
                statusMessage = replicateData.error || 'Transcription failed';
              }
            }
          }

          // Fallback to status-based progress if no replicate_data or progress info
          if (calculatedProgress === 0 && !statusMessage) {
            if (jobData.status === 'queued') {
              calculatedProgress = 0;
              statusMessage = 'Job is queued and waiting to start';
            } else if (jobData.status === 'starting') {
              calculatedProgress = 5;
              statusMessage = 'Job is initializing';
            } else if (jobData.status === 'processing') {
              // Calculate progress based on elapsed time
              if (jobData.started_at) {
                const started = new Date(jobData.started_at).getTime();
                const now = Date.now();
                const elapsedSeconds = (now - started) / 1000;
                // Estimate progress: 10% base + up to 80% based on time (assuming ~60s average)
                calculatedProgress = Math.min(10 + Math.floor((elapsedSeconds / 60) * 80), 90);
                statusMessage = `Processing audio (${Math.floor(elapsedSeconds)}s elapsed)`;
              } else {
                calculatedProgress = 20;
                statusMessage = 'Job is processing';
              }
            } else if (jobData.status === 'completed') {
              calculatedProgress = 100;
              statusMessage = 'Job completed successfully';
              setResult(jobData.result || null);
              // Stop polling when completed
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              isPollingRef.current = false;
              setIsLoading(false);
            } else if (jobData.status === 'error' || jobData.status === 'cancelled') {
              calculatedProgress = 0;
              statusMessage = jobData.error || `Job ${jobData.status}`;
              setError(jobData.error || `Job ${jobData.status}`);
              // Stop polling when error or cancelled
              if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
              }
              isPollingRef.current = false;
              setIsLoading(false);
            }
          }

          setProgress(calculatedProgress);
          setMessage(statusMessage);
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
    progress,
    message,
    result,
    error,
    isLoading,
  };
}


import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { convertYouTubeToM4A, isValidYouTubeUrl, ConversionProgress } from '../../lib/youtubeConverter';
import { submitTranscriptionJob, type TranscriptionJobOptions } from '../../lib/transcribeApi';
import { getJobStatus } from '../../lib/api/jobsApi';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { checkAuthAndTriggerModal } from '../../lib/authCheck';
import { InputMode } from './types';

export const useTranscription = (
  mode: InputMode,
  file: File | null,
  youtubeUrl: string,
  audioChunksRef: React.MutableRefObject<Blob[]>,
  energyPoints: number,
  setEnergyPoints: (points: number) => void,
  onTranscriptionStart?: () => void
) => {
  const { user } = useAuth();
  const { openModal } = useAuthModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPollingRef = useRef<boolean>(false);
  const performSubmission = useRef(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      isPollingRef.current = false;
    };
  }, []);

  const executeSubmission = async () => {
    if (performSubmission.current) return;
    performSubmission.current = true;

    setLoading(true);
    setError('');
    onTranscriptionStart?.();

    try {
      let fileToUpload: File | null = null;

      // Handle YouTube conversion
      if (mode === 'youtube' && youtubeUrl) {
        try {
          setConverting(true);
          setConversionProgress({ progress: 0, stage: 'loading' });
          
          // Convert YouTube video to M4A
          fileToUpload = await convertYouTubeToM4A(youtubeUrl, (progress) => {
            setConversionProgress(progress);
          });
          
          setConverting(false);
          setConversionProgress(null);
        } catch (conversionError: any) {
          setConverting(false);
          setConversionProgress(null);
          setError(conversionError.message || 'Failed to convert YouTube video. Please check your backend proxy configuration.');
          setLoading(false);
          return;
        }
      } else if (mode === 'file' && file) {
        fileToUpload = file;
      } else if (mode === 'recording') {
        // For recording, create file from audio chunks
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          fileToUpload = new File([audioBlob], 'recording.webm', { type: 'audio/webm' });
        }
      }

      if (!fileToUpload) {
        setError('No file to upload');
        setLoading(false);
        return;
      }

      // Submit transcription job to API
      const jobOptions: TranscriptionJobOptions = {
        engine: 'whisper', // Default engine, can be made configurable
        language: 'en', // Default language, can be made configurable
      };

      const response = await submitTranscriptionJob(fileToUpload, jobOptions);

      if (response.success && response.accepted) {
        // Start polling job status
        const jobId = response.job_id;
        isPollingRef.current = true;

        // Clear any existing polling
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }

        // Poll job status every 2 seconds
        const pollJobStatus = async () => {
          if (!isPollingRef.current || !jobId) {
            return;
          }

          try {
            const statusResponse = await getJobStatus(jobId);
            
            if (statusResponse.success && statusResponse.job) {
              const job = statusResponse.job;
              console.log('Job status:', job.status);

              // Check if job is complete
              if (job.status === 'completed') {
                setLoading(false);
                isPollingRef.current = false;
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
                // Job completed, refresh transcriptions list
                onTranscriptionStart?.();
              } else if (job.status === 'error' || job.status === 'cancelled') {
                setError(job.error || `Transcription ${job.status}`);
                setLoading(false);
                isPollingRef.current = false;
                if (pollingIntervalRef.current) {
                  clearInterval(pollingIntervalRef.current);
                  pollingIntervalRef.current = null;
                }
              }
              // Continue polling for other statuses (queued, starting, processing)
            }
          } catch (err: any) {
            console.error('Error polling job status:', err);
            // Don't stop polling on error, might be temporary network issue
          }
        };

        // Start polling
        pollingIntervalRef.current = setInterval(pollJobStatus, 2000);
        // Poll immediately
        pollJobStatus();

        // Reset form
        audioChunksRef.current = [];
        
        // Note: Energy points deduction is handled by the backend
        // The frontend will refresh user data to get updated energy points
      } else {
        setError('Failed to submit transcription job');
        setLoading(false);
      }
    } catch (err: any) {
      // Check if this is an authentication error
      if (
        err.message?.includes('not authenticated') ||
        err.message?.includes('Please log in') ||
        err.message?.includes('Authentication failed') ||
        err.message?.includes('Authentication required') ||
        err.response?.status === 401
      ) {
        // Show auth modal - will retry submission after successful auth
        checkAuthAndTriggerModal(openModal, executeSubmission);
        setLoading(false);
        return;
      }

      setError(err.message || 'Failed to start transcription');
      setLoading(false);
    } finally {
      performSubmission.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (energyPoints < 10) {
      setError('Not enough energy points. Please upgrade your plan.');
      return;
    }

    if (mode === 'file' && !file) {
      setError('Please select a file');
      return;
    }

    if (mode === 'youtube' && !youtubeUrl) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (mode === 'youtube' && !isValidYouTubeUrl(youtubeUrl)) {
      setError('Please enter a valid YouTube URL');
      return;
    }

    if (mode === 'recording' && audioChunksRef.current.length === 0) {
      setError('Please record audio first');
      return;
    }

    // Check authentication before proceeding
    if (!checkAuthAndTriggerModal(openModal, executeSubmission)) {
      // Auth modal was opened, stop here
      return;
    }

    // User is authenticated, proceed with submission
    await executeSubmission();
  };

  return {
    loading,
    error,
    converting,
    conversionProgress,
    handleSubmit,
    setError,
  };
};


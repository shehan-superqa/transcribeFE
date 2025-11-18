import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { convertYouTubeToM4A, isValidYouTubeUrl, ConversionProgress } from '../../lib/youtubeConverter';
import { submitTranscriptionJob, type TranscriptionJobOptions } from '../../lib/transcribeApi';
import { createSSEConnection, type SSEClient, type ProgressEvent } from '../../lib/sseClient';
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [converting, setConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<ConversionProgress | null>(null);
  const sseClientRef = useRef<SSEClient | null>(null);

  // Cleanup SSE connection on unmount
  useEffect(() => {
    return () => {
      if (sseClientRef.current) {
        sseClientRef.current.close();
        sseClientRef.current = null;
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('Please sign in to use transcription');
      return;
    }

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
        // Set up SSE connection for progress updates
        if (response.stream_url) {
          // Close any existing SSE connection
          if (sseClientRef.current) {
            sseClientRef.current.close();
          }

          // Create new SSE connection
          sseClientRef.current = createSSEConnection(
            response.stream_url,
            response.job_id,
            (event: ProgressEvent) => {
              // Handle progress updates
              console.log('Transcription progress:', event);
              
              if (event.status === 'completed') {
                setLoading(false);
                // Job completed, refresh transcriptions list
                onTranscriptionStart?.();
              } else if (event.status === 'error') {
                setError(event.error || 'Transcription failed');
                setLoading(false);
              }
            },
            (error) => {
              console.error('SSE error:', error);
              // Don't set error here as EventSource will try to reconnect
            }
          );
        }

        // Reset form
        audioChunksRef.current = [];
        
        // Note: Energy points deduction is handled by the backend
        // The frontend will refresh user data to get updated energy points
      } else {
        setError('Failed to submit transcription job');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start transcription');
      setLoading(false);
    }
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


/**
 * Transcription store
 */

import { create } from 'zustand';
import type { Job, TranscriptionResult, TranscriptionConfig } from '../types/api';
import { submitTranscriptionJob } from '../lib/api/transcriptionApi';

interface TranscriptionState {
  currentJob: Job | null;
  isProcessing: boolean;
  results: TranscriptionResult | null;
  error: string | null;
  submitJob: (file: File, config: TranscriptionConfig) => Promise<string | null>;
  cancelJob: (jobId: string) => Promise<void>;
  clearResults: () => void;
  setResults: (results: TranscriptionResult) => void;
  setError: (error: string | null) => void;
  setCurrentJob: (job: Job | null) => void;
  setIsProcessing: (isProcessing: boolean) => void;
}

export const transcriptionStore = create<TranscriptionState>((set, get) => ({
  currentJob: null,
  isProcessing: false,
  results: null,
  error: null,

  submitJob: async (file: File, config: TranscriptionConfig) => {
    try {
      set({ isProcessing: true, error: null });
      
      const response = await submitTranscriptionJob(file, config);
      
      set({ 
        currentJob: {
          _id: response.job_id,
          user_id: '', // Will be set from auth
          file_info: response.file_info,
          engine_used: response.engine_used,
          status: 'queued',
          created_at: new Date().toISOString(),
        } as Job,
      });

      return response.job_id;
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Failed to submit job';
      set({ error: errorMessage, isProcessing: false });
      return null;
    }
  },

  cancelJob: async (jobId: string) => {
    // Implementation will call API cancel endpoint
    set({ isProcessing: false, currentJob: null });
  },

  clearResults: () => {
    set({ results: null, error: null, currentJob: null });
  },

  setResults: (results: TranscriptionResult) => {
    set({ results, isProcessing: false, error: null });
  },

  setError: (error: string | null) => {
    set({ error, isProcessing: false });
  },

  setCurrentJob: (job: Job | null) => {
    set({ currentJob: job });
  },

  setIsProcessing: (isProcessing: boolean) => {
    set({ isProcessing });
  },
}));


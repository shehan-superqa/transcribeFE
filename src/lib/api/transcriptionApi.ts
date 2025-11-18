/**
 * Transcription API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { SubmitJobResponse, TranscriptionConfig, TranscriptionResult } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: 300000, // 5 minutes for large file uploads
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Submit a transcription job
 */
export async function submitTranscriptionJob(
  file: File,
  config: TranscriptionConfig = {}
): Promise<SubmitJobResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);
  if (config.job_id) formData.append('job_id', config.job_id);

  const response = await apiClient.post<SubmitJobResponse>('/api/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Simple transcription (synchronous, returns only text)
 */
export async function simpleTranscription(
  file: File,
  config: TranscriptionConfig = {}
): Promise<{ success: boolean; text: string; processing_time_seconds: number; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);

  const response = await apiClient.post('/api/transcribe/simple', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Batch transcription
 */
export async function batchTranscription(
  files: File[],
  config: TranscriptionConfig = {}
): Promise<{
  success: boolean;
  results: Array<{
    file_path: string;
    filename: string;
    success: boolean;
    transcription?: TranscriptionResult;
    error?: string;
  }>;
  total: number;
  successful: number;
  failed: number;
}> {
  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);

  const response = await apiClient.post('/api/transcribe/batch', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return response.data;
}

/**
 * Get available models and languages
 */
export async function getAvailableModels(): Promise<{
  success: boolean;
  models: string[];
  languages: string[];
  engines: string[];
  engines_status: Record<string, any>;
}> {
  const response = await apiClient.get('/api/models');
  return response.data;
}


/**
 * Transcription API endpoints
 */

import axios from 'axios';
import { getAccessToken, getStoredUser } from '../api';
import type { SubmitJobResponse, TranscriptionConfig, TranscriptionResult } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 300000, // 5 minutes for large file uploads
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Add auth token to requests and handle FormData correctly
  client.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // If the data is FormData, ensure proper handling
      if (config.data instanceof FormData) {
        // Remove Content-Type header so browser/axios can set it with boundary
        if (config.headers) {
          delete config.headers['Content-Type'];
          // Also try common header property names
          if ('common' in config.headers && config.headers.common) {
            delete (config.headers.common as any)['Content-Type'];
          }
        }
        // Ensure axios doesn't transform FormData
        config.transformRequest = [];
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
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', user.id);
  
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);
  if (config.job_id) formData.append('job_id', config.job_id);

  // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
  // Don't set it manually to allow axios to include the boundary parameter
  const response = await apiClient.post<SubmitJobResponse>('/api/transcribe', formData);

  return response.data;
}

/**
 * Simple transcription (synchronous, returns only text)
 */
export async function simpleTranscription(
  file: File,
  config: TranscriptionConfig = {}
): Promise<{ 
  success: boolean; 
  text: string; 
  processing_time_seconds: number;
  processing_time_formatted?: string;
  engine_used?: string;
  error?: string;
}> {
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', user.id);
  
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);

  // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
  const response = await apiClient.post('/api/transcribe/simple', formData);

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
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const formData = new FormData();
  
  files.forEach((file) => {
    formData.append('files', file);
  });
  
  formData.append('user_id', user.id);
  if (config.engine) formData.append('engine', config.engine);
  if (config.language) formData.append('language', config.language);
  if (config.model) formData.append('model', config.model);

  // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
  const response = await apiClient.post('/api/transcribe/batch', formData);

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
  try {
    const response = await apiClient.get('/api/models');
    return response.data;
  } catch (error: any) {
    // Handle 404 and other errors gracefully
    if (error.response?.status === 404) {
      console.warn('Models endpoint not found (404). Using default values.');
      return {
        success: false,
        models: ['base', 'small', 'medium', 'large'],
        languages: ['en'],
        engines: ['whisper', 'google', 'openai', 'replicate'],
        engines_status: {},
      };
    }
    // Re-throw other errors
    throw error;
  }
}

/**
 * Health check for transcription API
 * No authentication required as per API instructions
 */
export async function healthCheckTranscribe(): Promise<{ 
  status: string; 
  service: string; 
  version?: string;
}> {
  try {
    // Health check doesn't require auth, so use fetch directly
    const response = await fetch(`${TRANSCRIBE_API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Health check failed with status: ${response.status}`);
    }
    return await response.json();
  } catch (error: any) {
    throw new Error(`Health check failed: ${error.message || 'Unknown error'}`);
  }
}


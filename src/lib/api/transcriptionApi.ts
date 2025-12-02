/**
 * Transcription API endpoints
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getStoredUser, refreshAccessToken, clearAuthData } from '../api';
import type { SubmitJobResponse, TranscriptionConfig, TranscriptionResult, ModelsResponse } from '../../types/api';

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

  // Add response interceptor to handle 401 errors with token refresh
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // If error is 401 and we haven't retried yet
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh the token
          const newToken = await refreshAccessToken();
          
          if (newToken && originalRequest.headers) {
            // Update the authorization header with the new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            
            // Retry the original request
            return client(originalRequest);
          } else {
            // Token refresh failed, clear auth data
            clearAuthData();
            return Promise.reject(new Error('Authentication failed. Please log in again.'));
          }
        } catch (refreshError) {
          // Token refresh failed, clear auth data
          clearAuthData();
          return Promise.reject(new Error('Authentication failed. Please log in again.'));
        }
      }

      // Handle auth service 404 errors gracefully
      if (error.response?.status === 404 && error.config?.url?.includes('/api/transcribe')) {
        return Promise.reject(new Error('Authentication service unavailable. Please try again later.'));
      }

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
  if (config.processing_mode) formData.append('processing_mode', config.processing_mode);
  if (config.enable_punctuation !== undefined) formData.append('enable_punctuation', config.enable_punctuation.toString());
  if (config.enable_capitalization !== undefined) formData.append('enable_capitalization', config.enable_capitalization.toString());

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
  if (config.processing_mode) formData.append('processing_mode', config.processing_mode);
  if (config.enable_punctuation !== undefined) formData.append('enable_punctuation', config.enable_punctuation.toString());
  if (config.enable_capitalization !== undefined) formData.append('enable_capitalization', config.enable_capitalization.toString());

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
  if (config.processing_mode) formData.append('processing_mode', config.processing_mode);
  if (config.enable_punctuation !== undefined) formData.append('enable_punctuation', config.enable_punctuation.toString());
  if (config.enable_capitalization !== undefined) formData.append('enable_capitalization', config.enable_capitalization.toString());

  // Axios automatically sets Content-Type: multipart/form-data with boundary for FormData
  const response = await apiClient.post('/api/transcribe/batch', formData);

  return response.data;
}

/**
 * Get available models and languages
 */
export async function getAvailableModels(): Promise<ModelsResponse> {
  try {
    const response = await apiClient.get<ModelsResponse>('/api/models');
    const data = response.data;
    
    // Handle both new and legacy response formats
    if (data.engines && Array.isArray(data.engines) && data.engines.length > 0) {
      // New format with engines array
      return data;
    } else if (data.models && Array.isArray(data.models)) {
      // Legacy format - convert to new format
      return {
        ...data,
        engines: (data.engines as any as string[] || []).map((engineName: string) => ({
          name: engineName,
          available: data.engines_status?.[engineName]?.available ?? true,
          models: engineName === 'whisper' ? (data.models || []) : [],
          status: data.engines_status?.[engineName],
        })),
      };
    }
    
    // Fallback to default values
    return {
      success: false,
      engines: [
        {
          name: 'whisper',
          available: true,
          models: ['base', 'small', 'medium', 'large'],
        },
      ],
      languages: ['en'],
      models: ['base', 'small', 'medium', 'large'],
    };
  } catch (error: any) {
    // Handle 404 and other errors gracefully
    if (error.response?.status === 404) {
      console.warn('Models endpoint not found (404). Using default values.');
      return {
        success: false,
        engines: [
          {
            name: 'whisper',
            available: true,
            models: ['base', 'small', 'medium', 'large'],
          },
        ],
        languages: ['en'],
        models: ['base', 'small', 'medium', 'large'],
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

/**
 * Start model training
 */
export async function startTraining(config: {
  language: string;
  audio_dir?: string;
  transcriptions_file?: string;
  audio_files?: File[];
  transcriptions_file_data?: File;
}): Promise<{
  success: boolean;
  training_id: string;
  message: string;
}> {
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const formData = new FormData();
  formData.append('user_id', user.id);
  formData.append('language', config.language);
  
  if (config.audio_dir) {
    formData.append('audio_dir', config.audio_dir);
  }
  if (config.transcriptions_file) {
    formData.append('transcriptions_file', config.transcriptions_file);
  }
  if (config.audio_files) {
    config.audio_files.forEach((file) => {
      formData.append('audio_files', file);
    });
  }
  if (config.transcriptions_file_data) {
    formData.append('transcriptions_file_data', config.transcriptions_file_data);
  }

  const response = await apiClient.post('/api/train', formData);
  return response.data;
}

/**
 * Get training status
 */
export async function getTrainingStatus(trainingId: string): Promise<{
  success: boolean;
  training_id: string;
  status: 'queued' | 'preparing' | 'training' | 'completed' | 'error' | 'cancelled';
  progress: number;
  message: string;
  log?: string[];
  error?: string;
}> {
  const response = await apiClient.get(`/api/train/${trainingId}`);
  return response.data;
}

/**
 * Cancel training
 */
export async function cancelTraining(trainingId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiClient.post(`/api/train/${trainingId}/cancel`);
  return response.data;
}


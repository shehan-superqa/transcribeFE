/**
 * Transcription API Client
 * Handles all communication with the Transcription API backend
 */

import { authenticatedFetch, handleResponse, getAccessToken, refreshAccessToken, clearAuthData, getStoredUser } from './api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

export interface TranscriptionJobOptions {
  engine?: string;
  language?: string;
  model?: string;
  job_id?: string;
}

export interface SubmitJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  file_info: {
    filename: string;
    size: number;
  };
  engine_requested?: string;
  engine_used?: string;
  processing_time?: {
    total_seconds: number;
    formatted: string;
  };
}

export interface JobResult {
  _id: string;
  user_id: string;
  file_info: {
    filename: string;
    size: number;
  };
  engine_requested?: string;
  engine_used?: string;
  status: 'queued' | 'starting' | 'processing' | 'completed' | 'error' | 'cancelled';
  result?: {
    text: string;
  };
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  replicate_data?: any;
}

export interface JobStatusResponse {
  success: boolean;
  job_id: string;
  job: JobResult;
}

export interface UserJobsResponse {
  success: boolean;
  jobs: JobResult[];
}

export interface Model {
  name: string;
  description?: string;
}

export interface ModelsResponse {
  success: boolean;
  models: Model[];
}

export interface CancelJobResponse {
  success: boolean;
  message: string;
}

/**
 * Submit a transcription job
 */
export async function submitTranscriptionJob(
  file: File,
  options: TranscriptionJobOptions = {}
): Promise<SubmitJobResponse> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('user_id', user.id);

  if (options.engine) {
    formData.append('engine', options.engine);
  }
  if (options.language) {
    formData.append('language', options.language);
  }
  if (options.model) {
    formData.append('model', options.model);
  }
  if (options.job_id) {
    formData.append('job_id', options.job_id);
  }

  // For multipart/form-data, we need to let the browser set Content-Type with boundary
  // So we'll manually construct the headers without Content-Type
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(`${TRANSCRIBE_API_BASE_URL}/api/transcribe`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Handle 401 and retry with token refresh if needed
  if (response.status === 401) {
    const newToken = await refreshAccessToken();
    
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${TRANSCRIBE_API_BASE_URL}/api/transcribe`, {
        method: 'POST',
        headers,
        body: formData,
      });
      return handleResponse<SubmitJobResponse>(retryResponse);
    } else {
      clearAuthData();
      throw new Error('Authentication failed');
    }
  }

  return handleResponse<SubmitJobResponse>(response);
}

/**
 * Get job status and result
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await authenticatedFetch(
    `/api/jobs/${jobId}`,
    {
      method: 'GET',
    },
    true,
    TRANSCRIBE_API_BASE_URL
  );

  return handleResponse<JobStatusResponse>(response);
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId: string): Promise<UserJobsResponse> {
  // Updated to match API instructions: GET /api/jobs/user/{user_id}
  const response = await authenticatedFetch(
    `/api/jobs/user/${userId}`,
    {
      method: 'GET',
    },
    true,
    TRANSCRIBE_API_BASE_URL
  );

  return handleResponse<UserJobsResponse>(response);
}

/**
 * Cancel a specific job
 */
export async function cancelJob(jobId: string): Promise<CancelJobResponse> {
  const response = await authenticatedFetch(
    `/api/jobs/${jobId}/cancel`,
    {
      method: 'POST',
    },
    true,
    TRANSCRIBE_API_BASE_URL
  );

  return handleResponse<CancelJobResponse>(response);
}

/**
 * Cancel all jobs for a user
 */
export async function cancelUserJobs(userId: string): Promise<CancelJobResponse> {
  const response = await authenticatedFetch(
    `/api/users/${userId}/cancel`,
    {
      method: 'POST',
    },
    true,
    TRANSCRIBE_API_BASE_URL
  );

  return handleResponse<CancelJobResponse>(response);
}

/**
 * Get available models (public endpoint, no auth required)
 */
export async function getModels(): Promise<ModelsResponse> {
  const response = await fetch(`${TRANSCRIBE_API_BASE_URL}/api/models`);
  return handleResponse<ModelsResponse>(response);
}

/**
 * Health check for transcription API
 */
export async function healthCheckTranscribe(): Promise<{ status: string; service: string; version?: string }> {
  const response = await fetch(`${TRANSCRIBE_API_BASE_URL}/health`);
  return handleResponse(response);
}


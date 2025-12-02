/**
 * Image Generation API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { ImageJobRequest, ImageJobResponse, ImageJobStatusResponse } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 300000, // 5 minutes for image generation
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
 * Submit an image generation job
 */
export async function submitImageJob(
  request: ImageJobRequest
): Promise<ImageJobResponse> {
  const response = await apiClient.post<ImageJobResponse>('/api/image', request);
  return response.data;
}

/**
 * Get image job status and result
 */
export async function getImageJobStatus(jobId: string): Promise<ImageJobStatusResponse> {
  const response = await apiClient.get<ImageJobStatusResponse>(`/api/image/jobs/${jobId}`);
  return response.data;
}



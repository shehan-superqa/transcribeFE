/**
 * Image Training (LoRA) API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { ImageTrainingJobRequest, ImageTrainingJobResponse, ImageTrainingJobStatusResponse } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 600000, // 10 minutes for training submission
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
 * Submit an image training job
 */
export async function submitImageTrainingJob(
  request: ImageTrainingJobRequest
): Promise<ImageTrainingJobResponse> {
  const response = await apiClient.post<ImageTrainingJobResponse>('/api/image/train', request);
  return response.data;
}

/**
 * Get image training job status and result
 */
export async function getImageTrainingJobStatus(jobId: string): Promise<ImageTrainingJobStatusResponse> {
  const response = await apiClient.get<ImageTrainingJobStatusResponse>(`/api/image/train/jobs/${jobId}`);
  return response.data;
}



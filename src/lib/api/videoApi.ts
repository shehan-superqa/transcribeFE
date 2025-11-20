/**
 * Video Generation API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { VideoJobRequest, VideoJobResponse, VideoJobStatusResponse } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 600000, // 10 minutes for video generation
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
 * Submit a video generation job
 */
export async function submitVideoJob(
  request: VideoJobRequest
): Promise<VideoJobResponse> {
  const response = await apiClient.post<VideoJobResponse>('/api/video', request);
  return response.data;
}

/**
 * Get video job status and result
 */
export async function getVideoJobStatus(jobId: string): Promise<VideoJobStatusResponse> {
  const response = await apiClient.get<VideoJobStatusResponse>(`/api/video/jobs/${jobId}`);
  return response.data;
}


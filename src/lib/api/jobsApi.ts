/**
 * Job management API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { Job } from '../../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: API_BASE_URL,
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
 * Get job status and result
 */
export async function getJobStatus(jobId: string): Promise<{ success: boolean; job_id: string; job?: Job; state?: any }> {
  const response = await apiClient.get(`/api/jobs/${jobId}`);
  return response.data;
}

/**
 * Get all jobs for a user
 */
export async function getUserJobs(userId: string): Promise<{ success: boolean; jobs: Job[] }> {
  const response = await apiClient.get(`/api/users/${userId}/jobs`);
  return response.data;
}

/**
 * Cancel a specific job
 */
export async function cancelJob(jobId: string): Promise<{ success: boolean; cancelled: number; failures?: any[] }> {
  const response = await apiClient.post(`/api/jobs/${jobId}/cancel`);
  return response.data;
}

/**
 * Cancel all active jobs for a user
 */
export async function cancelUserJobs(userId: string, jobId?: string): Promise<{ success: boolean; cancelled: number; failures?: any[] }> {
  const data = jobId ? { job_id: jobId } : {};
  const response = await apiClient.post(`/api/users/${userId}/cancel`, data);
  return response.data;
}


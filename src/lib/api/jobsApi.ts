/**
 * Job management API endpoints
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken, clearAuthData } from '../api';
import type { Job } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
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
      if (error.response?.status === 404 && error.config?.url?.includes('/api/jobs')) {
        return Promise.reject(new Error('Authentication service unavailable. Please try again later.'));
      }

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
  // Updated to match API instructions: GET /api/jobs/user/{user_id}
  const response = await apiClient.get(`/api/jobs/user/${userId}`);
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

/**
 * Delete a specific job
 */
export async function deleteJob(jobId: string): Promise<{ success: boolean; deleted: number; message?: string }> {
  const response = await apiClient.delete(`/api/jobs/${jobId}`);
  return response.data;
}


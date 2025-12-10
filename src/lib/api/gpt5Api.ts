/**
 * GPT-5 API endpoints
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, refreshAccessToken, clearAuthData, TRANSCRIBE_API_BASE_URL } from '../api';
import type {
  GPT5TextGenerationRequest,
  GPT5ChatCompletionRequest,
  GPT5JobResponse,
  GPT5JobStatus,
} from '../../types/gpt5';

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

      // Handle 404 errors - endpoint not found
      if (error.response?.status === 404) {
        const endpoint = originalRequest?.url || 'endpoint';
        return Promise.reject(new Error(
          `GPT-5 endpoint not found (404). The backend endpoint ${endpoint} may not be available yet. ` +
          `Please ensure the GPT-5 service is running and the endpoint is configured.`
        ));
      }

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

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Text Generation: POST /api/gpt5/generate
 */
export async function generateText(
  request: GPT5TextGenerationRequest
): Promise<GPT5JobResponse> {
  const response = await apiClient.post<GPT5JobResponse>('/api/gpt5/generate', request);
  return response.data;
}

/**
 * Chat Completion: POST /api/gpt5/chat
 */
export async function chatCompletion(
  request: GPT5ChatCompletionRequest
): Promise<GPT5JobResponse> {
  const response = await apiClient.post<GPT5JobResponse>('/api/gpt5/chat', request);
  return response.data;
}

/**
 * Get Job Status: GET /api/gpt5/job/<job_id>
 * Returns job status with nested job object structure
 */
export async function getGPT5JobStatus(jobId: string): Promise<GPT5JobStatus> {
  const response = await apiClient.get<GPT5JobStatus>(`/api/gpt5/job/${jobId}`);
  return response.data;
}


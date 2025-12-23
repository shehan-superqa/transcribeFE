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
 * Use TRANSCRIBE_API_BASE_URL (port 5000) to call Flask backend directly
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL, // Use port 5000 to call Flask backend directly
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
 * 
 * Transforms the request format to match backend expectations:
 * - Converts messages array to a single message string
 * - Validates message is non-empty to prevent 400 errors
 * - Ensures context and model fields are properly formatted
 */
export async function chatCompletion(
  request: GPT5ChatCompletionRequest
): Promise<GPT5JobResponse> {
  // Transform messages array to single message string if needed
  let message: string;
  let context: Record<string, any> = {};
  let model: string | undefined;

  // Handle different request formats
  if ('messages' in request && Array.isArray(request.messages)) {
    // Convert messages array to a single message string
    // Combine system and user messages
    const systemMessage = request.messages.find(m => m.role === 'system')?.content || '';
    const userMessage = request.messages.find(m => m.role === 'user')?.content || '';
    
    message = systemMessage 
      ? `${systemMessage}\n\n${userMessage}`.trim()
      : userMessage.trim();
    
    // Extract context and model from request if present
    context = (request as any).context || {};
    model = request.model || (request as any).model;
  } else if ('message' in request) {
    // Direct message format
    message = request.message;
    context = (request as any).context || {};
    model = request.model || (request as any).model;
  } else {
    throw new Error('Invalid request format: must include either "messages" array or "message" string');
  }

  // Validate message is non-empty - prevents 400 BAD REQUEST errors
  // Backend requires a non-empty message field
  if (!message || typeof message !== 'string' || !message.trim()) {
    throw new Error('Message is required and must be a non-empty string');
  }

  // Build clean request body with required fields
  // Always include message and context to ensure valid JSON structure
  // Using defaults prevents undefined/null values that cause 400 errors
  const requestBody: {
    message: string;
    context: Record<string, any>;
    model?: string;
  } = {
    message: message.trim(), // Non-empty, validated above
    context: context || {}, // Default to empty object if not provided - prevents undefined/null
  };

  // Only include model if it has a value (not undefined/null)
  // Backend will use its default model if not provided
  if (model && typeof model === 'string' && model.trim()) {
    requestBody.model = model.trim();
  }

  // Make POST request with proper JSON handling
  // Why these changes prevent 400 errors:
  // 1. Non-empty message validation prevents backend rejection of empty messages
  // 2. Default context (empty object) prevents undefined/null which backend can't parse
  // 3. Clean request body (no undefined fields) ensures valid JSON serialization
  // 4. Proper field transformation ensures backend receives expected format
  try {
    const response = await apiClient.post<any>('/api/gpt5/chat', requestBody);
    
    // Handle different response formats from backend
    // Backend may return either:
    // 1. Direct response: { success, response, model } - immediate response
    // 2. Job-based response: { success, job_id, ... } - async job processing
    
    if (response.data) {
      const data = response.data;
      
      // Check if backend returned direct response (has 'response' field)
      if (data.success && data.response && typeof data.response === 'string') {
        // Backend returned direct response - store it for later retrieval
        // Return a job response format that indicates direct response
        return {
          success: true,
          accepted: true,
          job_id: `direct-${Date.now()}`, // Mark as direct response
          model: data.model,
          // Store the direct response in a custom field for useAdStrategy to access
          ...(data.response && { _directResponse: data.response }),
        } as any;
      }
      
      // If backend returns job-based response, return as-is
      if (data.success && data.job_id && !data.job_id.startsWith('direct-')) {
        return data as GPT5JobResponse;
      }
      
      // If response format is unexpected, log and return error
      console.error('Unexpected response format:', data);
      return {
        success: false,
        accepted: false,
        job_id: '',
      } as GPT5JobResponse;
    }
    
    return {
      success: false,
      accepted: false,
      job_id: '',
    } as GPT5JobResponse;
  } catch (error: any) {
    console.error('GPT-5 chatCompletion error:', error);
    // Re-throw with more context
    if (error.response?.data) {
      throw new Error(error.response.data.error || error.response.data.message || error.message);
    }
    throw error;
  }
}

/**
 * Get Job Status: GET /api/gpt5/job/<job_id>
 * Returns job status with nested job object structure
 */
export async function getGPT5JobStatus(jobId: string): Promise<GPT5JobStatus> {
  const response = await apiClient.get<GPT5JobStatus>(`/api/gpt5/job/${jobId}`);
  return response.data;
}


/**
 * Video Generation API endpoints
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getStoredUser, refreshAccessToken, clearAuthData } from '../api';
import type { VideoJobRequest, VideoJobResponse, VideoJobStatusResponse, VideoDubJobRequest, VideoDubJobResponse, VideoDubJobStatusResponse } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 * Same pattern as transcriptionApi.ts
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 600000, // 10 minutes for video generation
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

/**
 * Submit a video dubbing job
 * POST /api/video/dub - Main video dubbing endpoint (handles both file upload and URL)
 * Accepts either a File object or a video URL string
 * For files: sends FormData with 'file' and 'output_language'
 * For URLs: sends JSON with 'video' URL and 'output_language'
 * Token is automatically included in Authorization header
 */
export async function submitVideoDubJob(
  video: File | string,
  outputLanguage: string,
  addSubtitles: boolean = false
): Promise<VideoDubJobResponse> {
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  if (video instanceof File) {
    // Send file via FormData - same pattern as transcription
    const formData = new FormData();
    
    // Verify file exists and is valid
    if (!video || !(video instanceof File)) {
      throw new Error('Invalid video file provided');
    }
    
    // Backend expects 'video_file' for file uploads
    formData.append('video_file', video, video.name);
    formData.append('output_language', outputLanguage);
    formData.append('add_subtitles', addSubtitles.toString());
    formData.append('user_id', user.id); // Include user_id like transcription does
    
    // Debug: Log FormData contents (only in dev)
    if (import.meta.env.DEV) {
      console.log('Submitting video dubbing job with FormData:', {
        fileName: video.name,
        fileSize: video.size,
        fileType: video.type,
        outputLanguage,
        addSubtitles,
        formDataKeys: Array.from(formData.keys()),
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value
        })),
      });
      
      // Verify file is actually in FormData
      const fileFromFormData = formData.get('video_file');
      console.log('File from FormData:', fileFromFormData instanceof File ? {
        name: fileFromFormData.name,
        size: fileFromFormData.size,
        type: fileFromFormData.type
      } : 'NOT A FILE!');
    }
    
    // Use the same apiClient that handles FormData properly (same as transcription)
    const response = await apiClient.post<VideoDubJobResponse>('/api/video/dub', formData);
    return response.data;
  } else {
    // Send URL as JSON - backend expects 'video_url' field
    const request = {
      video_url: video,
      output_language: outputLanguage,
      add_subtitles: addSubtitles,
    };
    
    try {
      const response = await apiClient.post<VideoDubJobResponse>('/api/video/dub', request);
      return response.data;
    } catch (error: any) {
      // Extract error message from response
      if (error.response?.data) {
        const errorMessage = error.response.data.error || error.response.data.message || error.message || 'Failed to submit video dubbing job';
        throw new Error(errorMessage);
      }
      throw error;
    }
  }
}

/**
 * Get video dubbing job status and result
 * GET /api/video/dub/jobs/<job_id>
 */
export async function getVideoDubJobStatus(jobId: string): Promise<VideoDubJobStatusResponse> {
  const response = await apiClient.get<VideoDubJobStatusResponse>(`/api/video/dub/jobs/${jobId}`);
  return response.data;
}

/**
 * Synchronous video dubbing (waits for completion)
 * POST /api/video/dub/sync
 */
export interface VideoDubSyncRequest {
  video?: File | string; // Video file or URL
  output_language: string;
}

export interface VideoDubSyncResponse {
  success: boolean;
  video_url?: string;
  error?: string;
}

export async function submitVideoDubSync(
  video: File | string,
  outputLanguage: string
): Promise<VideoDubSyncResponse> {
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  if (video instanceof File) {
    // Send file via FormData - same pattern as transcription
    const formData = new FormData();
    formData.append('video_file', video, video.name);
    formData.append('output_language', outputLanguage);
    formData.append('user_id', user.id); // Include user_id like transcription does
    
    // Use the same apiClient that handles FormData properly
    const response = await apiClient.post<VideoDubSyncResponse>('/api/video/dub/sync', formData);
    return response.data;
  } else {
    // Send URL as JSON - backend expects 'video_url' field
    const request = {
      video_url: video,
      output_language: outputLanguage,
      user_id: user.id, // Include user_id for consistency
    };
    
    const response = await apiClient.post<VideoDubSyncResponse>('/api/video/dub/sync', request);
    return response.data;
  }
}

/**
 * Get dubbed video file by filename
 * GET /api/video/dub/file/<filename>
 */
export async function getDubbedVideoFile(filename: string): Promise<Blob> {
  // Create a client with responseType blob for video files
  const blobClient = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 600000, // 10 minutes for large video files
    responseType: 'blob',
  });

  // Add auth token to requests
  blobClient.interceptors.request.use(
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

  try {
    const response = await blobClient.get(`/api/video/dub/file/${filename}`);
    
    if (!(response.data instanceof Blob)) {
      throw new Error('Response is not a blob');
    }

    // Verify file size (at least 1KB)
    if (response.data.size < 1024) {
      throw new Error('Downloaded file is too small or corrupted (less than 1KB)');
    }

    return response.data;
  } catch (error: any) {
    // Extract error message from response
    if (error.response?.data) {
      // Try to parse error message from blob
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || errorData.message || 'Failed to download video');
          } catch {
            // If not JSON, use default message
          }
        } catch {
          // If parsing fails, use default message
        }
      }
    }
    
    throw new Error(error.message || 'Failed to download dubbed video');
  }
}

/**
 * Download dubbed video file (legacy endpoint - kept for backward compatibility)
 * Downloads the dubbed video for a completed job
 */
export async function downloadDubbedVideo(jobId: string): Promise<Blob> {
  // Create a client with responseType blob for video files
  const blobClient = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 600000, // 10 minutes for large video files
    responseType: 'blob',
  });

  // Add auth token to requests
  blobClient.interceptors.request.use(
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

  try {
    const response = await blobClient.get(`/api/video/dub/download/${jobId}`);
    
    if (!(response.data instanceof Blob)) {
      throw new Error('Response is not a blob');
    }

    // Verify file size (at least 1KB)
    if (response.data.size < 1024) {
      throw new Error('Downloaded file is too small or corrupted (less than 1KB)');
    }

    return response.data;
  } catch (error: any) {
    // Extract error message from response
    if (error.response?.data) {
      // Try to parse error message from blob
      if (error.response.data instanceof Blob) {
        try {
          const text = await error.response.data.text();
          try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.error || errorData.message || 'Failed to download video');
          } catch {
            // If not JSON, use default message
          }
        } catch {
          // If parsing fails, use default message
        }
      }
    }
    
    throw new Error(error.message || 'Failed to download dubbed video');
  }
}

/**
 * Get available languages for video dubbing
 * GET /api/video/dub/languages - Returns supported languages for video dubbing
 * Token is automatically included in Authorization header
 */
export interface DubLanguage {
  code: string;
  label: string;
}

export interface DubLanguagesResponse {
  success: boolean;
  languages: DubLanguage[];
}

export async function getDubLanguages(): Promise<DubLanguagesResponse> {
  const response = await apiClient.get<DubLanguagesResponse>('/api/video/dub/languages');
  return response.data;
}


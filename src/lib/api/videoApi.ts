/**
 * Video Generation API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { VideoJobRequest, VideoJobResponse, VideoJobStatusResponse, VideoDubJobRequest, VideoDubJobResponse, VideoDubJobStatusResponse } from '../../types/api';

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

/**
 * Submit a video dubbing job
 * Accepts either a File object or a video URL string
 * For files: sends FormData with 'video' file and 'output_language' string
 * For URLs: sends JSON with 'video' URL and 'output_language' string
 */
export async function submitVideoDubJob(
  video: File | string,
  outputLanguage: string
): Promise<VideoDubJobResponse> {
  if (video instanceof File) {
    // Send file via FormData
    const formData = new FormData();
    
    // Verify file exists and is valid
    if (!video || !(video instanceof File)) {
      throw new Error('Invalid video file provided');
    }
    
    // Backend expects 'file' for file uploads (as per backend code: request.files['file'])
    formData.append('file', video, video.name);
    formData.append('output_language', outputLanguage);
    
    // Debug: Log FormData contents (only in dev)
    if (import.meta.env.DEV) {
      console.log('Submitting video dubbing job with FormData:', {
        fileName: video.name,
        fileSize: video.size,
        fileType: video.type,
        outputLanguage,
        formDataKeys: Array.from(formData.keys()),
        formDataEntries: Array.from(formData.entries()).map(([key, value]) => ({
          key,
          value: value instanceof File ? { name: value.name, size: value.size, type: value.type } : value
        })),
      });
      
      // Verify file is actually in FormData
      const fileFromFormData = formData.get('file');
      console.log('File from FormData:', fileFromFormData instanceof File ? {
        name: fileFromFormData.name,
        size: fileFromFormData.size,
        type: fileFromFormData.type
      } : 'NOT A FILE!');
    }
    
    // Create a client that handles FormData properly
    const multipartClient = axios.create({
      baseURL: TRANSCRIBE_API_BASE_URL,
      timeout: 600000, // 10 minutes for video uploads
    });

    // Add auth token to requests
    multipartClient.interceptors.request.use(
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
          }
          config.transformRequest = [];
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    try {
      // Log request details before sending
      if (import.meta.env.DEV) {
        console.log('Sending FormData request to /api/video/dub:', {
          url: `${TRANSCRIBE_API_BASE_URL}/api/video/dub`,
          hasFile: formData.has('file'),
          hasOutputLanguage: formData.has('output_language'),
          fileValue: formData.get('file') instanceof File ? 'File object' : 'Not a file',
          outputLanguageValue: formData.get('output_language'),
        });
      }
      
      const response = await multipartClient.post<VideoDubJobResponse>('/api/video/dub', formData);
      return response.data;
    } catch (error: any) {
      // Extract error message from response
      if (error.response?.data) {
        const errorMessage = error.response.data.error || error.response.data.message || error.message || 'Failed to submit video dubbing job';
        
        // Log detailed error info
        if (import.meta.env.DEV) {
          console.error('Video dubbing API error:', {
            status: error.response.status,
            statusText: error.response.statusText,
            error: errorMessage,
            responseData: error.response.data,
          });
        }
        
        throw new Error(errorMessage);
      }
      
      // Log network errors
      if (import.meta.env.DEV) {
        console.error('Video dubbing network error:', {
          message: error.message,
          code: error.code,
        });
      }
      
      throw error;
    }
  } else {
    // Send URL as JSON
    const request: VideoDubJobRequest = {
      video: video,
      output_language: outputLanguage,
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
 */
export async function getVideoDubJobStatus(jobId: string): Promise<VideoDubJobStatusResponse> {
  const response = await apiClient.get<VideoDubJobStatusResponse>(`/api/video/dub/jobs/${jobId}`);
  return response.data;
}

/**
 * Download dubbed video file
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


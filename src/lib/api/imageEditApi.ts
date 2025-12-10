/**
 * Image Editing API endpoints
 */

import axios from 'axios';
import { getAccessToken } from '../api';
import type { ImageEditJobRequest, ImageEditJobResponse, ImageEditJobStatusResponse } from '../../types/api';

const TRANSCRIBE_API_BASE_URL = import.meta.env.VITE_TRANSCRIBE_API_BASE_URL || 'http://localhost:5000';

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 300000, // 5 minutes for image editing
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

/**
 * Create axios instance for multipart/form-data (file uploads)
 */
const createMultipartApiClient = () => {
  const client = axios.create({
    baseURL: TRANSCRIBE_API_BASE_URL,
    timeout: 300000, // 5 minutes for file uploads
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
const multipartApiClient = createMultipartApiClient();

/**
 * Submit an image editing job
 */
export async function submitImageEditJob(
  request: ImageEditJobRequest
): Promise<ImageEditJobResponse> {
  const formData = new FormData();

  // Prioritize request.image if it exists (for backend compatibility)
  if (request.image) {
    if (request.image instanceof File) {
      formData.append('image', request.image);
    } else if (typeof request.image === 'string') {
      formData.append('image_url', request.image);
    }
    
    // If we also have multiple images, append the rest
    if (request.images && request.images.length > 1) {
      const remainingImages = request.images.slice(1);
      remainingImages.forEach((img) => {
        if (img instanceof File) {
          formData.append('images', img);
        } else if (typeof img === 'string') {
          // For URLs, we'll append them separately
          const existingUrls = formData.get('image_urls') 
            ? JSON.parse(formData.get('image_urls') as string) 
            : [];
          existingUrls.push(img);
          formData.set('image_urls', JSON.stringify(existingUrls));
        }
      });
    }
  }
  // Handle multiple images if no single image provided
  else if (request.images && request.images.length > 0) {
    const files: File[] = [];
    const urls: string[] = [];
    
    request.images.forEach((img) => {
      if (img instanceof File) {
        files.push(img);
      } else if (typeof img === 'string') {
        urls.push(img);
      }
    });
    
    // Always send first image/file as 'image' or 'image_url' for backend compatibility
    if (files.length > 0) {
      formData.append('image', files[0]); // First image as 'image' for backend compatibility
      // Append remaining files as 'images' array
      for (let i = 1; i < files.length; i++) {
        formData.append('images', files[i]);
      }
    } else if (urls.length > 0) {
      formData.append('image_url', urls[0]); // First URL as 'image_url' for backend compatibility
      // Append remaining URLs as 'image_urls' array (JSON stringified)
      if (urls.length > 1) {
        formData.append('image_urls', JSON.stringify(urls.slice(1)));
      }
    }
  }

  // Append prompt (required)
  formData.append('prompt', request.prompt);

  // Append optional structured prompt components
  if (request.modification_instruction) {
    formData.append('modification_instruction', request.modification_instruction);
  }
  if (request.change_target) {
    formData.append('change_target', request.change_target);
  }
  if (request.preservation_requirements) {
    formData.append('preservation_requirements', request.preservation_requirements);
  }

  // Append optional parameters
  if (request.model) {
    formData.append('model', request.model);
  }
  if (request.strength !== undefined) {
    formData.append('strength', request.strength.toString());
  }
  if (request.guidance_scale !== undefined) {
    formData.append('guidance_scale', request.guidance_scale.toString());
  }
  if (request.num_inference_steps !== undefined) {
    formData.append('num_inference_steps', request.num_inference_steps.toString());
  }
  if (request.seed !== undefined) {
    formData.append('seed', request.seed.toString());
  }
  if (request.job_id) {
    formData.append('job_id', request.job_id);
  }

  const response = await multipartApiClient.post<ImageEditJobResponse>(
    '/api/image/edit',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data;
}

/**
 * Get image editing job status and result
 */
export async function getImageEditJobStatus(jobId: string): Promise<ImageEditJobStatusResponse> {
  const response = await apiClient.get<ImageEditJobStatusResponse>(`/api/image/edit/jobs/${jobId}`);
  return response.data;
}


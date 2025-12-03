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
 * Upload images and generate descriptions
 */
export interface ImageWithDescription {
  file: File;
  preview: string;
  description?: string;
  descriptionLoading?: boolean;
  descriptionError?: string;
  uploadedUrl?: string;
  uploadedUrlLoading?: boolean;
  uploadedUrlError?: string;
}

export interface UploadImagesResponse {
  success: boolean;
  images: Array<{
    filename: string;
    url: string;
    description?: string;
  }>;
}

export async function uploadImagesForTraining(
  images: File[]
): Promise<UploadImagesResponse> {
  const formData = new FormData();
  images.forEach((file) => {
    formData.append('images', file);
  });

  const response = await multipartApiClient.post<UploadImagesResponse>(
    '/api/image/train/upload',
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
 * Image Caption Request Options
 */
export interface ImageCaptionOptions {
  caption?: boolean;
  context?: string;
  question?: string;
  temperature?: number;
  use_nucleus_sampling?: boolean;
}

/**
 * Image Caption Job Response (initial response with job_id)
 */
export interface ImageCaptionJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  image?: string;
  caption?: boolean;
  context?: string;
  question?: string;
  temperature?: number;
  use_nucleus_sampling?: boolean;
  processing_time: {
    total_seconds: number;
    formatted: string;
  };
}

/**
 * Image Caption Job Result
 */
export interface ImageCaptionJobResult {
  caption: string;
  job_id: string;
}

/**
 * Image Caption Job Status Response
 */
export interface ImageCaptionJobStatusResponse {
  success: boolean;
  job_id: string;
  job?: {
    _id: string;
    user_id: string;
    job_type: 'image_caption';
    status: 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';
    result?: ImageCaptionJobResult | string | any; // Allow flexible result types
    caption?: string; // Some APIs might return caption directly
    error?: string;
    created_at: string;
    started_at?: string;
    finished_at?: string;
    updated_at: string;
    // Allow any additional fields
    [key: string]: any;
  };
  // Also check if caption is at the top level
  caption?: string;
  result?: string | ImageCaptionJobResult;
}

/**
 * Generate description for a single image using the caption API
 * This is an async job that returns a job_id, then polls for completion
 */
export async function generateImageDescription(
  imageFile: File,
  options: ImageCaptionOptions = {}
): Promise<ImageDescriptionResponse> {
  const formData = new FormData();
  formData.append('image', imageFile);
  
  // Add optional parameters
  if (options.caption !== undefined) {
    formData.append('caption', options.caption.toString());
  }
  if (options.context) {
    formData.append('context', options.context);
  }
  if (options.question) {
    formData.append('question', options.question);
  }
  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }
  if (options.use_nucleus_sampling !== undefined) {
    formData.append('use_nucleus_sampling', options.use_nucleus_sampling.toString());
  }

  // Submit caption job
  console.log('[generateImageDescription] Submitting caption job for image:', imageFile.name);
  const jobResponse = await multipartApiClient.post<ImageCaptionJobResponse>(
    '/api/image/caption',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  console.log('[generateImageDescription] Job submission response:', jobResponse.data);

  if (!jobResponse.data.success || !jobResponse.data.job_id) {
    console.error('[generateImageDescription] Failed to submit job:', jobResponse.data);
    throw new Error('Failed to submit caption job');
  }

  const jobId = jobResponse.data.job_id;
  console.log('[generateImageDescription] Job ID received:', jobId);

  // Poll for completion (with timeout)
  const maxAttempts = 120; // 120 attempts = 60 seconds max wait (caption generation can take longer)
  const pollInterval = 500; // 500ms between polls
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise(resolve => setTimeout(resolve, pollInterval));
    
    try {
      const statusResponse = await apiClient.get<ImageCaptionJobStatusResponse>(
        `/api/image/caption/jobs/${jobId}`
      );

      // Log full response for debugging
      console.log(`[Caption Job ${jobId}] Full response (attempt ${attempt + 1}):`, JSON.stringify(statusResponse.data, null, 2));
      
      if (statusResponse.data.success) {
        // Check if caption is at top level of response
        if (statusResponse.data.caption && typeof statusResponse.data.caption === 'string') {
          console.log('[Caption Job] Found caption at top level of response');
          return {
            success: true,
            description: statusResponse.data.caption.trim(),
          };
        }
        
        // Check if result is at top level
        if (statusResponse.data.result) {
          if (typeof statusResponse.data.result === 'string') {
            console.log('[Caption Job] Found result as string at top level');
            return {
              success: true,
              description: statusResponse.data.result.trim(),
            };
          } else if (statusResponse.data.result.caption) {
            console.log('[Caption Job] Found caption in top-level result');
            return {
              success: true,
              description: statusResponse.data.result.caption.trim(),
            };
          }
        }
        
        // Check job object
        if (statusResponse.data.job) {
          const job = statusResponse.data.job;
          
          // Log job status for debugging
          console.log(`[Caption Job ${jobId}] Status: ${job.status}, Attempt: ${attempt + 1}/${maxAttempts}`);
          
          // Check if job is completed
          if (job.status === 'completed') {
            // Log the full job structure for debugging
            console.log('[Caption Job] Full job object:', JSON.stringify(job, null, 2));
            
            // Try multiple possible locations for the caption
            let caption: string | undefined;
            
            // Check job.caption directly
            if (job.caption && typeof job.caption === 'string') {
              caption = job.caption;
              console.log('[Caption Job] Found caption directly on job object');
            }
            // Check job.result.caption (expected structure)
            else if (job.result && typeof job.result === 'object' && (job.result as any).caption) {
              caption = (job.result as any).caption;
              console.log('[Caption Job] Found caption in job.result.caption');
            }
            // Check if result is directly a string
            else if (typeof job.result === 'string') {
              caption = job.result;
              console.log('[Caption Job] Found caption as string in job.result');
            }
            // Check if result has a text field
            else if (job.result && typeof job.result === 'object' && (job.result as any).text) {
              caption = (job.result as any).text;
              console.log('[Caption Job] Found caption in job.result.text');
            }
            // Check if result has a description field
            else if (job.result && typeof job.result === 'object' && (job.result as any).description) {
              caption = (job.result as any).description;
              console.log('[Caption Job] Found caption in job.result.description');
            }
            // Check all properties of result object
            else if (job.result && typeof job.result === 'object') {
              const resultObj = job.result as any;
              console.log('[Caption Job] Result object keys:', Object.keys(resultObj));
              // Try common field names
              const possibleFields = ['caption', 'text', 'description', 'output', 'content', 'message'];
              for (const field of possibleFields) {
                if (resultObj[field] && typeof resultObj[field] === 'string') {
                  caption = resultObj[field];
                  console.log(`[Caption Job] Found caption in result.${field}`);
                  break;
                }
              }
            }
            
            if (caption && caption.trim()) {
              console.log('[Caption Job] Successfully extracted caption:', caption.substring(0, 100) + '...');
              return {
                success: true,
                description: caption.trim(),
              };
            } else {
              // Job completed but no caption found - log for debugging
              console.error('[Caption Job] Job completed but caption not found. Full response:', statusResponse.data);
              console.error('[Caption Job] Job object:', job);
              console.error('[Caption Job] Job.result:', job.result);
              console.error('[Caption Job] Job.result type:', typeof job.result);
              throw new Error('Caption generation completed but result not found in expected format. Please check the console for details.');
            }
          } else if (job.status === 'error') {
            console.error('[Caption Job] Job failed with error:', job.error);
            throw new Error(job.error || 'Caption generation failed');
          } else if (job.status === 'cancelled') {
            console.error('[Caption Job] Job was cancelled');
            throw new Error('Caption generation was cancelled');
          }
          // Continue polling if still queued or processing
          console.log(`[Caption Job] Job still ${job.status}, continuing to poll...`);
        } else {
          console.warn('[Caption Job] Response missing job object:', statusResponse.data);
        }
      } else {
        console.warn('[Caption Job] Response indicates failure:', statusResponse.data);
      }
    } catch (error: any) {
      // If it's a 404, the job might not exist yet, continue polling
      if (error.response?.status === 404) {
        // Continue polling - job might not be created yet
        continue;
      }
      // If it's not a network/404 error, throw it
      if (error.response?.status && error.response.status !== 404) {
        console.error('Error fetching caption job status:', error);
        throw error;
      }
      // If it's already an Error object with a message (from our code above), throw it
      if (error instanceof Error && error.message && !error.message.includes('404')) {
        throw error;
      }
      // Otherwise continue polling
    }
  }

  // Timeout - return error
  throw new Error('Caption generation timed out after 60 seconds. Please try again.');
}

/**
 * Image Description Response (for backward compatibility)
 */
export interface ImageDescriptionResponse {
  success: boolean;
  description: string;
}

/**
 * Image Training with ZIP file request
 */
export interface ImageTrainingZipRequest {
  dataset_zip: File;
  trigger_word: string;
  lora_type?: 'subject' | 'style';
  base_model?: string;
  training_steps?: number;
  learning_rate?: number;
  batch_size?: number;
  resolution?: number;
  training_model?: string;
  job_id?: string;
}

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
 * Submit an image training job with ZIP file
 */
export async function submitImageTrainingJobWithZip(
  zipFile: File,
  request: Omit<ImageTrainingZipRequest, 'dataset_zip'>
): Promise<ImageTrainingJobResponse> {
  const formData = new FormData();
  formData.append('dataset_zip', zipFile);
  formData.append('trigger_word', request.trigger_word);
  
  if (request.lora_type) {
    formData.append('lora_type', request.lora_type);
  }
  if (request.base_model) {
    formData.append('base_model', request.base_model);
  }
  if (request.training_steps !== undefined) {
    formData.append('training_steps', request.training_steps.toString());
  }
  if (request.learning_rate !== undefined) {
    formData.append('learning_rate', request.learning_rate.toString());
  }
  if (request.batch_size !== undefined) {
    formData.append('batch_size', request.batch_size.toString());
  }
  if (request.resolution !== undefined) {
    formData.append('resolution', request.resolution.toString());
  }
  if (request.training_model) {
    formData.append('training_model', request.training_model);
  }
  if (request.job_id) {
    formData.append('job_id', request.job_id);
  }

  const response = await multipartApiClient.post<ImageTrainingJobResponse>(
    '/api/image/train',
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
 * Get image training job status and result
 */
export async function getImageTrainingJobStatus(jobId: string): Promise<ImageTrainingJobStatusResponse> {
  const response = await apiClient.get<ImageTrainingJobStatusResponse>(`/api/image/train/jobs/${jobId}`);
  return response.data;
}

/**
 * Get image caption job status directly (useful for checking status without polling)
 */
export async function getImageCaptionJobStatus(jobId: string): Promise<ImageCaptionJobStatusResponse> {
  const response = await apiClient.get<ImageCaptionJobStatusResponse>(`/api/image/caption/jobs/${jobId}`);
  return response.data;
}

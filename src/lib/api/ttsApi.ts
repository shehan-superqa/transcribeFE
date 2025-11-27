/**
 * Text-to-Speech (TTS) API endpoints
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getAccessToken, getStoredUser, refreshAccessToken, clearAuthData, TRANSCRIBE_API_BASE_URL } from '../api';

// TTS API uses port 5000 (same as transcription API)
const TTS_API_BASE_URL = TRANSCRIBE_API_BASE_URL;

/**
 * Create axios instance with authentication
 */
const createApiClient = () => {
  const client = axios.create({
    baseURL: TTS_API_BASE_URL,
    timeout: 300000, // 5 minutes for TTS generation
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
      
      // Handle 401 errors with token refresh
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
        originalRequest._retry = true;
        try {
          const newToken = await refreshAccessToken();
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return client(originalRequest);
          } else {
            clearAuthData();
            return Promise.reject(new Error('Authentication failed. Please log in again.'));
          }
        } catch (refreshError) {
          clearAuthData();
          return Promise.reject(new Error('Authentication failed. Please log in again.'));
        }
      }

      // Handle auth service 404 errors gracefully
      if (error.response?.status === 404 && error.config?.url?.includes('/api/tts')) {
        return Promise.reject(new Error('TTS service unavailable. Please try again later.'));
      }

      return Promise.reject(error);
    }
  );

  return client;
};

const apiClient = createApiClient();

/**
 * Submit a TTS job
 */
export interface TTSJobRequest {
  text: string;
  voice: string;
  language?: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSJobResponse {
  success: boolean;
  job_id: string;
  message?: string;
}

export async function submitTTSJob(request: TTSJobRequest): Promise<TTSJobResponse> {
  const user = getStoredUser();
  if (!user || !user.id) {
    // Clear auth data and throw a special error that can be caught to redirect
    clearAuthData();
    const authError = new Error('User not authenticated. Please log in.');
    (authError as any).isAuthError = true;
    throw authError;
  }

  // Build request body matching backend API format
  const requestBody: any = {
    text: request.text,
    voice: request.voice,
  };

  // Add optional fields only if provided, otherwise use defaults
  requestBody.emotion = request.emotion || 'auto';
  requestBody.language = request.language || 'en';
  requestBody.speed = request.speed !== undefined ? request.speed : 1.0;
  requestBody.pitch = request.pitch !== undefined ? request.pitch : 1.0;
  requestBody.volume = request.volume !== undefined ? request.volume : 1.0;

  const response = await apiClient.post<TTSJobResponse>('/api/tts', requestBody);

  return response.data;
}

/**
 * Get available voices
 */
export interface Voice {
  id: string;
  name: string;
  language: string;
  gender?: string;
  accent?: string;
  provider?: string;
  category?: string;
}

export interface ModelInfo {
  available: boolean;
  description: string;
  name: string;
  provider: string;
  supported_languages: string[];
  version: string;
  voice_count: number;
}

export interface VoicesResponse {
  success: boolean;
  voices: string[]; // Array of voice names (e.g., "English_Trustworth_Man")
  total?: number;
  model_info?: ModelInfo;
}

/**
 * Parse a voice name string into a Voice object
 * Voice names follow pattern: "{Language}_{Description}" or "{Language}_{Description}"
 * Examples: "English_Trustworth_Man", "Chinese (Mandarin)_Reliable_Executive"
 */
export function parseVoiceName(voiceName: string): Voice {
  // Try to extract language from the voice name
  // Pattern: "Language_Description" or "Language (Variant)_Description"
  const parts = voiceName.split('_');
  let language = 'unknown';
  let name = voiceName;
  
  if (parts.length >= 2) {
    // First part might be language
    const firstPart = parts[0];
    
    // Check if it's a known language pattern
    // Order matters - check longer/more specific patterns first
    const languagePatterns: Array<[string, string]> = [
      ['Chinese (Mandarin)', 'zh'],
      ['Cantonese', 'zh-HK'],
      ['English', 'en'],
      ['Japanese', 'ja'],
      ['Korean', 'ko'],
      ['Spanish', 'es'],
      ['Portuguese', 'pt'],
      ['French', 'fr'],
      ['German', 'de'],
      ['Russian', 'ru'],
      ['Italian', 'it'],
      ['Indonesian', 'id'],
      ['Dutch', 'nl'],
      ['Vietnamese', 'vi'],
      ['Arabic', 'ar'],
      ['Turkish', 'tr'],
      ['Ukrainian', 'uk'],
      ['Chinese', 'zh'], // Check generic Chinese last
    ];
    
    // Handle special cases without language prefix
    const specialVoices: Record<string, string> = {
      'Arrogant_Miss': 'en', // Assume English if no prefix
      'Robot_Armor': 'en',   // Assume English if no prefix
    };
    
    if (specialVoices[voiceName]) {
      return {
        id: voiceName,
        name: voiceName.replace(/_/g, ' '),
        language: specialVoices[voiceName],
        provider: 'Replicate',
      };
    }
    
    // Try to match language (check longer patterns first)
    for (const [langName, langCode] of languagePatterns) {
      if (firstPart === langName || firstPart.startsWith(langName)) {
        language = langCode;
        // Remove language prefix from name
        name = parts.slice(1).join('_');
        break;
      }
    }
    
    // If no match, use the first part as language code
    if (language === 'unknown' && firstPart.length <= 5) {
      language = firstPart.toLowerCase();
      name = parts.slice(1).join('_');
    }
  }
  
  // Try to infer gender from description
  let gender: string | undefined;
  const description = name.toLowerCase();
  if (description.includes('man') || description.includes('boy') || description.includes('gentleman') || 
      description.includes('bloke') || description.includes('guy') || description.includes('male')) {
    gender = 'male';
  } else if (description.includes('woman') || description.includes('girl') || description.includes('lady') || 
             description.includes('female') || description.includes('sister') || description.includes('queen')) {
    gender = 'female';
  }
  
  return {
    id: voiceName, // Use full name as ID
    name: name.replace(/_/g, ' '), // Replace underscores with spaces for display
    language: language,
    gender: gender,
    provider: 'Replicate', // From model_info
  };
}

export async function getAvailableVoices(): Promise<{ success: boolean; voices: Voice[]; total?: number; model_info?: ModelInfo }> {
  try {
    const response = await apiClient.get<VoicesResponse>('/api/tts/voices');
    
    // Parse voice name strings into Voice objects
    const parsedVoices: Voice[] = response.data.voices.map(voiceName => {
      const parsed = parseVoiceName(voiceName);
      // Add provider from model_info if available
      if (response.data.model_info?.provider) {
        parsed.provider = response.data.model_info.provider;
      }
      return parsed;
    });
    
    return {
      success: response.data.success,
      voices: parsedVoices,
      total: response.data.total,
      model_info: response.data.model_info,
    };
  } catch (error: any) {
    if (error.response?.status === 404) {
      throw new Error(
        `TTS voices endpoint not found at /api/tts/voices. ` +
        `Please verify with the backend team that the TTS endpoints are implemented and the correct path is used. ` +
        `Current base URL: ${TTS_API_BASE_URL}`
      );
    }
    throw error;
  }
}

/**
 * Get TTS job status
 */
export interface TTSJobResult {
  audio_url?: string;
  audio_output_url?: string;
  text?: string;
  voice?: string;
  [key: string]: any; // Allow other result fields
}

export interface TTSJobStatus {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'error';
  progress?: number;
  text?: string;
  voice?: string;
  audio_url?: string;
  audio_output_url?: string;
  error?: string;
  created_at?: string;
  completed_at?: string;
  result?: TTSJobResult;
}

export interface TTSJobStatusResponse {
  success: boolean;
  job: TTSJobStatus;
}

export async function getTTSJobStatus(jobId: string): Promise<TTSJobStatusResponse> {
  const response = await apiClient.get<TTSJobStatusResponse>(`/api/tts/jobs/${jobId}`);
  return response.data;
}

/**
 * Get all TTS jobs for current user
 */
export interface TTSJobsListResponse {
  success: boolean;
  jobs: TTSJobStatus[];
  total?: number;
}

export async function getTTSJobs(): Promise<TTSJobsListResponse> {
  const user = getStoredUser();
  if (!user || !user.id) {
    throw new Error('User not authenticated. Please log in.');
  }

  const response = await apiClient.get<TTSJobsListResponse>(`/api/tts/jobs`);
  return response.data;
}


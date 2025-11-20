/**
 * API response types
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface TextSegment {
  start_time: number;
  end_time: number;
  segment_id: number;
  text: string;
}

export interface Job {
  _id: string;
  user_id: string;
  file_info: FileInfo;
  engine_requested?: string;
  engine_used: string;
  status: JobStatus;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at?: string;
  result?: TranscriptionResult;
  error?: string;
  replicate_data?: any;
  replicate_cancel_url?: string;
  text_segments?: TextSegment[];
  text_segments_count?: number;
  final_transcription?: string;
}

export type JobStatus = 
  | 'queued' 
  | 'starting' 
  | 'processing' 
  | 'completed' 
  | 'error' 
  | 'cancelled';

export interface FileInfo {
  filename: string;
  size: number;
  size_mb?: number;
  extension: string;
  modified?: string;
}

export interface TranscriptionResult {
  text: string;
  language?: string;
  engine?: string;
  model?: string;
  segments?: TranscriptionSegment[];
  processing_time?: {
    total_seconds: number;
    formatted: string;
  };
}

export interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  id?: number;
}

export interface TranscriptionConfig {
  engine?: string;
  language?: string;
  model?: string;
  job_id?: string;
  processing_mode?: string;
  enable_punctuation?: boolean;
  enable_capitalization?: boolean;
}

export interface SubmitJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  file_info: FileInfo;
  engine_requested?: string;
  engine_used: string;
  processing_time: {
    total_seconds: number;
    formatted: string;
  };
  engine_fallback?: {
    requested: string;
    used: string;
    reason: string;
  };
}

export interface ProgressEvent {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  result?: TranscriptionResult;
  error?: string;
}

export interface ModelsResponse {
  success: boolean;
  models: string[];
  languages: string[];
  engines: string[];
  engines_status: Record<string, EngineStatus>;
}

export interface EngineStatus {
  available: boolean;
  model_loaded?: boolean;
  recognizer_initialized?: boolean;
  api_key_set?: boolean;
  reason?: string;
}

export interface User {
  id: string;
  name?: string;
  email?: string;
  isEmailVerified?: boolean;
}

export interface AuthResponse {
  success: boolean;
  data?: User;
  message?: string;
}


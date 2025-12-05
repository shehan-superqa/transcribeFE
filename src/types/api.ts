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
  result?: TranscriptionResult | VideoJobResult | ImageJobResult | ImageTrainingJobResult;
  error?: string;
}

export interface EngineInfo {
  name: string;
  available: boolean;
  models: string[];
  description?: string;
  status?: EngineStatus;
}

export interface ModelsResponse {
  success: boolean;
  engines: EngineInfo[];
  languages: string[];
  default_engine?: string;
  default_model?: string;
  available_engines?: string[];
  // Legacy fields for backward compatibility
  models?: string[];
  engines_status?: Record<string, EngineStatus>;
}

export interface EngineStatus {
  available: boolean;
  model_loaded?: boolean;
  recognizer_initialized?: boolean;
  api_key_set?: boolean;
  reason?: string;
  package_installed?: boolean;
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

/**
 * TTS (Text-to-Speech) Types
 */
export interface TTSVoice {
  id: string;
  name: string;
  language: string;
  gender?: string;
  accent?: string;
  provider?: string;
  category?: string;
}

export interface TTSJob {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'error';
  progress?: number;
  text?: string;
  voice?: string;
  audio_url?: string;
  error?: string;
  created_at?: string;
  completed_at?: string;
  language?: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

export interface TTSConfig {
  text: string;
  voice: string;
  language?: string;
  emotion?: string;
  speed?: number;
  pitch?: number;
  volume?: number;
}

/**
 * Video Generation Types
 */
export interface VideoJobRequest {
  prompt: string;
  aspect_ratio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  duration?: number;
  image?: string;
  last_frame?: string;
  reference_images?: string[];
  negative_prompt?: string;
  resolution?: '720p' | '1080p' | '1440p' | '4K';
  generate_audio?: boolean;
  seed?: number;
  job_id?: string;
}

export interface VideoJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  prompt_length?: number;
  reference_images_count?: number;
  processing_time: {
    total_seconds: number;
    formatted: string;
  };
}

export interface VideoJobResult {
  video_url: string;
  video_path?: string;
  prompt: string;
  reference_images?: string[];
  engine?: string;
  model?: string;
  job_id: string;
}

export interface VideoJob {
  _id: string;
  user_id: string;
  job_type: 'video';
  prompt: string;
  reference_images?: string[];
  status: JobStatus;
  result?: VideoJobResult;
  video_output_url?: string;
  video_output_path?: string;
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
}

export interface VideoJobStatusResponse {
  success: boolean;
  job_id: string;
  job?: VideoJob;
}

/**
 * Image Generation Types
 */
export interface ImageJobRequest {
  prompt: string;
  negative_prompt?: string;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  model?: 'black-forest-labs/flux-dev' | 'black-forest-labs/flux-schnell' | 'stability-ai/sdxl' | 'stability-ai/stable-diffusion';
  image?: string;
  mask?: string;
  strength?: number;
  job_id?: string;
}

export interface ImageJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  prompt_length?: number;
  width?: number;
  height?: number;
  num_outputs?: number;
  guidance_scale?: number;
  num_inference_steps?: number;
  seed?: number;
  model?: string;
  processing_time: {
    total_seconds: number;
    formatted: string;
  };
}

export interface ImageJobResult {
  image_url: string;
  image_path?: string;
  image_urls?: string[];
  image_paths?: string[];
  prompt: string;
  width?: number;
  height?: number;
  engine?: string;
  model?: string;
  job_id: string;
}

export interface ImageJob {
  _id: string;
  user_id: string;
  job_type: 'image';
  prompt: string;
  width?: number;
  height?: number;
  status: JobStatus;
  result?: ImageJobResult;
  image_output_url?: string;
  image_output_path?: string;
  image_output_urls?: string[];
  image_output_paths?: string[];
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
}

export interface ImageJobStatusResponse {
  success: boolean;
  job_id: string;
  job?: ImageJob;
}

/**
 * Image Training (LoRA) Types
 */
export interface ImageTrainingJobRequest {
  image_urls: string[];
  trigger_word: string;
  destination_model: string; // Required: username/model-name format
  lora_type?: 'subject' | 'style';
  base_model?: string;
  training_steps?: number;
  learning_rate?: number;
  batch_size?: number;
  resolution?: number;
  training_model?: string;
  job_id?: string;
}

export interface ImageTrainingJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
  num_images?: number;
  trigger_word?: string;
  lora_type?: string;
  base_model?: string;
  training_steps?: number;
  processing_time: {
    total_seconds: number;
    formatted: string;
  };
}

export interface ImageTrainingJobResult {
  trained_model: string;
  training_id?: string;
  training_status?: {
    training_id: string;
    status: string;
    completed_at?: string;
    trained_model: string;
  };
}

export interface ImageTrainingJob {
  _id: string;
  user_id: string;
  job_type: 'image_training';
  image_urls: string[];
  trigger_word: string;
  lora_type?: string;
  base_model?: string;
  training_steps?: number;
  training_id?: string;
  trained_model?: string;
  training_status?: {
    training_id: string;
    status: string;
    completed_at?: string;
    trained_model: string;
  };
  status: JobStatus;
  result?: ImageTrainingJobResult;
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
}

export interface ImageTrainingJobStatusResponse {
  success: boolean;
  job_id: string;
  job?: ImageTrainingJob;
}

/**
 * Video Dubbing Types
 */
export interface VideoDubJobRequest {
  video: string; // Video URL
  output_language: string; // e.g., "Spanish", "French", "German"
}

export interface VideoDubJobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  stream_url: string;
}

export interface VideoDubJobResult {
  video_url: string;
  video_path?: string;
  output_language: string;
  engine?: string;
  model?: string;
  job_id: string;
}

export interface VideoDubJob {
  _id: string;
  user_id: string;
  job_type: 'video_dub';
  video: string;
  output_language: string;
  status: JobStatus;
  result?: VideoDubJobResult;
  video_output_url?: string;
  video_output_path?: string;
  error?: string;
  created_at: string;
  started_at?: string;
  finished_at?: string;
  updated_at: string;
}

export interface VideoDubJobStatusResponse {
  success: boolean;
  job_id: string;
  job?: VideoDubJob;
}


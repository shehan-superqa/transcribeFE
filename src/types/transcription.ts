/**
 * Transcription-related types
 */

export interface TranscriptionSettings {
  engine: string;
  language: string;
  model: string;
  enablePunctuation: boolean;
  enableCapitalization: boolean;
}

export type ProcessingMode = 
  | 'batch' 
  | 'streaming' 
  | 'realtime' 
  | 'advanced' 
  | 'vad';

export interface LiveTranscriptionConfig {
  engine: string;
  language: string;
  model: string;
  vad_threshold: number;
  min_speech_duration?: number;
  silence_duration?: number;
  chunk_interval?: number;
}

export interface LiveTranscriptionResult {
  session_id: string;
  text: string;
  language: string;
  engine: string;
  model: string;
  timestamp: number;
}

export interface VADStatus {
  session_id: string;
  status: 'speaking' | 'silent';
  timestamp: number;
}

export interface AudioSettings {
  sample_rate: number;
  channels: number;
}

export interface AppSettings {
  audio: AudioSettings;
  output_dir: string;
  api_key: string;
}


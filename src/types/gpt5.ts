/**
 * GPT-5 API Types
 */

export type ReasoningEffort = 'minimal' | 'medium' | 'high';
export type Verbosity = 'low' | 'medium' | 'high';

export interface GPT5Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GPT5TextGenerationRequest {
  prompt: string;
  model?: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
  stream?: boolean;
  job_id?: string;
}

export interface GPT5ChatCompletionRequest {
  messages: GPT5Message[];
  model?: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
  stream?: boolean;
  job_id?: string;
}

export interface GPT5JobResponse {
  success: boolean;
  accepted: boolean;
  job_id: string;
  messages_count?: number;
  model?: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
  stream?: boolean;
  stream_url?: string; // Optional SSE stream URL
}

export interface GPT5JobStatus {
  success: boolean;
  job_id: string;
  job?: GPT5Job;
}

export interface GPT5Job {
  _id: string;
  status: 'queued' | 'starting' | 'processing' | 'completed' | 'error';
  result?: GPT5Result;
  error?: string;
  created_at?: string;
  started_at?: string;
  finished_at?: string;
}

export interface GPT5Result {
  text?: string;
  chunks?: string[];
  streamed?: boolean;
  streaming_text?: string;
  streaming_chunks?: string[];
  model?: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
}

export interface GPT5StreamEvent {
  chunk?: string;
  done?: boolean;
  error?: string;
  text?: string;
}

/**
 * WebSocket Event Types for GPT-5 Streaming
 */

export interface GPT5WebSocketChunkEvent {
  job_id: string;
  chunk: string;
  done: boolean;
  timestamp: number;
}

export interface GPT5WebSocketCompleteEvent {
  job_id: string;
  text: string;
  chunks: string[];
  timestamp: number;
}

export interface GPT5WebSocketErrorEvent {
  job_id: string | null;
  error: string;
  error_code: string;
}

export interface GPT5WebSocketStartedEvent {
  job_id: string;
  status: string;
}

export interface GPT5WebSocketStoppedEvent {
  job_id: string;
  status: string;
}

export interface GPT5StartStreamRequest {
  job_id: string;
  token?: string;
  messages?: GPT5Message[];
  prompt?: string;
  model?: string;
  reasoning_effort?: ReasoningEffort;
  verbosity?: Verbosity;
}


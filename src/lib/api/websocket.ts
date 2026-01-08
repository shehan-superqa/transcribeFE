/**
 * Unified WebSocket client for all socket features
 * Connects to unified socket server on localhost:5002
 */

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api';
import type { LiveTranscriptionConfig, LiveTranscriptionResult, VADStatus } from '../../types/transcription';

// Updated to use unified socket server on port 5002
const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'http://localhost:5002';

// Get auth token from your auth store
const getAuthToken = (): string | null => {
  return getAccessToken();
};

/**
 * Unified WebSocket Client
 * Handles: Live Transcription, GPT-5 Streaming, Progress Updates
 */
export class UnifiedWebSocketClient {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnected: boolean = false;
  private connectingPromise: Promise<void> | null = null;

  /**
   * Connect to unified socket server
   */
  connect(token?: string): Promise<void> {
    // If already connected, resolve immediately
    if (this.isConnectedToServer()) {
      console.log('WebSocket already connected, skipping connection attempt');
      return Promise.resolve();
    }

    // If connection is already in progress, return the existing promise
    if (this.connectingPromise) {
      console.log('WebSocket connection already in progress, reusing existing connection attempt');
      return this.connectingPromise;
    }

    // Start new connection attempt
    this.connectingPromise = new Promise((resolve, reject) => {
      try {
        // If socket exists but not connected, clean it up first
        if (this.socket && !this.socket.connected) {
          // Remove all listeners to prevent leaks
          this.socket.removeAllListeners();
          this.socket.disconnect();
          this.socket = null;
        }

        const authToken = token || getAuthToken();
        
        this.socket = io(WEBSOCKET_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          forceNew: false, // Reuse existing connections
          auth: authToken ? { token: authToken } : undefined,
        });

        const cleanup = () => {
          this.connectingPromise = null;
        };

        // Set up timeout for connection confirmation
        const connectionTimeout = setTimeout(() => {
          // If 'connected' event doesn't arrive within 5 seconds, use socket ID
          if (!this.isConnected && this.socket?.connected) {
            console.warn('Server "connected" event not received, using socket ID');
            this.sessionId = this.socket.id || null;
            this.isConnected = true;
            cleanup();
            resolve();
          }
        }, 5000);

        // Listen for Socket.IO's built-in 'connect' event
        this.socket.once('connect', () => {
          console.log('Socket.IO connection established');
          // Wait for server's 'connected' event for session details
        });

        // Listen for server's custom 'connected' event with session details
        this.socket.once('connected', (data: {
          session_id?: string;
          status?: string;
          authenticated?: boolean;
          message?: string;
        }) => {
          clearTimeout(connectionTimeout);
          console.log('Unified WebSocket connected and authenticated', data);
          this.sessionId = data?.session_id || this.socket?.id || null;
          this.isConnected = true;
          cleanup();
          resolve();
        });

        this.socket.once('connect_error', (error) => {
          clearTimeout(connectionTimeout);
          console.error('WebSocket connection error:', error);
          this.isConnected = false;
          cleanup();
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.isConnected = false;
          this.sessionId = null;
          // Clear connecting promise on disconnect so reconnection can happen
          if (this.connectingPromise) {
            this.connectingPromise = null;
          }
        });

        // Handle reconnection events
        this.socket.on('reconnect', (attemptNumber: number) => {
          console.log(`WebSocket reconnected after ${attemptNumber} attempts`);
        });

        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
          console.log(`WebSocket reconnection attempt ${attemptNumber}`);
        });

        this.socket.on('reconnect_error', (error: Error) => {
          console.error('WebSocket reconnection error:', error);
        });

        this.socket.on('reconnect_failed', () => {
          console.error('WebSocket reconnection failed after max attempts');
          this.isConnected = false;
        });

        // Set up default error handlers
        this.setupDefaultHandlers();
      } catch (error) {
        this.connectingPromise = null;
        reject(error);
      }
    });

    return this.connectingPromise;
  }

  /**
   * Setup default event handlers
   */
  private setupDefaultHandlers(): void {
    if (!this.socket) return;

    // Handle ping/pong for keepalive
    this.socket.on('pong', (data) => {
      console.debug('Pong received:', data);
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    // Clear any pending connection promise
    this.connectingPromise = null;
    
    if (this.socket) {
      // Remove all event listeners before disconnecting to prevent leaks
      this.socket.removeAllListeners();
      
      // Disconnect the socket
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.sessionId = null;
      
      // Clear all registered listeners
      this.listeners.clear();
    }
  }

  /**
   * Check if connected
   */
  isConnectedToServer(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }

  // ==================== Live Transcription ====================

  /**
   * Start live transcription
   */
  startTranscription(config: LiveTranscriptionConfig, token?: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      const authToken = token || getAuthToken();
      
      this.socket.emit('start_transcription', {
        token: authToken,
        engine: config.engine || 'replicate',
        language: config.language || 'en',
        model: config.model || 'base',
        vad_threshold: config.vad_threshold || 0.01,
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Send audio data for transcription
   */
  sendAudio(audio: string | ArrayBuffer, format: 'base64' | 'raw' = 'base64'): void {
    if (!this.socket || !this.isConnectedToServer()) {
      throw new Error('Not connected to WebSocket server');
    }

    let audioBase64: string;
    
    if (typeof audio === 'string') {
      audioBase64 = audio;
    } else {
      // Convert ArrayBuffer to base64
      const bytes = new Uint8Array(audio);
      const binary = bytes.reduce((acc, byte) => acc + String.fromCharCode(byte), '');
      audioBase64 = btoa(binary);
    }

    this.socket.emit('audio_data', {
      audio: audioBase64,
    });
  }

  /**
   * Stop transcription
   */
  stopTranscription(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      this.socket.emit('stop_transcription', {}, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Listen to transcription started event
   */
  onTranscriptionStarted(callback: (data: {
    session_id: string;
    status: string;
    engine: string;
    language: string;
    model: string;
  }) => void): void {
    this.on('transcription_started', callback);
  }

  /**
   * Listen to transcription results
   */
  onTranscriptionResult(callback: (data: {
    session_id: string;
    text: string;
    confidence?: number;
    timestamp?: number;
  }) => void): void {
    this.on('transcription_result', callback);
  }

  /**
   * Listen to transcription stopped event
   */
  onTranscriptionStopped(callback: (data: {
    session_id: string;
    status: string;
  }) => void): void {
    this.on('transcription_stopped', callback);
  }

  /**
   * Listen to transcription errors
   */
  onTranscriptionError(callback: (error: {
    error: string;
    error_code?: string;
    session_id?: string;
  }) => void): void {
    this.on('transcription_error', callback);
  }

  // ==================== GPT-5 Streaming ====================

  /**
   * Start GPT-5 streaming
   */
  startGPT5Stream(config: {
    job_id?: string;
    prompt?: string;
    messages?: Array<{ role: string; content: string }>;
    model?: string;
    reasoning_effort?: 'minimal' | 'medium' | 'high';
    verbosity?: 'low' | 'medium' | 'high';
    token?: string;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      const authToken = config.token || getAuthToken();
      
      this.socket.emit('start_gpt5_stream', {
        token: authToken,
        job_id: config.job_id,
        prompt: config.prompt,
        messages: config.messages,
        model: config.model,
        reasoning_effort: config.reasoning_effort || 'medium',
        verbosity: config.verbosity || 'medium',
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Stop GPT-5 streaming
   */
  stopGPT5Stream(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      this.socket.emit('stop_gpt5_stream', {}, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Listen to GPT-5 started event
   */
  onGPT5Started(callback: (data: {
    job_id: string;
    status: string;
    timestamp?: number;
  }) => void): void {
    this.on('gpt5_started', callback);
  }

  /**
   * Listen to GPT-5 chunks
   */
  onGPT5Chunk(callback: (data: {
    job_id: string;
    chunk: string;
    done: boolean;
    timestamp?: number;
  }) => void): void {
    this.on('gpt5_chunk', callback);
  }

  /**
   * Listen to GPT-5 completion
   */
  onGPT5Complete(callback: (data: {
    job_id: string;
    status: string;
    text: string;
    timestamp?: number;
  }) => void): void {
    this.on('gpt5_complete', callback);
  }

  /**
   * Listen to GPT-5 stream stopped event
   */
  onGPT5StreamStopped(callback: (data: {
    job_id: string;
    status: string;
    timestamp?: number;
  }) => void): void {
    this.on('gpt5_stream_stopped', callback);
  }

  /**
   * Listen to GPT-5 errors
   */
  onGPT5Error(callback: (error: {
    job_id?: string;
    error: string;
    error_code?: string;
  }) => void): void {
    this.on('gpt5_error', callback);
  }

  // ==================== Progress Updates ====================

  /**
   * Subscribe to progress updates for a job
   */
  subscribeProgress(jobId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      this.socket.emit('subscribe_progress', {
        job_id: jobId,
      }, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Unsubscribe from progress updates
   */
  unsubscribeProgress(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.socket || !this.isConnectedToServer()) {
        reject(new Error('Not connected to WebSocket server'));
        return;
      }

      this.socket.emit('unsubscribe_progress', {}, (response: any) => {
        if (response?.error) {
          reject(new Error(response.error));
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * Listen to progress subscribed event
   */
  onProgressSubscribed(callback: (data: {
    job_id: string;
    status: string;
  }) => void): void {
    this.on('progress_subscribed', callback);
  }

  /**
   * Listen to progress updates
   */
  onProgressUpdate(callback: (data: {
    job_id: string;
    status: string;
    progress: number;
    message: string;
    details?: any;
    timestamp?: number;
  }) => void): void {
    this.on('progress_update', callback);
  }

  /**
   * Listen to progress unsubscribed event
   */
  onProgressUnsubscribed(callback: (data: {
    status: string;
  }) => void): void {
    this.on('progress_unsubscribed', callback);
  }

  /**
   * Listen to progress errors
   */
  onProgressError(callback: (error: {
    error: string;
    error_code?: string;
  }) => void): void {
    this.on('progress_error', callback);
  }

  // ==================== Event Management ====================

  /**
   * Register event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }

    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Remove all listeners for an event
   */
  removeAllListeners(event: string): void {
    this.listeners.delete(event);
    if (this.socket) {
      this.socket.removeAllListeners(event);
    }
  }
}

// Export singleton instance
export const unifiedWebSocketClient = new UnifiedWebSocketClient();

// Export for backward compatibility (if needed)
export const websocketClient = unifiedWebSocketClient;


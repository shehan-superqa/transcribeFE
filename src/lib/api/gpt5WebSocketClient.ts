/**
 * WebSocket client for GPT-5 streaming
 */

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api';
import type {
  GPT5StartStreamRequest,
  GPT5WebSocketChunkEvent,
  GPT5WebSocketCompleteEvent,
  GPT5WebSocketErrorEvent,
  GPT5WebSocketStartedEvent,
  GPT5WebSocketStoppedEvent,
} from '../../types/gpt5';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5003';

interface StreamState {
  jobId: string;
  text: string;
  chunks: string[];
  status: 'connecting' | 'connected' | 'streaming' | 'completed' | 'error';
  startTime?: number;
  completeTime?: number;
  error?: string;
}

export class GPT5WebSocketClient {
  private socket: Socket | null = null;
  private activeStreams: Map<string, StreamState> = new Map();
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting: boolean = false;
  private eventListenersSetup: boolean = false;

  /**
   * Connect to WebSocket server
   * Includes JWT token in auth object as per API requirements
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      // If already connected, resolve immediately
      if (this.socket && this.socket.connected) {
        resolve();
        return;
      }

      // If already connecting, wait for that connection
      if (this.isConnecting) {
        const checkConnection = setInterval(() => {
          if (this.socket && this.socket.connected) {
            clearInterval(checkConnection);
            resolve();
          } else if (!this.isConnecting) {
            clearInterval(checkConnection);
            reject(new Error('Connection failed'));
          }
        }, 100);
        return;
      }

      this.isConnecting = true;

      try {
        const token = getAccessToken();
        if (!token) {
          this.isConnecting = false;
          reject(new Error('Authentication required. Please log in.'));
          return;
        }

        // Include token in auth object and query string
        this.socket = io(WEBSOCKET_URL, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionAttempts: 5,
          auth: {
            token: token,
          },
          query: {
            token: token,
          },
        });

        this.socket.on('connect', () => {
          console.log('GPT-5 WebSocket connected');
          this.isConnecting = false;
          this.setupEventListeners();
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('GPT-5 WebSocket connection error:', error);
          this.isConnecting = false;
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('GPT-5 WebSocket disconnected');
          // Clear active streams on disconnect
          this.activeStreams.clear();
        });
      } catch (error) {
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners for GPT-5 events
   * Prevents duplicate listeners on reconnection
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Remove existing listeners to prevent duplicates on reconnection
    if (this.eventListenersSetup) {
      this.socket.off('gpt5_stream_started');
      this.socket.off('gpt5_chunk');
      this.socket.off('gpt5_complete');
      this.socket.off('gpt5_error');
      this.socket.off('gpt5_stream_stopped');
    }

    this.socket.on('gpt5_stream_started', (data: GPT5WebSocketStartedEvent) => {
      const state = this.activeStreams.get(data.job_id);
      if (state) {
        state.status = 'connected';
        state.startTime = Date.now();
      }
      this.emit('gpt5_stream_started', data);
    });

    this.socket.on('gpt5_chunk', (data: GPT5WebSocketChunkEvent) => {
      const state = this.activeStreams.get(data.job_id);
      if (state) {
        state.status = 'streaming';
        state.chunks.push(data.chunk);
        state.text += data.chunk;
      }
      this.emit('gpt5_chunk', data);
    });

    this.socket.on('gpt5_complete', (data: GPT5WebSocketCompleteEvent) => {
      const state = this.activeStreams.get(data.job_id);
      if (state) {
        state.status = 'completed';
        state.completeTime = Date.now();
        state.text = data.text;
        state.chunks = data.chunks;
      }
      this.emit('gpt5_complete', data);
    });

    this.socket.on('gpt5_error', (data: GPT5WebSocketErrorEvent) => {
      const state = data.job_id ? this.activeStreams.get(data.job_id) : null;
      if (state) {
        state.status = 'error';
        state.error = data.error;
      }
      this.emit('gpt5_error', data);
    });

    this.socket.on('gpt5_stream_stopped', (data: GPT5WebSocketStoppedEvent) => {
      const state = this.activeStreams.get(data.job_id);
      if (state) {
        state.status = 'completed';
      }
      this.emit('gpt5_stream_stopped', data);
    });

    this.eventListenersSetup = true;
  }

  /**
   * Start GPT-5 streaming
   */
  async startStream(request: GPT5StartStreamRequest): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      await this.connect();
    }

    if (!this.socket || !this.socket.connected) {
      throw new Error('WebSocket not connected');
    }

    // Ensure token is included
    const token = getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    // Validate request
    if (!request.messages && !request.prompt) {
      throw new Error('Either messages or prompt must be provided');
    }

    // Initialize stream state
    const streamState: StreamState = {
      jobId: request.job_id,
      text: '',
      chunks: [],
      status: 'connecting',
      startTime: Date.now(),
    };
    this.activeStreams.set(request.job_id, streamState);

    return new Promise((resolve, reject) => {
      // Include token in the request
      const requestWithToken = {
        ...request,
        token: token,
      };

      this.socket!.emit('start_gpt5_stream', requestWithToken, (response: any) => {
        if (response.error) {
          this.activeStreams.delete(request.job_id);
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
  async stopStream(jobId: string): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('stop_gpt5_stream', { job_id: jobId }, () => {
        this.activeStreams.delete(jobId);
        resolve();
      });
    });
  }

  /**
   * Get stream state for a job
   */
  getStreamState(jobId: string): StreamState | undefined {
    return this.activeStreams.get(jobId);
  }

  /**
   * Get all active streams
   */
  getActiveStreams(): Map<string, StreamState> {
    return this.activeStreams;
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.activeStreams.clear();
      this.listeners.clear();
      this.isConnecting = false;
      this.eventListenersSetup = false;
    }
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Clear stream state for a job
   */
  clearStream(jobId: string): void {
    this.activeStreams.delete(jobId);
  }
}

// Export singleton instance
export const gpt5WebSocketClient = new GPT5WebSocketClient();


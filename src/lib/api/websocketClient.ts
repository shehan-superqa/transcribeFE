/**
 * WebSocket client for live transcription
 */

import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '../api';
import type { LiveTranscriptionConfig, LiveTranscriptionResult, VADStatus } from '../../types/transcription';

const WEBSOCKET_URL = import.meta.env.VITE_WEBSOCKET_URL || 'ws://localhost:5003';

export class WebSocketClient {
  private socket: Socket | null = null;
  private sessionId: string | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  /**
   * Connect to WebSocket server
   * Includes JWT token in auth object as per API requirements
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const token = getAccessToken();
        if (!token) {
          reject(new Error('Authentication required. Please log in.'));
          return;
        }

        // Include token in auth object (Option 2 from API instructions)
        // Also include token in query string (Option 1) for compatibility
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
          console.log('WebSocket connected');
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          reject(error);
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.sessionId = null;
        });

        // Set up event listeners
        this.setupEventListeners();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Setup event listeners for transcription events
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('transcription', (data: LiveTranscriptionResult) => {
      this.emit('transcription', data);
    });

    this.socket.on('vad_status', (data: VADStatus) => {
      this.emit('vad_status', data);
    });

    this.socket.on('error', (error: { session_id: string; error: string; timestamp: number }) => {
      this.emit('error', error);
    });

    // Listen for audio chunk acknowledgments
    this.socket.on('audio_received', (data: { session_id: string; samples: number; timestamp: number }) => {
      this.emit('audio_received', data);
    });
  }

  /**
   * Start transcription session
   * Includes token in the event if not provided during connection
   */
  async startTranscription(config: LiveTranscriptionConfig): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('WebSocket not connected');
    }

    // Ensure token is included in the start_transcription event
    const token = getAccessToken();
    if (!token) {
      throw new Error('Authentication required. Please log in.');
    }

    return new Promise((resolve, reject) => {
      // Include token in the start_transcription event as per API instructions
      this.socket!.emit('start_transcription', {
        ...config,
        token: token,
      }, (response: any) => {
        if (!response) {
          reject(new Error('No response received from server'));
          return;
        }
        if (response.status === 'started' && response.session_id) {
          this.sessionId = response.session_id;
          resolve();
        } else {
          reject(new Error(response.error || 'Failed to start transcription'));
        }
      });
    });
  }

  /**
   * Send audio data
   */
  sendAudio(audio: string | ArrayBuffer, format: 'base64' | 'raw' = 'base64', sampleRate: number = 16000, channels: number = 1): void {
    if (!this.socket || !this.socket.connected) {
      console.error('WebSocket not connected, cannot send audio');
      throw new Error('WebSocket not connected');
    }

    try {
      // Convert ArrayBuffer to Base64 if needed
      const audioData = typeof audio === 'string' 
        ? audio 
        : this.arrayBufferToBase64(audio);

      // Send audio data with proper format
      this.socket.emit('audio_data', {
        audio: audioData,
        format,
        sample_rate: sampleRate,
        channels,
      });
    } catch (error) {
      console.error('Error sending audio chunk:', error);
      throw error;
    }
  }

  /**
   * Stop transcription
   */
  async stopTranscription(): Promise<void> {
    if (!this.socket || !this.socket.connected) {
      return;
    }

    return new Promise((resolve) => {
      this.socket!.emit('stop_transcription', {}, () => {
        resolve();
      });
    });
  }

  /**
   * Get transcription status
   */
  async getStatus(): Promise<any> {
    if (!this.socket || !this.socket.connected) {
      throw new Error('WebSocket not connected');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('get_status', {}, (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.sessionId = null;
      this.listeners.clear();
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
   * Convert ArrayBuffer to base64
   */
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Export singleton instance
export const websocketClient = new WebSocketClient();


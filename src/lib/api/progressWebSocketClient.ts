/**
 * WebSocket client for bill processing progress updates
 * Connects to ws://localhost:5002 for real-time progress streaming
 */

import type { ProgressEvent } from '../../types/api';
import { getAccessToken } from '../api';

// WebSocket Progress Bridge URL (port 5002 as per backend documentation)
const PROGRESS_WS_URL = import.meta.env.VITE_PROGRESS_WS_URL || 'ws://localhost:5002';

export class ProgressWebSocketClient {
  private ws: WebSocket | null = null;
  private jobId: string | null = null;
  private streamUrl: string | null = null;
  private listeners: Set<(event: ProgressEvent) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  /**
   * Connect to WebSocket progress stream for a job
   * @param jobId - Job ID to stream progress for
   * @param streamUrl - Optional stream URL from API response
   */
  connect(jobId: string, streamUrl?: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.close();
    }

    this.jobId = jobId;
    
    // Construct WebSocket URL
    let wsUrl: string;
    if (streamUrl) {
      // Convert HTTP URL to WebSocket URL
      if (streamUrl.startsWith('http://')) {
        wsUrl = streamUrl.replace('http://', 'ws://');
      } else if (streamUrl.startsWith('https://')) {
        wsUrl = streamUrl.replace('https://', 'wss://');
      } else if (streamUrl.startsWith('/')) {
        // Relative path - construct from base URL
        const baseUrl = PROGRESS_WS_URL.replace(/\/$/, '');
        wsUrl = `${baseUrl}${streamUrl}`;
      } else {
        wsUrl = `${PROGRESS_WS_URL}/progress/stream/${jobId}`;
      }
    } else {
      wsUrl = `${PROGRESS_WS_URL}/progress/stream/${jobId}`;
    }

    // Normalize URL
    wsUrl = wsUrl.replace('127.0.0.1', 'localhost');
    
    // Add token if available (some WebSocket servers support token in query)
    const token = getAccessToken();
    if (token && !wsUrl.includes('token=')) {
      const separator = wsUrl.includes('?') ? '&' : '?';
      wsUrl = `${wsUrl}${separator}token=${encodeURIComponent(token)}`;
    }

    this.streamUrl = wsUrl;

    // Log the final URL for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[Progress WebSocket] Connecting to:', wsUrl);
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('[Progress WebSocket] Connected for job:', jobId);
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const data: ProgressEvent = JSON.parse(event.data);
          // Verify job_id matches
          if (data.job_id === jobId || !data.job_id) {
            this.listeners.forEach((listener) => listener(data));
          }
        } catch (error) {
          console.error('[Progress WebSocket] Error parsing message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[Progress WebSocket] Connection error:', error);
      };

      this.ws.onclose = (event) => {
        console.log('[Progress WebSocket] Connection closed:', event.code, event.reason);
        
        // Attempt to reconnect if not a normal closure and we haven't exceeded max attempts
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts && this.jobId) {
          this.reconnectAttempts++;
          console.log(`[Progress WebSocket] Reconnecting (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          this.reconnectTimeout = setTimeout(() => {
            if (this.jobId) {
              this.connect(this.jobId, this.streamUrl || undefined);
            }
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };
    } catch (error) {
      console.error('[Progress WebSocket] Failed to create WebSocket:', error);
    }
  }

  /**
   * Add progress listener
   */
  onProgress(callback: (event: ProgressEvent) => void): void {
    this.listeners.add(callback);
  }

  /**
   * Remove progress listener
   */
  offProgress(callback: (event: ProgressEvent) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * Close WebSocket connection
   */
  close(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close(1000, 'Client closing');
      this.ws = null;
    }
    
    this.jobId = null;
    this.streamUrl = null;
    this.reconnectAttempts = 0;
    this.listeners.clear();
  }

  /**
   * Get current job ID
   */
  getJobId(): string | null {
    return this.jobId;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection state
   */
  getReadyState(): number {
    if (!this.ws) return WebSocket.CLOSED;
    return this.ws.readyState;
  }
}

// Export singleton instance
export const progressWebSocketClient = new ProgressWebSocketClient();


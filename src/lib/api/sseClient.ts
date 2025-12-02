/**
 * Server-Sent Events (SSE) client for job progress streaming
 */

import type { ProgressEvent } from '../../types/api';

const SSE_BASE_URL = import.meta.env.VITE_SSE_BASE_URL || 'http://localhost:5002';

export class SSEClient {
  private eventSource: EventSource | null = null;
  private jobId: string | null = null;
  private streamUrl: string | null = null;
  private listeners: Set<(event: ProgressEvent) => void> = new Set();

  /**
   * Connect to SSE stream for a job
   * @param jobId - Job ID to stream progress for
   * @param streamUrl - Optional stream URL from API response. If provided, uses this instead of constructing from jobId
   */
  connect(jobId: string, streamUrl?: string): void {
    if (this.eventSource) {
      this.close();
    }

    this.jobId = jobId;
    
    // Use provided stream_url or construct from jobId
    let url: string;
    if (streamUrl) {
      url = streamUrl;
      this.streamUrl = streamUrl;
    } else {
      url = `${SSE_BASE_URL}/progress/stream/${jobId}`;
    }
    
    // Normalize URL to use localhost instead of 127.0.0.1 to avoid CORS issues
    const normalizedUrl = url.replace('http://127.0.0.1:', 'http://localhost:');
    
    this.eventSource = new EventSource(normalizedUrl);

    // Handle generic message events
    this.eventSource.onmessage = (event) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    // Handle 'progress' event type (as per API docs)
    this.eventSource.addEventListener('progress', (event: MessageEvent) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error('Error parsing SSE progress event:', error);
      }
    });

    // Handle 'result' event type (as per API docs)
    this.eventSource.addEventListener('result', (event: MessageEvent) => {
      try {
        const data: ProgressEvent = JSON.parse(event.data);
        this.listeners.forEach((listener) => listener(data));
      } catch (error) {
        console.error('Error parsing SSE result event:', error);
      }
    });

    this.eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      // EventSource will automatically reconnect
    };
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
   * Close SSE connection
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.jobId = null;
      this.listeners.clear();
    }
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
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

// Export singleton instance
export const sseClient = new SSEClient();


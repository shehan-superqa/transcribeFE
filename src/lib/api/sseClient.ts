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
      // If streamUrl is relative (starts with /), construct full URL with SSE_BASE_URL
      if (streamUrl.startsWith('/')) {
        url = `${SSE_BASE_URL}${streamUrl}`;
      } 
      // If streamUrl is absolute but uses wrong port, normalize to port 5002
      else if (streamUrl.startsWith('http://localhost:') || streamUrl.startsWith('http://127.0.0.1:')) {
        // Replace any port with 5002
        url = streamUrl.replace(/http:\/\/(localhost|127\.0\.0\.1):\d+/, `http://localhost:5002`);
      }
      // If already absolute with correct format, use as-is
      else if (streamUrl.startsWith('http://') || streamUrl.startsWith('https://')) {
        url = streamUrl;
      }
      // Otherwise, treat as relative
      else {
        url = `${SSE_BASE_URL}/${streamUrl.startsWith('/') ? streamUrl.slice(1) : streamUrl}`;
      }
      this.streamUrl = url;
    } else {
      url = `${SSE_BASE_URL}/progress/stream/${jobId}`;
    }
    
    // Normalize URL to use localhost instead of 127.0.0.1 to avoid CORS issues
    // Also ensure port is 5002
    let normalizedUrl = url.replace('http://127.0.0.1:', 'http://localhost:');
    
    // Ensure port is 5002 if it's localhost
    if (normalizedUrl.startsWith('http://localhost:')) {
      const portMatch = normalizedUrl.match(/http:\/\/localhost:(\d+)/);
      if (portMatch && portMatch[1] !== '5002') {
        normalizedUrl = normalizedUrl.replace(/http:\/\/localhost:\d+/, 'http://localhost:5002');
      }
    }
    
    // Log the final URL for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log('[SSE Client] Connecting to:', normalizedUrl);
    }
    
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
      console.error('[SSE Client] Connection error:', error);
      // EventSource will automatically reconnect
      // Log connection state for debugging
      if (this.eventSource) {
        const states = ['CONNECTING', 'OPEN', 'CLOSED'];
        console.log('[SSE Client] Connection state:', states[this.eventSource.readyState] || 'UNKNOWN');
      }
    };

    this.eventSource.addEventListener('open', () => {
      if (import.meta.env.DEV) {
        console.log('[SSE Client] Connected for job:', jobId);
      }
    });
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


/**
 * Server-Sent Events (SSE) Client for Transcription Progress
 */

export interface ProgressEvent {
  job_id: string;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress?: number;
  message?: string;
  result?: {
    text: string;
  };
  error?: string;
}

export type ProgressCallback = (event: ProgressEvent) => void;
export type ErrorCallback = (error: Event) => void;

export class SSEClient {
  private eventSource: EventSource | null = null;
  private jobId: string;
  private streamUrl: string;
  private onProgress: ProgressCallback;
  private onError: ErrorCallback | null;

  constructor(
    streamUrl: string,
    jobId: string,
    onProgress: ProgressCallback,
    onError?: ErrorCallback
  ) {
    this.streamUrl = streamUrl;
    this.jobId = jobId;
    this.onProgress = onProgress;
    this.onError = onError || null;
  }

  /**
   * Connect to the SSE stream
   */
  connect(): void {
    if (this.eventSource) {
      this.close();
    }

    try {
      this.eventSource = new EventSource(this.streamUrl);

      this.eventSource.onmessage = (event) => {
        try {
          const data: ProgressEvent = JSON.parse(event.data);
          this.onProgress(data);
        } catch (error) {
          console.error('Failed to parse SSE message:', error);
        }
      };

      this.eventSource.onerror = (error) => {
        console.error('SSE connection error:', error);
        if (this.onError) {
          this.onError(error);
        }
        // EventSource will automatically attempt to reconnect
      };

      this.eventSource.addEventListener('open', () => {
        console.log(`SSE stream connected for job ${this.jobId}`);
      });
    } catch (error) {
      console.error('Failed to create EventSource:', error);
      if (this.onError) {
        this.onError(error as Event);
      }
    }
  }

  /**
   * Close the SSE connection
   */
  close(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      console.log(`SSE stream closed for job ${this.jobId}`);
    }
  }

  /**
   * Check if the connection is open
   */
  isConnected(): boolean {
    return this.eventSource !== null && this.eventSource.readyState === EventSource.OPEN;
  }
}

/**
 * Create and manage an SSE connection for a transcription job
 */
export function createSSEConnection(
  streamUrl: string,
  jobId: string,
  onProgress: ProgressCallback,
  onError?: ErrorCallback
): SSEClient {
  const client = new SSEClient(streamUrl, jobId, onProgress, onError);
  client.connect();
  return client;
}


/**
 * Hook for GPT-5 Server-Sent Events (SSE) streaming
 * 
 * This hook provides real-time streaming via SSE, which is more reliable than polling
 * for long-running operations and avoids timeout issues.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { getAccessToken, TRANSCRIBE_API_BASE_URL } from '../lib/api';
import type { GPT5StreamEvent } from '../types/gpt5';

export interface UseGPT5StreamReturn {
  text: string;
  isStreaming: boolean;
  error: string | null;
  isConnected: boolean;
}

/**
 * Hook to listen to GPT-5 SSE stream for a job
 * @param streamUrl - Stream URL from API response (e.g., /api/gpt5/stream/<job_id>)
 */
export function useGPT5Stream(streamUrl: string | null): UseGPT5StreamReturn {
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!streamUrl) {
      // Reset state when no stream URL
      setText('');
      setIsStreaming(false);
      setError(null);
      setIsConnected(false);
      return;
    }

    // Reset state when starting new stream
    setText('');
    setIsStreaming(true);
    setError(null);
    setIsConnected(false);

    // Since EventSource doesn't support custom headers, we need to use fetch with SSE
    // However, if the backend supports token in query params or cookies, we can use EventSource
    // For now, we'll use fetch with ReadableStream
    
    const token = getAccessToken();
    if (!token) {
      setError('Authentication token not found');
      setIsStreaming(false);
      return;
    }

    // Construct full URL
    let fullUrl = streamUrl;
    if (!streamUrl.startsWith('http')) {
      // If relative URL, prepend base URL
      fullUrl = `${TRANSCRIBE_API_BASE_URL}${streamUrl.startsWith('/') ? '' : '/'}${streamUrl}`;
    }

    // Normalize URL to use localhost instead of 127.0.0.1 to avoid CORS issues
    const normalizedUrl = fullUrl.replace('http://127.0.0.1:', 'http://localhost:');

    // Use fetch with SSE support and timeout handling
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Add timeout to prevent indefinite hanging
    timeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        setError('Stream connection timed out. Please try again.');
        setIsStreaming(false);
        setIsConnected(false);
      }
    }, 300000); // 5 minute timeout

    fetch(normalizedUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/event-stream',
      },
      signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Stream request failed: ${response.status} ${response.statusText}`);
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        setIsConnected(true);
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                setIsStreaming(false);
                setIsConnected(false);
                if (timeoutRef.current) {
                  clearTimeout(timeoutRef.current);
                  timeoutRef.current = null;
                }
                break;
              }

              // Decode chunk
              buffer += decoder.decode(value, { stream: true });

              // Process complete lines
              const lines = buffer.split('\n');
              buffer = lines.pop() || ''; // Keep incomplete line in buffer

              for (const line of lines) {
                if (line.trim() === '') continue;

                // SSE format: "data: <json>"
                if (line.startsWith('data: ')) {
                  const jsonStr = line.slice(6);
                  try {
                    const event: GPT5StreamEvent = JSON.parse(jsonStr);

                    if (event.error) {
                      setError(event.error);
                      setIsStreaming(false);
                      setIsConnected(false);
                      return;
                    }

                    if (event.chunk) {
                      setText((prev) => prev + event.chunk);
                    }

                    if (event.text) {
                      setText(event.text);
                    }

                    if (event.done) {
                      setIsStreaming(false);
                      setIsConnected(false);
                      if (timeoutRef.current) {
                        clearTimeout(timeoutRef.current);
                        timeoutRef.current = null;
                      }
                      return;
                    }
                  } catch (parseError) {
                    console.error('Error parsing SSE event:', parseError, jsonStr);
                  }
                }
              }
            }
          } catch (streamError: any) {
            if (streamError.name === 'AbortError') {
              // Stream was cancelled, this is expected
              return;
            }
            console.error('Error reading stream:', streamError);
            setError(streamError.message || 'Error reading stream');
            setIsStreaming(false);
            setIsConnected(false);
          }
        };

        readStream();
      })
      .catch((fetchError: any) => {
        if (fetchError.name === 'AbortError') {
          // Request was cancelled, this is expected
          return;
        }
        console.error('Error starting stream:', fetchError);
        setError(fetchError.message || 'Failed to start stream');
        setIsStreaming(false);
        setIsConnected(false);
      });

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      setIsStreaming(false);
      setIsConnected(false);
    };
  }, [streamUrl]);

  return {
    text,
    isStreaming,
    error,
    isConnected,
  };
}


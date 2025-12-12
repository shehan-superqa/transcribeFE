import { useState, useEffect, useRef } from 'react';
import { chatCompletion } from '../../lib/api/gpt5Api';
import { useGPT5WebSocket } from '../../hooks/useGPT5WebSocket';
import type { GPT5ChatCompletionRequest, GPT5Message, ReasoningEffort, Verbosity } from '../../types/gpt5';
import './GPT5Tool.css';

export default function ChatCompletionTool() {
  const [messages, setMessages] = useState<GPT5Message[]>([
    { role: 'system', content: 'You are a helpful assistant.' },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [model, setModel] = useState('');
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');
  const [verbosity, setVerbosity] = useState<Verbosity>('medium');
  const [stream, setStream] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Use WebSocket streaming when stream is enabled
  const wsStream = useGPT5WebSocket(stream && jobId ? jobId : null);

  // Auto-scroll conversation area when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, wsStream.text]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setJobId(null);

    // Get current message content before clearing input
    const messageContent = inputMessage.trim();
    
    // Clear input immediately to prevent double submission
    setInputMessage('');

    // Add user message to conversation
    const userMessage: GPT5Message = { role: 'user', content: messageContent };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);

    try {
      const request: GPT5ChatCompletionRequest = {
        messages: updatedMessages,
        stream,
      };

      if (model) request.model = model;
      if (reasoningEffort) request.reasoning_effort = reasoningEffort;
      if (verbosity) request.verbosity = verbosity;

      const response = await chatCompletion(request);

      if (response.success && response.accepted && response.job_id) {
        setJobId(response.job_id);
        
        // Start WebSocket streaming if enabled
        if (stream) {
          try {
            await wsStream.startStream({
              job_id: response.job_id,
              messages: updatedMessages,
              model: model || undefined,
              reasoning_effort: reasoningEffort,
              verbosity: verbosity,
            });
            // Don't set isSubmitting to false here - let it be controlled by streaming state
          } catch (streamError: any) {
            console.error('WebSocket stream error:', streamError);
            setError(streamError.message || 'Failed to start streaming');
            setIsSubmitting(false);
          }
        } else {
          // If not streaming, we can set isSubmitting to false immediately
          setIsSubmitting(false);
        }
      } else {
        setError('Failed to start chat completion. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error in chat completion:', err);
      
      // Provide user-friendly error messages
      let errorMessage = err.message || 'Failed to complete chat. Please try again.';
      
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        errorMessage = 'GPT-5 endpoint not available. Please ensure the backend service is running and the GPT-5 endpoints are configured.';
      } else if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
      
      // Re-add the user message to input if request failed
      setInputMessage(messageContent);
    }
  };

  // Update messages when result is available from WebSocket
  useEffect(() => {
    const resultText = wsStream.text;
    const isStreaming = wsStream.isStreaming;
    
    if (resultText && jobId) {
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        
        // If streaming, update the last message if it's an assistant message, or add new one
        if (isStreaming) {
          if (lastMessage?.role === 'assistant') {
            // Update existing assistant message with streaming text
            const updatedMessages = [...prevMessages];
            updatedMessages[updatedMessages.length - 1] = { role: 'assistant', content: resultText };
            return updatedMessages;
          } else {
            // Add new assistant message with streaming text
            return [...prevMessages, { role: 'assistant', content: resultText }];
          }
        } else if (!isStreaming && resultText) {
          // Streaming completed - ensure final message is in messages
          if (lastMessage?.role !== 'assistant' || lastMessage.content !== resultText) {
            // Remove any incomplete assistant message and add the complete one
            const updatedMessages = prevMessages.filter((msg, idx) => 
              !(idx === prevMessages.length - 1 && msg.role === 'assistant')
            );
            return [...updatedMessages, { role: 'assistant', content: resultText }];
          }
        }
        
        return prevMessages;
      });
    }
  }, [wsStream.text, wsStream.isStreaming, jobId]);

  // Reset isSubmitting when streaming completes
  useEffect(() => {
    if (!wsStream.isStreaming && jobId && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [wsStream.isStreaming, jobId, isSubmitting]);

  const handleClearConversation = async () => {
    if (jobId && wsStream.isStreaming) {
      await wsStream.stopStream(jobId);
    }
    setMessages([{ role: 'system', content: 'You are a helpful assistant.' }]);
    setInputMessage('');
    setJobId(null);
    setError(null);
    wsStream.clearError();
  };

  const isLoading = isSubmitting || (stream && jobId ? wsStream.isStreaming : false);
  const displayError = error || wsStream.error;

  return (
    <div className="gpt5-tool-container">
      <div className="gpt5-chat-wrapper">
        <div className="gpt5-chat-header">
          <h2 className="gpt5-title">Chat Completion</h2>
          <p className="gpt5-subtitle">Have a conversation with GPT-5</p>
          <button
            className="gpt5-button gpt5-button-small"
            onClick={handleClearConversation}
            disabled={isLoading}
          >
            Clear Conversation
          </button>
        </div>

        <div className="gpt5-chat-messages" ref={messagesContainerRef}>
          {messages.map((msg, idx) => {
            if (msg.role === 'system') return null;
            
            // Check if this is the last assistant message and we're currently streaming
            const isStreamingMessage = msg.role === 'assistant' && 
                                      idx === messages.length - 1 && 
                                      wsStream.isStreaming && 
                                      jobId;
            
            return (
              <div
                key={idx}
                className={`gpt5-message gpt5-message-${msg.role}`}
              >
                <div className="gpt5-message-role">
                  {msg.role === 'user' ? 'You' : 'Assistant'}
                </div>
                <div className="gpt5-message-content">
                  {msg.content}
                  {isStreamingMessage && <span className="gpt5-cursor">▋</span>}
                </div>
              </div>
            );
          })}
          
          {/* Show loading spinner only when starting (no text yet) */}
          {isLoading && !wsStream.text && jobId && (
            <div className="gpt5-message gpt5-message-assistant">
              <div className="gpt5-message-role">Assistant</div>
              <div className="gpt5-message-content">
                <div className="gpt5-loading">
                  <div className="gpt5-spinner"></div>
                  <span>{wsStream.isConnected ? 'Thinking...' : 'Connecting...'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {displayError && (
          <div className="gpt5-error">
            {displayError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="gpt5-chat-form">
          <div className="gpt5-chat-input-wrapper">
            <textarea
              className="gpt5-chat-input"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              required
              disabled={isLoading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <button
              type="submit"
              className="gpt5-button gpt5-button-primary"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </form>

        <div className="gpt5-chat-settings">
          <div className="gpt5-row">
            <div className="gpt5-input-group">
              <label className="gpt5-label">Model (optional)</label>
              <input
                type="text"
                className="gpt5-input"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Leave empty for default"
                disabled={isLoading}
              />
            </div>

            <div className="gpt5-input-group">
              <label className="gpt5-label">Reasoning Effort</label>
              <select
                className="gpt5-select"
                value={reasoningEffort}
                onChange={(e) => setReasoningEffort(e.target.value as ReasoningEffort)}
                disabled={isLoading}
              >
                <option value="minimal">Minimal</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div className="gpt5-input-group">
              <label className="gpt5-label">Verbosity</label>
              <select
                className="gpt5-select"
                value={verbosity}
                onChange={(e) => setVerbosity(e.target.value as Verbosity)}
                disabled={isLoading}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <div className="gpt5-checkbox-group">
            <input
              type="checkbox"
              id="chat-stream-toggle"
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              disabled={isLoading}
              className="gpt5-checkbox"
            />
            <label htmlFor="chat-stream-toggle" className="gpt5-checkbox-label">
              Enable streaming (real-time updates)
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}


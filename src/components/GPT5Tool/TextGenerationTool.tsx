import { useState, useEffect } from 'react';
import { generateText } from '../../lib/api/gpt5Api';
import { useGPT5WebSocket } from '../../hooks/useGPT5WebSocket';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import type { GPT5TextGenerationRequest, ReasoningEffort, Verbosity } from '../../types/gpt5';
import './GPT5Tool.css';

export default function TextGenerationTool() {
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('');
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEffort>('medium');
  const [verbosity, setVerbosity] = useState<Verbosity>('medium');
  const [stream, setStream] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use WebSocket streaming when stream is enabled
  const wsStream = useGPT5WebSocket(stream && jobId ? jobId : null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication before submitting
    if (!requireAuth()) {
      return;
    }
    
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Prevent duplicate submissions
    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setJobId(null);

    try {
      const request: GPT5TextGenerationRequest = {
        prompt: prompt.trim(),
        stream,
      };

      if (model) request.model = model;
      if (reasoningEffort) request.reasoning_effort = reasoningEffort;
      if (verbosity) request.verbosity = verbosity;

      const response = await generateText(request);

      if (response.success && response.accepted && response.job_id) {
        setJobId(response.job_id);
        
        // Start WebSocket streaming if enabled
        if (stream) {
          try {
            await wsStream.startStream({
              job_id: response.job_id,
              prompt: prompt.trim(),
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
        setError('Failed to start generation. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Error generating text:', err);
      
      // Provide user-friendly error messages
      let errorMessage = err.message || 'Failed to generate text. Please try again.';
      
      if (err.message?.includes('404') || err.message?.includes('not found')) {
        errorMessage = 'GPT-5 endpoint not available. Please ensure the backend service is running and the GPT-5 endpoints are configured.';
      } else if (err.message?.includes('401') || err.message?.includes('Authentication')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (err.message?.includes('Network') || err.message?.includes('fetch')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const handleReset = async () => {
    if (jobId && wsStream.isStreaming) {
      await wsStream.stopStream(jobId);
    }
    setPrompt('');
    setJobId(null);
    setError(null);
    wsStream.clearError();
  };

  // Display streaming text from WebSocket
  const displayText = stream && jobId ? wsStream.text : '';
  const isLoading = isSubmitting || (stream && jobId ? wsStream.isStreaming : false);
  const displayError = error || wsStream.error;
  const hasResult = displayText || jobId;

  // Reset isSubmitting when streaming completes
  useEffect(() => {
    if (!wsStream.isStreaming && jobId && isSubmitting) {
      setIsSubmitting(false);
    }
  }, [wsStream.isStreaming, jobId, isSubmitting]);

  return (
    <div className="gpt5-tool-container">
      <div className="gpt5-form-wrapper">
        <h2 className="gpt5-title">Text Generation</h2>
        <p className="gpt5-subtitle">Generate text using GPT-5</p>

        <form onSubmit={handleSubmit} className="gpt5-form">
          <div className="gpt5-input-group">
            <label className="gpt5-label">Prompt *</label>
            <textarea
              className="gpt5-textarea"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter your prompt here..."
              rows={6}
              required
              disabled={isLoading}
            />
          </div>

          <div className="gpt5-input-group">
            <label className="gpt5-label">Model (optional)</label>
            <input
              type="text"
              className="gpt5-input"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Leave empty for default model"
              disabled={isLoading}
            />
          </div>

          <div className="gpt5-row">
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
              id="stream-toggle"
              checked={stream}
              onChange={(e) => setStream(e.target.checked)}
              disabled={isLoading}
              className="gpt5-checkbox"
            />
            <label htmlFor="stream-toggle" className="gpt5-checkbox-label">
              Enable streaming (real-time updates)
            </label>
          </div>

          {displayError && (
            <div className="gpt5-error">
              {displayError}
            </div>
          )}

          <div className="gpt5-button-group">
            <button
              type="submit"
              className="gpt5-button gpt5-button-primary"
              disabled={!isAuthenticated || isLoading || !prompt.trim()}
            >
              {isLoading ? 'Generating...' : 'Generate Text'}
            </button>
            {hasResult && (
              <button
                type="button"
                className="gpt5-button gpt5-button-secondary"
                onClick={handleReset}
                disabled={isLoading}
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {(hasResult || isLoading) && (
        <div className="gpt5-result-wrapper">
          <h3 className="gpt5-result-title">Generated Text</h3>
          <div className="gpt5-result-content">
            {isLoading && !displayText && (
              <div className="gpt5-loading">
                <div className="gpt5-spinner"></div>
                <span>{wsStream.isConnected ? 'Generating...' : 'Connecting...'}</span>
              </div>
            )}
            {(displayText || isLoading) && (
              <div className="gpt5-text-output">
                {displayText}
                {isLoading && wsStream.isStreaming && (
                  <span className="gpt5-cursor">▋</span>
                )}
              </div>
            )}
            {displayText && !isLoading && (
              <div className="gpt5-result-actions">
                <button
                  className="gpt5-button gpt5-button-small"
                  onClick={() => {
                    navigator.clipboard.writeText(displayText);
                  }}
                >
                  Copy Text
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


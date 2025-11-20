import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { submitVideoJob, getVideoJobStatus } from '../../lib/api/videoApi';
import { useSSE } from '../../hooks/useSSE';
import type { VideoJobRequest, VideoJobResult } from '../../types/api';
import './VideoGenerationTool.css';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    maxWidth: '900px',
    margin: '2rem auto',
    fontFamily: 'Inter, system-ui, sans-serif',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  label: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#f8fafc',
  },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical' as const,
    minHeight: '120px',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.95rem',
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.95rem',
    cursor: 'pointer',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  advancedToggle: {
    background: 'transparent',
    border: 'none',
    color: '#60a5fa',
    cursor: 'pointer',
    fontSize: '0.9rem',
    padding: '0.5rem 0',
    textAlign: 'left' as const,
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  advancedSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.75rem',
    marginTop: '0.5rem',
  },
  referenceImageInput: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  addImageButton: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a5b4fc',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    alignSelf: 'flex-start',
  },
  removeImageButton: {
    background: 'rgba(239, 68, 68, 0.2)',
    border: '1px solid rgba(239, 68, 68, 0.4)',
    color: '#fca5a5',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  submitButton: {
    background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
  },
  progressBarContainer: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    height: '0.5rem',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },
  videoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
  },
  video: {
    width: '100%',
    borderRadius: '0.75rem',
    maxHeight: '500px',
  },
  downloadButton: {
    background: 'linear-gradient(90deg, #10b981, #059669)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    textDecoration: 'none',
    display: 'inline-block',
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    textAlign: 'right' as const,
    marginTop: '0.25rem',
  },
};

export default function VideoGenerationTool() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>(['']);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');
  const [duration, setDuration] = useState(8);
  const [resolution, setResolution] = useState<'720p' | '1080p' | '1440p' | '4K'>('1080p');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [generateAudio, setGenerateAudio] = useState(true);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getVideoJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          
          if (jobStatus === 'completed' && response.job.result) {
            const url = response.job.result.video_url || response.job.video_output_url;
            if (url) {
              setVideoUrl(url);
              setLoading(false);
              setPollingInterval((prev) => {
                if (prev) {
                  clearInterval(prev);
                }
                return null;
              });
            }
          } else if (jobStatus === 'error') {
            setError(response.job.error || 'Job failed');
            setLoading(false);
            setPollingInterval((prev) => {
              if (prev) {
                clearInterval(prev);
              }
              return null;
            });
          }
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    };

    poll(); // Poll immediately
    const interval = setInterval(poll, 5000); // Then every 5 seconds
    setPollingInterval(interval);
  }, [jobId]);

  // Fallback to polling if SSE fails
  useEffect(() => {
    if (jobId && !isConnected && !usePolling && status !== 'completed' && status !== 'error') {
      setUsePolling(true);
      startPolling();
    }
  }, [jobId, isConnected, usePolling, status, startPolling]);

  // Handle SSE result
  useEffect(() => {
    if (result && 'video_url' in result) {
      const videoResult = result as VideoJobResult;
      if (videoResult.video_url) {
        setVideoUrl(videoResult.video_url);
        setLoading(false);
        setPollingInterval((prev) => {
          if (prev) {
            clearInterval(prev);
          }
          return null;
        });
      }
    }
  }, [result]);

  // Handle SSE errors
  useEffect(() => {
    if (sseError) {
      setError(sseError);
      if (!usePolling) {
        setUsePolling(true);
        startPolling();
      }
    }
  }, [sseError, usePolling, startPolling]);

  const handleAddReferenceImage = () => {
    if (referenceImages.length < 3) {
      setReferenceImages([...referenceImages, '']);
    }
  };

  const handleRemoveReferenceImage = (index: number) => {
    if (referenceImages.length > 1) {
      setReferenceImages(referenceImages.filter((_, i) => i !== index));
    }
  };

  const handleReferenceImageChange = (index: number, value: string) => {
    const newImages = [...referenceImages];
    newImages[index] = value;
    setReferenceImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setVideoUrl(null);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setLoading(false);
      return;
    }

    // Filter out empty reference images
    const validReferenceImages = referenceImages.filter(img => img.trim() !== '');

    const request: VideoJobRequest = {
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio,
      duration,
      resolution,
      negative_prompt: negativePrompt.trim() || undefined,
      generate_audio: generateAudio,
      seed: seed || undefined,
      reference_images: validReferenceImages.length > 0 ? validReferenceImages : undefined,
    };

    try {
      const response = await submitVideoJob(request);
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        // SSE will handle progress, but start polling as backup
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 2000);
      } else {
        setError('Failed to submit video generation job');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit video generation job');
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (videoUrl) {
      const link = document.createElement('a');
      link.href = videoUrl;
      link.download = `video-${jobId || 'output'}.mp4`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const currentStatus = loading ? (status || 'queued') : '';
  const displayProgress = progress || 0;
  const displayMessage = message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating video...' : '');

  return (
    <div style={styles.container} className="video-generation-tool-container">
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Prompt <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the video you want to generate..."
            style={styles.textarea}
            disabled={loading}
            required
          />
          <div style={styles.charCount}>{prompt.length} characters</div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Reference Images (Optional, 1-3 images)</label>
          <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 0.5rem 0' }}>
            Provide URLs to images that will guide the video generation. Only works with 16:9 aspect ratio and 8-second duration.
          </p>
          {referenceImages.map((imageUrl, index) => (
            <div key={index} style={styles.referenceImageInput}>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => handleReferenceImageChange(index, e.target.value)}
                placeholder={`Reference image ${index + 1} URL`}
                style={styles.input}
                disabled={loading}
              />
              {referenceImages.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveReferenceImage(index)}
                  style={styles.removeImageButton}
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {referenceImages.length < 3 && (
            <button
              type="button"
              onClick={handleAddReferenceImage}
              style={styles.addImageButton}
              disabled={loading}
            >
              + Add Reference Image
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={styles.advancedToggle}
        >
          {showAdvanced ? '▼' : '▶'} Advanced Options
        </button>

        {showAdvanced && (
          <div style={styles.advancedSection}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Aspect Ratio</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                style={styles.select}
                disabled={loading}
              >
                <option value="16:9">16:9 (Landscape)</option>
                <option value="9:16">9:16 (Portrait)</option>
                <option value="1:1">1:1 (Square)</option>
                <option value="4:3">4:3</option>
                <option value="3:4">3:4</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Duration (seconds)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 8)}
                min={1}
                max={60}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as any)}
                style={styles.select}
                disabled={loading}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
                <option value="1440p">1440p</option>
                <option value="4K">4K</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Negative Prompt (Optional)</label>
              <input
                type="text"
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder="What to exclude from the video..."
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={generateAudio}
                  onChange={(e) => setGenerateAudio(e.target.checked)}
                  style={styles.checkbox}
                  disabled={loading}
                />
                <label style={styles.label}>Generate Audio</label>
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Seed (Optional)</label>
              <input
                type="number"
                value={seed || ''}
                onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="Random seed for reproducibility"
                style={styles.input}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {error && <div style={styles.error}>{error}</div>}

        {(currentStatus || loading) && (
          <div style={styles.progressContainer}>
            <div style={styles.progressText}>
              {displayMessage}
              {displayProgress > 0 && <span> ({Math.round(displayProgress)}%)</span>}
            </div>
            {displayProgress > 0 && (
              <div style={styles.progressBarContainer}>
                <div style={{ ...styles.progressBar, width: `${displayProgress}%` }} />
              </div>
            )}
          </div>
        )}

        {videoUrl && (
          <div style={styles.videoContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Generated Video</h3>
            <video src={videoUrl} controls style={styles.video}>
              Your browser does not support the video tag.
            </video>
            <a
              href={videoUrl}
              download={`video-${jobId || 'output'}.mp4`}
              style={styles.downloadButton}
            >
              Download Video
            </a>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !user || !prompt.trim()}
          style={{
            ...styles.submitButton,
            ...(loading || !user || !prompt.trim() ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? 'Generating...' : 'Generate Video'}
        </button>

        {!user && (
          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: '#60a5fa' }}>sign in</a> to generate videos
          </p>
        )}
      </form>
    </div>
  );
}


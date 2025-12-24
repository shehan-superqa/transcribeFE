import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { submitVideoJob, getVideoJobStatus } from '../../lib/api/videoApi';
import { useSSE } from '../../hooks/useSSE';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { checkAuthAndTriggerModal } from '../../lib/authCheck';
import type { VideoJobRequest, VideoJobResult, VideoJob } from '../../types/api';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';
import './VideoGenerationTool.css';

const getStyles = () => ({
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2rem',
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, var(--gradient-start), var(--gradient-end))',
    color: 'var(--text-primary)',
    boxShadow: '0 10px 25px var(--shadow)',
    maxWidth: '1600px',
    margin: '2rem auto',
    width: '100%',
  },
  formContainer: {
    flex: 1,
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)',
    color: '#1a1a1a',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
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
    paddingBottom: '1.5rem',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    marginBottom: '0.5rem',
  },
  label: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: '#1a1a1a',
  },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderBottom: '2px solid rgba(0, 0, 0, 0.2)',
    background: '#ffffff',
    color: '#1a1a1a',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical' as const,
    minHeight: '120px',
    transition: 'border-color 0.3s ease',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderBottom: '2px solid rgba(0, 0, 0, 0.2)',
    background: '#ffffff',
    color: '#1a1a1a',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'border-color 0.3s ease',
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(0, 0, 0, 0.15)',
    borderBottom: '2px solid rgba(0, 0, 0, 0.2)',
    background: '#ffffff',
    backgroundColor: '#ffffff',
    color: '#1a1a1a',
    outline: 'none',
    fontSize: '0.95rem',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
    transition: 'border-color 0.3s ease',
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
    color: 'var(--primary-color)',
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
    background: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
    marginTop: '0.5rem',
  },
  referenceImageInput: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  imagePreview: {
    maxWidth: '200px',
    maxHeight: '150px',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    border: '1px solid var(--border-color)',
  },
  imageInputWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  fileInputLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  fileInput: {
    display: 'none',
  },
  addImageButton: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary-color)',
    color: 'var(--primary-color)',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 500,
    alignSelf: 'flex-start',
  },
  removeImageButton: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f44336',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.75rem',
    marginTop: '0.25rem',
  },
  submitButton: {
    background: 'linear-gradient(90deg, var(--primary-color), var(--primary-hover))',
    color: 'var(--text-primary)',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.875rem 1.5rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 12px var(--shadow)',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#f44336',
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
  },
  progressContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.75rem',
    padding: '1rem',
    background: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
  },
  progressBarContainer: {
    background: 'var(--bg-secondary)',
    borderRadius: '1rem',
    height: '0.5rem',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, var(--primary-color), var(--primary-hover))',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
  },
  videoContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    background: 'var(--bg-secondary)',
    borderRadius: '0.75rem',
    minWidth: '400px',
    maxWidth: '500px',
    flexShrink: 0,
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
    color: 'var(--text-secondary)',
    textAlign: 'right' as const,
    marginTop: '0.25rem',
  },
});

export default function VideoGenerationTool() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { openModal } = useAuthModal();
  const styles = getStyles();
  const performSubmission = useRef(false);
  const [prompt, setPrompt] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>(['']);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');
  const [duration, setDuration] = useState<4 | 6 | 8>(8);
  const [resolution, setResolution] = useState<'720p' | '1080p'>('1080p');
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
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);


  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getVideoJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          setPollingStatus(jobStatus);
          
          // Extract progress from various possible locations
          let extractedProgress = 0;
          let extractedMessage = '';
          
          // Check replicate_data for progress (common in video generation APIs)
          const replicateData = (response.job as any).replicate_data;
          if (replicateData) {
            if (typeof replicateData.progress === 'number') {
              extractedProgress = Math.min(Math.max(replicateData.progress * 100, 0), 100);
            }
            if (replicateData.status) {
              extractedMessage = replicateData.status;
            }
            if (replicateData.logs && Array.isArray(replicateData.logs)) {
              const lastLog = replicateData.logs[replicateData.logs.length - 1];
              if (lastLog && typeof lastLog === 'string') {
                extractedMessage = lastLog;
              }
            }
          }
          
          // Check for progress field directly on job
          if (!extractedProgress && (response.job as any).progress !== undefined) {
            extractedProgress = Math.min(Math.max((response.job as any).progress, 0), 100);
          }
          
          // Estimate progress based on status if no explicit progress
          if (!extractedProgress) {
            switch (jobStatus) {
              case 'queued':
                extractedProgress = 5;
                extractedMessage = extractedMessage || 'Job queued...';
                break;
              case 'starting':
                extractedProgress = 10;
                extractedMessage = extractedMessage || 'Starting video generation...';
                break;
              case 'processing':
                extractedProgress = 50; // Mid-range for processing
                extractedMessage = extractedMessage || 'Generating video...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Video generation completed!';
                break;
              default:
                extractedProgress = 0;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
          
          if (jobStatus === 'completed' && response.job.result) {
            const url = response.job.result.video_url || response.job.video_output_url;
            if (url) {
              setVideoUrl(url);
              setLoading(false);
              setPollingProgress(100);
              setPollingMessage('Video generation completed!');
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
    const interval = setInterval(poll, 1000); // Poll every 1 second for real-time updates
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
    setReferenceImages(referenceImages.filter((_, i) => i !== index));
  };

  const handleReferenceImageChange = (index: number, value: string) => {
    const newImages = [...referenceImages];
    newImages[index] = value;
    setReferenceImages(newImages);
  };

  const handlePasteImage = async (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const items = e.clipboardData.items;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const blob = item.getAsFile();
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64data = reader.result as string;
            const newImages = [...referenceImages];
            newImages[index] = base64data;
            setReferenceImages(newImages);
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const handleFileSelect = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        const newImages = [...referenceImages];
        newImages[index] = base64data;
        setReferenceImages(newImages);
      };
      reader.readAsDataURL(file);
    }
  };

  const executeSubmission = async () => {
    if (performSubmission.current) return;
    performSubmission.current = true;

    setError(null);
    setVideoUrl(null);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      setLoading(false);
      return;
    }

    // Filter out empty reference images
    const validReferenceImages = referenceImages.filter(img => img.trim() !== '');

    // Ensure duration is a valid number
    const durationValue = typeof duration === 'number' && (duration === 4 || duration === 6 || duration === 8) 
      ? duration 
      : 8; // Default to 8 if invalid

    const request: VideoJobRequest = {
      prompt: prompt.trim(),
      aspect_ratio: aspectRatio,
      duration: durationValue,
      resolution,
      negative_prompt: negativePrompt.trim() || undefined,
      generate_audio: generateAudio,
      seed: seed || undefined,
      reference_images: validReferenceImages.length > 0 ? validReferenceImages : undefined,
    };

    // Log request for debugging
    console.log('Video generation request:', JSON.stringify(request, null, 2));
    console.log('Duration value:', durationValue, 'Type:', typeof durationValue);

    try {
      const response = await submitVideoJob(request);
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        // Set initial progress state
        setPollingProgress(5);
        setPollingStatus('queued');
        setPollingMessage('Job submitted, starting...');
        // SSE will handle progress, but start polling as backup immediately
        // Polling will start automatically via useEffect if SSE doesn't connect
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 1000);
      } else {
        setError('Failed to submit video generation job');
        setLoading(false);
      }
    } catch (err: any) {
      // Check if this is an authentication error
      if (
        err.message?.includes('not authenticated') ||
        err.message?.includes('Please log in') ||
        err.message?.includes('Authentication failed') ||
        err.message?.includes('Authentication required') ||
        err.response?.status === 401
      ) {
        // Show auth modal - will retry submission after successful auth
        checkAuthAndTriggerModal(openModal, executeSubmission);
        setLoading(false);
        return;
      }

      setError(err.message || 'Failed to submit video generation job');
      setLoading(false);
    } finally {
      performSubmission.current = false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    // Check authentication before proceeding
    if (!checkAuthAndTriggerModal(openModal, executeSubmission)) {
      // Auth modal was opened, stop here
      return;
    }

    // User is authenticated, proceed with submission
    await executeSubmission();
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

  // Use polling progress/status if SSE is not connected, otherwise use SSE data
  const currentStatus = loading ? (isConnected ? status : pollingStatus || 'queued') : '';
  const displayProgress = isConnected ? (progress || 0) : (pollingProgress || 0);
  const displayMessage = isConnected 
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating video...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating video...' : currentStatus === 'starting' ? 'Starting video generation...' : ''));



  return (
    <div>
      <div className="tool-sticky-title">
        <h1>
          <span>Text to Video</span>
          <span className="title-subtitle"> - Generate videos using AI with text prompts and reference images</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Enter a detailed text prompt describing the video you want to generate. Optionally upload reference images to guide the video style (1-3 images, works with 16:9 aspect ratio and 8-second duration). Adjust settings like aspect ratio, duration, and model selection. Click 'Generate Video' to create your video. The process may take several minutes depending on the video length."
      />
      <div style={styles.container}>
        <div style={styles.formContainer}>
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>
            Paste images from clipboard, upload files, or provide image URLs. Only works with 16:9 aspect ratio and 8-second duration.
          </p>
          {referenceImages.map((imageUrl, index) => (
            <div key={index} style={styles.imageInputWrapper}>
              <div style={styles.referenceImageInput}>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => handleReferenceImageChange(index, e.target.value)}
                  onPaste={(e) => handlePasteImage(index, e)}
                  placeholder={`Reference image ${index + 1} URL or paste image here`}
                  style={styles.input}
                  disabled={loading}
                />
                <label htmlFor={`file-input-${index}`} style={styles.fileInputLabel}>
                  Or click to upload image file
                </label>
                <input
                  id={`file-input-${index}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(index, e)}
                  style={styles.fileInput}
                  disabled={loading}
                />
                {imageUrl && (imageUrl.startsWith('data:image') || imageUrl.startsWith('http')) && (
                  <img 
                    src={imageUrl} 
                    alt={`Reference ${index + 1}`} 
                    style={styles.imagePreview}
                    onError={(e) => {
                      // Hide image if it fails to load
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => handleRemoveReferenceImage(index)}
                style={styles.removeImageButton}
                disabled={loading}
              >
                Remove
              </button>
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
              <select
                value={duration.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (val === 4 || val === 6 || val === 8) {
                    setDuration(val as 4 | 6 | 8);
                  }
                }}
                style={styles.select}
                disabled={loading}
              >
                <option value="4">4 seconds</option>
                <option value="6">6 seconds</option>
                <option value="8">8 seconds</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(e.target.value as '720p' | '1080p')}
                style={styles.select}
                disabled={loading}
              >
                <option value="720p">720p</option>
                <option value="1080p">1080p</option>
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
              <label style={styles.label}>Generate Audio</label>
              <select
                value={generateAudio ? 'true' : 'false'}
                onChange={(e) => setGenerateAudio(e.target.value === 'true')}
                style={styles.select}
                disabled={loading}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
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
              {displayMessage || 'Processing...'}
              <span> ({Math.round(displayProgress)}%)</span>
            </div>
            <div style={styles.progressBarContainer}>
              <div style={{ ...styles.progressBar, width: `${Math.max(displayProgress, 5)}%` }} />
            </div>
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
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: 'var(--primary-color)' }}>sign in</a> to generate videos
          </p>
        )}
      </form>
      </div>

      {/* Right Sidebar: Video Result + History */}
      <div style={styles.rightSidebar}>
        {videoUrl && (
          <div style={styles.videoContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Generated Video</h3>
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

      </div>
      </div>
    </div>
  );
}


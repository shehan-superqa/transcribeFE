import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { submitVideoJob, getVideoJobStatus } from '../../lib/api/videoApi';
import { getUserJobs } from '../../lib/api/jobsApi';
import { useSSE } from '../../hooks/useSSE';
import type { VideoJobRequest, VideoJobResult, VideoJob, Job } from '../../types/api';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';
import './VideoGenerationTool.css';

const styles = {
  formContainer: {
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
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
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.95rem',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    MozAppearance: 'none' as const,
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
  imagePreview: {
    maxWidth: '200px',
    maxHeight: '150px',
    borderRadius: '0.5rem',
    marginTop: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
  },
  imageInputWrapper: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  fileInputLabel: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  fileInput: {
    display: 'none',
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
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
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
    color: '#cbd5e1',
    textAlign: 'right' as const,
    marginTop: '0.25rem',
  },
};

export default function VideoGenerationTool() {
  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
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
  const [videoHistory, setVideoHistory] = useState<VideoJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  // Fetch video job history
  useEffect(() => {
    const fetchVideoHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for video jobs only
          const videoJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'video'
          ).map((job: Job) => job as unknown as VideoJob);
          
          // Sort by created_at (newest first)
          videoJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setVideoHistory(videoJobs);
        }
      } catch (err: any) {
        console.error('Error fetching video history:', err);
        setHistoryError(err?.message || 'Failed to load video history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchVideoHistory();
  }, [user]);

  // Refresh history when a job completes
  useEffect(() => {
    if (videoUrl && user) {
      const fetchVideoHistory = async () => {
        try {
          const response = await getUserJobs(user.id);
          if (response.success && response.jobs) {
            const videoJobs = response.jobs.filter(
              (job: Job) => (job as any).job_type === 'video'
            ).map((job: Job) => job as unknown as VideoJob);
            
            videoJobs.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            
            setVideoHistory(videoJobs);
          }
        } catch (err) {
          console.error('Error refreshing video history:', err);
        }
      };
      fetchVideoHistory();
    }
  }, [videoUrl, user]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication before submitting
    if (!requireAuth()) {
      return;
    }
    
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

  // Use polling progress/status if SSE is not connected, otherwise use SSE data
  const currentStatus = loading ? (isConnected ? status : pollingStatus || 'queued') : '';
  const displayProgress = isConnected ? (progress || 0) : (pollingProgress || 0);
  const displayMessage = isConnected 
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating video...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating video...' : currentStatus === 'starting' ? 'Starting video generation...' : ''));

  // Helper functions
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#4caf50";
      case "processing":
      case "starting":
        return "#ff9800";
      case "error":
      case "cancelled":
        return "#f44336";
      case "queued":
        return "#2196f3";
      default:
        return "#666666";
    }
  };

  const handleVideoJobClick = (job: VideoJob) => {
    if (job.result?.video_url || job.video_output_url) {
      const url = job.result?.video_url || job.video_output_url;
      if (url) {
        setVideoUrl(url);
        setJobId(job._id);
      }
    }
  };

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
      <div style={styles.formContainer}>
              {videoUrl && (
                <div style={styles.videoContainer}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Generated Video</h3>
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
          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: '#60a5fa' }}>sign in</a> to generate videos
          </p>
        )}
      </form>
      </div>
    </div>
  );
}


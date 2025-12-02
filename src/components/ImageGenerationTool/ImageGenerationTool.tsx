import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { submitImageJob, getImageJobStatus } from '../../lib/api/imageApi';
import { getUserJobs } from '../../lib/api/jobsApi';
import { useSSE } from '../../hooks/useSSE';
import type { ImageJobRequest, ImageJobResult, ImageJob, Job } from '../../types/api';
import './ImageGenerationTool.css';

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'row' as const,
    gap: '2rem',
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    maxWidth: '1600px',
    margin: '2rem auto',
    fontFamily: 'Inter, system-ui, sans-serif',
    alignItems: 'flex-start' as const,
  },
  formWrapper: {
    flex: '1',
    minWidth: 0,
    maxWidth: '600px',
  },
  rightSidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2rem',
    minWidth: '400px',
    position: 'sticky' as const,
    top: '2rem',
    alignSelf: 'flex-start' as const,
    maxHeight: 'calc(100vh - 4rem)',
    overflowY: 'auto' as const,
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
  imageInputWrapper: {
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
  fileInputLabel: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  fileInput: {
    display: 'none',
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
  imageContainer: {
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
  image: {
    width: '100%',
    borderRadius: '0.75rem',
    maxHeight: '600px',
    objectFit: 'contain' as const,
  },
  imageGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginTop: '0.5rem',
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
  historyContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
    minWidth: '350px',
    maxWidth: '400px',
    flexShrink: 0,
    minHeight: 0,
  },
  historyTitle: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600,
    color: '#f8fafc',
  },
  historyCard: {
    padding: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  historyCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.5rem',
  },
  historyCardPrompt: {
    fontSize: '0.9rem',
    color: '#cbd5e1',
    marginBottom: '0.5rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },
  historyCardMeta: {
    fontSize: '0.75rem',
    color: '#94a3b8',
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  emptyHistory: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#94a3b8',
  },
  charCount: {
    fontSize: '0.75rem',
    color: '#cbd5e1',
    textAlign: 'right' as const,
    marginTop: '0.25rem',
  },
};

export default function ImageGenerationTool() {
  const { user } = useAuth();
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [numOutputs, setNumOutputs] = useState(1);
  const [guidanceScale, setGuidanceScale] = useState(3.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [model, setModel] = useState<'black-forest-labs/flux-dev' | 'black-forest-labs/flux-schnell' | 'stability-ai/sdxl' | 'stability-ai/stable-diffusion'>('black-forest-labs/flux-dev');
  const [inputImage, setInputImage] = useState<string>('');
  const [maskImage, setMaskImage] = useState<string>('');
  const [strength, setStrength] = useState(0.8);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');
  const [imageHistory, setImageHistory] = useState<ImageJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  // Fetch image job history
  useEffect(() => {
    const fetchImageHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for image jobs only
          const imageJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image'
          ).map((job: Job) => job as unknown as ImageJob);
          
          // Sort by created_at (newest first)
          imageJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setImageHistory(imageJobs);
        }
      } catch (err: any) {
        console.error('Error fetching image history:', err);
        setHistoryError(err?.message || 'Failed to load image history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchImageHistory();
  }, [user]);

  // Refresh history when a job completes
  useEffect(() => {
    if (imageUrls.length > 0 && user) {
      const fetchImageHistory = async () => {
        try {
          const response = await getUserJobs(user.id);
          if (response.success && response.jobs) {
            const imageJobs = response.jobs.filter(
              (job: Job) => (job as any).job_type === 'image'
            ).map((job: Job) => job as unknown as ImageJob);
            
            imageJobs.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            
            setImageHistory(imageJobs);
          }
        } catch (err) {
          console.error('Error refreshing image history:', err);
        }
      };
      fetchImageHistory();
    }
  }, [imageUrls, user]);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getImageJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          setPollingStatus(jobStatus);
          
          // Extract progress from various possible locations
          let extractedProgress = 0;
          let extractedMessage = '';
          
          // Check replicate_data for progress
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
                extractedMessage = extractedMessage || 'Starting image generation...';
                break;
              case 'processing':
                extractedProgress = 50;
                extractedMessage = extractedMessage || 'Generating image...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Image generation completed!';
                break;
              default:
                extractedProgress = 0;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
          
          if (jobStatus === 'completed' && response.job.result) {
            const urls = response.job.result.image_urls || 
                        (response.job.result.image_url ? [response.job.result.image_url] : []) ||
                        response.job.image_output_urls ||
                        (response.job.image_output_url ? [response.job.image_output_url] : []);
            if (urls.length > 0) {
              setImageUrls(urls);
              setLoading(false);
              setPollingProgress(100);
              setPollingMessage('Image generation completed!');
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
    const interval = setInterval(poll, 3000); // Poll every 3 seconds
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
    if (result && 'image_url' in result) {
      const imageResult = result as ImageJobResult;
      const urls = imageResult.image_urls || (imageResult.image_url ? [imageResult.image_url] : []);
      if (urls.length > 0) {
        setImageUrls(urls);
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

  const handlePasteImage = async (setter: (value: string) => void, e: React.ClipboardEvent<HTMLInputElement>) => {
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
            setter(base64data);
          };
          reader.readAsDataURL(blob);
        }
        break;
      }
    }
  };

  const handleFileSelect = (setter: (value: string) => void, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setter(base64data);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setImageUrls([]);
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

    const request: ImageJobRequest = {
      prompt: prompt.trim(),
      negative_prompt: negativePrompt.trim() || undefined,
      width,
      height,
      num_outputs: numOutputs,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
      seed: seed || undefined,
      model,
      image: inputImage.trim() || undefined,
      mask: maskImage.trim() || undefined,
      strength: inputImage ? strength : undefined,
    };

    try {
      const response = await submitImageJob(request);
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        setPollingProgress(5);
        setPollingStatus('queued');
        setPollingMessage('Job submitted, starting...');
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 1000);
      } else {
        setError('Failed to submit image generation job');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit image generation job');
      setLoading(false);
    }
  };

  const handleDownload = (url: string, index: number) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `image-${jobId || 'output'}-${index + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating image...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Generating image...' : currentStatus === 'starting' ? 'Starting image generation...' : ''));

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

  const handleImageJobClick = (job: ImageJob) => {
    const urls = job.result?.image_urls || 
                (job.result?.image_url ? [job.result.image_url] : []) ||
                job.image_output_urls ||
                (job.image_output_url ? [job.image_output_url] : []);
    if (urls.length > 0) {
      setImageUrls(urls);
      setJobId(job._id);
    }
  };

  return (
    <div style={styles.container} className="image-generation-tool-container">
      <div style={styles.formWrapper}>
        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Prompt <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            style={styles.textarea}
            disabled={loading}
            required
          />
          <div style={styles.charCount}>{prompt.length} characters</div>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>Negative Prompt (Optional)</label>
          <input
            type="text"
            value={negativePrompt}
            onChange={(e) => setNegativePrompt(e.target.value)}
            placeholder="What to exclude from the image..."
            style={styles.input}
            disabled={loading}
          />
        </div>

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
          {loading ? 'Generating...' : 'Generate Image'}
        </button>

        {!user && (
          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: '#60a5fa' }}>sign in</a> to generate images
          </p>
        )}

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
              <label style={styles.label}>Model</label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value as any)}
                style={styles.select}
                disabled={loading}
              >
                <option value="black-forest-labs/flux-dev">Flux Dev (Best Quality)</option>
                <option value="black-forest-labs/flux-schnell">Flux Schnell (Fast)</option>
                <option value="stability-ai/sdxl">Stable Diffusion XL</option>
                <option value="stability-ai/stable-diffusion">Stable Diffusion</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Width (pixels)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value) || 1024)}
                min={256}
                max={2048}
                step={64}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Height (pixels)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value) || 1024)}
                min={256}
                max={2048}
                step={64}
                style={styles.input}
                disabled={loading}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Number of Outputs</label>
              <select
                value={numOutputs}
                onChange={(e) => setNumOutputs(parseInt(e.target.value) || 1)}
                style={styles.select}
                disabled={loading}
              >
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={4}>4</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Guidance Scale</label>
              <input
                type="number"
                value={guidanceScale}
                onChange={(e) => setGuidanceScale(parseFloat(e.target.value) || 3.5)}
                min={1}
                max={20}
                step={0.5}
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Higher = more prompt adherence (default: 3.5)
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Inference Steps</label>
              <input
                type="number"
                value={numInferenceSteps}
                onChange={(e) => setNumInferenceSteps(parseInt(e.target.value) || 28)}
                min={10}
                max={50}
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                More steps = higher quality but slower (default: 28)
              </small>
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

            <div style={styles.inputGroup}>
              <label style={styles.label}>Input Image URL (for img2img)</label>
              <div style={styles.imageInputWrapper}>
                <input
                  type="text"
                  value={inputImage}
                  onChange={(e) => setInputImage(e.target.value)}
                  onPaste={(e) => handlePasteImage(setInputImage, e)}
                  placeholder="Image URL or paste image here"
                  style={styles.input}
                  disabled={loading}
                />
                <label htmlFor="input-image-file" style={styles.fileInputLabel}>
                  Or click to upload image file
                </label>
                <input
                  id="input-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(setInputImage, e)}
                  style={styles.fileInput}
                  disabled={loading}
                />
                {inputImage && (inputImage.startsWith('data:image') || inputImage.startsWith('http')) && (
                  <img 
                    src={inputImage} 
                    alt="Input" 
                    style={styles.imagePreview}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>

            {inputImage && (
              <div style={styles.inputGroup}>
                <label style={styles.label}>Strength (for img2img)</label>
                <input
                  type="number"
                  value={strength}
                  onChange={(e) => setStrength(parseFloat(e.target.value) || 0.8)}
                  min={0}
                  max={1}
                  step={0.1}
                  style={styles.input}
                  disabled={loading}
                />
                <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                  How much to transform (0.0 = keep original, 1.0 = full transformation)
                </small>
              </div>
            )}

            <div style={styles.inputGroup}>
              <label style={styles.label}>Mask Image URL (for inpainting)</label>
              <div style={styles.imageInputWrapper}>
                <input
                  type="text"
                  value={maskImage}
                  onChange={(e) => setMaskImage(e.target.value)}
                  onPaste={(e) => handlePasteImage(setMaskImage, e)}
                  placeholder="Mask image URL or paste image here"
                  style={styles.input}
                  disabled={loading}
                />
                <label htmlFor="mask-image-file" style={styles.fileInputLabel}>
                  Or click to upload mask file
                </label>
                <input
                  id="mask-image-file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(setMaskImage, e)}
                  style={styles.fileInput}
                  disabled={loading}
                />
                {maskImage && (maskImage.startsWith('data:image') || maskImage.startsWith('http')) && (
                  <img 
                    src={maskImage} 
                    alt="Mask" 
                    style={styles.imagePreview}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </form>
      </div>

      {/* Right Sidebar: Image Result + History */}
      <div style={styles.rightSidebar}>
        {imageUrls.length > 0 && (
          <div style={styles.imageContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Generated Image{imageUrls.length > 1 ? 's' : ''}</h3>
            {imageUrls.length === 1 ? (
              <>
                <img src={imageUrls[0]} alt="Generated" style={styles.image} />
                <button
                  onClick={() => handleDownload(imageUrls[0], 0)}
                  style={styles.downloadButton}
                >
                  Download Image
                </button>
              </>
            ) : (
              <>
                <div style={styles.imageGrid}>
                  {imageUrls.map((url, index) => (
                    <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <img src={url} alt={`Generated ${index + 1}`} style={{ ...styles.image, maxHeight: '200px' }} />
                      <button
                        onClick={() => handleDownload(url, index)}
                        style={{ ...styles.downloadButton, fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      >
                        Download {index + 1}
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Image History Section */}
        <div style={styles.historyContainer}>
        <h3 style={styles.historyTitle}>Image History</h3>
        
        {historyLoading ? (
          <div style={styles.emptyHistory}>Loading history...</div>
        ) : historyError ? (
          <div style={{ ...styles.emptyHistory, color: '#f44336' }}>
            {historyError}
          </div>
        ) : imageHistory.length === 0 ? (
          <div style={styles.emptyHistory}>
            <p>No image generations yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Start generating images using the form on the left.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {imageHistory.map((job) => {
              const urls = job.result?.image_urls || 
                          (job.result?.image_url ? [job.result.image_url] : []) ||
                          job.image_output_urls ||
                          (job.image_output_url ? [job.image_output_url] : []);
              const hasImage = urls.length > 0;
              return (
                <div
                  key={job._id}
                  style={{
                    ...styles.historyCard,
                    ...(hasImage ? {} : { opacity: 0.7 }),
                  }}
                  onClick={() => hasImage && handleImageJobClick(job)}
                  onMouseEnter={(e) => {
                    if (hasImage) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasImage) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }
                  }}
                >
                  <div style={styles.historyCardHeader}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {job.prompt.length > 30 ? `${job.prompt.substring(0, 30)}...` : job.prompt}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: getStatusColor(job.status),
                        textTransform: 'uppercase',
                      }}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div style={styles.historyCardMeta}>
                    <span>{formatDate(job.created_at)}</span>
                    {job.width && job.height && <span>• {job.width}x{job.height}</span>}
                    {job.result?.model && <span>• {job.result.model.split('/').pop()}</span>}
                  </div>
                  {hasImage && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4caf50' }}>
                      ✓ Image available - Click to view
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}


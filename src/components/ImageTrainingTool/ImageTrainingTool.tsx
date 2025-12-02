import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { submitImageTrainingJob, getImageTrainingJobStatus } from '../../lib/api/imageTrainingApi';
import { getUserJobs } from '../../lib/api/jobsApi';
import { useSSE } from '../../hooks/useSSE';
import type { ImageTrainingJobRequest, ImageTrainingJobResult, ImageTrainingJob, Job } from '../../types/api';
import './ImageTrainingTool.css';

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
    minHeight: '100px',
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
  imageUrlInput: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  addButton: {
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
  removeButton: {
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
  resultContainer: {
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
  modelInfo: {
    padding: '1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    color: '#6ee7b7',
  },
  modelId: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    wordBreak: 'break-all' as const,
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '0.5rem',
  },
  copyButton: {
    background: 'rgba(99, 102, 241, 0.2)',
    border: '1px solid rgba(99, 102, 241, 0.4)',
    color: '#a5b4fc',
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    fontSize: '0.85rem',
    marginTop: '0.5rem',
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
  infoBox: {
    padding: '0.75rem 1rem',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    borderRadius: '0.75rem',
    fontSize: '0.85rem',
    color: '#93c5fd',
    marginBottom: '0.5rem',
  },
};

export default function ImageTrainingTool() {
  const { user } = useAuth();
  const [imageUrls, setImageUrls] = useState<string[]>(['']);
  const [triggerWord, setTriggerWord] = useState('');
  const [loraType, setLoraType] = useState<'subject' | 'style'>('subject');
  const [baseModel, setBaseModel] = useState('black-forest-labs/flux-dev');
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [batchSize, setBatchSize] = useState(1);
  const [resolution, setResolution] = useState(1024);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [trainedModel, setTrainedModel] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');
  const [trainingHistory, setTrainingHistory] = useState<ImageTrainingJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  // Fetch training job history
  useEffect(() => {
    const fetchTrainingHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      setHistoryError(null);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          // Filter for image training jobs only
          const trainingJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image_training'
          ).map((job: Job) => job as unknown as ImageTrainingJob);
          
          // Sort by created_at (newest first)
          trainingJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setTrainingHistory(trainingJobs);
        }
      } catch (err: any) {
        console.error('Error fetching training history:', err);
        setHistoryError(err?.message || 'Failed to load training history');
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchTrainingHistory();
  }, [user]);

  // Refresh history when a job completes
  useEffect(() => {
    if (trainedModel && user) {
      const fetchTrainingHistory = async () => {
        try {
          const response = await getUserJobs(user.id);
          if (response.success && response.jobs) {
            const trainingJobs = response.jobs.filter(
              (job: Job) => (job as any).job_type === 'image_training'
            ).map((job: Job) => job as unknown as ImageTrainingJob);
            
            trainingJobs.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            
            setTrainingHistory(trainingJobs);
          }
        } catch (err) {
          console.error('Error refreshing training history:', err);
        }
      };
      fetchTrainingHistory();
    }
  }, [trainedModel, user]);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getImageTrainingJobStatus(jobId!);
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
          }
          
          // Estimate progress based on status if no explicit progress
          if (!extractedProgress) {
            switch (jobStatus) {
              case 'queued':
                extractedProgress = 5;
                extractedMessage = extractedMessage || 'Job queued...';
                break;
              case 'processing':
                extractedProgress = 50;
                extractedMessage = extractedMessage || 'Training in progress...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Training completed!';
                break;
              default:
                extractedProgress = 0;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
          
          if (jobStatus === 'completed' && response.job.trained_model) {
            setTrainedModel(response.job.trained_model);
            setLoading(false);
            setPollingProgress(100);
            setPollingMessage('Training completed!');
            setPollingInterval((prev) => {
              if (prev) {
                clearInterval(prev);
              }
              return null;
            });
          } else if (jobStatus === 'error') {
            setError(response.job.error || 'Training failed');
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
    const interval = setInterval(poll, 30000); // Poll every 30 seconds for training
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
    if (result && 'trained_model' in result) {
      const trainingResult = result as ImageTrainingJobResult;
      if (trainingResult.trained_model) {
        setTrainedModel(trainingResult.trained_model);
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

  const handleAddImageUrl = () => {
    setImageUrls([...imageUrls, '']);
  };

  const handleRemoveImageUrl = (index: number) => {
    if (imageUrls.length > 1) {
      setImageUrls(imageUrls.filter((_, i) => i !== index));
    }
  };

  const handleImageUrlChange = (index: number, value: string) => {
    const newUrls = [...imageUrls];
    newUrls[index] = value;
    setImageUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrainedModel(null);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');

    // Filter out empty URLs
    const validImageUrls = imageUrls.filter(url => url.trim() !== '');

    if (validImageUrls.length === 0) {
      setError('Please provide at least one image URL');
      setLoading(false);
      return;
    }

    if (!triggerWord.trim()) {
      setError('Please enter a trigger word');
      setLoading(false);
      return;
    }

    // Validate minimum images based on LoRA type
    if (loraType === 'subject' && validImageUrls.length < 5) {
      setError('Subject training requires at least 5 images (recommended: 5-10)');
      setLoading(false);
      return;
    }

    if (loraType === 'style' && validImageUrls.length < 20) {
      setError('Style training requires at least 20 images (recommended: 20-100)');
      setLoading(false);
      return;
    }

    const request: ImageTrainingJobRequest = {
      image_urls: validImageUrls.map(url => url.trim()),
      trigger_word: triggerWord.trim(),
      lora_type: loraType,
      base_model: baseModel,
      training_steps: trainingSteps,
      learning_rate: learningRate,
      batch_size: batchSize,
      resolution,
    };

    try {
      const response = await submitImageTrainingJob(request);
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        setPollingProgress(5);
        setPollingStatus('queued');
        setPollingMessage('Training job submitted, starting...');
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 1000);
      } else {
        setError('Failed to submit training job');
        setLoading(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit training job');
      setLoading(false);
    }
  };

  const handleCopyModelId = () => {
    if (trainedModel) {
      navigator.clipboard.writeText(trainedModel);
      // You could add a toast notification here
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
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Training in progress...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Training in progress...' : currentStatus === 'starting' ? 'Starting training...' : ''));

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

  const handleTrainingJobClick = (job: ImageTrainingJob) => {
    if (job.trained_model) {
      setTrainedModel(job.trained_model);
      setJobId(job._id);
    }
  };

  return (
    <div style={styles.container} className="image-training-tool-container">
      <div style={styles.formWrapper}>
        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.infoBox}>
          <strong>Training Guide:</strong> {loraType === 'subject' 
            ? 'Use 5-10 high-quality images of the same subject. Different angles and poses help.'
            : 'Use 20-100 images in the same artistic style. Consistent style across all images is important.'}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Image URLs <span style={{ color: '#ef4444' }}>*</span>
          </label>
          {imageUrls.map((url, index) => (
            <div key={index} style={styles.imageUrlInput}>
              <input
                type="text"
                value={url}
                onChange={(e) => handleImageUrlChange(index, e.target.value)}
                placeholder={`Image URL ${index + 1} (must be publicly accessible)`}
                style={styles.input}
                disabled={loading}
              />
              {imageUrls.length > 1 && (
                <button
                  type="button"
                  onClick={() => handleRemoveImageUrl(index)}
                  style={styles.removeButton}
                  disabled={loading}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={handleAddImageUrl}
            style={styles.addButton}
            disabled={loading}
          >
            + Add Image URL
          </button>
          <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            {imageUrls.filter(u => u.trim()).length} image{imageUrls.filter(u => u.trim()).length !== 1 ? 's' : ''} provided
          </small>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Trigger Word <span style={{ color: '#ef4444' }}>*</span>
          </label>
          <input
            type="text"
            value={triggerWord}
            onChange={(e) => setTriggerWord(e.target.value)}
            placeholder="e.g., mycustomstyle, johnportrait, watercolorstyle"
            style={styles.input}
            disabled={loading}
            required
          />
          <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Unique word to invoke your trained model. Use this word in prompts when generating images.
          </small>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>LoRA Type</label>
          <select
            value={loraType}
            onChange={(e) => setLoraType(e.target.value as 'subject' | 'style')}
            style={styles.select}
            disabled={loading}
          >
            <option value="subject">Subject (person, pet, object)</option>
            <option value="style">Style (artistic style, art movement)</option>
          </select>
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
          disabled={loading || !user || imageUrls.filter(u => u.trim()).length === 0 || !triggerWord.trim()}
          style={{
            ...styles.submitButton,
            ...(loading || !user || imageUrls.filter(u => u.trim()).length === 0 || !triggerWord.trim() ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading ? 'Training...' : 'Start Training'}
        </button>

        {!user && (
          <p style={{ textAlign: 'center', color: '#cbd5e1', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: '#60a5fa' }}>sign in</a> to train models
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
              <label style={styles.label}>Base Model</label>
              <select
                value={baseModel}
                onChange={(e) => setBaseModel(e.target.value)}
                style={styles.select}
                disabled={loading}
              >
                <option value="black-forest-labs/flux-dev">Flux Dev</option>
                <option value="black-forest-labs/flux-schnell">Flux Schnell</option>
                <option value="stability-ai/sdxl">Stable Diffusion XL</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Training Steps</label>
              <input
                type="number"
                value={trainingSteps}
                onChange={(e) => setTrainingSteps(parseInt(e.target.value) || 1000)}
                min={500}
                max={3000}
                step={100}
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                500-1000: Fast (15-60 min), 1000-2000: Balanced (30-120 min), 2000+: High quality (60+ min)
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Learning Rate</label>
              <input
                type="number"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value) || 0.0001)}
                min={0.00005}
                max={0.0005}
                step={0.00005}
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Default: 0.0001 (recommended)
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Batch Size</label>
              <input
                type="number"
                value={batchSize}
                onChange={(e) => setBatchSize(parseInt(e.target.value) || 1)}
                min={1}
                max={4}
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Default: 1 (recommended)
              </small>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Resolution</label>
              <select
                value={resolution}
                onChange={(e) => setResolution(parseInt(e.target.value) || 1024)}
                style={styles.select}
                disabled={loading}
              >
                <option value={512}>512 (Faster)</option>
                <option value={768}>768</option>
                <option value={1024}>1024 (Recommended)</option>
                <option value={1280}>1280 (High Quality)</option>
              </select>
            </div>
          </div>
        )}
      </form>
      </div>

      {/* Right Sidebar: Training Result + History */}
      <div style={styles.rightSidebar}>
        {trainedModel && (
          <div style={styles.resultContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Training Completed!</h3>
            <div style={styles.modelInfo}>
              <div>Your trained model is ready to use:</div>
              <div style={styles.modelId}>{trainedModel}</div>
              <button
                onClick={handleCopyModelId}
                style={styles.copyButton}
              >
                Copy Model ID
              </button>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
                <strong>How to use:</strong> When generating images, set the model to this ID and include your trigger word in the prompt.
              </div>
            </div>
          </div>
        )}

        {/* Training History Section */}
        <div style={styles.historyContainer}>
        <h3 style={styles.historyTitle}>Training History</h3>
        
        {historyLoading ? (
          <div style={styles.emptyHistory}>Loading history...</div>
        ) : historyError ? (
          <div style={{ ...styles.emptyHistory, color: '#f44336' }}>
            {historyError}
          </div>
        ) : trainingHistory.length === 0 ? (
          <div style={styles.emptyHistory}>
            <p>No training jobs yet</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Start training a model using the form on the left.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {trainingHistory.map((job) => {
              const hasModel = !!job.trained_model;
              return (
                <div
                  key={job._id}
                  style={{
                    ...styles.historyCard,
                    ...(hasModel ? {} : { opacity: 0.7 }),
                  }}
                  onClick={() => hasModel && handleTrainingJobClick(job)}
                  onMouseEnter={(e) => {
                    if (hasModel) {
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.5)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasModel) {
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                    }
                  }}
                >
                  <div style={styles.historyCardHeader}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      {job.trigger_word}
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
                    {job.lora_type && <span>• {job.lora_type}</span>}
                    {job.image_urls && <span>• {job.image_urls.length} images</span>}
                  </div>
                  {hasModel && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#4caf50' }}>
                      ✓ Model ready - Click to view
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



import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/auth';
import { submitImageTrainingJob, getImageTrainingJobStatus, uploadImagesForTraining, getLoRAsFromReplicate, type ImageWithDescription, type LoRAModel } from '../../lib/api/imageTrainingApi';
import { useSSE } from '../../hooks/useSSE';
import type { ImageTrainingJobRequest, ImageTrainingJobResult, ImageTrainingJob, ImageJob, Job } from '../../types/api';
import ImageUploader from './ImageUploader';
import ImageGenerationMode from './ImageGenerationMode';
import ImageGalleryMode from './ImageGalleryMode';
import './ImageTrainingTool.css';

const getStyles = () => ({
  container: {
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, var(--gradient-start), var(--gradient-end))',
    color: 'var(--text-primary)',
    boxShadow: '0 10px 25px var(--shadow)',
    fontFamily: 'Inter, system-ui, sans-serif',
    maxWidth: '1600px',
    margin: '2rem auto',
    width: '100%',
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
    color: 'var(--text-primary)',
  },
  textarea: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    resize: 'vertical' as const,
    minHeight: '100px',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.95rem',
  },
  select: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
    background: 'var(--bg-primary)',
    backgroundColor: 'var(--bg-paper)',
    color: 'var(--text-primary)',
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
  imageUrlInput: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },
  addButton: {
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
  removeButton: {
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
  resultContainer: {
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
  modelInfo: {
    padding: '1rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '0.75rem',
    fontSize: '0.9rem',
    color: '#4caf50',
  },
  modelId: {
    fontFamily: 'monospace',
    fontSize: '0.85rem',
    wordBreak: 'break-all' as const,
    marginTop: '0.5rem',
    padding: '0.5rem',
    background: 'var(--bg-primary)',
    borderRadius: '0.5rem',
  },
  copyButton: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary-color)',
    color: 'var(--primary-color)',
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
    background: 'var(--bg-secondary)',
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
    color: 'var(--text-primary)',
  },
  historyCard: {
    padding: '1rem',
    background: 'var(--bg-paper)',
    borderRadius: '0.75rem',
    border: '1px solid var(--border-color)',
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
    color: 'var(--text-tertiary)',
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap' as const,
  },
  emptyHistory: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: 'var(--text-tertiary)',
  },
  rightSidebar: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    minWidth: '350px',
    maxWidth: '400px',
    flexShrink: 0,
  },
  infoBox: {
    padding: '0.75rem 1rem',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--primary-color)',
    borderRadius: '0.75rem',
    fontSize: '0.85rem',
    color: 'var(--primary-color)',
    marginBottom: '0.5rem',
  },
  tabContainer: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
    borderBottom: '1px solid var(--border-color)',
  },
  tab: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-tertiary)',
    padding: '0.75rem 1.5rem',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    transition: 'all 0.2s ease',
  },
  tabActive: {
    color: 'var(--primary-color)',
    borderBottomColor: 'var(--primary-color)',
  },
});

export default function ImageTrainingTool() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const styles = getStyles();
  const [images, setImages] = useState<ImageWithDescription[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [triggerWord, setTriggerWord] = useState('');
  const [destinationModel, setDestinationModel] = useState('');
  const [loraType, setLoraType] = useState<'subject' | 'style'>('subject');
  const [baseModel, setBaseModel] = useState('black-forest-labs/flux-dev');
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.0001);
  const [batchSize, setBatchSize] = useState(1);
  const [resolution, setResolution] = useState(1024);
  const [trainingModel, setTrainingModel] = useState('lucataco/sd3.5-large-fine-tuner');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [autoGenerateModel, setAutoGenerateModel] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [trainedModel, setTrainedModel] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');
  const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<'training' | 'generation' | 'gallery'>('training');
  const [imageHistory, setImageHistory] = useState<ImageJob[]>([]);
  const [imageHistoryLoading, setImageHistoryLoading] = useState(false);
  const [imageHistoryError, setImageHistoryError] = useState<string | null>(null);
  const [loras, setLoras] = useState<LoRAModel[]>([]);
  const [lorasLoading, setLorasLoading] = useState(false);
  const [lorasError, setLorasError] = useState<string | null>(null);
  
  // Training workflow progress state
  const [trainingStep, setTrainingStep] = useState<'idle' | 'uploading_images' | 'training'>('idle');
  const [stepMessage, setStepMessage] = useState<string>('');

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId, streamUrl);

  // Fetch LoRAs from Replicate (needed for ImageGenerationMode)
  useEffect(() => {
    const fetchLoRAs = async () => {
      if (!user) return;
      
      setLorasLoading(true);
      setLorasError(null);
      
      try {
        const response = await getLoRAsFromReplicate();
        if (response.success && response.loras) {
          // Sort by updated_at (newest first)
          const sortedLoras = [...response.loras].sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at).getTime();
            const dateB = new Date(b.updated_at || b.created_at).getTime();
            return dateB - dateA;
          });
          setLoras(sortedLoras);
        } else {
          setLorasError(response.error || response.message || 'Failed to load LoRAs');
        }
      } catch (err: any) {
        console.error('Error fetching LoRAs:', err);
        setLorasError(err?.message || 'Failed to load LoRAs');
      } finally {
        setLorasLoading(false);
      }
    };

    fetchLoRAs();
  }, [user]);


  // Fetch image generation history
  const fetchImageHistory = useCallback(async () => {
    if (!user) return;
    
    setImageHistoryLoading(true);
    setImageHistoryError(null);
    
    try {
      const response = await getUserJobs(user.id);
      if (response.success && response.jobs) {
        // Filter for image generation jobs only
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
      setImageHistoryError(err?.message || 'Failed to load image history');
    } finally {
      setImageHistoryLoading(false);
    }
  }, [user]);

  // Fetch image history on mount
  useEffect(() => {
    fetchImageHistory();
  }, [fetchImageHistory]);


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
          
          // Check for completion (case-insensitive and handle variations)
          const normalizedStatus = jobStatus?.toLowerCase();
          if ((normalizedStatus === 'completed' || normalizedStatus === 'complete') && response.job.trained_model) {
            setTrainedModel(response.job.trained_model);
            setLoading(false);
            setPollingProgress(100);
            setPollingStatus('completed');
            setPollingMessage('Training completed!');
            
            
            // Stop polling after a short delay to ensure final status is captured
            setTimeout(() => {
              setPollingInterval((prev) => {
                if (prev) {
                  clearInterval(prev);
                }
                return null;
              });
            }, 2000);
          } else if (normalizedStatus === 'error' || normalizedStatus === 'failed') {
            setError(response.job.error || 'Training failed');
            setLoading(false);
            setPollingStatus('error');
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

  // Handle uploaded URLs from ImageUploader
  const handleUploadUrls = useCallback((urls: string[]) => {
    setImageUrls(urls);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setTrainedModel(null);
    setLoading(true);
    setJobId(null);
    setStreamUrl(undefined);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');
    setTrainingStep('idle');
    setStepMessage('');

    // Collect all image URLs (from uploaded files + manual URLs)
    const manualUrls = imageUrls.filter(url => url.trim());
    
    // Validation
    if (images.length === 0 && manualUrls.length === 0) {
      setError('Please provide at least one image (upload files or provide URLs).');
      setLoading(false);
      return;
    }

    if (!triggerWord.trim()) {
      setError('Please enter a trigger word');
      setLoading(false);
      return;
    }

    if (!destinationModel.trim()) {
      setError('Please enter a destination model (format: username/model-name)');
      setLoading(false);
      return;
    }

    // Validate destination_model format
    if (!/^[a-z0-9-]+\/[a-z0-9-]+$/.test(destinationModel.trim())) {
      setError('Invalid destination model format. Use: username/model-name (lowercase, hyphens, alphanumerics only)');
      setLoading(false);
      return;
    }

    const totalImageCount = images.length + manualUrls.length;

    // Validate minimum images based on LoRA type
    if (loraType === 'subject' && totalImageCount < 5) {
      setError('Subject training requires at least 5 images (recommended: 5-10)');
      setLoading(false);
      return;
    }

    if (loraType === 'style' && totalImageCount < 20) {
      setError('Style training requires at least 20 images (recommended: 20-100)');
      setLoading(false);
      return;
    }

    try {
      let allImageUrls: string[] = [...manualUrls];

      // Step 1: Upload images if any files were uploaded
      if (images.length > 0) {
        setTrainingStep('uploading_images');
        setStepMessage(`Uploading ${images.length} image${images.length !== 1 ? 's' : ''}...`);
        
        const uploadResponse = await uploadImagesForTraining(images.map(img => img.file), {
          trigger_word: triggerWord.trim(),
          destination_model: destinationModel.trim(),
          lora_type: loraType,
        });
        
        console.log('[Training] Upload response:', uploadResponse);
        
        // Check if upload endpoint started training directly (returns job_id)
        if (uploadResponse.success && (uploadResponse as any).job_id) {
          console.log('[Training] Upload endpoint started training directly, job_id:', (uploadResponse as any).job_id);
          setJobId((uploadResponse as any).job_id);
          
          // Use stream_url from response if available
          if ((uploadResponse as any).stream_url) {
            setStreamUrl((uploadResponse as any).stream_url);
          }
          
          setPollingProgress(5);
          setPollingStatus('queued');
          setPollingMessage('Training job submitted, starting...');
          
          setTimeout(() => {
            if (!isConnected) {
              startPolling();
            }
          }, 1000);
          return; // Training started, no need to proceed with separate submission
        }
        
        // Handle different response structures for image URLs
        if (uploadResponse.success) {
          let uploadedUrls: string[] = [];
          
          // Check if response has images array
          if (uploadResponse.images && Array.isArray(uploadResponse.images)) {
            uploadedUrls = uploadResponse.images.map(img => img.url).filter((url): url is string => !!url);
          }
          // Check if response has image_urls array (alternative structure)
          else if ((uploadResponse as any).image_urls && Array.isArray((uploadResponse as any).image_urls)) {
            uploadedUrls = (uploadResponse as any).image_urls.filter((url: string): url is string => !!url);
          }
          // Check if response has urls array (another alternative)
          else if ((uploadResponse as any).urls && Array.isArray((uploadResponse as any).urls)) {
            uploadedUrls = (uploadResponse as any).urls.filter((url: string): url is string => !!url);
          }
          
          if (uploadedUrls.length > 0) {
            allImageUrls = [...allImageUrls, ...uploadedUrls];
            console.log('[Training] Successfully uploaded', uploadedUrls.length, 'images');
          } else {
            console.warn('[Training] Upload successful but no URLs found in response:', uploadResponse);
            throw new Error('Upload successful but no image URLs returned. Response: ' + JSON.stringify(uploadResponse));
          }
        } else {
          const errorMsg = (uploadResponse as any).error || (uploadResponse as any).message || 'Unknown error';
          console.error('[Training] Upload failed:', errorMsg, uploadResponse);
          throw new Error(`Failed to upload images: ${errorMsg}`);
        }
      }

      // Step 2: Submit training job with image URLs
      setTrainingStep('training');
      setStepMessage('Starting training...');
      
      const response = await submitImageTrainingJob({
        image_urls: allImageUrls,
        trigger_word: triggerWord.trim(),
        destination_model: destinationModel.trim(),
        lora_type: loraType,
        base_model: baseModel,
        training_steps: trainingSteps,
        learning_rate: learningRate,
        batch_size: batchSize,
        resolution,
        training_model: trainingModel,
      });
      
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        
        // Use stream_url from response if available
        if (response.stream_url) {
          setStreamUrl(response.stream_url);
        }
        
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
        setTrainingStep('idle');
      }
    } catch (err: any) {
      console.error('[Training] Error in training workflow:', err);
      setError(err.message || 'Failed to start training workflow');
      setLoading(false);
      setTrainingStep('idle');
      setStepMessage('');
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
    const normalizedStatus = status?.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "complete":
        return theme.palette.success.main;
      case "processing":
      case "in_progress":
        return theme.palette.warning.main;
      case "error":
      case "failed":
      case "cancelled":
        return theme.palette.error.main;
      case "queued":
        return theme.palette.info.main;
      default:
        return theme.palette.text.secondary;
    }
  };


  return (
    <div style={styles.container}>
        {/* Tab Navigation */}
        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => setActiveTab('training')}
            style={{
              ...styles.tab,
              ...(activeTab === 'training' ? styles.tabActive : {}),
            }}
          >
            Training Mode
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('generation')}
            style={{
              ...styles.tab,
              ...(activeTab === 'generation' ? styles.tabActive : {}),
            }}
          >
            Generation Mode
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('gallery');
              // Refresh gallery when switching to gallery tab
              fetchImageHistory();
            }}
            style={{
              ...styles.tab,
              ...(activeTab === 'gallery' ? styles.tabActive : {}),
            }}
          >
            Gallery
          </button>
        </div>

        {/* Training Mode */}
        {activeTab === 'training' && (
        <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.infoBox}>
          <strong>Training Guide:</strong> {loraType === 'subject' 
            ? 'Use 5-10 high-quality images of the same subject. Different angles and poses help.'
            : 'Use 20-100 images in the same artistic style. Consistent style across all images is important.'}
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Training Images <span style={{ color: theme.palette.error.main }}>*</span>
          </label>
          <ImageUploader
            images={images}
            onImagesChange={setImages}
            disabled={loading}
            onUploadUrls={handleUploadUrls}
            trainingInProgress={trainingStep !== 'idle'}
          />
          {/* Manual URL input fallback */}
          <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <label style={{ ...styles.label, fontSize: '0.85rem', marginBottom: '0.5rem' }}>
              Or provide image URLs manually:
            </label>
            {imageUrls.map((url, index) => (
              <div key={index} style={{ ...styles.imageUrlInput, marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    const newUrls = [...imageUrls];
                    newUrls[index] = e.target.value;
                    setImageUrls(newUrls);
                  }}
                  placeholder={`Image URL ${index + 1} (must be publicly accessible)`}
                  style={styles.input}
                  disabled={loading}
                />
                {imageUrls.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setImageUrls(imageUrls.filter((_, i) => i !== index))}
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
              onClick={() => setImageUrls([...imageUrls, ''])}
              style={styles.addButton}
              disabled={loading}
            >
              + Add Image URL
            </button>
          </div>
          <small style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem', display: 'block' }}>
            {images.length > 0 
              ? `${images.length} image${images.length !== 1 ? 's' : ''} uploaded, ${imageUrls.filter(u => u.trim()).length} URL${imageUrls.filter(u => u.trim()).length !== 1 ? 's' : ''} provided`
              : `${imageUrls.filter(u => u.trim()).length} image URL${imageUrls.filter(u => u.trim()).length !== 1 ? 's' : ''} provided`}
          </small>
        </div>

        <div style={styles.inputGroup}>
          <label style={styles.label}>
            Trigger Word <span style={{ color: theme.palette.error.main }}>*</span>
          </label>
          <input
            type="text"
            value={triggerWord}
            onChange={(e) => {
              setTriggerWord(e.target.value);
              // Auto-generate destination_model if enabled
              if (autoGenerateModel && e.target.value.trim()) {
                const modelName = e.target.value
                  .toLowerCase()
                  .replace(/[^a-z0-9]+/g, '-')
                  .replace(/^-+|-+$/g, '');
                setDestinationModel(`shehan-superqa/${modelName}-lora`);
              }
            }}
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
          <label style={styles.label}>
            Destination Model <span style={{ color: theme.palette.error.main }}>*</span>
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
            <input
              type="checkbox"
              checked={autoGenerateModel}
              onChange={(e) => {
                setAutoGenerateModel(e.target.checked);
                if (e.target.checked && triggerWord.trim()) {
                  const modelName = triggerWord
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, '-')
                    .replace(/^-+|-+$/g, '');
                  setDestinationModel(`shehan-superqa/${modelName}-lora`);
                }
              }}
              style={{ cursor: 'pointer' }}
              disabled={loading}
            />
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              Auto-generate from trigger word
            </label>
          </div>
          <input
            type="text"
            value={destinationModel}
            onChange={(e) => {
              setDestinationModel(e.target.value);
              setAutoGenerateModel(false);
            }}
            placeholder="shehan-superqa/my-custom-lora"
            style={styles.input}
            disabled={loading || autoGenerateModel}
            required
          />
          <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
            Format: username/model-name (e.g., shehan-superqa/my-lora). The model will be created on Replicate if it doesn't exist.
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

        {/* Training Workflow Progress */}
        {trainingStep !== 'idle' && (
          <div style={styles.progressContainer}>
            <div style={{ ...styles.progressText, marginBottom: '0.5rem', fontWeight: 600 }}>
              {trainingStep === 'uploading_images' && '☁️ Step 1: Uploading Images'}
              {trainingStep === 'training' && '🚀 Step 2: Training Model'}
            </div>
            
            <div style={styles.progressText}>
              {stepMessage}
            </div>
          </div>
        )}

        {/* Training Progress (after workflow completes) */}
        {(currentStatus || (loading && trainingStep === 'training')) && trainingStep === 'training' && (
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
          disabled={loading || !user || (images.length === 0 && imageUrls.filter(u => u.trim()).length === 0) || !triggerWord.trim() || !destinationModel.trim()}
          style={{
            ...styles.submitButton,
            ...(loading || !user || (images.length === 0 && imageUrls.filter(u => u.trim()).length === 0) || !triggerWord.trim() || !destinationModel.trim() ? styles.submitButtonDisabled : {}),
          }}
        >
          {loading && trainingStep === 'uploading_images' ? 'Uploading Images...' :
           loading && trainingStep === 'training' ? 'Starting Training...' :
           'Start Training'}
        </button>

        {!user && (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Please <a href="/auth/login" style={{ color: 'var(--primary-color)' }}>sign in</a> to train models
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

            <div style={styles.inputGroup}>
              <label style={styles.label}>Training Model</label>
              <input
                type="text"
                value={trainingModel}
                onChange={(e) => setTrainingModel(e.target.value)}
                placeholder="lucataco/sd3.5-large-fine-tuner"
                style={styles.input}
                disabled={loading}
              />
              <small style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Default: lucataco/sd3.5-large-fine-tuner
              </small>
            </div>
          </div>
        )}
      </form>
        )}

        {/* Generation Mode */}
        {activeTab === 'generation' && (
          <ImageGenerationMode
            loras={loras}
            lorasLoading={lorasLoading}
            lorasError={lorasError}
            onGenerationComplete={fetchImageHistory}
          />
        )}

        {/* Gallery Mode */}
        {activeTab === 'gallery' && (
          <ImageGalleryMode
            imageHistory={imageHistory}
            historyLoading={imageHistoryLoading}
            historyError={imageHistoryError}
            onRefresh={fetchImageHistory}
          />
        )}

      {/* Right Sidebar: Training Result + History */}
      <div style={styles.rightSidebar}>
        {trainedModel && (
          <div style={styles.resultContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)' }}>Training Completed!</h3>
            <div style={styles.modelInfo}>
              <div>Your trained model is ready to use:</div>
              <div style={styles.modelId}>{trainedModel}</div>
              <button
                onClick={handleCopyModelId}
                style={styles.copyButton}
              >
                Copy Model ID
              </button>
              <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <strong>How to use:</strong> When generating images, set the model to this ID and include your trigger word in the prompt.
              </div>
            </div>
          </div>
        )}

        {/* LoRAs from Replicate Section */}
        <div style={styles.historyContainer}>
        <h3 style={styles.historyTitle}>My LoRAs</h3>
        
        {lorasLoading ? (
          <div style={styles.emptyHistory}>Loading LoRAs...</div>
        ) : lorasError ? (
          <div style={{ ...styles.emptyHistory, color: '#f44336' }}>
            {lorasError}
          </div>
        ) : loras.length === 0 ? (
          <div style={styles.emptyHistory}>
            <p>No LoRAs found</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Train a model to create your first LoRA.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {loras.map((lora) => {
              const loraUrl = lora.url || `${lora.owner}/${lora.name}`;
              return (
                <div
                  key={lora.id}
                  style={styles.historyCard}
                  onClick={() => {
                    setTrainedModel(loraUrl);
                    navigator.clipboard.writeText(loraUrl);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--primary-color)';
                    e.currentTarget.style.background = 'var(--hover-bg)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--border-color)';
                    e.currentTarget.style.background = 'var(--bg-paper)';
                  }}
                >
                  <div style={styles.historyCardHeader}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {lora.name}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: lora.visibility === 'public' ? theme.palette.success.main : theme.palette.warning.main,
                        textTransform: 'uppercase',
                      }}
                    >
                      {lora.visibility}
                    </span>
                  </div>
                  {lora.description && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem' }}>
                      {lora.description.length > 60 
                        ? `${lora.description.substring(0, 60)}...` 
                        : lora.description}
                    </div>
                  )}
                  <div style={styles.historyCardMeta}>
                    <span>{formatDate(lora.updated_at || lora.created_at)}</span>
                    {lora.owner && <span>• {lora.owner}</span>}
                  </div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--primary-color)' }}>
                    {loraUrl} - Click to copy
                  </div>
                </div>
              );
            })}
          </div>
        )}
        </div>

        {/* Training History Section */}
        <div style={styles.historyContainer}>
        <h3 style={styles.historyTitle}>Training History</h3>
        
        {historyLoading ? (
          <div style={styles.emptyHistory}>Loading history...</div>
        ) : historyError ? (
          <div style={{ ...styles.emptyHistory, color: theme.palette.error.main }}>
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
              // Determine actual status: if model exists, it's completed regardless of status field
              const actualStatus = hasModel ? 'completed' : (job.status || 'unknown');
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
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.background = 'var(--hover-bg)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasModel) {
                      e.currentTarget.style.borderColor = 'var(--border-color)';
                      e.currentTarget.style.background = 'var(--bg-paper)';
                    }
                  }}
                >
                  <div style={styles.historyCardHeader}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {job.trigger_word}
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        color: getStatusColor(actualStatus),
                        textTransform: 'uppercase',
                      }}
                    >
                      {actualStatus}
                    </span>
                  </div>
                  <div style={styles.historyCardMeta}>
                    <span>{formatDate(job.created_at)}</span>
                    {job.lora_type && <span>• {job.lora_type}</span>}
                    {job.image_urls && <span>• {job.image_urls.length} images</span>}
                  </div>
                  {hasModel && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: theme.palette.success.main }}>
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




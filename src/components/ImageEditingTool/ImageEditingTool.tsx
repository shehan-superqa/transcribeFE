import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../lib/auth';
import { submitImageEditJob, getImageEditJobStatus } from '../../lib/api/imageEditApi';
import { getUserJobs } from '../../lib/api/jobsApi';
import { useSSE } from '../../hooks/useSSE';
import type { ImageEditJobRequest, ImageEditJobResult, ImageEditJob, Job } from '../../types/api';
import './ImageEditingTool.css';

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
    maxWidth: '700px',
    overflow: 'hidden',
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
    width: '100%',
    overflow: 'hidden',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    width: '100%',
    overflow: 'hidden',
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
  fileUploadBox: {
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.03)',
  },
  fileUploadBoxHover: {
    borderColor: '#00c6ff',
    background: 'rgba(0, 198, 255, 0.1)',
  },
  imagePreview: {
    maxWidth: '100%',
    maxHeight: '250px',
    width: '100%',
    height: 'auto',
    objectFit: 'contain' as const,
    borderRadius: '0.75rem',
    marginTop: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'block',
    boxSizing: 'border-box' as const,
  },
  categoryButtons: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  categoryButton: {
    padding: '0.5rem 1rem',
    borderRadius: '0.5rem',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    cursor: 'pointer',
    fontSize: '0.85rem',
    transition: 'all 0.2s ease',
  },
  categoryButtonActive: {
    background: 'linear-gradient(90deg, #00c6ff, #0077be)',
    borderColor: '#00c6ff',
  },
  promptPreview: {
    padding: '1rem',
    borderRadius: '0.75rem',
    background: 'rgba(0, 198, 255, 0.1)',
    border: '1px solid rgba(0, 198, 255, 0.3)',
    fontSize: '0.9rem',
    color: '#e0f2fe',
    marginTop: '0.5rem',
    whiteSpace: 'pre-wrap' as const,
  },
  helperText: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    marginTop: '0.25rem',
    fontStyle: 'italic' as const,
  },
  submitButton: {
    background: 'linear-gradient(90deg, #00c6ff, #0077be)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '1rem 2rem',
    fontWeight: 600,
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  error: {
    color: '#ef4444',
    padding: '0.75rem',
    borderRadius: '0.75rem',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  progressContainer: {
    padding: '1rem',
    borderRadius: '0.75rem',
    background: 'rgba(255, 255, 255, 0.05)',
    marginTop: '1rem',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
    marginTop: '0.5rem',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #00c6ff, #0077be)',
    transition: 'width 0.3s ease',
  },
  imageContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    padding: '1.5rem',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '0.75rem',
  },
  beforeAfterContainer: {
    display: 'flex',
    gap: '1rem',
    alignItems: 'flex-start' as const,
    width: '100%',
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    minWidth: 0,
    overflow: 'hidden',
  },
  imageLabel: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    fontWeight: 600,
  },
  image: {
    maxWidth: '100%',
    maxHeight: '300px',
    width: 'auto',
    height: 'auto',
    objectFit: 'contain' as const,
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    display: 'block',
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
  },
  editAgainButton: {
    background: 'linear-gradient(90deg, #00c6ff, #0077be)',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1.5rem',
    fontWeight: 600,
    fontSize: '0.95rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
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
  },
  emptyHistory: {
    textAlign: 'center' as const,
    padding: '2rem',
    color: '#94a3b8',
  },
};

type EditCategory = 'add' | 'remove' | 'modify' | 'text' | 'people' | 'camera' | 'background' | 'multi-step';

const categoryTemplates: Record<EditCategory, {
  modification: string;
  target: string;
  preservation: string;
  description: string;
}> = {
  'add': {
    modification: 'Add a knitted purple teddy bear',
    target: 'next to the character reading a book',
    preservation: 'matching textures and fabric while preserving the overall style and keeping all other elements unchanged',
    description: 'Add new objects or elements to the image'
  },
  'remove': {
    modification: 'Remove the person',
    target: 'in the background',
    preservation: 'while maintaining the same lighting and keeping all other elements unchanged',
    description: 'Remove unwanted objects or elements'
  },
  'modify': {
    modification: 'Change the car color to red',
    target: 'the car in the foreground',
    preservation: 'while maintaining the same lighting and shadows',
    description: 'Modify existing objects (color, material, style)'
  },
  'text': {
    modification: "Replace 'Old Text' with 'New Text'",
    target: 'the text on the sign',
    preservation: 'while maintaining the same font style and position',
    description: 'Edit text or document content'
  },
  'people': {
    modification: 'Transform the man into a Viking',
    target: 'the man with short black hair',
    preservation: 'while preserving his exact facial features and expression',
    description: 'Edit people, faces, or character attributes'
  },
  'camera': {
    modification: 'Make a top down view',
    target: 'of the street vendor',
    preservation: 'while keeping all scene elements and positions the same',
    description: 'Change camera view or perspective'
  },
  'background': {
    modification: 'Change the background to a beach',
    target: 'behind the subject',
    preservation: 'while keeping the person in the exact same position, scale, and pose',
    description: 'Alter background, texture, or style'
  },
  'multi-step': {
    modification: 'First, change the background to a beach, then update the character\'s setting',
    target: 'the purple prune character',
    preservation: 'maintaining natural lighting and cartoon proportions throughout',
    description: 'Multi-step instructions for complex edits'
  },
};

interface ImageWithPreview {
  file: File | null;
  preview: string;
  id: string;
}

export default function ImageEditingTool() {
  const { user } = useAuth();
  const [imageFiles, setImageFiles] = useState<ImageWithPreview[]>([]);
  const [modificationInstruction, setModificationInstruction] = useState('');
  const [changeTarget, setChangeTarget] = useState('');
  const [preservationRequirements, setPreservationRequirements] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<EditCategory | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [strength, setStrength] = useState(0.8);
  const [guidanceScale, setGuidanceScale] = useState(7.5);
  const [numInferenceSteps, setNumInferenceSteps] = useState(28);
  const [seed, setSeed] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | undefined>(undefined);
  const [editedImageUrl, setEditedImageUrl] = useState<string>('');
  const [originalImageUrls, setOriginalImageUrls] = useState<string[]>([]);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');
  const [editHistory, setEditHistory] = useState<ImageEditJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId, streamUrl);

  // Fetch edit history
  useEffect(() => {
    const fetchEditHistory = async () => {
      if (!user) return;
      
      setHistoryLoading(true);
      
      try {
        const response = await getUserJobs(user.id);
        if (response.success && response.jobs) {
          const editJobs = response.jobs.filter(
            (job: Job) => (job as any).job_type === 'image_edit'
          ).map((job: Job) => job as unknown as ImageEditJob);
          
          editJobs.sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return dateB - dateA;
          });
          
          setEditHistory(editJobs);
        }
      } catch (err: any) {
        console.error('Error fetching edit history:', err);
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchEditHistory();
  }, [user]);

  // Refresh history when a job completes
  useEffect(() => {
    if (editedImageUrl && user) {
      const fetchEditHistory = async () => {
        try {
          const response = await getUserJobs(user.id);
          if (response.success && response.jobs) {
            const editJobs = response.jobs.filter(
              (job: Job) => (job as any).job_type === 'image_edit'
            ).map((job: Job) => job as unknown as ImageEditJob);
            
            editJobs.sort((a, b) => {
              const dateA = new Date(a.created_at).getTime();
              const dateB = new Date(b.created_at).getTime();
              return dateB - dateA;
            });
            
            setEditHistory(editJobs);
          }
        } catch (err) {
          console.error('Error refreshing edit history:', err);
        }
      };
      fetchEditHistory();
    }
  }, [editedImageUrl, user]);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getImageEditJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          setPollingStatus(jobStatus);
          
          let extractedProgress = 0;
          let extractedMessage = '';
          
          const replicateData = (response.job as any).replicate_data;
          if (replicateData) {
            if (typeof replicateData.progress === 'number') {
              extractedProgress = Math.min(Math.max(replicateData.progress * 100, 0), 100);
            }
            if (replicateData.status) {
              extractedMessage = replicateData.status;
            }
          }
          
          if (!extractedProgress) {
            switch (jobStatus) {
              case 'queued':
                extractedProgress = 5;
                extractedMessage = extractedMessage || 'Job queued...';
                break;
              case 'starting':
                extractedProgress = 10;
                extractedMessage = extractedMessage || 'Starting image editing...';
                break;
              case 'processing':
                extractedProgress = 50;
                extractedMessage = extractedMessage || 'Editing image...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Image editing completed!';
                break;
              default:
                extractedProgress = 0;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
          
          if (jobStatus === 'completed' && response.job.result) {
            const url = response.job.result.image_url || response.job.image_output_url;
            if (url) {
              setEditedImageUrl(url);
              setLoading(false);
              setPollingProgress(100);
              setPollingMessage('Image editing completed! You can edit this image again or download it.');
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

    poll();
    const interval = setInterval(poll, 3000);
    setPollingInterval(interval);
  }, [jobId]);

  useEffect(() => {
    if (jobId && !isConnected && !usePolling && status !== 'completed' && status !== 'error') {
      setUsePolling(true);
      startPolling();
    }
  }, [jobId, isConnected, usePolling, status, startPolling]);

  useEffect(() => {
    if (result && 'image_url' in result) {
      const editResult = result as ImageEditJobResult;
      if (editResult.image_url) {
        setEditedImageUrl(editResult.image_url);
        setLoading(false);
        setPollingMessage('Image editing completed! You can edit this image again or download it.');
        setPollingInterval((prev) => {
          if (prev) {
            clearInterval(prev);
          }
          return null;
        });
      }
    }
  }, [result]);

  useEffect(() => {
    if (sseError) {
      setError(sseError);
      if (!usePolling) {
        setUsePolling(true);
        startPolling();
      }
    }
  }, [sseError, usePolling, startPolling]);

  const handleImageSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    let hasError = false;

    // Validate all files first
    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setError('Please select valid image files');
        hasError = true;
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        hasError = true;
        return;
      }
      validFiles.push(file);
    });

    if (hasError || validFiles.length === 0) return;

    // Load previews for all valid files
    const newImages: ImageWithPreview[] = [];
    let loadedCount = 0;

    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        newImages.push({
          file,
          preview,
          id: `${Date.now()}-${Math.random()}-${loadedCount}`,
        });
        
        loadedCount++;
        
        // Update state when all images are loaded
        if (loadedCount === validFiles.length) {
          setImageFiles((prev) => [...prev, ...newImages]);
          setOriginalImageUrls((prev) => [...prev, ...newImages.map(img => img.preview)]);
          setError(null);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files);
    }
  };

  const handleRemoveImage = (id: string) => {
    setImageFiles((prev) => {
      const updated = prev.filter(img => img.id !== id);
      setOriginalImageUrls(updated.map(img => img.preview));
      return updated;
    });
  };

  const handleCategorySelect = (category: EditCategory) => {
    setSelectedCategory(category);
    const template = categoryTemplates[category];
    setModificationInstruction(template.modification);
    setChangeTarget(template.target);
    setPreservationRequirements(template.preservation);
  };

  const buildPrompt = (): string => {
    const parts: string[] = [];
    if (modificationInstruction.trim()) parts.push(modificationInstruction.trim());
    if (changeTarget.trim()) parts.push(changeTarget.trim());
    if (preservationRequirements.trim()) parts.push(preservationRequirements.trim());
    return parts.join(', ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');

    // Allow editing from either imageFiles or editedImageUrl
    if (imageFiles.length === 0 && !editedImageUrl) {
      setError('Please select at least one image to edit');
      setLoading(false);
      return;
    }

    const prompt = buildPrompt();
    if (!prompt.trim()) {
      setError('Please provide editing instructions');
      setLoading(false);
      return;
    }

    try {
      // Prepare images array
      let imagesInput: (File | string)[] = [];
      
      if (imageFiles.length > 0) {
        // Use uploaded files
        imagesInput = imageFiles.map(img => img.file!).filter(Boolean);
      } else if (editedImageUrl) {
        // Use edited image URL for chaining
        imagesInput = [editedImageUrl];
      }

      if (imagesInput.length === 0) {
        setError('Please select at least one image to edit');
        setLoading(false);
        return;
      }

      const request: ImageEditJobRequest = {
        // Always send first image as 'image' for backend compatibility
        image: imagesInput[0],
        // Also send as 'images' array if multiple images (for future backend support)
        images: imagesInput.length > 1 ? imagesInput : undefined,
        prompt,
        modification_instruction: modificationInstruction.trim() || undefined,
        change_target: changeTarget.trim() || undefined,
        preservation_requirements: preservationRequirements.trim() || undefined,
        strength: showAdvanced ? strength : undefined,
        guidance_scale: showAdvanced ? guidanceScale : undefined,
        num_inference_steps: showAdvanced ? numInferenceSteps : undefined,
        seed: showAdvanced ? seed : undefined,
      };

      // Store the current edited image URL as original before clearing
      const currentEditedUrl = editedImageUrl;
      
      // Clear edited image URL when starting a new edit
      setEditedImageUrl('');
      
      // If we're editing from a URL, set it as the original for the new edit
      if (currentEditedUrl && imageFiles.length === 0) {
        setOriginalImageUrls([currentEditedUrl]);
      }

      const response = await submitImageEditJob(request);
      
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        if (response.stream_url) {
          setStreamUrl(response.stream_url);
        }
        setPollingProgress(5);
        setPollingStatus('queued');
        setPollingMessage('Job submitted, starting...');
        setTimeout(() => {
          if (!isConnected) {
            startPolling();
          }
        }, 1000);
      } else {
        setError('Failed to submit editing job');
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Error submitting edit job:', err);
      setError(err?.message || 'Failed to submit editing job. Please try again.');
      setLoading(false);
    }
  };

  const handleDownload = (url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `edited-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUseAsNewOriginal = async () => {
    if (!editedImageUrl) return;

    try {
      // Fetch the edited image as a blob
      const response = await fetch(editedImageUrl);
      const blob = await response.blob();
      
      // Create a File object from the blob
      const fileName = `edited-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;
      const file = new File([blob], fileName, { type: blob.type });
      
      // Set as new image file
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImageFiles([{
          file,
          preview,
          id: `${Date.now()}-${Math.random()}`,
        }]);
        setOriginalImageUrls([preview]);
      };
      reader.readAsDataURL(file);
      
      // Clear the edited image URL to show we're starting a new edit
      setEditedImageUrl('');
      
      // Scroll to top of form
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Error loading edited image:', err);
      setError('Failed to load edited image. Please try downloading and uploading it manually.');
    }
  };

  const handleHistoryClick = (job: ImageEditJob) => {
    if (job.result?.image_url) {
      setEditedImageUrl(job.result.image_url);
    }
    if (job.original_image_url) {
      setOriginalImageUrls([job.original_image_url]);
      // Convert URL to file for editing
      fetch(job.original_image_url)
        .then(res => res.blob())
        .then(blob => {
          const file = new File([blob], `image-${Date.now()}.png`, { type: blob.type });
          const reader = new FileReader();
          reader.onloadend = () => {
            setImageFiles([{
              file,
              preview: reader.result as string,
              id: `${Date.now()}-${Math.random()}`,
            }]);
          };
          reader.readAsDataURL(file);
        })
        .catch(err => console.error('Error loading image:', err));
    }
    if (job.prompt) {
      // Try to parse prompt back into components (basic attempt)
      const parts = job.prompt.split(',');
      if (parts.length >= 3) {
        setModificationInstruction(parts[0].trim());
        setChangeTarget(parts[1].trim());
        setPreservationRequirements(parts.slice(2).join(',').trim());
      } else {
        setModificationInstruction(job.prompt);
      }
    }
  };

  const currentProgress = isConnected ? progress : pollingProgress;
  const currentStatus = isConnected ? status : pollingStatus;
  const currentMessage = isConnected ? message : pollingMessage;

  return (
    <div style={styles.container} className="image-editing-tool-container">
      <div style={styles.formWrapper}>
        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Image Upload */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Upload Image{imageFiles.length > 1 ? 's' : ''}
              {editedImageUrl && imageFiles.length === 0 && (
                <span style={{ color: '#00c6ff', fontSize: '0.85rem', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                  (Editing previously edited image)
                </span>
              )}
            </label>
            <div
              style={{
                ...styles.fileUploadBox,
                ...(isDragging ? styles.fileUploadBoxHover : {}),
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  handleImageSelect(e.target.files);
                }}
                style={{ display: 'none' }}
              />
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ margin: '0 auto', opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p style={{ margin: '0.5rem 0', color: '#cbd5e1' }}>
                {imageFiles.length > 0 
                  ? `${imageFiles.length} image${imageFiles.length > 1 ? 's' : ''} selected` 
                  : 'Click to upload or drag and drop'}
              </p>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>
                PNG, JPG, WEBP up to 10MB each (multiple images supported)
              </p>
            </div>
            {imageFiles.length > 0 && (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: '1rem',
                marginTop: '1rem',
              }}>
                {imageFiles.map((img) => (
                  <div 
                    key={img.id}
                    style={{
                      position: 'relative',
                      borderRadius: '0.75rem',
                      overflow: 'hidden',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                  >
                    <img 
                      src={img.preview} 
                      alt="Preview" 
                      className="image-preview"
                      style={{
                        ...styles.imagePreview,
                        maxWidth: '100%',
                        width: '100%',
                        height: 'auto',
                        marginTop: 0,
                        borderRadius: 0,
                      }} 
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(img.id)}
                      style={{
                        position: 'absolute',
                        top: '0.5rem',
                        right: '0.5rem',
                        background: 'rgba(239, 68, 68, 0.9)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Editing Category (Optional Templates)</label>
            <div style={styles.categoryButtons}>
              {(Object.keys(categoryTemplates) as EditCategory[]).map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  style={{
                    ...styles.categoryButton,
                    ...(selectedCategory === category ? styles.categoryButtonActive : {}),
                  }}
                >
                  {categoryTemplates[category].description}
                </button>
              ))}
            </div>
          </div>

          {/* Modification Instruction */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Modification Instruction <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(What to change?)</span>
            </label>
            <textarea
              value={modificationInstruction}
              onChange={(e) => setModificationInstruction(e.target.value)}
              placeholder="e.g., Add a knitted purple teddy bear"
              style={styles.textarea}
              disabled={loading}
            />
            <div style={styles.helperText}>
              Describe what change or transformation you want to make (Add, Remove, Modify, Transform)
            </div>
          </div>

          {/* Change Target */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Change Target <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(What to modify?)</span>
            </label>
            <textarea
              value={changeTarget}
              onChange={(e) => setChangeTarget(e.target.value)}
              placeholder="e.g., next to the character reading a book"
              style={styles.textarea}
              disabled={loading}
            />
            <div style={styles.helperText}>
              Identify exactly where or which element(s) you want to modify. Be specific and avoid pronouns.
            </div>
          </div>

          {/* Preservation Requirements */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>
              Preservation Requirements <span style={{ color: '#94a3b8', fontWeight: 'normal' }}>(What must stay the same?)</span>
            </label>
            <textarea
              value={preservationRequirements}
              onChange={(e) => setPreservationRequirements(e.target.value)}
              placeholder="e.g., matching textures and fabric while preserving the overall style and keeping all other elements unchanged"
              style={styles.textarea}
              disabled={loading}
            />
            <div style={styles.helperText}>
              Explicitly state what must remain unchanged (identity, lighting, composition, style, etc.)
            </div>
          </div>

          {/* Combined Prompt Preview */}
          <div style={styles.inputGroup}>
            <label style={styles.label}>Combined Prompt Preview</label>
            <div style={styles.promptPreview}>
              {buildPrompt() || 'Your combined prompt will appear here...'}
            </div>
          </div>

          {/* Advanced Options */}
          <div style={styles.inputGroup}>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#60a5fa',
                cursor: 'pointer',
                fontSize: '0.9rem',
                padding: '0.5rem 0',
                textAlign: 'left' as const,
              }}
            >
              {showAdvanced ? '▼' : '▶'} Advanced Options
            </button>
            {showAdvanced && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
                <div>
                  <label style={styles.label}>Strength: {strength}</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={strength}
                    onChange={(e) => setStrength(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={styles.label}>Guidance Scale: {guidanceScale}</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={guidanceScale}
                    onChange={(e) => setGuidanceScale(parseFloat(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={styles.label}>Inference Steps: {numInferenceSteps}</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="1"
                    value={numInferenceSteps}
                    onChange={(e) => setNumInferenceSteps(parseInt(e.target.value))}
                    style={{ width: '100%' }}
                    disabled={loading}
                  />
                </div>
                <div>
                  <label style={styles.label}>Seed (optional)</label>
                  <input
                    type="number"
                    value={seed || ''}
                    onChange={(e) => setSeed(e.target.value ? parseInt(e.target.value) : undefined)}
                    placeholder="Random"
                    style={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            )}
          </div>

          {error && <div style={styles.error}>{error}</div>}

          {/* Progress Display */}
          {(loading || currentProgress > 0) && (
            <div style={styles.progressContainer}>
              <div style={{ color: '#f8fafc', fontSize: '0.9rem' }}>
                {currentMessage || 'Processing...'}
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressBarFill,
                    width: `${currentProgress}%`,
                  }}
                />
              </div>
              <div style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                Status: {currentStatus || 'Processing'} ({Math.round(currentProgress)}%)
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !user || (imageFiles.length === 0 && !editedImageUrl)}
            style={{
              ...styles.submitButton,
              ...(loading || !user || (imageFiles.length === 0 && !editedImageUrl) ? styles.submitButtonDisabled : {}),
            }}
          >
            {loading ? 'Editing...' : editedImageUrl && imageFiles.length === 0 ? 'Edit Again' : `Edit ${imageFiles.length > 1 ? `${imageFiles.length} Images` : 'Image'}`}
          </button>

          {!user && (
            <p style={{ color: '#94a3b8', fontSize: '0.9rem', textAlign: 'center' }}>
              Please <a href="/auth/login" style={{ color: '#00c6ff' }}>sign in</a> to use image editing
            </p>
          )}
        </form>
      </div>

      {/* Right Sidebar: Results + History */}
      <div style={styles.rightSidebar}>
        {(originalImageUrls.length > 0 || editedImageUrl) && (
          <div style={styles.imageContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Before & After</h3>
            <div style={styles.beforeAfterContainer}>
              {originalImageUrls.length > 0 && (
                <div style={styles.imageWrapper}>
                  <div style={styles.imageLabel}>
                    Original{originalImageUrls.length > 1 ? ` (${originalImageUrls.length})` : ''}
                  </div>
                  {originalImageUrls.length === 1 ? (
                    <img src={originalImageUrls[0]} alt="Original" style={styles.image} />
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                      {originalImageUrls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Original ${idx + 1}`} style={{ ...styles.image, maxHeight: '150px' }} />
                      ))}
                    </div>
                  )}
                </div>
              )}
              {editedImageUrl && (
                <div style={styles.imageWrapper}>
                  <div style={styles.imageLabel}>Edited</div>
                  <img src={editedImageUrl} alt="Edited" style={styles.image} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
                    <button
                      onClick={() => handleDownload(editedImageUrl)}
                      style={styles.downloadButton}
                    >
                      Download Edited Image
                    </button>
                    <button
                      onClick={handleUseAsNewOriginal}
                      style={styles.editAgainButton}
                    >
                      Edit This Image Again
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit History */}
        <div style={styles.historyContainer}>
          <h3 style={styles.historyTitle}>Edit History</h3>
          {historyLoading ? (
            <div style={styles.emptyHistory}>Loading history...</div>
          ) : editHistory.length === 0 ? (
            <div style={styles.emptyHistory}>No edit history yet</div>
          ) : (
            editHistory.map((job) => (
              <div
                key={job._id}
                style={styles.historyCard}
                onClick={() => handleHistoryClick(job)}
              >
                <div style={styles.historyCardHeader}>
                  <span style={{ color: '#f8fafc', fontSize: '0.85rem', fontWeight: 600 }}>
                    {new Date(job.created_at).toLocaleDateString()}
                  </span>
                  <span
                    style={{
                      color: job.status === 'completed' ? '#10b981' : job.status === 'error' ? '#ef4444' : '#94a3b8',
                      fontSize: '0.75rem',
                    }}
                  >
                    {job.status}
                  </span>
                </div>
                <div style={styles.historyCardPrompt}>{job.prompt}</div>
                <div style={styles.historyCardMeta}>
                  {job.result?.image_url && '✓ Completed'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}


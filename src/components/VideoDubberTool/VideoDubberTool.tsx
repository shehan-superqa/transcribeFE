import { useState, useEffect, useCallback, useRef } from 'react';
import { submitVideoDubJob, getVideoDubJobStatus, getDubLanguages, type DubLanguage } from '../../lib/api/videoApi';
import { useSSE } from '../../hooks/useSSE';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import HowToUse from '../common/HowToUse';
import '../common/HowToUse.css';
import '../../pages/Dashboard.css';
import './VideoDubberTool.css';

const styles = {
  formContainer: {
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    fontFamily: 'Inter, system-ui, sans-serif',
    maxWidth: '900px',
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
    color: '#f8fafc',
  },
  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
    fontSize: '0.95rem',
    width: '100%',
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
    width: '100%',
  },
  dropzone: {
    border: '2px dashed rgba(255, 255, 255, 0.3)',
    borderRadius: '0.75rem',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    width: '100%',
  },
  dropzoneActive: {
    borderColor: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  dropzoneText: {
    color: '#cbd5e1',
    fontSize: '0.9rem',
    marginTop: '0.5rem',
  },
  videoPreview: {
    width: '100%',
    maxWidth: '100%',
    borderRadius: '0.75rem',
    marginTop: '1rem',
  },
  button: {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.75rem',
    border: 'none',
    fontSize: '0.95rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    width: '100%',
  },
  buttonPrimary: {
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#ffffff',
  },
  buttonDisabled: {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.5)',
    cursor: 'not-allowed',
  },
  progressBar: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden' as const,
    marginTop: '0.5rem',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    transition: 'width 0.3s ease',
  },
  error: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5',
    fontSize: '0.9rem',
  },
  success: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    border: '1px solid rgba(34, 197, 94, 0.3)',
    color: '#86efac',
    fontSize: '0.9rem',
  },
  historyItem: {
    padding: '1rem',
    borderRadius: '0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    marginBottom: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  historyItemHeader: {
    display: 'flex',
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: '0.5rem',
  },
  historyItemTitle: {
    fontWeight: 600,
    fontSize: '0.9rem',
    color: '#f8fafc',
  },
  historyItemStatus: {
    fontSize: '0.75rem',
    padding: '0.25rem 0.5rem',
    borderRadius: '0.25rem',
    fontWeight: 500,
  },
  statusCompleted: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    color: '#86efac',
  },
  statusProcessing: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    color: '#93c5fd',
  },
  statusError: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    color: '#fca5a5',
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
};

// Supported languages for video dubbing
const SUPPORTED_LANGUAGES = [
  { code: 'Spanish', label: 'Spanish' },
  { code: 'French', label: 'French' },
  { code: 'German', label: 'German' },
  { code: 'Italian', label: 'Italian' },
  { code: 'Portuguese', label: 'Portuguese' },
  { code: 'Chinese', label: 'Chinese' },
  { code: 'Japanese', label: 'Japanese' },
  { code: 'Korean', label: 'Korean' },
  { code: 'Hindi', label: 'Hindi' },
  { code: 'Arabic', label: 'Arabic' },
  { code: 'Russian', label: 'Russian' },
  { code: 'Dutch', label: 'Dutch' },
  { code: 'Polish', label: 'Polish' },
  { code: 'Turkish', label: 'Turkish' },
  { code: 'Vietnamese', label: 'Vietnamese' },
];

export default function VideoDubberTool() {
  const { requireAuth, isAuthenticated } = useRequireAuth();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [outputLanguage, setOutputLanguage] = useState<string>('Spanish');
  const [addSubtitles, setAddSubtitles] = useState<boolean>(false);
  const [availableLanguages, setAvailableLanguages] = useState<DubLanguage[]>(SUPPORTED_LANGUAGES);
  const [languagesLoading, setLanguagesLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [resultVideoUrl, setResultVideoUrl] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);
  const [usePolling, setUsePolling] = useState(false);
  const [pollingProgress, setPollingProgress] = useState<number>(0);
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [pollingMessage, setPollingMessage] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Fetch available languages on component mount
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLanguagesLoading(true);
        const response = await getDubLanguages();
        
        // Log the raw response for debugging
        console.log('🔍 Languages API raw response:', response);
        console.log('🔍 Response type:', typeof response);
        console.log('🔍 Is array?', Array.isArray(response));
        
        // Handle different response structures
        let languages: DubLanguage[] = [];
        
        if (response) {
          // Case 1: Response is directly an array of languages
          if (Array.isArray(response)) {
            languages = response;
            console.log('✅ Found languages as direct array:', languages.length);
          } 
          // Case 2: Response has languages property (with or without success)
          else if (response.languages && Array.isArray(response.languages)) {
            languages = response.languages;
            console.log('✅ Found languages in response.languages:', languages.length);
          }
          // Case 3: Response has data property containing languages
          else if ((response as any).data && Array.isArray((response as any).data)) {
            languages = (response as any).data;
            console.log('✅ Found languages in response.data:', languages.length);
          }
          // Case 4: Response has data.languages
          else if ((response as any).data?.languages && Array.isArray((response as any).data.languages)) {
            languages = (response as any).data.languages;
            console.log('✅ Found languages in response.data.languages:', languages.length);
          }
          // Case 5: Response has success and languages
          else if (response.success && response.languages && Array.isArray(response.languages)) {
            languages = response.languages;
            console.log('✅ Found languages in response.success.languages:', languages.length);
          }
        }
        
        // Log extracted languages
        console.log('📋 Extracted languages:', languages);
        console.log('📊 Total languages found:', languages.length);
        
        // Validate language structure
        if (languages.length > 0) {
          const validLanguages = languages.filter(lang => lang && lang.code && lang.label);
          console.log('✅ Valid languages:', validLanguages.length);
          
          if (validLanguages.length > 0) {
            setAvailableLanguages(validLanguages);
          // Set default language to first available language if current default is not in the list
            if (!validLanguages.find(lang => lang.code === outputLanguage)) {
              setOutputLanguage(validLanguages[0].code);
            }
            console.log('✅ Languages set successfully:', validLanguages.length);
          } else {
            console.warn('⚠️ No valid languages found in response, using fallback');
            setAvailableLanguages(SUPPORTED_LANGUAGES);
          }
        } else {
          console.warn('⚠️ No languages received from API, using fallback languages');
          setAvailableLanguages(SUPPORTED_LANGUAGES);
        }
      } catch (err: any) {
        console.error('❌ Error fetching dubbing languages:', err);
        console.error('❌ Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        // Keep using the hardcoded fallback languages
        setAvailableLanguages(SUPPORTED_LANGUAGES);
      } finally {
        setLanguagesLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  // Use SSE hook for progress tracking
  const { progress, status, message, result, error: sseError, isConnected } = useSSE(jobId);

  const startPolling = useCallback(() => {
    if (!jobId) return;

    const poll = async () => {
      try {
        const response = await getVideoDubJobStatus(jobId!);
        if (response.success && response.job) {
          const jobStatus = response.job.status;
          setPollingStatus(jobStatus);
          
          // Log job status for debugging
          if (import.meta.env.DEV) {
            console.log('Job status update:', {
              jobId,
              status: jobStatus,
              error: response.job.error,
              result: response.job.result,
            });
          }
          
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
                extractedMessage = extractedMessage || 'Starting video dubbing...';
                break;
              case 'processing':
                extractedProgress = 50;
                extractedMessage = extractedMessage || 'Dubbing video...';
                break;
              case 'completed':
                extractedProgress = 100;
                extractedMessage = extractedMessage || 'Dubbing completed!';
                // Prioritize video_output_url (dubbed video) over result.video_url (might be input)
                // Also check result.dubbed_video_url if it exists
                const completedVideoUrl = response.job.video_output_url || 
                                         (response.job.result as any)?.dubbed_video_url ||
                                         (response.job.result as any)?.output_video_url ||
                                         response.job.result?.video_url;
                if (completedVideoUrl) {
                  // Make sure we're not using the input video URL
                  const inputVideoUrl = response.job.video;
                  if (completedVideoUrl !== inputVideoUrl) {
                    setResultVideoUrl(completedVideoUrl);
                    setLoading(false);
                    setUsePolling(false);
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                  } else {
                    // If output URL is same as input, log warning
                    console.warn('Output video URL matches input video URL - dubbing may have failed');
                    setError('Dubbing completed but output video appears to be the same as input. Please check the backend logs.');
                    setLoading(false);
                    setUsePolling(false);
                    if (pollingInterval) {
                      clearInterval(pollingInterval);
                      setPollingInterval(null);
                    }
                  }
                }
                break;
              case 'error':
                extractedProgress = 0;
                const errorMsg = response.job.error || 'An error occurred during video dubbing';
                extractedMessage = extractedMessage || errorMsg;
                setError(errorMsg);
                setLoading(false);
                setUsePolling(false);
                if (pollingInterval) {
                  clearInterval(pollingInterval);
                  setPollingInterval(null);
                }
                break;
            }
          }
          
          setPollingProgress(extractedProgress);
          setPollingMessage(extractedMessage);
        }
      } catch (err: any) {
        console.error('Error polling job status:', err);
        
        // Extract detailed error message
        let errorMessage = err.message || 'Failed to check job status';
        if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        
        setError(errorMessage);
        setLoading(false);
        setUsePolling(false);
        if (pollingInterval) {
          clearInterval(pollingInterval);
          setPollingInterval(null);
        }
      }
    };

    poll(); // Initial poll
    const interval = setInterval(poll, 2000); // Poll every 2 seconds
    setPollingInterval(interval);
    setUsePolling(true);
  }, [jobId, pollingInterval]);

  // Start polling when jobId is set and SSE is not connected
  useEffect(() => {
    if (jobId && !isConnected && !usePolling) {
      setTimeout(() => {
        if (!isConnected) {
          startPolling();
        }
      }, 1000);
    }
  }, [jobId, isConnected, usePolling, startPolling]);

  // Handle SSE result
  useEffect(() => {
    if (result) {
      // Prioritize output video URL (dubbed video) over input video URL
      const completedVideoUrl = (result as any).video_output_url || 
                                (result as any).dubbed_video_url ||
                                (result as any).output_video_url ||
                                (result as any).video_url;
      if (completedVideoUrl) {
        // Check if this is different from the input video URL
        const inputVideoUrl = videoUrl.trim();
        if (completedVideoUrl !== inputVideoUrl) {
          setResultVideoUrl(completedVideoUrl);
          setLoading(false);
        } else {
          console.warn('SSE result video URL matches input - dubbing may have failed');
          setError('Dubbing completed but output video appears to be the same as input.');
          setLoading(false);
        }
      }
    }
  }, [result, videoUrl]);

  // Handle SSE error
  useEffect(() => {
    if (sseError) {
      console.error('SSE error:', sseError);
      setError(sseError);
      setLoading(false);
    }
  }, [sseError]);
  
  // Handle SSE result errors
  useEffect(() => {
    if (result && (result as any).error) {
      const errorMsg = (result as any).error;
      console.error('SSE result error:', errorMsg);
      setError(errorMsg);
      setLoading(false);
    }
  }, [result]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl);
      }
    };
  }, [videoPreviewUrl]);

  const handleFileSelect = (file: File) => {
    if (!file || !(file instanceof File)) {
      setError('Invalid file selected');
      return;
    }
    
    if (!file.type.startsWith('video/')) {
      setError('Please select a valid video file');
      return;
    }

    console.log('File selected:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
    });

    setVideoFile(file);
    setVideoUrl(''); // Clear URL when file is selected
    setError(null);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setVideoPreviewUrl(previewUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items);
    const fileItem = items.find(item => item.type.startsWith('video/'));
    
    if (fileItem) {
      const file = fileItem.getAsFile();
      if (file) {
        handleFileSelect(file);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check authentication before submitting
    if (!requireAuth()) {
      return;
    }
    
    setError(null);
    setResultVideoUrl(null);
    setLoading(true);
    setJobId(null);
    setUsePolling(false);
    setPollingProgress(0);
    setPollingStatus('');
    setPollingMessage('');

    if (!videoFile && !videoUrl.trim()) {
      setError('Please upload a video file or provide a video URL');
      setLoading(false);
      return;
    }

    if (!outputLanguage) {
      setError('Please select an output language');
      setLoading(false);
      return;
    }

    try {
      // Verify we have a valid file or URL
      if (videoFile) {
        // Double-check file is valid
        if (!(videoFile instanceof File)) {
          setError('Invalid video file. Please select a file again.');
          setLoading(false);
          return;
        }
        
        console.log('Submitting video file:', {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          outputLanguage,
          addSubtitles,
          isFile: videoFile instanceof File,
        });
      } else if (videoUrl.trim()) {
        console.log('Submitting video URL:', {
          url: videoUrl.trim(),
          outputLanguage,
          addSubtitles,
        });
      } else {
        setError('Please upload a video file or provide a video URL');
        setLoading(false);
        return;
      }
      
      // Submit job with either file or URL
      const response = await submitVideoDubJob(
        videoFile || videoUrl.trim(),
        outputLanguage,
        addSubtitles
      );
      
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
        setError('Failed to submit video dubbing job');
        setLoading(false);
      }
    } catch (err: any) {
      // Extract detailed error message
      let errorMessage = 'Failed to submit video dubbing job';
      
      if (err.response?.data) {
        // Backend returned error details
        errorMessage = err.response.data.error || err.response.data.message || errorMessage;
      } else if (err.message) {
        // Error from our API function
        errorMessage = err.message;
      }
      
      console.error('Video dubbing submission error:', {
        error: err,
        response: err.response?.data,
        status: err.response?.status,
      });
      
      setError(errorMessage);
      setLoading(false);
    }
  };

  // Use polling progress/status if SSE is not connected, otherwise use SSE data
  const currentStatus = loading ? (isConnected ? status : pollingStatus || 'queued') : '';
  const displayProgress = isConnected ? (progress || 0) : (pollingProgress || 0);
  const displayMessage = isConnected 
    ? (message || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Dubbing video...' : ''))
    : (pollingMessage || (currentStatus === 'queued' ? 'Job queued...' : currentStatus === 'processing' ? 'Dubbing video...' : currentStatus === 'starting' ? 'Starting video dubbing...' : ''));

  return (
    <div>
      <div className="tool-sticky-title">
        <h1>
          <span>Video Dubber</span>
          <span className="title-subtitle"> - Add professional voiceovers and translations to your videos using AI</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload a video file using drag & drop, paste from clipboard, or click to browse. You can also paste a video URL. Select the target language for dubbing. Click 'Dub Video' to start the process. The system will translate and dub your video with natural-sounding voice in the selected language."
      />
      <div style={styles.formContainer}>
        <form style={styles.form} onSubmit={handleSubmit} onPaste={handlePaste}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Video File *</label>
              <div
                ref={dropzoneRef}
                style={{
                  ...styles.dropzone,
                  ...(isDragging ? styles.dropzoneActive : {}),
                }}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                {videoPreviewUrl ? (
                  <video
                    src={videoPreviewUrl}
                    controls
                    style={styles.videoPreview}
                    onLoadStart={() => {}}
                  />
                ) : (
                  <>
                    <svg
                      width="48"
                      height="48"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ color: '#64748b', margin: '0 auto' }}
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                    <p style={styles.dropzoneText}>
                      Drag & drop video here, or click to browse
                    </p>
                    <p style={{ ...styles.dropzoneText, fontSize: '0.75rem', marginTop: '0.25rem' }}>
                      or paste from clipboard
                    </p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleFileInputChange}
                style={{ display: 'none' }}
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Or Video URL</label>
              <input
                type="text"
                placeholder="https://example.com/video.mp4"
                value={videoUrl}
                onChange={(e) => {
                  setVideoUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setVideoFile(null);
                    setVideoPreviewUrl(null);
                  }
                }}
                style={styles.input}
              />
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                Alternatively, enter a publicly accessible video URL
              </p>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>
                Output Language
                {!languagesLoading && availableLanguages.length > 0 && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 400, color: '#94a3b8', marginLeft: '0.5rem' }}>
                    ({availableLanguages.length} available)
                  </span>
                )}
              </label>
              <select
                value={outputLanguage}
                onChange={(e) => setOutputLanguage(e.target.value)}
                style={styles.select}
                disabled={languagesLoading}
              >
                {languagesLoading ? (
                  <option>Loading languages...</option>
                ) : availableLanguages.length === 0 ? (
                  <option>No languages available</option>
                ) : (
                  availableLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label || lang.code}
                    </option>
                  ))
                )}
              </select>
              {!languagesLoading && availableLanguages.length === 0 && (
                <p style={{ fontSize: '0.75rem', color: '#fca5a5', marginTop: '0.25rem' }}>
                  ⚠️ Failed to load languages from API. Using fallback languages.
                </p>
              )}
            </div>

            <div style={styles.inputGroup}>
              <label style={{ ...styles.label, display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={addSubtitles}
                  onChange={(e) => setAddSubtitles(e.target.checked)}
                  style={{
                    width: '18px',
                    height: '18px',
                    cursor: 'pointer',
                    accentColor: '#3b82f6',
                  }}
                />
                <span>Add Subtitles</span>
              </label>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
                Generate subtitles in the selected language and embed them in the video
              </p>
            </div>

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

            {loading && (
              <div>
                <div style={styles.progressBar}>
                  <div
                    style={{
                      ...styles.progressFill,
                      width: `${displayProgress}%`,
                    }}
                  />
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                  {displayMessage || 'Processing...'}
                </p>
              </div>
            )}

            {resultVideoUrl && !loading && (
              <div style={styles.success}>
                <p style={{ margin: '0 0 0.5rem 0' }}>✓ Video dubbing completed!</p>
              </div>
            )}

            <button
              type="submit"
              disabled={!isAuthenticated || loading || (!videoFile && !videoUrl.trim())}
              style={{
                ...styles.button,
                ...(!isAuthenticated || loading || (!videoFile && !videoUrl.trim()) ? styles.buttonDisabled : styles.buttonPrimary),
              }}
            >
              {loading ? 'Dubbing Video...' : 'Dub Video'}
            </button>
          </form>
        {resultVideoUrl && (
          <div style={styles.videoContainer}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc' }}>Dubbed Video</h3>
            <video src={resultVideoUrl} controls style={styles.video}>
              Your browser does not support the video tag.
            </video>
            <a
              href={resultVideoUrl}
              download={`dubbed_video_${jobId || 'output'}.mp4`}
              style={styles.downloadButton}
            >
              Download Dubbed Video
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

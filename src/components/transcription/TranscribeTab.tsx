/**
 * Unified Transcription tab component
 * Handles both single file and batch processing
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Button,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Alert,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Chip,
  LinearProgress,
  Snackbar,
  Grid,
  useMediaQuery,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import FileUploader from './common/FileUploader';
import ProgressBar from './common/ProgressBar';
import StatusLabel from './common/StatusLabel';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import './TranscribeTab.css';
import { StatusTag, SectionCard } from '../../components/design-system';
import { transcriptionStore } from '../../stores/transcriptionStore';
import { jobStore } from '../../stores/jobStore';
import { useAuth } from '../../lib/auth';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useJobPolling } from '../../hooks/useJobPolling';
import { getAvailableModels, submitTranscriptionJob } from '../../lib/api/transcriptionApi';
import { cancelJob } from '../../lib/api/jobsApi';
import { useAuthModal } from '../../contexts/AuthModalContext';
import { useTheme } from '../../contexts/ThemeContext';
import { checkAuthAndTriggerModal } from '../../lib/authCheck';
import type { TranscriptionConfig } from '../../types/api';
import type { ProcessingMode } from '../../types/transcription';
import type { TranscriptionResult } from '../../types/api';

interface BatchFile {
  file: File;
  status: 'idle' | 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  result?: TranscriptionResult;
  error?: string;
  jobId?: string;
}

export default function TranscribeTab() {
  const { openModal } = useAuthModal();
  const { theme } = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [files, setFiles] = useState<File[]>([]);
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [engine] = useState('replicate');
  const [language, setLanguage] = useState('en');
  const [model, setModel] = useState('base');
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('batch');
  const [enablePunctuation, setEnablePunctuation] = useState(true);
  const [enableCapitalization, setEnableCapitalization] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [enginesData, setEnginesData] = useState<Array<{ name: string; models: string[] }>>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchError, setBatchError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuth();
  const { requireAuth } = useRequireAuth();
  const submitJob = transcriptionStore((state) => state.submitJob);
  const isProcessing = transcriptionStore((state) => state.isProcessing);
  const results = transcriptionStore((state) => state.results);
  const error = transcriptionStore((state) => state.error);
  const clearResults = transcriptionStore((state) => state.clearResults);
  const fetchJobs = jobStore((state) => state.fetchJobs);
  const updateJob = jobStore((state) => state.updateJob);
  const { progress, message, result, status, progressDetails, job } = useJobPolling(jobId);

  // Language code to full name mapping
  const getLanguageDisplayName = (code: string): string => {
    const languageMap: Record<string, string> = {
      'en': 'English',
      'es': 'Spanish',
      'fr': 'French',
      'de': 'German',
      'it': 'Italian',
      'pt': 'Portuguese',
      'ru': 'Russian',
      'ja': 'Japanese',
      'ko': 'Korean',
      'zh': 'Chinese',
      'ar': 'Arabic',
      'hi': 'Hindi',
      'nl': 'Dutch',
      'pl': 'Polish',
      'tr': 'Turkish',
      'vi': 'Vietnamese',
      'uk': 'Ukrainian',
      'id': 'Indonesian',
      'cs': 'Czech',
      'da': 'Danish',
      'fi': 'Finnish',
      'el': 'Greek',
      'he': 'Hebrew',
      'hu': 'Hungarian',
      'no': 'Norwegian',
      'ro': 'Romanian',
      'sv': 'Swedish',
      'th': 'Thai',
    };
    const fullName = languageMap[code.toLowerCase()] || code.charAt(0).toUpperCase() + code.slice(1);
    const codeUpper = code.toUpperCase();
    return `${codeUpper}-${fullName}`;
  };

  // Determine if we're in batch mode (multiple files) or single mode
  const isBatchMode = files.length > 1;
  const singleFile = files.length === 1 ? files[0] : null;

  useEffect(() => {
    // Load available models and languages
    getAvailableModels()
      .then((data) => {
        if (data.success || data.engines) {
          // Store engines data
          const engines = data.engines || [];
          setEnginesData(engines.map(e => ({ name: e.name, models: e.models || [] })));
          
          // Set languages
          setAvailableLanguages(data.languages || []);
          
          // Set models for current engine or default to whisper models
          const currentEngineData = engines.find(e => e.name === engine);
          if (currentEngineData && currentEngineData.models.length > 0) {
            setAvailableModels(currentEngineData.models);
            // Reset model if current model is not available for selected engine
            if (!currentEngineData.models.includes(model)) {
              setModel(currentEngineData.models[0] || 'base');
            }
          } else {
            // Fallback to legacy models or default
            setAvailableModels(data.models || ['base', 'small', 'medium', 'large']);
          }
        }
      })
      .catch((error) => {
        console.warn('Failed to load available models:', error);
        setAvailableModels(['base', 'small', 'medium', 'large']);
        setAvailableLanguages(['en']);
      });
  }, []);

  // Update available models when engine changes
  useEffect(() => {
    // Don't update if enginesData is not loaded yet (empty array)
    if (enginesData.length === 0) {
      return;
    }

    const currentEngineData = enginesData.find(e => e.name === engine);
    if (currentEngineData && currentEngineData.models.length > 0) {
      setAvailableModels(currentEngineData.models);
      // Reset model if current model is not available for selected engine
      if (!currentEngineData.models.includes(model)) {
        setModel(currentEngineData.models[0] || 'base');
      }
    } else if (engine === 'whisper') {
      // Default whisper models if engine data not loaded yet
      setAvailableModels(['tiny', 'base', 'small', 'medium', 'large', 'large-v2', 'large-v3']);
      if (!model || !['tiny', 'base', 'small', 'medium', 'large', 'large-v2', 'large-v3'].includes(model)) {
        setModel('base');
      }
    } else {
      // For engines without models (like google), show empty array but keep dropdown visible with a message
      // Actually, let's check if replicate has models - it should
      if (engine === 'replicate') {
        // Replicate should have models, use default if not found
        setAvailableModels(['base', 'small', 'medium', 'large']);
        if (!model || !['base', 'small', 'medium', 'large'].includes(model)) {
          setModel('base');
        }
      } else {
        // For engines that truly don't support models (like google), hide dropdown
        setAvailableModels([]);
        if (model) {
          setModel('');
        }
      }
    }
  }, [engine, enginesData]);

  const setResults = transcriptionStore((state) => state.setResults);
  const setIsProcessing = transcriptionStore((state) => state.setIsProcessing);
  
  // Track previous status to detect completion
  const prevStatusRef = useRef<string>('');
  
  useEffect(() => {
    // Update results when polling receives final result or when job completes
    if (result && results !== result) {
      setResults(result);
      setIsProcessing(false);
    } else if (status === 'completed') {
      // Job completed - ensure isProcessing is false and extract result if available
      setIsProcessing(false);
      if (job?.result && !results) {
        // Extract result from job object if not already set
        setResults(job.result);
      } else if (result && !results) {
        // Use result from polling hook if available
        setResults(result);
      }
      // Update job in store to refresh history
      if (job) {
        updateJob(job);
      }
      // Refresh the full job list when status changes to completed
      if (prevStatusRef.current !== 'completed' && user?.id) {
        prevStatusRef.current = 'completed';
        // Refresh immediately and again after a short delay to ensure backend has updated
        fetchJobs(user.id);
        setTimeout(() => {
          fetchJobs(user.id);
        }, 1000);
      }
    } else if (status === 'error' || status === 'cancelled') {
      // Job failed or cancelled
      setIsProcessing(false);
      // Update job in store to refresh history
      if (job) {
        updateJob(job);
      }
      // Refresh history when job fails or is cancelled
      if (prevStatusRef.current !== status && user?.id) {
        prevStatusRef.current = status;
        fetchJobs(user.id);
      }
    } else if (status === 'processing' || status === 'queued' || status === 'starting') {
      // Job is still processing
      setIsProcessing(true);
      // Update job status in store periodically
      if (job) {
        updateJob(job);
      }
      prevStatusRef.current = status;
    }
  }, [result, results, setResults, setIsProcessing, status, job, updateJob, fetchJobs, user]);

  // Convert files array to batchFiles when switching to batch mode
  useEffect(() => {
    if (isBatchMode && files.length > 0) {
      const newBatchFiles: BatchFile[] = files.map((file) => {
        // Check if file already exists in batchFiles
        const existing = batchFiles.find((bf) => bf.file === file);
        if (existing) return existing;
        // New files start as 'idle' - they haven't been queued for processing yet
        return {
          file,
          status: 'idle' as const,
        };
      });
      // Remove files that are no longer in the files array
      const updatedBatchFiles = newBatchFiles.filter((bf) => files.includes(bf.file));
      setBatchFiles(updatedBatchFiles);
    } else if (!isBatchMode && files.length === 0) {
      setBatchFiles([]);
    }
  }, [files, isBatchMode]);

  const handleFileSelect = (selectedFile: File) => {
    // If single file mode, replace; if batch mode, add
    if (files.length === 0) {
      setFiles([selectedFile]);
    } else {
      setFiles([...files, selectedFile]);
    }
    clearResults();
    setBatchError(null);
  };

  const handleMultipleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      setFiles((prev) => [...prev, ...newFiles]);
      setBatchError(null);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    const fileToRemove = files[index];
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setBatchFiles((prev) => prev.filter((bf) => bf.file !== fileToRemove));
    if (files.length === 2) {
      // Switching from batch to single mode
      setBatchFiles([]);
    }
    // If removing the file that's currently being processed, stop polling
    if (fileToRemove === singleFile && jobId) {
      setJobId(null);
    }
    clearResults();
    setBatchError(null);
  };

  const handleStartTranscription = async () => {
    // Check authentication before starting transcription
    if (!requireAuth()) {
      return;
    }

    if (files.length === 0) {
      return;
    }

    // Build transcription configuration
    const config: TranscriptionConfig = {
      engine,
      language,
      model,
      processing_mode: processingMode,
      enable_punctuation: enablePunctuation,
      enable_capitalization: enableCapitalization,
    };

    if (isBatchMode) {
      // Batch processing
      await handleStartBatch(config);
    } else {
      // Single file processing
      const submittedJobId = await submitJob(singleFile!, config);
      if (submittedJobId && user?.id) {
        setJobId(submittedJobId);
        // Fetch job data immediately after getting API response
        // This will update the store and trigger HistoryTab to re-render automatically
        await fetchJobs(user.id);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isBatchMode && batchFiles.length === 0) {
      setBatchError('Please select at least one file');
      return;
    }

    if (!isBatchMode && !singleFile) {
      setError('Please select a file');
      return;
    }

    // Check authentication before proceeding
    if (!checkAuthAndTriggerModal(openModal, executeTranscription)) {
      // Auth modal was opened, stop here
      return;
    }

    // User is authenticated, proceed with transcription
    await executeTranscription();
  };

  const handleStartBatch = async (config: TranscriptionConfig) => {
    if (batchFiles.length === 0) {
      setBatchError('Please select at least one file');
      return;
    }

    // Get files that are idle (new files) or pending (retry)
    const filesToProcess = batchFiles.filter((f) => f.status === 'idle' || f.status === 'pending');
    
    if (filesToProcess.length === 0) {
      setBatchError('No files ready for processing');
      return;
    }

    setIsBatchProcessing(true);
    setBatchProgress(0);
    setBatchError(null);

    // Set idle files to pending, then immediately to processing
    setBatchFiles((prev) =>
      prev.map((f) => {
        if (f.status === 'idle' || f.status === 'pending') {
          return { ...f, status: 'processing' as const };
        }
        return f;
      })
    );

    try {
      const jobPromises = filesToProcess.map(async (batchFile) => {
        try {
          const response = await submitTranscriptionJob(batchFile.file, config);
          return {
            file: batchFile.file,
            jobId: response.job_id,
            success: true,
          };
        } catch (err: any) {
          let errorMessage = err.response?.data?.error || err.message || 'Failed to submit job';
          if (err.response?.status === 401 || errorMessage.includes('Authentication failed') || 
              errorMessage.includes('not authenticated') || errorMessage.includes('Please log in')) {
            // Show auth modal for first auth error
            if (!batchError) {
              checkAuthAndTriggerModal(openModal, () => handleStartBatch(config));
            }
            errorMessage = 'Authentication required';
          } else if (errorMessage.includes('Authentication service unavailable')) {
            errorMessage = 'Authentication service unavailable. Please try again later.';
          }
          return {
            file: batchFile.file,
            jobId: undefined,
            success: false,
            error: errorMessage,
          };
        }
      });

      const jobResults = await Promise.all(jobPromises);

      // Immediately fetch jobs after getting API responses
      // Await to ensure the store is updated before continuing
      if (user?.id && jobResults.some(jr => jr.success)) {
        await fetchJobs(user.id);
      }

      setBatchFiles((prev) => {
        return prev.map((batchFile) => {
          const jobResult = jobResults.find((jr) => jr.file === batchFile.file);
          if (jobResult) {
            if (jobResult.success && jobResult.jobId) {
              return {
                ...batchFile,
                status: 'processing' as const,
                jobId: jobResult.jobId,
              };
            } else {
              return {
                ...batchFile,
                status: 'error' as const,
                error: jobResult.error,
              };
            }
          }
          return batchFile;
        });
      });

      const successfulJobs = jobResults.filter((jr) => jr.success && jr.jobId).map((jr) => jr.jobId!);
      if (successfulJobs.length > 0) {
        pollBatchJobStatuses(successfulJobs);
      } else {
        setIsBatchProcessing(false);
      }
    } catch (err: any) {
      let errorMessage = err.response?.data?.error || err.message || 'Batch processing failed';
      if (err.response?.status === 401 || errorMessage.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (errorMessage.includes('Authentication service unavailable')) {
        errorMessage = 'Authentication service unavailable. Please try again later.';
      }
      setBatchError(errorMessage);
      setBatchFiles((prev) =>
        prev.map((f) =>
          f.status === 'processing' ? { ...f, status: 'error' as const, error: errorMessage } : f
        )
      );
      setIsBatchProcessing(false);
    }
  };

  const pollBatchJobStatuses = (jobIds: string[]) => {
    if (jobIds.length === 0) {
      setIsBatchProcessing(false);
      return;
    }

    const pollInterval = setInterval(async () => {
      const { getJobStatus } = await import('../../lib/api/jobsApi');
      
      const statusPromises = jobIds.map(async (jobId) => {
        try {
          const response = await getJobStatus(jobId);
          return { jobId, job: response.job };
        } catch {
          return { jobId, job: null };
        }
      });

      const statuses = await Promise.all(statusPromises);
      
      setBatchFiles((prev) => {
        let allCompleted = true;
        const updated = prev.map((batchFile) => {
          if (!batchFile.jobId) return batchFile;
          
          const status = statuses.find((s) => s.jobId === batchFile.jobId);
          if (!status || !status.job) {
            if (batchFile.status === 'processing') {
              allCompleted = false;
            }
            return batchFile;
          }

          const job = status.job;
          if (job.status === 'completed' && job.result) {
            return {
              ...batchFile,
              status: 'completed' as const,
              result: job.result,
            };
          } else if (job.status === 'error' || job.status === 'cancelled') {
            return {
              ...batchFile,
              status: job.status === 'cancelled' ? ('cancelled' as const) : ('error' as const),
              error: job.error || 'Processing failed',
            };
          } else {
            allCompleted = false;
            return batchFile;
          }
        });

        // Update progress
        const completedCount = updated.filter((f) => f.status === 'completed').length;
        setBatchProgress((completedCount / updated.length) * 100);

        if (allCompleted) {
          setIsBatchProcessing(false);
          clearInterval(pollInterval);
          // Refresh job history when all batch jobs complete
          if (user?.id) {
            setTimeout(() => {
              fetchJobs(user.id);
            }, 500);
          }
        }

        return updated;
      });
    }, 2000);

    setTimeout(() => {
      clearInterval(pollInterval);
      setIsBatchProcessing(false);
    }, 600000);
  };

  const handleCancelFile = async (index: number) => {
    const batchFile = batchFiles[index];
    if (!batchFile.jobId) {
      handleRemoveFile(index);
      return;
    }

    try {
      await cancelJob(batchFile.jobId);
      setBatchFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'cancelled' as const } : f
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to cancel job';
      setBatchError(`Failed to cancel ${batchFile.file.name}: ${errorMessage}`);
    }
  };

  const handleDownload = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename.replace(/\.[^/.]+$/, '')}_transcription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cancelJobStore = transcriptionStore((state) => state.cancelJob);
  
  const handleStop = () => {
    if (jobId) {
      cancelJobStore(jobId);
      setJobId(null);
    }
  };

  const completedCount = batchFiles.filter((f) => f.status === 'completed').length;
  const errorCount = batchFiles.filter((f) => f.status === 'error').length;
  const pendingCount = batchFiles.filter((f) => f.status === 'pending').length;
  const idleCount = batchFiles.filter((f) => f.status === 'idle').length;

  // Helper function to format time in seconds to MM:SS format
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Main Content - File Upload, Settings, Results
  const centerPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
      <Box>
        <Typography 
          variant="h4" 
          sx={{ 
            color: theme.palette.text.primary,
            fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2rem' },
            fontWeight: 700,
            mb: 0.5,
            letterSpacing: '-0.02em',
            lineHeight: 1.2,
          }}
        >
          Transcribe Audio/Video
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: theme.palette.text.secondary,
            fontSize: '0.9375rem',
            lineHeight: 1.6,
          }}
        >
          Convert audio files to accurate text transcriptions
        </Typography>
      </Box>

      {/* Controls */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 1, sm: 1.5 },
          width: '100%'
        }}
      >
        <Button
          variant="contained"
          onClick={handleStartTranscription}
          disabled={files.length === 0 || isProcessing || isBatchProcessing || (isBatchMode && batchFiles.every((f) => f.status !== 'idle' && f.status !== 'pending'))}
          size={isMobile ? 'medium' : 'large'}
          sx={{
            backgroundColor: theme.palette.primary.main,
            color: '#ffffff',
            '&:hover': { backgroundColor: theme.palette.primary.dark },
            '&:disabled': { backgroundColor: theme.palette.action.disabledBackground, color: theme.palette.action.disabled },
            width: { xs: '100%', sm: 'auto' },
            flex: { xs: '1', sm: '0 1 auto' },
            minWidth: { xs: '100%', sm: '180px', md: '200px' },
            fontSize: { xs: '0.875rem', sm: '1rem' },
            fontWeight: 500,
            borderRadius: '0.5rem',
            textTransform: 'none',
            padding: { xs: '0.625rem 1rem', sm: '0.75rem 1.5rem' },
          }}
        >
          {isBatchMode 
            ? (isMobile ? `Start Batch (${idleCount + pendingCount})` : `Start Batch Processing (${idleCount + pendingCount} files)`)
            : (isMobile ? 'Start Transcription' : 'Start Audio/Video Transcription')
          }
        </Button>
        {!isBatchMode && (
          <Button
            variant="outlined"
            onClick={handleStop}
            disabled={!isProcessing}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6' },
              '&:disabled': { borderColor: theme.palette.divider, color: theme.palette.action.disabled },
              width: { xs: '100%', sm: 'auto' },
              flex: { xs: '1', sm: '0 1 auto' },
              minWidth: { xs: '100%', sm: '120px' },
              fontWeight: 500,
              borderRadius: '0.5rem',
              textTransform: 'none',
              padding: { xs: '0.625rem 1rem', sm: '0.75rem 1.5rem' },
            }}
          >
            Stop
          </Button>
        )}
        {isBatchMode && files.length > 0 && (
          <Button
            variant="outlined"
            onClick={() => {
              setFiles([]);
              setBatchFiles([]);
              setBatchError(null);
            }}
            disabled={isBatchProcessing}
            size={isMobile ? 'medium' : 'large'}
            sx={{
              borderColor: theme.palette.divider,
              color: theme.palette.text.primary,
              '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6' },
              '&:disabled': { borderColor: theme.palette.divider, color: theme.palette.action.disabled },
              width: { xs: '100%', sm: 'auto' },
              flex: { xs: '1', sm: '0 1 auto' },
              minWidth: { xs: '100%', sm: '120px' },
              fontWeight: 500,
              borderRadius: '0.5rem',
              textTransform: 'none',
              padding: { xs: '0.625rem 1rem', sm: '0.75rem 1.5rem' },
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* File Upload Section */}
      <SectionCard
        title={isBatchMode ? `Audio/Video Files (${files.length})` : 'Audio/Video File'}
        padding="1.5rem"
      >
        {isBatchMode && (
            <Box 
              className="transcribe-batch-chips"
              sx={{ 
                display: 'flex', 
                flexWrap: 'wrap',
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 0.5, sm: 1 },
                width: { xs: '100%', sm: 'auto' }
              }}
            >
              {completedCount > 0 && (
                <StatusTag status="success" size="small">
                  {completedCount} Completed
                </StatusTag>
              )}
              {errorCount > 0 && (
                <StatusTag status="error" size="small">
                  {errorCount} Errors
                </StatusTag>
              )}
              {pendingCount > 0 && (
                <StatusTag status="awaiting" size="small">
                  {pendingCount} Pending
                </StatusTag>
              )}
              {idleCount > 0 && (
                <StatusTag status="completed" size="small">
                  {idleCount} Ready
                </StatusTag>
              )}
            </Box>
          )}

        {/* Hidden file input - always rendered for "Add More Files" button */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,video/*"
          onChange={handleMultipleFileSelect}
          style={{ display: 'none' }}
        />

        {!isBatchMode ? (
          // Single file upload
          <>
            <FileUploader
              onFileSelect={handleFileSelect}
              currentFile={singleFile}
              disabled={isProcessing || isBatchProcessing}
            />
            {singleFile && (
              <Box sx={{ mt: 2 }}>
                <Box 
                  className="transcribe-file-info"
                  sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between', 
                    alignItems: { xs: 'flex-start', sm: 'center' },
                    gap: { xs: 1, sm: 2 },
                    mb: isProcessing ? { xs: 1.5, sm: 2 } : 0 
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      wordBreak: 'break-word',
                      overflowWrap: 'break-word'
                    }}
                  >
                    {singleFile.name} • {(singleFile.size / (1024 * 1024)).toFixed(2)} MB • {singleFile.name.split('.').pop()?.toUpperCase()}
                  </Typography>
                  <Box 
                    className="transcribe-file-actions"
                    sx={{ 
                      display: 'flex', 
                      flexDirection: { xs: 'column', sm: 'row' },
                      gap: { xs: 0.5, sm: 1 },
                      width: { xs: '100%', sm: 'auto' }
                    }}
                  >
                    <IconButton
                      onClick={() => handleRemoveFile(0)}
                      disabled={isProcessing || isBatchProcessing}
                      sx={{ 
                        color: theme.palette.error.main,
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
                        '&:disabled': { color: theme.palette.action.disabled },
                      }}
                      size="small"
                      title="Remove file"
                    >
                      <DeleteIcon />
                    </IconButton>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.click();
                        }
                      }}
                      disabled={isProcessing || isBatchProcessing}
                      sx={{ 
                        color: theme.palette.primary.main,
                        '&:disabled': { color: theme.palette.action.disabled },
                      }}
                    >
                      Add More Files
                    </Button>
                  </Box>
                </Box>
                
                {/* Progress Details in File Upload Area */}
                {isProcessing && progressDetails && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: theme.palette.background.default, 
                    borderRadius: 1, 
                    border: `1px solid ${theme.palette.divider}` 
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                        Processing Progress
                      </Typography>
                      {progressDetails.percentage !== undefined && (
                        <Typography variant="body2" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
                          {progressDetails.percentage}%
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <ProgressBar value={progress} />
                    </Box>
                    <Box 
                      className="transcribe-progress-details-grid"
                      sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: { 
                          xs: '1fr', 
                          sm: 'repeat(2, 1fr)', 
                          md: 'repeat(3, 1fr)' 
                        }, 
                        gap: { xs: 1, sm: 1.5 } 
                      }}
                    >
                      {progressDetails.audio_time_processed !== undefined && progressDetails.audio_duration !== undefined && (
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                            Audio Processed
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                            {formatTime(progressDetails.audio_time_processed)} / {formatTime(progressDetails.audio_duration)}
                          </Typography>
                        </Box>
                      )}
                      {progressDetails.audio_time_remaining !== undefined && (
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                            Time Remaining
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                            {formatTime(progressDetails.audio_time_remaining)}
                          </Typography>
                        </Box>
                      )}
                      {progressDetails.frames_progress && (
                        <Box>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 0.5 }}>
                            Frames Progress
                          </Typography>
                          <Typography variant="body2" sx={{ color: theme.palette.text.primary }}>
                            {progressDetails.frames_progress}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>
            )}
          </>
        ) : (
          // Batch file list
          <>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.click();
                }
              }}
              disabled={isProcessing || isBatchProcessing}
              sx={{
                mb: 2,
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6' },
                '&:disabled': { borderColor: theme.palette.divider, color: theme.palette.action.disabled },
              }}
            >
              Add More Files
            </Button>
            <List>
              {files.map((file, index) => {
                const batchFile = batchFiles.find((bf) => bf.file === file);
                const fileStatus = batchFile?.status || 'idle';
                return (
                  <ListItem
                    key={index}
                    className="transcribe-list-item"
                    sx={{
                      backgroundColor: theme.palette.background.paper,
                      border: `1px solid ${theme.palette.divider}`,
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: { xs: 'column', sm: 'row' },
                      alignItems: { xs: 'stretch', sm: 'center' },
                      gap: { xs: 1, sm: 2 },
                      padding: { xs: '0.75rem', sm: '1rem' },
                    }}
                  >
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        flexDirection: { xs: 'column', sm: 'row' },
                        justifyContent: 'space-between', 
                        alignItems: { xs: 'flex-start', sm: 'center' },
                        width: '100%',
                        gap: { xs: 1, sm: 2 }
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: theme.palette.text.primary }}>{file.name}</Typography>
                            {batchFile && (
                              <StatusTag
                                status={
                                  fileStatus === 'completed' ? 'success' :
                                  fileStatus === 'error' ? 'error' :
                                  fileStatus === 'processing' ? 'warning' :
                                  fileStatus === 'cancelled' ? 'completed' :
                                  fileStatus === 'idle' ? 'awaiting' :
                                  'awaiting'
                                }
                                size="small"
                              >
                                {fileStatus === 'cancelled' ? 'cancelled' : fileStatus === 'idle' ? 'ready' : fileStatus}
                              </StatusTag>
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ color: theme.palette.text.secondary }}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                            {batchFile?.error && ` • Error: ${batchFile.error}`}
                            {batchFile?.jobId && ` • Job: ${batchFile.jobId.substring(0, 8)}...`}
                          </Typography>
                        }
                      />
                      <Box 
                        className="transcribe-file-actions"
                        sx={{ 
                          display: 'flex', 
                          flexDirection: { xs: 'row', sm: 'row' },
                          gap: { xs: 0.5, sm: 0.5 },
                          flexWrap: 'wrap'
                        }}
                      >
                        {batchFile?.status === 'completed' && batchFile.result && (
                          <IconButton
                            onClick={() => handleDownload(batchFile.result!.text, file.name)}
                            sx={{ color: theme.palette.primary.main }}
                            size="small"
                            title="Download transcription"
                          >
                            <DownloadIcon />
                          </IconButton>
                        )}
                        {batchFile?.status === 'processing' && (
                          <IconButton
                            onClick={() => handleCancelFile(batchFiles.indexOf(batchFile))}
                            sx={{ color: '#ff9800' }}
                            size="small"
                            title="Cancel processing"
                          >
                            <CancelIcon />
                          </IconButton>
                        )}
                        <IconButton
                          onClick={() => handleRemoveFile(index)}
                          sx={{ color: '#f44336' }}
                          size="small"
                          title="Remove file"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                    {batchFile?.status === 'completed' && batchFile.result && (
                      <Box sx={{ mt: 2, width: '100%' }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={isMobile ? 2 : 3}
                          value={batchFile.result.text}
                          InputProps={{ readOnly: true }}
                          className="transcribe-textfield"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#000000',
                              backgroundColor: '#ffffff',
                              '& fieldset': { borderColor: theme.palette.divider },
                              fontSize: { xs: '0.875rem', sm: '1rem' },
                            },
                          }}
                        />
                      </Box>
                    )}
                  </ListItem>
                );
              })}
            </List>
          </>
        )}
      </SectionCard>

      {/* Transcription Settings */}
      <SectionCard
        title="Transcription Settings"
        padding="1.5rem"
      >
        <Box 
          className="transcribe-settings-grid"
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, 
            gap: { xs: 1.5, sm: 2 }, 
            mb: 2 
          }}
        >
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#666666' }}>Language</InputLabel>
            <Select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing || isBatchProcessing}
              renderValue={(value) => typeof value === 'string' ? getLanguageDisplayName(value) : value}
                              sx={{ 
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                '& .MuiSelect-icon': { color: theme.palette.text.primary },
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.primary,
                  },
                },
              }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang} sx={{ color: theme.palette.text.primary, '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6' } }}>
                  {getLanguageDisplayName(lang)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {availableModels.length > 0 && (
            <FormControl fullWidth>
              <InputLabel sx={{ color: theme.palette.text.secondary }}>Model</InputLabel>
              <Select 
                value={model || ''} 
                onChange={(e) => setModel(e.target.value)} 
                disabled={isProcessing || isBatchProcessing || availableModels.length === 0}
                renderValue={(value) => typeof value === 'string' && value ? value.charAt(0).toUpperCase() + value.slice(1) : value}
                MenuProps={{
                  PaperProps: {
                    style: {
                      zIndex: 1300,
                      backgroundColor: theme.palette.background.paper,
                      color: theme.palette.text.primary,
                    },
                  },
                }}
                sx={{ 
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.background.paper,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.primary.main },
                  '& .MuiSelect-icon': { color: theme.palette.text.primary },
                }}
              >
                {availableModels.map((m) => (
                  <MenuItem 
                    key={m} 
                    value={m}
                    sx={{
                      color: theme.palette.text.primary,
                      backgroundColor: theme.palette.background.paper,
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                      },
                    }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={enablePunctuation}
                onChange={(e) => setEnablePunctuation(e.target.checked)}
                disabled={isProcessing || isBatchProcessing}
                sx={{ color: theme.palette.primary.main }}
              />
            }
            label={
              <Typography 
                className="transcribe-form-label"
                sx={{ 
                  color: theme.palette.text.primary,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.6,
                }}
              >
                Enable punctuation
              </Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={enableCapitalization}
                onChange={(e) => setEnableCapitalization(e.target.checked)}
                disabled={isProcessing || isBatchProcessing}
                sx={{ color: theme.palette.primary.main }}
              />
            }
            label={
              <Typography 
                className="transcribe-form-label"
                sx={{ 
                  color: theme.palette.text.primary,
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  lineHeight: 1.6,
                }}
              >
                Enable capitalization
              </Typography>
            }
          />
        </Box>

        {/* Processing Mode - Only show for single file */}
        {!isBatchMode && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ color: theme.palette.text.primary, mb: 1 }}>
              Processing Mode
            </Typography>
            <RadioGroup
              value={processingMode}
              onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
            >
              <FormControlLabel 
                value="batch" 
                control={<Radio sx={{ color: theme.palette.primary.main }} />} 
                label={
                  <Typography 
                    className="transcribe-form-label"
                    sx={{ 
                      color: theme.palette.text.primary,
                      fontSize: { xs: '0.875rem', sm: '1rem' }
                    }}
                  >
                    {isMobile ? 'Batch Processing' : 'Batch Processing (Process entire file at once)'}
                  </Typography>
                } 
              />
            </RadioGroup>
          </Box>
        )}
      </SectionCard>

      {/* Single File Progress - Status Message Only (detailed progress shown in file upload area) */}
      {isProcessing && !isBatchMode && !progressDetails && (
        <SectionCard padding="1.5rem">
          <StatusLabel
            status={isProcessing ? 'processing' : 'ready'}
            message={message || 'Processing...'}
          />
          <Box sx={{ mt: 2 }}>
            <ProgressBar value={progress} />
          </Box>
        </SectionCard>
      )}

      {/* Batch Progress */}
      {isBatchProcessing && isBatchMode && (
        <SectionCard padding="1.5rem">
          <Typography 
            variant="body2" 
            sx={{ 
              color: theme.palette.text.secondary, 
              mb: 1,
              fontSize: { xs: '0.875rem', sm: '1rem' }
            }}
          >
            Processing batch... {completedCount} of {batchFiles.length} completed
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={batchProgress}
            sx={{
              backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
              '& .MuiLinearProgress-bar': {
                backgroundColor: theme.palette.primary.main,
              },
            }}
          />
        </SectionCard>
      )}

      {/* Errors */}
      {(error || batchError) && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: theme.palette.background.paper, color: theme.palette.error.main, border: `1px solid ${theme.palette.error.main}` }}>
          {error || batchError}
        </Alert>
      )}

      {/* Single File Results */}
      {(results || (status === 'completed' && (job?.result || result))) && !isBatchMode && (
        <SectionCard
          title="Transcription Results"
          padding="1.5rem"
        >
          <TextField
            fullWidth
            multiline
            rows={isMobile ? 6 : isTablet ? 8 : 10}
            value={results?.text || job?.result?.text || result?.text || ''}
            InputProps={{ readOnly: true }}
            className="transcribe-textfield"
            sx={{
              mb: { xs: 1.5, sm: 2 },
              '& .MuiOutlinedInput-root': {
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
                fontSize: { xs: '0.875rem', sm: '1rem' },
              },
            }}
          />
          <Box 
            className="transcribe-button-group"
            sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', sm: 'row' },
              gap: { xs: 1, sm: 2 },
              width: '100%'
            }}
          >
            <Button 
              variant="contained" 
              onClick={async () => {
                const text = results?.text || job?.result?.text || result?.text || '';
                try {
                  await navigator.clipboard.writeText(text);
                  setCopySuccess(true);
                  setTimeout(() => setCopySuccess(false), 3000);
                } catch (err) {
                  console.error('Failed to copy text:', err);
                }
              }}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#121212',
                '&:hover': { backgroundColor: '#00b0e6' },
              }}
            >
              Copy to Clipboard
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                clearResults();
                setFiles([]);
                setJobId(null);
                setBatchFiles([]);
                setBatchError(null);
                setBatchProgress(0);
                setIsBatchProcessing(false);
              }}
              sx={{
                borderColor: theme.palette.divider,
                color: theme.palette.text.primary,
                '&:hover': { borderColor: theme.palette.primary.main, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6' },
              }}
            >
              Clear
            </Button>
          </Box>
          <Snackbar
            open={copySuccess}
            autoHideDuration={3000}
            onClose={() => setCopySuccess(false)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          >
            <Alert 
              onClose={() => setCopySuccess(false)} 
              severity="success"
              sx={{ 
                backgroundColor: '#4caf50',
                color: '#fff',
                '& .MuiAlert-icon': { color: '#fff' },
              }}
            >
              Copied to clipboard!
            </Alert>
          </Snackbar>
        </SectionCard>
      )}
    </Box>
  );

  return (
    <Box 
      className="transcribe-tab-container"
      sx={{
        width: '100%',
        maxWidth: '100%',
        padding: { xs: '1rem', sm: '1.5rem', md: '2rem' },
      }}
    >
      {/* Single column layout - Dashboard already provides left/right panels */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* Main Content - File Upload, Settings, Results */}
        {centerPanel}
      </Box>
    </Box>
  );
}

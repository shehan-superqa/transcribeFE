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
import { transcriptionStore } from '../../stores/transcriptionStore';
import { jobStore } from '../../stores/jobStore';
import { useAuth } from '../../lib/auth';
import { useRequireAuth } from '../../hooks/useRequireAuth';
import { useJobPolling } from '../../hooks/useJobPolling';
import { getAvailableModels, submitTranscriptionJob } from '../../lib/api/transcriptionApi';
import { cancelJob } from '../../lib/api/jobsApi';
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
          if (err.response?.status === 401 || errorMessage.includes('Authentication failed')) {
            errorMessage = 'Authentication failed. Please log in again.';
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

  return (
    <Box>
      <div className="tool-sticky-title">
        <h1>Audio to Text</h1>
      </div>
      <HowToUse
        title=""
        subtitle="Convert audio files to accurate text transcriptions"
        instructions="Upload audio files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link or record audio directly. Select your preferred language and model, then click 'Transcribe' to start. The transcription will appear in your history once completed."
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#e0e0e0' }}>
          Transcribe Audio/Video
        </Typography>
        {isBatchMode && (
          <Chip 
            label={`Batch Mode: ${files.length} files`}
            sx={{
              backgroundColor: '#00c6ff',
              color: '#121212',
              fontWeight: 600,
            }}
          />
        )}
        {!isBatchMode && files.length === 1 && (
          <Chip 
            label="Single File Mode"
            sx={{
              backgroundColor: '#4caf50',
              color: '#fff',
              fontWeight: 600,
            }}
          />
        )}
      </Box>

      {/* Controls - Moved to Top */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleStartTranscription}
          disabled={files.length === 0 || isProcessing || isBatchProcessing || (isBatchMode && batchFiles.every((f) => f.status !== 'idle' && f.status !== 'pending'))}
          size="large"
          sx={{
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          {isBatchMode 
            ? `Start Batch Processing (${idleCount + pendingCount} files)`
            : 'Start Audio/Video Transcription'
          }
        </Button>
        {!isBatchMode && (
          <Button
            variant="outlined"
            onClick={handleStop}
            disabled={!isProcessing}
            size="large"
            sx={{
              borderColor: '#333333',
              color: '#e0e0e0',
              '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
              '&:disabled': { borderColor: '#333333', color: '#666666' },
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
            size="large"
            sx={{
              borderColor: '#333333',
              color: '#e0e0e0',
              '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
              '&:disabled': { borderColor: '#333333', color: '#666666' },
            }}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* File Upload Section */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#e0e0e0' }}>
            {isBatchMode ? `Audio/Video Files (${files.length})` : 'Audio/Video File'}
          </Typography>
          {isBatchMode && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip label={`${completedCount} Completed`} size="small" sx={{ backgroundColor: '#4caf50', color: '#fff' }} />
              {errorCount > 0 && <Chip label={`${errorCount} Errors`} size="small" sx={{ backgroundColor: '#f44336', color: '#fff' }} />}
              {pendingCount > 0 && <Chip label={`${pendingCount} Pending`} size="small" sx={{ backgroundColor: '#666666', color: '#fff' }} />}
              {idleCount > 0 && <Chip label={`${idleCount} Ready`} size="small" sx={{ backgroundColor: '#333333', color: '#a0a0a0' }} />}
            </Box>
          )}
        </Box>

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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: isProcessing ? 2 : 0 }}>
                  <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                    {singleFile.name} • {(singleFile.size / (1024 * 1024)).toFixed(2)} MB • {singleFile.name.split('.').pop()?.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      onClick={() => handleRemoveFile(0)}
                      disabled={isProcessing || isBatchProcessing}
                      sx={{ 
                        color: '#f44336',
                        '&:hover': { backgroundColor: 'rgba(244, 67, 54, 0.1)' },
                        '&:disabled': { color: '#666666' },
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
                        color: '#00c6ff',
                        '&:disabled': { color: '#666666' },
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
                    backgroundColor: '#121212', 
                    borderRadius: 1, 
                    border: '1px solid #333333' 
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ color: '#e0e0e0', fontWeight: 600 }}>
                        Processing Progress
                      </Typography>
                      {progressDetails.percentage !== undefined && (
                        <Typography variant="body2" sx={{ color: '#00c6ff', fontWeight: 600 }}>
                          {progressDetails.percentage}%
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <ProgressBar value={progress} />
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 1.5 }}>
                      {progressDetails.audio_time_processed !== undefined && progressDetails.audio_duration !== undefined && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 0.5 }}>
                            Audio Processed
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                            {formatTime(progressDetails.audio_time_processed)} / {formatTime(progressDetails.audio_duration)}
                          </Typography>
                        </Box>
                      )}
                      {progressDetails.audio_time_remaining !== undefined && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 0.5 }}>
                            Time Remaining
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
                            {formatTime(progressDetails.audio_time_remaining)}
                          </Typography>
                        </Box>
                      )}
                      {progressDetails.frames_progress && (
                        <Box>
                          <Typography variant="caption" sx={{ color: '#666666', display: 'block', mb: 0.5 }}>
                            Frames Progress
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#e0e0e0' }}>
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
                borderColor: '#333333',
                color: '#e0e0e0',
                '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
                '&:disabled': { borderColor: '#333333', color: '#666666' },
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
                    sx={{
                      backgroundColor: '#121212',
                      border: '1px solid #333333',
                      borderRadius: 1,
                      mb: 1,
                      flexDirection: 'column',
                      alignItems: 'stretch',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ color: '#e0e0e0' }}>{file.name}</Typography>
                            {batchFile && (
                              <Chip
                                label={fileStatus === 'cancelled' ? 'cancelled' : fileStatus === 'idle' ? 'ready' : fileStatus}
                                size="small"
                                sx={{
                                  backgroundColor:
                                    fileStatus === 'completed' ? '#4caf50' :
                                    fileStatus === 'error' ? '#f44336' :
                                    fileStatus === 'processing' ? '#ff9800' :
                                    fileStatus === 'cancelled' ? '#9e9e9e' :
                                    fileStatus === 'idle' ? '#333333' :
                                    '#666666',
                                  color: fileStatus === 'idle' ? '#a0a0a0' : '#fff',
                                  fontSize: '0.7rem',
                                }}
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <Typography sx={{ color: '#a0a0a0' }}>
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                            {batchFile?.error && ` • Error: ${batchFile.error}`}
                            {batchFile?.jobId && ` • Job: ${batchFile.jobId.substring(0, 8)}...`}
                          </Typography>
                        }
                      />
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        {batchFile?.status === 'completed' && batchFile.result && (
                          <IconButton
                            onClick={() => handleDownload(batchFile.result!.text, file.name)}
                            sx={{ color: '#00c6ff' }}
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
                          rows={3}
                          value={batchFile.result.text}
                          InputProps={{ readOnly: true }}
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              color: '#e0e0e0',
                              backgroundColor: '#0a0a0a',
                              '& fieldset': { borderColor: '#333333' },
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
      </Paper>

      {/* Transcription Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Transcription Settings
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Language</InputLabel>
            <Select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing || isBatchProcessing}
              renderValue={(value) => typeof value === 'string' ? getLanguageDisplayName(value) : value}
              sx={{ 
                color: '#e0e0e0',
                backgroundColor: '#121212',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
                '& .MuiSelect-icon': { color: '#e0e0e0' },
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: '#1e1e1e',
                    color: '#e0e0e0',
                  },
                },
              }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang} sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>
                  {getLanguageDisplayName(lang)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {availableModels.length > 0 && (
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#a0a0a0' }}>Model</InputLabel>
              <Select 
                value={model || ''} 
                onChange={(e) => setModel(e.target.value)} 
                disabled={isProcessing || isBatchProcessing || availableModels.length === 0}
                renderValue={(value) => typeof value === 'string' && value ? value.charAt(0).toUpperCase() + value.slice(1) : value}
                MenuProps={{
                  PaperProps: {
                    style: {
                      zIndex: 1300,
                      backgroundColor: '#1e1e1e',
                      color: '#e0e0e0',
                    },
                  },
                }}
                sx={{ 
                  color: '#e0e0e0',
                  backgroundColor: '#121212',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
                  '& .MuiSelect-icon': { color: '#e0e0e0' },
                }}
              >
                {availableModels.map((m) => (
                  <MenuItem 
                    key={m} 
                    value={m}
                    sx={{
                      color: '#e0e0e0',
                      backgroundColor: '#1e1e1e',
                      '&:hover': {
                        backgroundColor: '#2a2a2a',
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
                sx={{ color: '#00c6ff' }}
              />
            }
            label={<Typography sx={{ color: '#e0e0e0' }}>Enable punctuation</Typography>}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={enableCapitalization}
                onChange={(e) => setEnableCapitalization(e.target.checked)}
                disabled={isProcessing || isBatchProcessing}
                sx={{ color: '#00c6ff' }}
              />
            }
            label={<Typography sx={{ color: '#e0e0e0' }}>Enable capitalization</Typography>}
          />
        </Box>

        {/* Processing Mode - Only show for single file */}
        {!isBatchMode && (
          <Box>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#e0e0e0', mb: 1 }}>
              Processing Mode
            </Typography>
            <RadioGroup
              value={processingMode}
              onChange={(e) => setProcessingMode(e.target.value as ProcessingMode)}
            >
              <FormControlLabel 
                value="batch" 
                control={<Radio sx={{ color: '#00c6ff' }} />} 
                label={<Typography sx={{ color: '#e0e0e0' }}>Batch Processing (Process entire file at once)</Typography>} 
              />
              <FormControlLabel 
                value="streaming" 
                control={<Radio sx={{ color: '#00c6ff' }} />} 
                label={<Typography sx={{ color: '#e0e0e0' }}>Parallel Streaming (Process all 5s chunks simultaneously)</Typography>} 
              />
              <FormControlLabel 
                value="realtime" 
                control={<Radio sx={{ color: '#00c6ff' }} />} 
                label={<Typography sx={{ color: '#e0e0e0' }}>Real-time Streaming (Process 5s chunks with 5s delays)</Typography>} 
              />
              <FormControlLabel 
                value="advanced" 
                control={<Radio sx={{ color: '#00c6ff' }} />} 
                label={<Typography sx={{ color: '#e0e0e0' }}>Advanced Streaming (Research-grade with Local Agreement Policy)</Typography>} 
              />
              <FormControlLabel 
                value="vad" 
                control={<Radio sx={{ color: '#00c6ff' }} />} 
                label={<Typography sx={{ color: '#e0e0e0' }}>VAD-Enhanced Streaming (With Voice Activity Detection)</Typography>} 
              />
            </RadioGroup>
          </Box>
        )}
      </Paper>

      {/* Single File Progress - Status Message Only (detailed progress shown in file upload area) */}
      {isProcessing && !isBatchMode && !progressDetails && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
          <StatusLabel
            status={isProcessing ? 'processing' : 'ready'}
            message={message || 'Processing...'}
          />
          <Box sx={{ mt: 2 }}>
            <ProgressBar value={progress} />
          </Box>
        </Paper>
      )}

      {/* Batch Progress */}
      {isBatchProcessing && isBatchMode && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
          <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
            Processing batch... {completedCount} of {batchFiles.length} completed
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={batchProgress}
            sx={{
              backgroundColor: '#333333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00c6ff',
              },
            }}
          />
        </Paper>
      )}

      {/* Errors */}
      {(error || batchError) && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#1e1e1e', color: '#f44336' }}>
          {error || batchError}
        </Alert>
      )}

      {/* Single File Results */}
      {(results || (status === 'completed' && (job?.result || result))) && !isBatchMode && (
        <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
            Transcription Results
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={results?.text || job?.result?.text || result?.text || ''}
            InputProps={{ readOnly: true }}
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                backgroundColor: '#121212',
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#00c6ff' },
              },
            }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
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
                backgroundColor: '#00c6ff',
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
                borderColor: '#333333',
                color: '#e0e0e0',
                '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
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
        </Paper>
      )}
    </Box>
  );
}

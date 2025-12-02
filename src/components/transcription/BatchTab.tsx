/**
 * Batch processing tab component
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
  IconButton,
  Chip,
  TextField,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import CancelIcon from '@mui/icons-material/Cancel';
import { batchTranscription, getAvailableModels, submitTranscriptionJob } from '../../lib/api/transcriptionApi';
import { cancelJob } from '../../lib/api/jobsApi';
import type { TranscriptionConfig } from '../../types/api';
import type { TranscriptionResult } from '../../types/api';

interface BatchFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error' | 'cancelled';
  result?: TranscriptionResult;
  error?: string;
  jobId?: string;
}

export default function BatchTab() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [engine, setEngine] = useState('replicate');
  const [language, setLanguage] = useState('en');
  const [model, setModel] = useState('base');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load available models and languages
  useEffect(() => {
    getAvailableModels()
      .then((data) => {
        if (data.success) {
          setAvailableModels(data.models || []);
          setAvailableLanguages(data.languages || []);
        }
      })
      .catch((error) => {
        console.warn('Failed to load available models:', error);
        setAvailableModels(['base', 'small', 'medium', 'large']);
        setAvailableLanguages(['en']);
      });
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const newFiles: BatchFile[] = Array.from(selectedFiles).map((file) => ({
        file,
        status: 'pending' as const,
      }));
      setFiles((prev) => [...prev, ...newFiles]);
      setError(null);
    }
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStartBatch = async () => {
    if (files.length === 0) {
      setError('Please select at least one file');
      return;
    }

    setIsProcessing(true);
    setProgress(0);
    setError(null);

    const config: TranscriptionConfig = {
      engine,
      language,
      model,
    };

    // Submit files individually to track job IDs for cancellation
    const pendingFiles = files.filter((f) => f.status === 'pending');
    
    // Update pending files to processing status
    setFiles((prev) =>
      prev.map((f) => (f.status === 'pending' ? { ...f, status: 'processing' as const } : f))
    );

    try {
      // Submit each file individually to get job IDs
      const jobPromises = pendingFiles.map(async (batchFile) => {
        try {
          const response = await submitTranscriptionJob(batchFile.file, config);
          return {
            index: files.indexOf(batchFile),
            jobId: response.job_id,
            success: true,
          };
        } catch (err: any) {
          let errorMessage = err.response?.data?.error || err.message || 'Failed to submit job';
          
          // Handle authentication errors more gracefully
          if (err.response?.status === 401 || errorMessage.includes('Authentication failed')) {
            errorMessage = 'Authentication failed. Please log in again.';
          } else if (errorMessage.includes('Authentication service unavailable')) {
            errorMessage = 'Authentication service unavailable. Please try again later.';
          }
          
          return {
            index: files.indexOf(batchFile),
            jobId: undefined,
            success: false,
            error: errorMessage,
          };
        }
      });

      const jobResults = await Promise.all(jobPromises);

      // Update files with job IDs
      setFiles((prev) => {
        return prev.map((batchFile, index) => {
          const jobResult = jobResults.find((jr) => jr.index === index);
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

      // Poll for job status updates
      pollJobStatuses(jobResults.filter((jr) => jr.success && jr.jobId).map((jr) => jr.jobId!));
    } catch (err: any) {
      let errorMessage = err.response?.data?.error || err.message || 'Batch processing failed';
      
      // Handle authentication errors more gracefully
      if (err.response?.status === 401 || errorMessage.includes('Authentication failed')) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (errorMessage.includes('Authentication service unavailable')) {
        errorMessage = 'Authentication service unavailable. Please try again later.';
      }
      
      setError(errorMessage);
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'processing' ? { ...f, status: 'error' as const, error: errorMessage } : f
        )
      );
      setIsProcessing(false);
    }
  };

  const pollJobStatuses = (jobIds: string[]) => {
    if (jobIds.length === 0) {
      setIsProcessing(false);
      return;
    }

    // Poll each job individually
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
      
      setFiles((prev) => {
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

        if (allCompleted) {
          setIsProcessing(false);
          clearInterval(pollInterval);
        }

        return updated;
      });
    }, 2000); // Poll every 2 seconds

    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      setIsProcessing(false);
    }, 600000);
  };

  const handleCancelFile = async (index: number) => {
    const batchFile = files[index];
    if (!batchFile.jobId) {
      // If no job ID, just remove from list
      handleRemoveFile(index);
      return;
    }

    try {
      await cancelJob(batchFile.jobId);
      setFiles((prev) =>
        prev.map((f, i) =>
          i === index ? { ...f, status: 'cancelled' as const } : f
        )
      );
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to cancel job';
      setError(`Failed to cancel ${batchFile.file.name}: ${errorMessage}`);
    }
  };

  const handleClear = () => {
    setFiles([]);
    setProgress(0);
    setError(null);
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

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const errorCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Batch Processing (Audio & Video)
      </Typography>

      {/* Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Transcription Settings
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Engine</InputLabel>
            <Select 
              value={engine} 
              onChange={(e) => setEngine(e.target.value)}
              disabled={isProcessing}
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              <MenuItem value="whisper">Whisper</MenuItem>
              <MenuItem value="google">Google</MenuItem>
              <MenuItem value="openai">OpenAI</MenuItem>
              <MenuItem value="replicate">Replicate</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Language</InputLabel>
            <Select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isProcessing}
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              {availableLanguages.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {lang}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Model</InputLabel>
            <Select 
              value={model} 
              onChange={(e) => setModel(e.target.value)} 
              disabled={isProcessing || engine !== 'whisper'}
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
                  {m}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* File Selection */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#e0e0e0' }}>
            Selected Files ({files.length})
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {files.length > 0 && (
              <>
                <Chip label={`${completedCount} Completed`} color="success" size="small" sx={{ backgroundColor: '#4caf50', color: '#fff' }} />
                {errorCount > 0 && <Chip label={`${errorCount} Errors`} color="error" size="small" sx={{ backgroundColor: '#f44336', color: '#fff' }} />}
                {pendingCount > 0 && <Chip label={`${pendingCount} Pending`} size="small" sx={{ backgroundColor: '#666666', color: '#fff' }} />}
              </>
            )}
          </Box>
        </Box>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        <Button 
          variant="contained" 
          startIcon={<FolderIcon />}
          onClick={() => fileInputRef.current?.click()}
          sx={{ 
            mb: 2,
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          Select Audio/Video Files
        </Button>
        {files.length > 0 && (
          <List>
            {files.map((batchFile, index) => (
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
                        <Typography sx={{ color: '#e0e0e0' }}>{batchFile.file.name}</Typography>
                        <Chip 
                          label={batchFile.status === 'cancelled' ? 'cancelled' : batchFile.status} 
                          size="small"
                          sx={{
                            backgroundColor: 
                              batchFile.status === 'completed' ? '#4caf50' :
                              batchFile.status === 'error' ? '#f44336' :
                              batchFile.status === 'processing' ? '#ff9800' :
                              batchFile.status === 'cancelled' ? '#9e9e9e' :
                              '#666666',
                            color: '#fff',
                            fontSize: '0.7rem',
                          }}
                        />
                      </Box>
                    }
                    secondary={
                      <Typography sx={{ color: '#a0a0a0' }}>
                        {`${(batchFile.file.size / (1024 * 1024)).toFixed(2)} MB`}
                        {batchFile.status === 'processing' && ' • Processing...'}
                        {batchFile.status === 'cancelled' && ' • Cancelled'}
                        {batchFile.error && ` • Error: ${batchFile.error}`}
                        {batchFile.jobId && ` • Job: ${batchFile.jobId.substring(0, 8)}...`}
                      </Typography>
                    }
                  />
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    {batchFile.status === 'completed' && batchFile.result && (
                      <IconButton
                        onClick={() => handleDownload(batchFile.result!.text, batchFile.file.name)}
                        sx={{ color: '#00c6ff' }}
                        size="small"
                        title="Download transcription"
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                    {batchFile.status === 'processing' && (
                      <IconButton
                        onClick={() => handleCancelFile(index)}
                        sx={{ color: '#ff9800' }}
                        size="small"
                        title="Cancel processing"
                      >
                        <CancelIcon />
                      </IconButton>
                    )}
                    {(batchFile.status === 'pending' || batchFile.status === 'error' || batchFile.status === 'cancelled' || batchFile.status === 'completed') && (
                      <IconButton
                        onClick={() => handleRemoveFile(index)}
                        sx={{ color: '#f44336' }}
                        size="small"
                        title="Remove from list"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                  </Box>
                </Box>
                {batchFile.status === 'completed' && batchFile.result && (
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
            ))}
          </List>
        )}
      </Paper>

      {/* Progress */}
      {isProcessing && (
        <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
          <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
            Processing batch... {completedCount} of {files.length} completed
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progress}
            sx={{
              backgroundColor: '#333333',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#00c6ff',
              },
            }}
          />
        </Paper>
      )}

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#1e1e1e', color: '#f44336' }}>
          {error}
        </Alert>
      )}

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          onClick={handleStartBatch}
          disabled={files.length === 0 || files.every((f) => f.status !== 'pending')}
          sx={{
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          Start Batch Processing (Audio/Video)
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={files.length === 0}
          sx={{
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            '&:disabled': { borderColor: '#333333', color: '#666666' },
          }}
        >
          Clear All
        </Button>
      </Box>
    </Box>
  );
}

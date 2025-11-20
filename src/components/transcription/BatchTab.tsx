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
import { batchTranscription, getAvailableModels } from '../../lib/api/transcriptionApi';
import type { TranscriptionConfig } from '../../types/api';
import type { TranscriptionResult } from '../../types/api';

interface BatchFile {
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  result?: TranscriptionResult;
  error?: string;
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

    // Update all files to processing status
    setFiles((prev) => prev.map((f) => ({ ...f, status: 'processing' as const })));

    try {
      const fileList = files.map((bf) => bf.file);
      const config: TranscriptionConfig = {
        engine,
        language,
        model,
      };

      const response = await batchTranscription(fileList, config);

      // Update files with results
      setFiles((prev) => {
        return prev.map((batchFile, index) => {
          const result = response.results[index];
          if (result) {
            return {
              ...batchFile,
              status: result.success ? ('completed' as const) : ('error' as const),
              result: result.transcription,
              error: result.error,
            };
          }
          return batchFile;
        });
      });

      setProgress(100);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Batch processing failed';
      setError(errorMessage);
      setFiles((prev) => prev.map((f) => ({ ...f, status: 'error' as const, error: errorMessage })));
    } finally {
      setIsProcessing(false);
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
        Batch Processing
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
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              {availableModels.map((m) => (
                <MenuItem key={m} value={m}>
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
          disabled={isProcessing}
          sx={{ 
            mb: 2,
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          Select Files
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
                          label={batchFile.status} 
                          size="small"
                          sx={{
                            backgroundColor: 
                              batchFile.status === 'completed' ? '#4caf50' :
                              batchFile.status === 'error' ? '#f44336' :
                              batchFile.status === 'processing' ? '#ff9800' :
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
                        {batchFile.error && ` • Error: ${batchFile.error}`}
                      </Typography>
                    }
                  />
                  <Box>
                    {batchFile.status === 'completed' && batchFile.result && (
                      <IconButton
                        onClick={() => handleDownload(batchFile.result!.text, batchFile.file.name)}
                        sx={{ color: '#00c6ff' }}
                        size="small"
                      >
                        <DownloadIcon />
                      </IconButton>
                    )}
                    {!isProcessing && (
                      <IconButton
                        onClick={() => handleRemoveFile(index)}
                        sx={{ color: '#f44336' }}
                        size="small"
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
          disabled={files.length === 0 || isProcessing}
          sx={{
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          Start Batch Processing
        </Button>
        <Button
          variant="outlined"
          onClick={handleClear}
          disabled={isProcessing || files.length === 0}
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

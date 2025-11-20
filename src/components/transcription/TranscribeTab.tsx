/**
 * Transcription tab component
 * Main interface for file transcription
 */

import { useState, useEffect } from 'react';
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
} from '@mui/material';
import FileUploader from './common/FileUploader';
import ProgressBar from './common/ProgressBar';
import StatusLabel from './common/StatusLabel';
import { transcriptionStore } from '../../stores/transcriptionStore';
import { useJobPolling } from '../../hooks/useJobPolling';
import { getAvailableModels } from '../../lib/api/transcriptionApi';
import type { TranscriptionConfig } from '../../types/api';
import type { ProcessingMode } from '../../types/transcription';

export default function TranscribeTab() {
  const [file, setFile] = useState<File | null>(null);
  const [engine, setEngine] = useState('replicate');
  const [language, setLanguage] = useState('en');
  const [model, setModel] = useState('base');
  const [processingMode, setProcessingMode] = useState<ProcessingMode>('batch');
  const [enablePunctuation, setEnablePunctuation] = useState(true);
  const [enableCapitalization, setEnableCapitalization] = useState(true);
  const [jobId, setJobId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);

  const submitJob = transcriptionStore((state) => state.submitJob);
  const isProcessing = transcriptionStore((state) => state.isProcessing);
  const results = transcriptionStore((state) => state.results);
  const error = transcriptionStore((state) => state.error);
  const clearResults = transcriptionStore((state) => state.clearResults);
  const { progress, message, result, status, error: pollingError } = useJobPolling(jobId);

  useEffect(() => {
    // Load available models and languages
    getAvailableModels()
      .then((data) => {
        if (data.success) {
          setAvailableModels(data.models || []);
          setAvailableLanguages(data.languages || []);
        }
      })
      .catch((error) => {
        // Silently handle errors - API might not be available
        console.warn('Failed to load available models:', error);
        // Set default values if API fails
        setAvailableModels(['base', 'small', 'medium', 'large']);
        setAvailableLanguages(['en']);
      });
  }, []);

  const setResults = transcriptionStore((state) => state.setResults);
  
  useEffect(() => {
    // Update results when polling receives final result
    if (result && results !== result) {
      setResults(result);
    }
  }, [result, results, setResults]);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    clearResults();
  };

  const handleStartTranscription = async () => {
    if (!file) {
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

    const submittedJobId = await submitJob(file, config);
    if (submittedJobId) {
      setJobId(submittedJobId);
    }
  };

  const cancelJob = transcriptionStore((state) => state.cancelJob);
  
  const handleStop = () => {
    if (jobId) {
      cancelJob(jobId);
      setJobId(null);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Transcribe Audio/Video
      </Typography>

      {/* File Upload */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Audio/Video File
        </Typography>
        <FileUploader
          onFileSelect={handleFileSelect}
          currentFile={file}
          disabled={isProcessing}
        />
        {file && (
          <Typography variant="body2" sx={{ mt: 1, color: '#a0a0a0' }}>
            Size: {(file.size / (1024 * 1024)).toFixed(2)} MB | Format: {file.name.split('.').pop()?.toUpperCase()}
          </Typography>
        )}
      </Paper>

      {/* Transcription Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Transcription Settings
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Engine</InputLabel>
            <Select 
              value={engine} 
              onChange={(e) => setEngine(e.target.value)}
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
              disabled={engine !== 'whisper'}
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

        <Box sx={{ mb: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={enablePunctuation}
                onChange={(e) => setEnablePunctuation(e.target.checked)}
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
                sx={{ color: '#00c6ff' }}
              />
            }
            label={<Typography sx={{ color: '#e0e0e0' }}>Enable capitalization</Typography>}
          />
        </Box>

        {/* Processing Mode */}
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
      </Paper>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="contained"
          onClick={handleStartTranscription}
          disabled={!file || isProcessing}
          size="large"
          sx={{
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          Start Audio/Video Transcription
        </Button>
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
      </Box>

      {/* Progress */}
      {isProcessing && (
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

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#1e1e1e', color: '#f44336' }}>
          {error}
        </Alert>
      )}

      {/* Results */}
      {results && (
        <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
            Transcription Results
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={10}
            value={results.text}
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
              onClick={() => navigator.clipboard.writeText(results.text || '')}
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
              onClick={clearResults}
              sx={{
                borderColor: '#333333',
                color: '#e0e0e0',
                '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
              }}
            >
              Clear
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
}


/**
 * Trainer tab component for custom model training
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Alert,
} from '@mui/material';
import { startTraining, getTrainingStatus, cancelTraining } from '../../lib/api/transcriptionApi';

export default function TrainerTab() {
  const [language, setLanguage] = useState('sinhala');
  const [audioDir, setAudioDir] = useState('');
  const [transcriptionsFile, setTranscriptionsFile] = useState('');
  const [audioFiles, setAudioFiles] = useState<File[]>([]);
  const [transcriptionsFileData, setTranscriptionsFileData] = useState<File | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [progress, setProgress] = useState(0);
  const [trainingId, setTrainingId] = useState<string | null>(null);
  const [status, setStatus] = useState<'queued' | 'preparing' | 'training' | 'completed' | 'error' | 'cancelled'>('queued');
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');
  const audioInputRef = useRef<HTMLInputElement>(null);
  const transcriptionsInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for training status
  useEffect(() => {
    if (isTraining && trainingId) {
      pollingIntervalRef.current = setInterval(async () => {
        try {
          const response = await getTrainingStatus(trainingId);
          setProgress(response.progress || 0);
          setStatus(response.status);
          setMessage(response.message || '');
          if (response.log) {
            setLog(response.log);
          }
          if (response.error) {
            setError(response.error);
          }
          if (response.status === 'completed' || response.status === 'error' || response.status === 'cancelled') {
            setIsTraining(false);
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }
        } catch (err: any) {
          console.error('Error fetching training status:', err);
          setError(err.message || 'Failed to fetch training status');
        }
      }, 2000); // Poll every 2 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [isTraining, trainingId]);

  const handleAudioFilesSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setAudioFiles(Array.from(files));
    }
    if (audioInputRef.current) {
      audioInputRef.current.value = '';
    }
  };

  const handleTranscriptionsFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setTranscriptionsFileData(file);
    }
    if (transcriptionsInputRef.current) {
      transcriptionsInputRef.current.value = '';
    }
  };

  const handleStartTraining = async () => {
    if (!audioDir && audioFiles.length === 0) {
      setError('Please provide either an audio directory or select audio files');
      return;
    }

    if (!transcriptionsFile && !transcriptionsFileData) {
      setError('Please provide either a transcriptions file path or upload a transcriptions file');
      return;
    }

    setIsTraining(true);
    setProgress(0);
    setError(null);
    setLog([]);
    setStatus('queued');
    setMessage('Starting training...');

    try {
      const response = await startTraining({
        language,
        audio_dir: audioDir || undefined,
        transcriptions_file: transcriptionsFile || undefined,
        audio_files: audioFiles.length > 0 ? audioFiles : undefined,
        transcriptions_file_data: transcriptionsFileData || undefined,
      });

      if (response.success) {
        setTrainingId(response.training_id);
        setMessage(response.message || 'Training started');
      } else {
        throw new Error(response.message || 'Failed to start training');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to start training';
      setError(errorMessage);
      setIsTraining(false);
      setStatus('error');
    }
  };

  const handleStopTraining = async () => {
    if (!trainingId) return;

    try {
      await cancelTraining(trainingId);
      setIsTraining(false);
      setStatus('cancelled');
      setMessage('Training cancelled');
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || 'Failed to cancel training';
      setError(errorMessage);
    }
  };

  const handleClear = () => {
    setAudioDir('');
    setTranscriptionsFile('');
    setAudioFiles([]);
    setTranscriptionsFileData(null);
    setProgress(0);
    setError(null);
    setLog([]);
    setMessage('');
    setTrainingId(null);
    setIsTraining(false);
    setStatus('queued');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Custom Language Model Trainer
      </Typography>

      {/* Training Configuration */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Configuration
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#a0a0a0' }}>Target Language</InputLabel>
          <Select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isTraining}
            sx={{ 
              color: '#e0e0e0',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
            }}
          >
            <MenuItem value="sinhala">Sinhala</MenuItem>
            <MenuItem value="tamil">Tamil</MenuItem>
            <MenuItem value="hindi">Hindi</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="subtitle2" sx={{ color: '#a0a0a0', mb: 1 }}>
          Audio Files (choose one method)
        </Typography>
        <TextField
          fullWidth
          label="Audio Files Directory Path"
          value={audioDir}
          onChange={(e) => setAudioDir(e.target.value)}
          disabled={isTraining || audioFiles.length > 0}
          placeholder="/path/to/audio/files"
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
          }}
        />
        <input
          ref={audioInputRef}
          type="file"
          multiple
          accept="audio/*"
          onChange={handleAudioFilesSelect}
          style={{ display: 'none' }}
          disabled={isTraining || !!audioDir}
        />
        <Button
          variant="outlined"
          onClick={() => audioInputRef.current?.click()}
          disabled={isTraining || !!audioDir}
          sx={{
            mb: 2,
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            '&:disabled': { borderColor: '#333333', color: '#666666' },
          }}
        >
          {audioFiles.length > 0 ? `${audioFiles.length} files selected` : 'Select Audio Files'}
        </Button>

        <Typography variant="subtitle2" sx={{ color: '#a0a0a0', mb: 1, mt: 2 }}>
          Transcriptions File (choose one method)
        </Typography>
        <TextField
          fullWidth
          label="Transcriptions File Path"
          value={transcriptionsFile}
          onChange={(e) => setTranscriptionsFile(e.target.value)}
          disabled={isTraining || !!transcriptionsFileData}
          placeholder="/path/to/transcriptions.json"
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
          }}
        />
        <input
          ref={transcriptionsInputRef}
          type="file"
          accept=".json,.txt,.csv"
          onChange={handleTranscriptionsFileSelect}
          style={{ display: 'none' }}
          disabled={isTraining || !!transcriptionsFile}
        />
        <Button
          variant="outlined"
          onClick={() => transcriptionsInputRef.current?.click()}
          disabled={isTraining || !!transcriptionsFile}
          sx={{
            mb: 2,
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            '&:disabled': { borderColor: '#333333', color: '#666666' },
          }}
        >
          {transcriptionsFileData ? transcriptionsFileData.name : 'Upload Transcriptions File'}
        </Button>
      </Paper>

      {/* Training Controls */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Controls
        </Typography>
        {isTraining && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                Status: {status} {message && `- ${message}`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                {progress}%
              </Typography>
            </Box>
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
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: '#1e1e1e', color: '#f44336' }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleStartTraining}
            disabled={isTraining || (!audioDir && audioFiles.length === 0) || (!transcriptionsFile && !transcriptionsFileData)}
            sx={{
              backgroundColor: '#4caf50',
              color: '#fff',
              '&:hover': { backgroundColor: '#45a049' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Start Training
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStopTraining}
            disabled={!isTraining}
            sx={{
              backgroundColor: '#f44336',
              color: '#fff',
              '&:hover': { backgroundColor: '#da190b' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Stop Training
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={isTraining}
            sx={{
              borderColor: '#333333',
              color: '#e0e0e0',
              '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
              '&:disabled': { borderColor: '#333333', color: '#666666' },
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Training Log */}
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Log
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value={log.length > 0 ? log.join('\n') : (isTraining ? 'Training in progress...' : 'Training log will appear here...')}
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              backgroundColor: '#121212',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>
    </Box>
  );
}

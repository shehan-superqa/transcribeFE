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
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';

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
      <div className="tool-sticky-title">
        <h1>
          <span>Custom Language Model Trainer</span>
          <span className="title-subtitle"> - Train custom transcription models for specific languages or domains</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Select the language you want to train a model for. Upload audio files either by selecting files directly or providing a directory path. Upload a transcriptions file (JSON or text format) that matches your audio files. The transcriptions file should contain the text corresponding to each audio file. Click 'Start Training' to begin the training process. Monitor the progress and logs in real-time. Once training is complete, you can use your custom model for transcriptions."
      />

      {/* Training Configuration */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', mb: 2, fontWeight: 600 }}>
          Training Configuration
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#666666' }}>Target Language</InputLabel>
          <Select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            disabled={isTraining}
            sx={{ 
              color: '#000000',
              backgroundColor: '#ffffff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#cccccc' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3b82f6' },
              '& .MuiSelect-icon': { color: '#000000' },
            }}
            MenuProps={{
              PaperProps: {
                style: {
                  backgroundColor: '#ffffff',
                  color: '#000000',
                },
              },
            }}
          >
            <MenuItem value="sinhala" sx={{ color: '#000000', '&:hover': { backgroundColor: '#f3f4f6' } }}>Sinhala</MenuItem>
            <MenuItem value="tamil" sx={{ color: '#000000', '&:hover': { backgroundColor: '#f3f4f6' } }}>Tamil</MenuItem>
            <MenuItem value="hindi" sx={{ color: '#000000', '&:hover': { backgroundColor: '#f3f4f6' } }}>Hindi</MenuItem>
            <MenuItem value="custom" sx={{ color: '#000000', '&:hover': { backgroundColor: '#f3f4f6' } }}>Custom</MenuItem>
          </Select>
        </FormControl>
        
        <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1 }}>
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
              color: '#000000',
              backgroundColor: '#ffffff',
              '& fieldset': { borderColor: '#cccccc' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputLabel-root': { color: '#666666' },
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
            borderColor: 'rgba(0, 0, 0, 0.15)',
            color: '#1a1a1a',
            '&:hover': { borderColor: '#3b82f6', backgroundColor: '#f3f4f6' },
            '&:disabled': { borderColor: '#cccccc', color: '#999999' },
          }}
        >
          {audioFiles.length > 0 ? `${audioFiles.length} files selected` : 'Select Audio Files'}
        </Button>

        <Typography variant="subtitle2" sx={{ color: '#666666', mb: 1, mt: 2 }}>
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
              color: '#000000',
              backgroundColor: '#ffffff',
              '& fieldset': { borderColor: '#cccccc' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
            },
            '& .MuiInputLabel-root': { color: '#666666' },
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
            borderColor: 'rgba(0, 0, 0, 0.15)',
            color: '#1a1a1a',
            '&:hover': { borderColor: '#3b82f6', backgroundColor: '#f3f4f6' },
            '&:disabled': { borderColor: '#cccccc', color: '#999999' },
          }}
        >
          {transcriptionsFileData ? transcriptionsFileData.name : 'Upload Transcriptions File'}
        </Button>
      </Paper>

      {/* Training Controls */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', mb: 2, fontWeight: 600 }}>
          Training Controls
        </Typography>
        {isTraining && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                Status: {status} {message && `- ${message}`}
              </Typography>
              <Typography variant="body2" sx={{ color: '#666666' }}>
                {progress}%
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                backgroundColor: '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                },
              }}
            />
          </Box>
        )}
        {error && (
          <Alert severity="error" sx={{ mb: 2, backgroundColor: '#ffffff', color: '#f44336', border: '1px solid #f44336' }}>
            {error}
          </Alert>
        )}
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            onClick={handleStartTraining}
            disabled={isTraining || (!audioDir && audioFiles.length === 0) || (!transcriptionsFile && !transcriptionsFileData)}
            sx={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
                boxShadow: '0 6px 16px rgba(59, 130, 246, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': { 
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Start Training
          </Button>
          <Button 
            variant="contained" 
            onClick={handleStopTraining}
            disabled={!isTraining}
            sx={{
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#ffffff',
              fontWeight: 600,
              borderRadius: '10px',
              boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
              '&:hover': { 
                background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
                boxShadow: '0 6px 16px rgba(239, 68, 68, 0.4)',
                transform: 'translateY(-1px)',
              },
              '&:disabled': { 
                background: 'rgba(0, 0, 0, 0.12)',
                color: 'rgba(0, 0, 0, 0.26)',
                boxShadow: 'none',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Stop Training
          </Button>
          <Button
            variant="outlined"
            onClick={handleClear}
            disabled={isTraining}
            sx={{
              borderColor: 'rgba(0, 0, 0, 0.15)',
              color: '#1a1a1a',
              fontWeight: 500,
              borderRadius: '10px',
              '&:hover': { 
                borderColor: '#3b82f6', 
                backgroundColor: '#f3f4f6',
                transform: 'translateY(-1px)',
              },
              '&:disabled': { 
                borderColor: '#cccccc', 
                color: '#999999',
              },
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            Clear
          </Button>
        </Box>
      </Paper>

      {/* Training Log */}
      <Paper sx={{ p: 3, background: 'linear-gradient(135deg, #ffffff 0%, #fafafa 100%)', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#1a1a1a', mb: 2, fontWeight: 600 }}>
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
              color: '#1a1a1a',
              backgroundColor: '#ffffff',
              '& fieldset': { borderColor: '#cccccc' },
              '&:hover fieldset': { borderColor: '#3b82f6' },
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
          }}
        />
      </Paper>
    </Box>
  );
}

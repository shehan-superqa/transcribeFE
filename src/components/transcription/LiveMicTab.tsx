/**
 * Live microphone transcription tab
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  Chip,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import { useLiveTranscription } from '../../hooks/useLiveTranscription';
import { useMicrophone } from '../../hooks/useMicrophone';
import { useWaveformVisualization } from '../../hooks/useWaveformVisualization';

export default function LiveMicTab() {
  const [model, setModel] = useState('base');
  const [language, setLanguage] = useState('en');
  const [vadThreshold, setVadThreshold] = useState(0.01);

  const {
    isActive,
    isConnected,
    isRecording,
    transcription,
    vadStatus,
    error,
    sessionId,
    start,
    stop,
    clearResults,
  } = useLiveTranscription();

  const { getAudioDevices, audioStream } = useMicrophone();
  const { canvasRef, audioLevel, startVisualization, stopVisualization } = useWaveformVisualization();

  useEffect(() => {
    getAudioDevices();
  }, [getAudioDevices]);

  useEffect(() => {
    if (audioStream && isRecording) {
      startVisualization(audioStream);
    } else {
      stopVisualization();
    }
    return () => {
      stopVisualization();
    };
  }, [audioStream, isRecording, startVisualization, stopVisualization]);

  const handleStart = async () => {
    try {
      await start({
        engine: 'replicate',
        language,
        model,
        vad_threshold: vadThreshold,
        chunkInterval: 2000, // 2 seconds
      });
    } catch (error) {
      console.error('Error starting live transcription:', error);
    }
  };

  const handleStop = async () => {
    try {
      await stop();
    } catch (error) {
      console.error('Error stopping live transcription:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Live Microphone Transcription with VAD
      </Typography>

      {/* Status and Connection Info */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
          <Chip
            label={isConnected ? 'Connected' : 'Disconnected'}
            color={isConnected ? 'success' : 'default'}
            sx={{
              backgroundColor: isConnected ? '#4caf50' : '#666666',
              color: '#fff',
            }}
          />
          <Chip
            label={isRecording ? 'Recording' : 'Not Recording'}
            color={isRecording ? 'error' : 'default'}
            sx={{
              backgroundColor: isRecording ? '#f44336' : '#666666',
              color: '#fff',
            }}
          />
          <Chip
            label={`VAD: ${vadStatus === 'speaking' ? 'Speaking' : 'Silent'}`}
            color={vadStatus === 'speaking' ? 'warning' : 'default'}
            sx={{
              backgroundColor: vadStatus === 'speaking' ? '#ff9800' : '#666666',
              color: '#fff',
            }}
          />
          {sessionId && (
            <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
              Session: {sessionId.substring(0, 8)}...
            </Typography>
          )}
        </Box>
        {error && (
          <Alert severity="error" sx={{ backgroundColor: '#1e1e1e', color: '#f44336' }}>
            {error}
          </Alert>
        )}
      </Paper>

      {/* Waveform visualization */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#e0e0e0' }}>
            Audio Waveform
          </Typography>
          {isRecording && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: audioLevel > 0.1 ? '#4caf50' : '#666666',
                  animation: audioLevel > 0.1 ? 'pulse 1s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%, 100%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                  },
                }}
              />
              <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
                {Math.round(audioLevel * 100)}% level
              </Typography>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            width: '100%',
            height: 200,
            backgroundColor: '#121212',
            borderRadius: 1,
            overflow: 'hidden',
            border: '1px solid #333333',
          }}
        >
          <canvas
            ref={canvasRef}
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
          />
        </Box>
        {!isRecording && (
          <Typography variant="body2" sx={{ color: '#a0a0a0', mt: 2, textAlign: 'center' }}>
            Start recording to see waveform visualization
          </Typography>
        )}
      </Paper>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Live Transcription Controls
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Model</InputLabel>
            <Select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              <MenuItem value="tiny">Tiny</MenuItem>
              <MenuItem value="base">Base</MenuItem>
              <MenuItem value="small">Small</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="large">Large</MenuItem>
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
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="de">German</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography gutterBottom sx={{ color: '#e0e0e0' }}>VAD Sensitivity: {vadThreshold.toFixed(3)}</Typography>
          <Slider
            value={vadThreshold}
            onChange={(_, value) => setVadThreshold(value as number)}
            min={0.001}
            max={0.1}
            step={0.001}
            sx={{
              color: '#00c6ff',
              '& .MuiSlider-thumb': {
                backgroundColor: '#00c6ff',
              },
            }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<MicIcon />}
            onClick={handleStart}
            disabled={isActive}
            sx={{
              backgroundColor: '#4caf50',
              color: '#fff',
              '&:hover': { backgroundColor: '#45a049' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Start Live Transcription
          </Button>
          <Button
            variant="contained"
            startIcon={<StopIcon />}
            onClick={handleStop}
            disabled={!isActive}
            sx={{
              backgroundColor: '#f44336',
              color: '#fff',
              '&:hover': { backgroundColor: '#da190b' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Stop Live Transcription
          </Button>
        </Box>
      </Paper>

      {/* Results */}
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Live Transcription Results
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={10}
          value={transcription}
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
        <Button 
          variant="outlined" 
          onClick={clearResults}
          sx={{
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
          }}
        >
          Clear Results
        </Button>
      </Paper>
    </Box>
  );
}


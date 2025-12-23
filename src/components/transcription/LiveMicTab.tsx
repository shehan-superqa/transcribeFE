/**
 * Live microphone transcription tab
 */

import { useState, useEffect, useRef } from 'react';
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
import { useRequireAuth } from '../../hooks/useRequireAuth';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';

export default function LiveMicTab() {
  const [model, setModel] = useState('base');
  const [language, setLanguage] = useState('en');
  const [vadThreshold, setVadThreshold] = useState(0.01);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { requireAuth } = useRequireAuth();

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

  const { getAudioDevices, audioStream, startRecording, stopRecording, selectedDeviceId, setSelectedDeviceId } = useMicrophone();
  const { waveformRef, audioLevel, startVisualization, stopVisualization } = useWaveformVisualization();

  // Load audio devices and auto-start microphone when component mounts
  useEffect(() => {
    const initializeMicrophone = async () => {
      try {
        const devices = await getAudioDevices();
        setAudioDevices(devices);
        // Start recording immediately (just for waveform, not transcription)
        await startRecording();
      } catch (error) {
        console.error('Error initializing microphone:', error);
      }
    };
    
    initializeMicrophone();
    
    // Cleanup: stop recording when component unmounts
    return () => {
      stopRecording();
    };
  }, [getAudioDevices, startRecording, stopRecording]);

  // Restart microphone when device selection changes (but not on initial mount)
  const isInitialMount = useRef(true);
  const prevDeviceIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevDeviceIdRef.current = selectedDeviceId;
      return;
    }

    // Only restart if device actually changed and we have an active stream
    if (prevDeviceIdRef.current !== selectedDeviceId && audioStream) {
      const restartWithNewDevice = async () => {
        try {
          stopRecording();
          // Small delay to ensure cleanup
          await new Promise(resolve => setTimeout(resolve, 200));
          await startRecording();
          prevDeviceIdRef.current = selectedDeviceId;
        } catch (error) {
          console.error('Error restarting microphone with new device:', error);
        }
      };

      restartWithNewDevice();
    } else {
      prevDeviceIdRef.current = selectedDeviceId;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDeviceId]); // Only depend on selectedDeviceId to avoid loops

  // Start waveform visualization as soon as audio stream is available
  useEffect(() => {
    if (audioStream) {
      startVisualization(audioStream);
    } else {
      stopVisualization();
    }
    return () => {
      stopVisualization();
    };
  }, [audioStream, startVisualization, stopVisualization]);

  const handleStart = async () => {
    // Check authentication before starting
    if (!requireAuth()) {
      return;
    }

    setLocalError(null);
    
    try {
      await start({
        engine: 'replicate',
        language,
        model,
        vad_threshold: vadThreshold,
        chunkInterval: 2000, // 2 seconds
        deviceId: selectedDeviceId || undefined,
      });
    } catch (error: any) {
      const errorMessage = error?.message || error?.toString() || 'Failed to start live transcription';
      console.error('Error starting live transcription:', error);
      setLocalError(errorMessage);
      
      // If transcription fails, try to restart microphone for waveform preview
      if (!audioStream && !isActive) {
        try {
          await startRecording();
        } catch (micError) {
          console.error('Error restarting microphone:', micError);
        }
      }
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
      <div className="live-mic-sticky-title">
        <h1 className="live-mic-title">
          <span>Live Mic VAD</span>
          <span className="title-subtitle"> - Real-time speech-to-text transcription as you speak</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Click 'Start Recording' to begin. Grant microphone permissions when prompted. Speak clearly into your microphone. The transcription will appear in real-time as you speak. Adjust the VAD (Voice Activity Detection) threshold to control sensitivity. Click 'Stop Recording' when finished. You can copy the transcription or save it to your history."
      />
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
            label={audioStream ? 'Microphone Active' : 'Microphone Inactive'}
            color={audioStream ? 'success' : 'default'}
            sx={{
              backgroundColor: audioStream ? '#4caf50' : '#666666',
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
          {audioStream && (
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
            position: 'relative',
            '& wave': {
              height: '200px !important',
            },
            '& wavesurfer': {
              height: '200px !important',
              width: '100% !important',
            },
            '& > div': {
              width: '100% !important',
              height: '100% !important',
            },
          }}
        >
          <div
            ref={waveformRef}
            style={{
              width: '100%',
              height: '100%',
              minHeight: '200px',
            }}
          />
        </Box>
        {!audioStream && (
          <Typography variant="body2" sx={{ color: '#a0a0a0', mt: 2, textAlign: 'center' }}>
            Requesting microphone access...
          </Typography>
        )}
      </Paper>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Live Transcription Controls
        </Typography>
        
        {/* Microphone Selection */}
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Microphone</InputLabel>
            <Select 
              value={selectedDeviceId || 'default'} 
              onChange={(e) => {
                const deviceId = e.target.value === 'default' ? null : e.target.value;
                setSelectedDeviceId(deviceId);
              }}
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
                    border: '1px solid #333333',
                  },
                },
              }}
            >
              <MenuItem value="default" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>
                Default Microphone
              </MenuItem>
              {audioDevices.map((device) => (
                <MenuItem 
                  key={device.deviceId} 
                  value={device.deviceId}
                  sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}
                >
                  {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2, mb: 2 }}>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Model</InputLabel>
            <Select 
              value={model} 
              onChange={(e) => setModel(e.target.value)}
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
                    border: '1px solid #333333',
                  },
                },
              }}
            >
              <MenuItem value="tiny" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Tiny</MenuItem>
              <MenuItem value="base" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Base</MenuItem>
              <MenuItem value="small" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Small</MenuItem>
              <MenuItem value="medium" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Medium</MenuItem>
              <MenuItem value="large" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Large</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Language</InputLabel>
            <Select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
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
                    border: '1px solid #333333',
                  },
                },
              }}
            >
              <MenuItem value="en" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>English</MenuItem>
              <MenuItem value="es" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>Spanish</MenuItem>
              <MenuItem value="fr" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>French</MenuItem>
              <MenuItem value="de" sx={{ color: '#e0e0e0', '&:hover': { backgroundColor: '#2a2a2a' } }}>German</MenuItem>
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

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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
              whiteSpace: 'nowrap',
              padding: '8px 20px',
              fontSize: '0.875rem',
              minWidth: 'fit-content',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
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
              whiteSpace: 'nowrap',
              padding: '8px 20px',
              fontSize: '0.875rem',
              minWidth: 'fit-content',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            Stop Live Transcription
          </Button>
        </Box>
      </Paper>

      {/* Error Display */}
      {(error || localError) && (
        <Alert 
          severity="error" 
          sx={{ mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #f44336' }}
          onClose={() => {
            setLocalError(null);
          }}
        >
          {error || localError}
        </Alert>
      )}

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


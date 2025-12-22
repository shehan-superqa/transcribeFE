/**
 * Live Microphone VAD (Voice Activity Detection) Tool
 * Dedicated tool for real-time voice activity detection without transcription
 */

import { useState, useEffect, useRef, useCallback } from 'react';
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
  Alert,
  Chip,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { useMicrophone } from '../../hooks/useMicrophone';
import { useWaveformVisualization } from '../../hooks/useWaveformVisualization';
import { websocketClient } from '../../lib/api/websocketClient';
import HowToUse from '../common/HowToUse';
import '../common/HowToUse.css';
import './LiveMicVADTool.css';

export default function LiveMicVADTool() {
  const [vadThreshold, setVadThreshold] = useState(0.01);
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [vadStatus, setVadStatus] = useState<'speaking' | 'silent'>('silent');
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Statistics
  const [speakingTime, setSpeakingTime] = useState(0);
  const [silentTime, setSilentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [vadEvents, setVadEvents] = useState<Array<{ status: 'speaking' | 'silent'; timestamp: number }>>([]);
  
  const statusStartTimeRef = useRef<number | null>(null);
  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const vadCallbackRef = useRef<((data: any) => void) | null>(null);
  const errorCallbackRef = useRef<((error: any) => void) | null>(null);

  const { 
    getAudioDevices, 
    audioStream, 
    startRecording, 
    stopRecording, 
    selectedDeviceId, 
    setSelectedDeviceId,
    isRecording 
  } = useMicrophone();
  
  const { waveformRef, audioLevel, startVisualization, stopVisualization } = useWaveformVisualization();

  // Load audio devices on mount
  useEffect(() => {
    const initializeDevices = async () => {
      try {
        const devices = await getAudioDevices();
        setAudioDevices(devices);
      } catch (error) {
        console.error('Error loading audio devices:', error);
      }
    };
    
    initializeDevices();
  }, [getAudioDevices]);

  // Set up WebSocket event listeners
  useEffect(() => {
    const vadCallback = (data: any) => {
      if (data.status) {
        setVadStatus(data.status);
        
        // Track VAD events
        setVadEvents(prev => [...prev.slice(-99), { status: data.status, timestamp: Date.now() }]);
        
        // Update status start time for statistics
        if (data.status === 'speaking' && vadStatus === 'silent') {
          statusStartTimeRef.current = Date.now();
        } else if (data.status === 'silent' && vadStatus === 'speaking') {
          if (statusStartTimeRef.current) {
            const duration = (Date.now() - statusStartTimeRef.current) / 1000;
            setSpeakingTime(prev => prev + duration);
            statusStartTimeRef.current = null;
          }
        }
      }
    };

    const errorCallback = (errorData: any) => {
      const errorMessage = errorData.error || 'WebSocket error';
      setError(errorMessage);
    };

    vadCallbackRef.current = vadCallback;
    errorCallbackRef.current = errorCallback;

    websocketClient.on('vad_status', vadCallback);
    websocketClient.on('error', errorCallback);

    // Check initial connection status
    setIsConnected(websocketClient.isConnected());

    return () => {
      if (vadCallbackRef.current) {
        websocketClient.off('vad_status', vadCallbackRef.current);
      }
      if (errorCallbackRef.current) {
        websocketClient.off('error', errorCallbackRef.current);
      }
    };
  }, [vadStatus]);

  // Update statistics timer
  useEffect(() => {
    if (isActive) {
      statsIntervalRef.current = setInterval(() => {
        setTotalTime(prev => prev + 1);
        if (vadStatus === 'speaking') {
          setSpeakingTime(prev => prev + 1);
        } else {
          setSilentTime(prev => prev + 1);
        }
      }, 1000);
    } else {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
        statsIntervalRef.current = null;
      }
    }

    return () => {
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current);
      }
    };
  }, [isActive, vadStatus]);

  // Start waveform visualization when audio stream is available
  useEffect(() => {
    if (audioStream && isActive) {
      startVisualization(audioStream);
    } else {
      stopVisualization();
    }
    return () => {
      stopVisualization();
    };
  }, [audioStream, isActive, startVisualization, stopVisualization]);

  const handleStart = useCallback(async () => {
    try {
      setError(null);
      setSpeakingTime(0);
      setSilentTime(0);
      setTotalTime(0);
      setVadEvents([]);
      statusStartTimeRef.current = null;

      // 1. Connect to WebSocket if not connected
      if (!websocketClient.isConnected()) {
        await websocketClient.connect();
        setIsConnected(true);
        setSessionId(websocketClient.getSessionId());
      }

      // 2. Start VAD session (without transcription)
      await websocketClient.startTranscription({
        engine: 'replicate',
        language: 'en',
        model: 'base',
        vad_threshold: vadThreshold,
      });

      setIsActive(true);
      setSessionId(websocketClient.getSessionId());

      // 3. Start audio capture with chunk callback
      await startRecording(
        (audioBuffer: ArrayBuffer) => {
          // Send audio chunk via WebSocket for VAD processing
          try {
            websocketClient.sendAudio(audioBuffer, 'base64', 16000, 1);
          } catch (err: any) {
            console.error('Error sending audio chunk:', err);
            setError(err.message || 'Failed to send audio chunk');
          }
        },
        2000 // 2 second chunks
      );
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start VAD detection';
      setError(errorMessage);
      setIsActive(false);
      
      // Cleanup on error
      try {
        await handleStop();
      } catch (cleanupError) {
        console.error('Error during cleanup:', cleanupError);
      }
    }
  }, [vadThreshold, startRecording]);

  const handleStop = useCallback(async () => {
    try {
      // Stop audio capture
      stopRecording();

      // Stop VAD session
      if (websocketClient.isConnected()) {
        await websocketClient.stopTranscription();
      }

      setIsActive(false);
      setError(null);
      
      // Finalize statistics
      if (statusStartTimeRef.current && vadStatus === 'speaking') {
        const duration = (Date.now() - statusStartTimeRef.current) / 1000;
        setSpeakingTime(prev => prev + duration);
        statusStartTimeRef.current = null;
      }
    } catch (err: any) {
      console.error('Error stopping VAD:', err);
      setError(err.message || 'Error stopping VAD detection');
    }
  }, [stopRecording, vadStatus]);

  const handleResetStats = () => {
    setSpeakingTime(0);
    setSilentTime(0);
    setTotalTime(0);
    setVadEvents([]);
    statusStartTimeRef.current = null;
  };

  const speakingPercentage = totalTime > 0 ? ((speakingTime / totalTime) * 100).toFixed(1) : '0.0';

  return (
    <Box>
      <div className="live-mic-sticky-title">
        <h1 className="live-mic-title">Live Mic VAD Tool</h1>
      </div>
      <HowToUse
        title=""
        subtitle="Real-time Voice Activity Detection - Detect when someone is speaking"
        instructions="Click 'Start VAD' to begin voice activity detection. Grant microphone permissions when prompted. Speak into your microphone and watch the VAD status change between 'Speaking' and 'Silent'. Adjust the VAD threshold to control sensitivity. View real-time statistics and audio visualization. Click 'Stop VAD' when finished."
      />
      
      <div className="vad-tool-container">
        {/* Controls Section */}
        <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', color: '#f8fafc' }}>
          <Grid container spacing={3}>
            {/* Microphone Selection */}
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: '#a0a0a0' }}>Microphone</InputLabel>
                <Select
                  value={selectedDeviceId || ''}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  sx={{
                    color: '#f8fafc',
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '& .MuiSvgIcon-root': {
                      color: '#a0a0a0',
                    },
                  }}
                  disabled={isActive}
                >
                  <MenuItem value="">
                    <em>Default Microphone</em>
                  </MenuItem>
                  {audioDevices.map((device) => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Microphone ${device.deviceId.substring(0, 8)}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* VAD Threshold Control */}
            <Grid item xs={12} md={6}>
              <Typography gutterBottom sx={{ color: '#e0e0e0' }}>
                VAD Sensitivity: {vadThreshold.toFixed(3)}
              </Typography>
              <Slider
                value={vadThreshold}
                onChange={(_, value) => setVadThreshold(value as number)}
                min={0.001}
                max={0.1}
                step={0.001}
                disabled={isActive}
                sx={{
                  color: '#00c6ff',
                  '& .MuiSlider-thumb': {
                    backgroundColor: '#00c6ff',
                  },
                  '& .MuiSlider-track': {
                    backgroundColor: '#00c6ff',
                  },
                }}
              />
              <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mt: 1 }}>
                Lower values = more sensitive (detects quieter speech)
              </Typography>
            </Grid>
          </Grid>

          {/* Control Buttons */}
          <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'center' }}>
            <Button
              variant="contained"
              startIcon={isActive ? <StopIcon /> : <MicIcon />}
              onClick={isActive ? handleStop : handleStart}
              disabled={!audioDevices.length && !isActive}
              sx={{
                backgroundColor: isActive ? '#ef4444' : '#00c6ff',
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: isActive ? '#dc2626' : '#0099cc',
                },
                minWidth: 150,
              }}
            >
              {isActive ? 'Stop VAD' : 'Start VAD'}
            </Button>
            {isActive && (
              <Button
                variant="outlined"
                onClick={handleResetStats}
                sx={{
                  borderColor: '#64748b',
                  color: '#e0e0e0',
                  '&:hover': {
                    borderColor: '#94a3b8',
                    backgroundColor: 'rgba(100, 116, 139, 0.1)',
                  },
                }}
              >
                Reset Stats
              </Button>
            )}
          </Box>
        </Paper>

        {/* Status Indicators */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={4}>
            <Card sx={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                  Connection Status
                </Typography>
                <Chip
                  label={isConnected ? 'Connected' : 'Disconnected'}
                  color={isConnected ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                  Microphone Status
                </Typography>
                <Chip
                  label={audioStream ? 'Active' : 'Inactive'}
                  color={audioStream ? 'success' : 'default'}
                  size="small"
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={4}>
            <Card sx={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                  VAD Status
                </Typography>
                <Chip
                  label={vadStatus === 'speaking' ? 'Speaking' : 'Silent'}
                  color={vadStatus === 'speaking' ? 'warning' : 'default'}
                  icon={vadStatus === 'speaking' ? <VolumeUpIcon /> : <VolumeOffIcon />}
                  size="small"
                  sx={{ 
                    backgroundColor: vadStatus === 'speaking' ? '#ff9800' : '#666666',
                    color: '#ffffff',
                  }}
                />
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <Card sx={{ backgroundColor: '#1e293b', color: '#f8fafc' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5 }}>
                  Audio Level
                </Typography>
                <Typography variant="h6" sx={{ color: '#00c6ff', mt: 0 }}>
                  {(audioLevel * 100).toFixed(0)}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Audio Visualization */}
        {isActive && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#1e293b' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#f8fafc' }}>
              Audio Waveform
            </Typography>
            <div 
              ref={waveformRef} 
              style={{ 
                width: '100%', 
                height: '200px',
                backgroundColor: '#0f172a',
                borderRadius: '8px',
              }} 
            />
          </Paper>
        )}

        {/* Statistics */}
        {isActive && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', color: '#f8fafc' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#f8fafc' }}>
              Statistics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Total Time
                </Typography>
                <Typography variant="h6" sx={{ color: '#00c6ff' }}>
                  {Math.floor(totalTime / 60)}:{(totalTime % 60).toString().padStart(2, '0')}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Speaking Time
                </Typography>
                <Typography variant="h6" sx={{ color: '#ff9800' }}>
                  {Math.floor(speakingTime / 60)}:{(speakingTime % 60).toString().padStart(2, '0')}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Silent Time
                </Typography>
                <Typography variant="h6" sx={{ color: '#64748b' }}>
                  {Math.floor(silentTime / 60)}:{(silentTime % 60).toString().padStart(2, '0')}
                </Typography>
              </Grid>
              <Grid item xs={6} md={3}>
                <Typography variant="caption" sx={{ color: '#94a3b8' }}>
                  Speaking %
                </Typography>
                <Typography variant="h6" sx={{ color: '#10b981' }}>
                  {speakingPercentage}%
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        )}

        {/* VAD Events Log */}
        {isActive && vadEvents.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 3, backgroundColor: '#1e293b', color: '#f8fafc' }}>
            <Typography variant="h6" sx={{ mb: 2, color: '#f8fafc' }}>
              Recent VAD Events (Last 10)
            </Typography>
            <Box sx={{ maxHeight: '200px', overflowY: 'auto' }}>
              {vadEvents.slice(-10).reverse().map((event, index) => (
                <Chip
                  key={index}
                  label={`${event.status} - ${new Date(event.timestamp).toLocaleTimeString()}`}
                  color={event.status === 'speaking' ? 'warning' : 'default'}
                  size="small"
                  sx={{ 
                    mr: 1, 
                    mb: 1,
                    backgroundColor: event.status === 'speaking' ? '#ff9800' : '#666666',
                    color: '#ffffff',
                  }}
                />
              ))}
            </Box>
          </Paper>
        )}

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Session Info */}
        {sessionId && (
          <Typography variant="caption" sx={{ color: '#64748b', display: 'block', textAlign: 'center' }}>
            Session ID: {sessionId}
          </Typography>
        )}
      </div>
    </Box>
  );
}


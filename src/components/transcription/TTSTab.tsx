/**
 * Text-to-Speech (TTS) tab component
 * Main interface for TTS generation
 */

import { useState, useEffect } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Slider,
  Alert,
  Card,
  CardContent,
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import ProgressBar from './common/ProgressBar';
import StatusLabel from './common/StatusLabel';
import VoiceSelector from './tts/VoiceSelector';
import AudioPlayer from './tts/AudioPlayer';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import { submitTTSJob, getTTSJobStatus, getAvailableVoices, type Voice as TTSVoice, type TTSJobRequest } from '../../lib/api/ttsApi';
import { useRequireAuth } from '../../hooks/useRequireAuth';

export default function TTSTab() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { requireAuth } = useRequireAuth();
  const [text, setText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [language, setLanguage] = useState<string>('en');
  const [emotion, setEmotion] = useState<string>('');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [volume, setVolume] = useState<number>(1.0);
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [voices, setVoices] = useState<TTSVoice[]>([]);
  const [loadingVoices, setLoadingVoices] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ttsJob, setTtsJob] = useState<any | null>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>('');

  // Load available voices on mount
  useEffect(() => {
    loadVoices();
  }, []);

  // Poll job status periodically (TTS doesn't use SSE, use polling instead)
  useEffect(() => {
    if (!jobId) return;

    let attempts = 0;
    const maxAttempts = 60; // 2 minutes max (60 * 2 seconds)
    const intervalMs = 2000; // Poll every 2 seconds

    const pollJobStatus = async () => {
      try {
        const response = await getTTSJobStatus(jobId);
        if (response.success && response.job) {
          const job = response.job;
          setTtsJob(job);
          setStatus(job.status);

          // Update progress based on status
          if (job.status === 'queued') {
            setProgress(10);
          } else if (job.status === 'processing') {
            setProgress(job.progress || 50);
          } else if (job.status === 'completed') {
            setProgress(100);
          }

          // Stop polling if job is completed, failed, error, or cancelled
          if (['completed', 'failed', 'error', 'cancelled'].includes(job.status)) {
            return true; // Signal to stop polling
          }
        }
      } catch (err: any) {
        console.error('Error polling TTS job status:', err);
        setError(err.message || 'Failed to get job status');
      }

      attempts++;
      if (attempts >= maxAttempts) {
        setError('Polling timeout - job did not complete in time');
        return true; // Signal to stop polling
      }

      return false; // Continue polling
    };

    // Initial poll
    pollJobStatus();

    // Set up polling interval
    const interval = setInterval(async () => {
      const shouldStop = await pollJobStatus();
      if (shouldStop) {
        clearInterval(interval);
      }
    }, intervalMs);

    // Cleanup
    return () => {
      clearInterval(interval);
    };
  }, [jobId]);

  const loadVoices = async () => {
    setLoadingVoices(true);
    setError(null);
    try {
      const response = await getAvailableVoices();
      if (response.success && response.voices) {
        setVoices(response.voices);
        // Set default voice if available
        if (response.voices.length > 0 && !selectedVoice) {
          const defaultVoice = response.voices.find(v => v.language === 'en') || response.voices[0];
          if (defaultVoice) {
            setSelectedVoice(defaultVoice.id);
            if (defaultVoice.language) {
              setLanguage(defaultVoice.language);
            }
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load voices');
      console.error('Error loading voices:', err);
    } finally {
      setLoadingVoices(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Prevent navigation if button is clicked
    if (e && e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
    }

    // Check authentication before submitting
    if (!requireAuth()) {
      return;
    }

    if (!text.trim()) {
      setError('Please enter text to convert to speech');
      return;
    }

    if (!selectedVoice) {
      setError('Please select a voice');
      return;
    }

    setError(null);
    setTtsJob(null);
    setProgress(0);
    setStatus('');

    try {
      const request: TTSJobRequest = {
        text: text.trim(),
        voice: selectedVoice,
        language: language || 'en',
        emotion: emotion || undefined, // Don't send 'auto' if emotion is empty, let backend handle default
        speed: speed,
        pitch: pitch,
        volume: volume,
      };

      console.log('Submitting TTS job:', request);
      const response = await submitTTSJob(request);
      console.log('TTS job response:', response);
      
      if (response.success && response.job_id) {
        setJobId(response.job_id);
        setStatus('queued');
        setProgress(5);
      } else {
        const errorMsg = response.message || 'Failed to submit TTS job';
        setError(errorMsg);
        console.error('TTS job submission failed:', errorMsg);
      }
    } catch (err: any) {
      // Check if this is an authentication error
      if (err.isAuthError || err.message?.includes('not authenticated') || err.message?.includes('Please log in')) {
        // Only redirect if we're actually not authenticated
        // Don't redirect if user is already on login page
        if (!window.location.pathname.includes('/auth/login')) {
          const currentPath = window.location.pathname;
          navigate(`/auth/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
        }
        return;
      }
      
      const errorMsg = err.response?.data?.error || err.message || 'Failed to submit TTS job';
      setError(errorMsg);
      console.error('Error submitting TTS job:', err);
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
    }
  };

  const handleReset = () => {
    setJobId(null);
    setTtsJob(null);
    setError(null);
    setText('');
  };

  const currentStatus = ttsJob?.status || status || 'idle';
  const currentProgress = progress;
  // Get audio URL from result.audio_url or audio_output_url (as per backend docs)
  const audioUrl = ttsJob?.result?.audio_url || ttsJob?.audio_output_url || null;
  const currentError = ttsJob?.error || error;

  return (
    <Box>
      <div className="tool-sticky-title">
        <h1>Text-to-Speech</h1>
      </div>
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      <HowToUse
        title=""
        subtitle="Convert text into natural-sounding speech with multiple voice options"
        instructions="Enter the text you want to convert to speech in the input field. Select a voice from over 300 available voices, or use the search to find a specific voice. Optionally adjust emotion, language, speed, pitch, and volume settings. Click 'Generate Speech' to create the audio. Once generated, you can play, pause, or download the audio file."
      />

      {/* Error Alert */}
      {currentError && (
        <Alert 
          severity="error" 
          sx={{ 
            mb: { xs: 2, md: 3 },
            fontSize: { xs: '0.875rem', md: '1rem' }
          }} 
          onClose={() => setError(null)}
        >
          {currentError}
        </Alert>
      )}

      {/* TTS Input Form */}
      <Paper sx={{ 
        p: { xs: 1.5, sm: 2, md: 3 }, 
        mb: { xs: 2, md: 3 }, 
        bgcolor: '#1e1e1e' 
      }}>
        <Typography 
          variant="h6" 
          gutterBottom 
          sx={{ 
            color: '#e0e0e0', 
            mb: { xs: 1.5, md: 2 },
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          Input Text
        </Typography>
        
        <TextField
          fullWidth
          multiline
          rows={isMobile ? 4 : 6}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          disabled={currentStatus === 'processing' || currentStatus === 'queued'}
          sx={{
            mb: { xs: 2, md: 3 },
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': {
                borderColor: '#333333',
              },
              '&:hover fieldset': {
                borderColor: '#00c6ff',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#00c6ff',
              },
            },
          }}
        />

        {/* Voice Selection */}
        <Box sx={{ mb: 3 }}>
          <VoiceSelector
            voices={voices}
            selectedVoice={selectedVoice}
            onVoiceSelect={(voiceId, voice) => {
              setSelectedVoice(voiceId);
              setLanguage(voice.language);
            }}
            loading={loadingVoices}
            onReload={loadVoices}
          />
        </Box>

        {/* Advanced Options */}
        <Box sx={{ mb: { xs: 2, md: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              color: '#e0e0e0', 
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: '1rem', md: '1.25rem' }
            }}
          >
            Advanced Options
          </Typography>

          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, 
            gap: { xs: 2, md: 3 } 
          }}>
            {/* Emotion */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#a0a0a0' }}>Emotion (Optional)</InputLabel>
              <Select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                label="Emotion (Optional)"
                sx={{
                  color: '#e0e0e0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#333333',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00c6ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00c6ff',
                  },
                }}
              >
                <MenuItem value="">None (Auto)</MenuItem>
                <MenuItem value="auto">Auto</MenuItem>
                <MenuItem value="happy">Happy</MenuItem>
                <MenuItem value="sad">Sad</MenuItem>
                <MenuItem value="angry">Angry</MenuItem>
                <MenuItem value="fearful">Fearful</MenuItem>
                <MenuItem value="disgusted">Disgusted</MenuItem>
                <MenuItem value="surprised">Surprised</MenuItem>
                <MenuItem value="calm">Calm</MenuItem>
                <MenuItem value="fluent">Fluent</MenuItem>
                <MenuItem value="neutral">Neutral</MenuItem>
              </Select>
            </FormControl>

            {/* Language - auto-set from voice, but allow override */}
            <FormControl fullWidth>
              <InputLabel sx={{ color: '#a0a0a0' }}>Language</InputLabel>
              <Select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                label="Language"
                sx={{
                  color: '#e0e0e0',
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#333333',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00c6ff',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00c6ff',
                  },
                }}
              >
                {Array.from(new Set(voices.map(v => v.language).filter(Boolean))).map((lang) => (
                  <MenuItem key={lang} value={lang}>
                    {lang?.toUpperCase() || lang}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          {/* Speed Slider */}
          <Box sx={{ mt: { xs: 2, md: 3 } }}>
            <Typography 
              gutterBottom 
              sx={{ 
                color: '#a0a0a0', 
                mb: 1,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              Speed: {speed.toFixed(1)}x
            </Typography>
            <Slider
              value={speed}
              onChange={(_, value) => setSpeed(value as number)}
              min={0.5}
              max={2.0}
              step={0.1}
              sx={{
                color: '#00c6ff',
                '& .MuiSlider-thumb': {
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(0, 198, 255, 0.16)',
                  },
                },
              }}
            />
          </Box>

            {/* Pitch Slider */}
          <Box sx={{ mt: { xs: 2, md: 3 } }}>
            <Typography 
              gutterBottom 
              sx={{ 
                color: '#a0a0a0', 
                mb: 1,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              Pitch: {pitch.toFixed(1)}
            </Typography>
            <Slider
              value={pitch}
              onChange={(_, value) => setPitch(value as number)}
              min={0.5}
              max={2.0}
              step={0.1}
              sx={{
                color: '#00c6ff',
                '& .MuiSlider-thumb': {
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(0, 198, 255, 0.16)',
                  },
                },
              }}
            />
          </Box>

          {/* Volume Slider */}
          <Box sx={{ mt: { xs: 2, md: 3 } }}>
            <Typography 
              gutterBottom 
              sx={{ 
                color: '#a0a0a0', 
                mb: 1,
                fontSize: { xs: '0.875rem', md: '1rem' }
              }}
            >
              Volume: {Math.round(volume * 100)}%
            </Typography>
            <Slider
              value={volume}
              onChange={(_, value) => setVolume(value as number)}
              min={0}
              max={1}
              step={0.1}
              sx={{
                color: '#00c6ff',
                '& .MuiSlider-thumb': {
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(0, 198, 255, 0.16)',
                  },
                },
              }}
            />
          </Box>
        </Box>

        {/* Submit Button */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          justifyContent: 'flex-end' 
        }}>
          {(currentStatus === 'completed' || currentStatus === 'failed') && (
            <Button
              variant="outlined"
              onClick={handleReset}
              fullWidth={isMobile}
              sx={{
                color: '#a0a0a0',
                borderColor: '#333333',
                '&:hover': {
                  borderColor: '#00c6ff',
                  color: '#00c6ff',
                },
              }}
            >
              Reset
            </Button>
          )}
          <Button
            type="button"
            variant="contained"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit(e);
            }}
            disabled={!text.trim() || !selectedVoice || currentStatus === 'processing' || currentStatus === 'queued'}
            startIcon={<VolumeUpIcon />}
            fullWidth={isMobile}
            sx={{
              bgcolor: '#00c6ff',
              color: '#000',
              '&:hover': {
                bgcolor: '#00b8e6',
              },
              '&:disabled': {
                bgcolor: '#333333',
                color: '#666666',
              },
            }}
          >
            {currentStatus === 'processing' || currentStatus === 'queued' ? 'Processing...' : 'Generate Speech'}
          </Button>
        </Box>
      </Paper>

      {/* Progress and Status */}
      {(currentStatus === 'processing' || currentStatus === 'queued') && (
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          mb: { xs: 2, md: 3 }, 
          bgcolor: '#1e1e1e' 
        }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: { xs: 1, md: 2 }, 
            mb: { xs: 1.5, md: 2 },
            flexWrap: 'wrap'
          }}>
            <StatusLabel 
              status={currentStatus === 'queued' ? 'ready' : 'processing'} 
              message={
                currentStatus === 'queued' ? 'Queued' : 'Processing...'
              } 
            />
          </Box>
          <ProgressBar value={currentProgress} />
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#a0a0a0', 
              mt: 1,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            Polling job status...
          </Typography>
        </Paper>
      )}

      {/* Status for completed/failed */}
      {(currentStatus === 'completed' || currentStatus === 'failed') && !audioUrl && (
        <Paper sx={{ 
          p: { xs: 1.5, sm: 2, md: 3 }, 
          mb: { xs: 2, md: 3 }, 
          bgcolor: '#1e1e1e' 
        }}>
          <StatusLabel 
            status={currentStatus === 'completed' ? 'completed' : 'error'} 
            message={currentStatus === 'completed' ? 'Completed' : (currentError || 'Failed')} 
          />
        </Paper>
      )}

      {/* Audio Player */}
      {audioUrl && currentStatus === 'completed' && (
        <Card sx={{ bgcolor: '#1e1e1e', mb: { xs: 2, md: 3 } }}>
          <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom 
              sx={{ 
                color: '#e0e0e0', 
                mb: { xs: 1.5, md: 2 },
                fontSize: { xs: '1rem', md: '1.25rem' }
              }}
            >
              Generated Audio
            </Typography>
            <AudioPlayer audioUrl={audioUrl} jobId={jobId || ''} />
          </CardContent>
        </Card>
      )}
      </Box>
    </Box>
  );
}


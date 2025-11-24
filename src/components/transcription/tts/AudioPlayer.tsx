/**
 * Audio player component for TTS results
 */

import { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Slider,
  Typography,
  Button,
  LinearProgress,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import DownloadIcon from '@mui/icons-material/Download';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';

export interface AudioPlayerProps {
  audioUrl: string;
  jobId: string;
}

export default function AudioPlayer({ audioUrl, jobId }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };
    const handleLoadStart = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioUrl]);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (_: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const seekTime = Array.isArray(newValue) ? newValue[0] : newValue;
    audio.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (_: Event, newValue: number | number[]) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newVolume = Array.isArray(newValue) ? newValue[0] : newValue;
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isMuted) {
      audio.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts_${jobId}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Box>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Loading indicator */}
      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress sx={{ color: '#00c6ff' }} />
        </Box>
      )}

      {/* Playback Controls */}
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'stretch', sm: 'center' },
        gap: { xs: 1.5, sm: 2 }, 
        mb: 2 
      }}>
        {/* Top Row: Play Button, Time, Progress */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 2 },
          width: { xs: '100%', sm: 'auto' },
          flex: { xs: 'none', sm: 1 }
        }}>
          <IconButton
            onClick={togglePlayPause}
            disabled={isLoading}
            sx={{
              color: '#00c6ff',
              bgcolor: '#252525',
              '&:hover': {
                bgcolor: '#333333',
              },
              '&:disabled': {
                color: '#666666',
              },
              flexShrink: 0,
            }}
          >
            {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
          </IconButton>

          {/* Time Display */}
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#a0a0a0', 
              minWidth: { xs: 70, sm: 80 },
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              flexShrink: 0,
            }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </Typography>

          {/* Progress Slider */}
          <Slider
            value={currentTime}
            max={duration || 0}
            onChange={handleSeek}
            disabled={isLoading}
            sx={{
              flex: { xs: 1, sm: 1 },
              color: '#00c6ff',
              '& .MuiSlider-thumb': {
                '&:hover': {
                  boxShadow: '0 0 0 8px rgba(0, 198, 255, 0.16)',
                },
              },
            }}
          />
        </Box>

        {/* Bottom Row: Volume and Download */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: { xs: 1, sm: 1.5 },
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'space-between', sm: 'flex-end' }
        }}>
          {/* Volume Control */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 1, 
            minWidth: { xs: 'auto', sm: 120 },
            flex: { xs: 1, sm: 'none' }
          }}>
            <IconButton
              onClick={toggleMute}
              size="small"
              sx={{ color: '#a0a0a0', '&:hover': { color: '#00c6ff' } }}
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </IconButton>
            <Slider
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.1}
              sx={{
                width: { xs: 60, sm: 80 },
                color: '#00c6ff',
                '& .MuiSlider-thumb': {
                  '&:hover': {
                    boxShadow: '0 0 0 8px rgba(0, 198, 255, 0.16)',
                  },
                },
              }}
            />
          </Box>

          {/* Download Button */}
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownload}
            size="medium"
            sx={{
              color: '#a0a0a0',
              borderColor: '#333333',
              '&:hover': {
                borderColor: '#00c6ff',
                color: '#00c6ff',
              },
              flexShrink: 0,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              padding: { xs: '0.375rem 0.75rem', sm: '0.5rem 1rem' },
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Download
            </Box>
            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
              DL
            </Box>
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


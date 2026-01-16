import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Paper, Box, Typography, LinearProgress, IconButton, Collapse, Badge } from '@mui/material';
import { Close, Description } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../lib/auth';
import { jobStore } from '../../stores/jobStore';
import type { Job } from '../../types/api';

export default function ProcessingDocumentWidget() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeJobs = jobStore((state) => state.activeJobs);
  const fetchJobs = jobStore((state) => state.fetchJobs);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const prevProcessingCountRef = React.useRef(0);

  // Fetch jobs when component mounts and when user changes
  React.useEffect(() => {
    if (user?.id) {
      console.log('ProcessingDocumentWidget: Fetching jobs for user', user.id);
      fetchJobs(user.id);
    }
  }, [user?.id, fetchJobs]);

  // Poll for job updates every 5 seconds if there are active jobs
  React.useEffect(() => {
    if (!user?.id || activeJobs.length === 0) {
      return;
    }

    const intervalId = setInterval(() => {
      console.log('ProcessingDocumentWidget: Polling for job updates');
      fetchJobs(user.id);
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(intervalId);
  }, [user?.id, activeJobs.length, fetchJobs]);

  // Debug: Log active jobs
  React.useEffect(() => {
    if (activeJobs.length > 0) {
      console.log('ProcessingDocumentWidget: Active jobs found', activeJobs.length, activeJobs);
    }
  }, [activeJobs]);

  // Auto-expand when a new processing document starts
  React.useEffect(() => {
    if (activeJobs.length > prevProcessingCountRef.current && isMinimized) {
      setIsMinimized(false);
    }
    prevProcessingCountRef.current = activeJobs.length;
  }, [activeJobs.length, isMinimized]);

  // Get the most recent processing job (most recently created)
  const currentJob = activeJobs.length > 0 
    ? [...activeJobs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null;

  // If minimized and there are active jobs, show a small badge
  if (isMinimized && activeJobs.length > 0) {
    return (
      <Badge
        badgeContent={activeJobs.length}
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1000,
        }}
      >
        <IconButton
          onClick={() => setIsMinimized(false)}
          sx={{
            bgcolor: theme.palette.mode === 'dark' ? '#1f2937' : '#ffffff',
            color: theme.palette.text.primary,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${theme.palette.divider}`,
            '&:hover': {
              bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#f3f4f6',
            },
          }}
        >
          <Description />
        </IconButton>
      </Badge>
    );
  }

  // Don't render if no active jobs
  if (!currentJob || activeJobs.length === 0) {
    return null;
  }

  const formatFileName = (job: Job) => {
    const filename = job.file_info?.filename || 'Unknown file';
    
    // If it's a YouTube URL or recording, return as is
    if (filename.includes('youtube') || filename.includes('YouTube') || filename.includes('Recording') || filename.includes('recording')) {
      return filename;
    }
    
    // Otherwise return the filename or truncate if too long
    return filename.length > 30 ? filename.substring(0, 30) + '...' : filename;
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Queued...';
      case 'starting':
        return 'Starting...';
      case 'processing':
      case 'running':
        return 'Transcribing audio...';
      default:
        return 'Processing...';
    }
  };

  const getInputTypeIcon = () => {
    return <Description />;
  };

  const widgetStyles = {
    position: 'fixed' as const,
    bottom: 24,
    right: 24,
    zIndex: 9999,
    minWidth: 320,
    maxWidth: 400,
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.3s ease-in-out',
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
      }}
    >
      <Collapse in={!isMinimized} timeout={300}>
        <Paper
          elevation={8}
          onClick={() => navigate('/voice/transcribe')}
          sx={{
            ...widgetStyles,
            backgroundColor: theme.palette.mode === 'dark' ? '#1f2937' : '#ffffff',
            border: `1px solid ${theme.palette.divider}`,
            cursor: 'pointer',
            '&:hover': {
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.2)',
              transform: 'translateY(-2px)',
            },
          }}
        >
        <Box
          sx={{
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: '8px',
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(59, 130, 246, 0.2)' 
                    : 'rgba(59, 130, 246, 0.1)',
                  color: '#3B82F6',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {getInputTypeIcon()}
              </Box>
              <Box>
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    color: theme.palette.text.primary,
                  }}
                >
                  Processing Document
                </Typography>
                {activeJobs.length > 1 && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: '0.75rem',
                      color: theme.palette.text.secondary,
                    }}
                  >
                    +{activeJobs.length - 1} more
                  </Typography>
                )}
              </Box>
            </Box>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setIsMinimized(true);
              }}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' 
                    ? 'rgba(255, 255, 255, 0.1)' 
                    : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>

          {/* Document Name */}
          <Box>
            <Typography
              variant="body2"
              sx={{
                fontSize: '0.8125rem',
                color: theme.palette.text.primary,
                fontWeight: 500,
                wordBreak: 'break-word',
              }}
            >
              {formatFileName(currentJob)}
            </Typography>
          </Box>

          {/* Progress Indicator */}
          <Box>
            <LinearProgress
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(0, 0, 0, 0.1)',
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  backgroundColor: '#3B82F6',
                },
              }}
            />
          </Box>

          {/* Status Text */}
          <Typography
            variant="caption"
            sx={{
              fontSize: '0.75rem',
              color: theme.palette.text.secondary,
              fontStyle: 'italic',
            }}
          >
            {getStatusText(currentJob.status)}
          </Typography>
        </Box>
      </Paper>
    </Collapse>
    </Box>
  );
}

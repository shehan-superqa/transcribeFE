import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  LinearProgress, 
  IconButton, 
  Collapse,
  CircularProgress,
} from '@mui/material';
import { 
  Close, 
  Minimize,
  PictureAsPdf,
  Image as ImageIcon,
  Description,
  CheckCircle,
  ExpandMore,
  AccountTree,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../lib/auth';
import { jobStore } from '../../stores/jobStore';
import { unifiedWebSocketClient } from '../../lib/api/websocket';
import type { Job } from '../../types/api';

interface JobProgress {
  jobId: string;
  progress: number;
  status: string;
  message: string;
  startTime?: number;
}

export default function ProcessingDocumentWidget() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeJobs = jobStore((state) => state.activeJobs);
  const fetchJobs = jobStore((state) => state.fetchJobs);
  const [isMinimized, setIsMinimized] = React.useState(false);
  const [jobProgresses, setJobProgresses] = useState<Map<string, JobProgress>>(new Map());
  const prevProcessingCountRef = React.useRef(0);
  const prevActiveJobsRef = React.useRef<string[]>([]);

  // Fetch jobs when component mounts and when user changes
  useEffect(() => {
    if (user?.id) {
      console.log('ProcessingDocumentWidget: Fetching jobs for user', user.id);
      fetchJobs(user.id);
    }
  }, [user?.id, fetchJobs]);

  // Set up progress listeners for each active job
  useEffect(() => {
    if (!user?.id || activeJobs.length === 0) {
      return;
    }

    const progressCallbacks = new Map<string, (event: any) => void>();

    const setupProgressListeners = async () => {
      try {
        // Connect if not connected
        if (!unifiedWebSocketClient.isConnectedToServer()) {
          await unifiedWebSocketClient.connect();
        }

        // Subscribe to progress for each active job
        for (const job of activeJobs) {
          const jobId = job._id;
          
          // Initialize progress if not exists
          if (!jobProgresses.has(jobId)) {
            const estimatedProgress = estimateProgressFromStatus(job.status);
            setJobProgresses(prev => {
              const newMap = new Map(prev);
              newMap.set(jobId, {
                jobId,
                progress: estimatedProgress,
                status: job.status,
                message: getStatusMessage(job.status),
                startTime: job.started_at ? new Date(job.started_at).getTime() : Date.now(),
              });
              return newMap;
            });
          }

          // Set up progress callback
          const progressCallback = (event: {
            job_id: string;
            status: string;
            progress: number;
            message: string;
            timestamp?: number;
          }) => {
            if (event.job_id === jobId) {
              setJobProgresses(prev => {
                const newMap = new Map(prev);
                newMap.set(jobId, {
                  jobId,
                  progress: event.progress || estimateProgressFromStatus(event.status),
                  status: event.status,
                  message: event.message || getStatusMessage(event.status),
                });
                return newMap;
              });
            }
          };

          progressCallbacks.set(jobId, progressCallback);
          unifiedWebSocketClient.onProgressUpdate(progressCallback);

          // Subscribe to progress updates
          try {
            await unifiedWebSocketClient.subscribeProgress(jobId);
          } catch (err) {
            console.warn(`Failed to subscribe to progress for job ${jobId}:`, err);
          }
        }
      } catch (error) {
        console.error('Failed to set up progress listeners:', error);
      }
    };

    setupProgressListeners();

    return () => {
      // Cleanup progress listeners
      progressCallbacks.forEach((callback, jobId) => {
        unifiedWebSocketClient.off('progress_update', callback);
      });
    };
  }, [user?.id, activeJobs.map(j => j._id).join(',')]);

  // Auto-expand and show widget when a new job is added
  useEffect(() => {
    const currentJobIds = activeJobs.map(j => j._id).sort();
    const prevJobIds = prevActiveJobsRef.current.sort();
    
    // Check if a new job was added (not just count change, but actual new job IDs)
    const hasNewJob = currentJobIds.length > prevJobIds.length || 
      currentJobIds.some(id => !prevJobIds.includes(id));
    
    if (hasNewJob && activeJobs.length > 0) {
      // Auto-expand if minimized
      setIsMinimized(false);
      console.log('ProcessingDocumentWidget: New job detected, showing and expanding widget');
    }
    
    // If this is the first time we have jobs and widget was never shown, don't start minimized
    if (activeJobs.length > 0 && prevActiveJobsRef.current.length === 0) {
      setIsMinimized(false);
    }
    
    prevProcessingCountRef.current = activeJobs.length;
    prevActiveJobsRef.current = currentJobIds;
  }, [activeJobs.map(j => j._id).join(',')]);

  // Periodically update progress estimates for jobs without WebSocket updates
  useEffect(() => {
    const interval = setInterval(() => {
      setJobProgresses(prev => {
        const newMap = new Map(prev);
        let updated = false;

        activeJobs.forEach(job => {
          if (['queued', 'starting', 'processing', 'running'].includes(job.status)) {
            const currentProgress = newMap.get(job._id);
            const startTime = currentProgress?.startTime ?? (job.started_at ? new Date(job.started_at).getTime() : Date.now());
            const estimatedProgress = estimateProgressFromStatus(job.status, startTime);
            
            // Only update if we don't have a real progress value or if estimated is higher
            if (!currentProgress || (currentProgress.progress < 90 && estimatedProgress > currentProgress.progress)) {
              newMap.set(job._id, {
                jobId: job._id,
                progress: estimatedProgress,
                status: job.status,
                message: getStatusMessage(job.status),
                startTime,
              });
              updated = true;
            }
          }
        });

        return updated ? newMap : prev;
      });
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [activeJobs]);

  const estimateProgressFromStatus = (status: string, startTime?: number): number => {
    switch (status) {
      case 'queued':
        return 5;
      case 'starting':
        return 15;
      case 'processing':
      case 'running':
        // If we have a start time, estimate progress based on elapsed time
        // Assume average processing time of 30 seconds
        if (startTime) {
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const estimatedProgress = Math.min(15 + (elapsed / 30) * 70, 90);
          return Math.round(estimatedProgress);
        }
        return 50;
      case 'completed':
        return 100;
      case 'error':
      case 'cancelled':
        return 0;
      default:
        return 25;
    }
  };

  const getStatusMessage = (status: string): string => {
    switch (status) {
      case 'queued':
        return 'Queued...';
      case 'starting':
        return 'Starting...';
      case 'processing':
      case 'running':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'error':
        return 'Error';
      case 'cancelled':
        return 'Cancelled';
      default:
        return 'Processing...';
    }
  };

  const formatFileName = (job: Job) => {
    const filename = job.file_info?.filename || 'Unknown file';
    return filename.length > 30 ? filename.substring(0, 30) + '...' : filename;
  };

  const getFileIcon = (job: Job) => {
    const filename = job.file_info?.filename?.toLowerCase() || '';
    if (filename.endsWith('.pdf')) {
      return <PictureAsPdf />;
    } else if (filename.match(/\.(jpg|jpeg|png|gif|webp|bmp)$/)) {
      return <ImageIcon />;
    }
    return <Description />;
  };

  const getFileTypeColor = (job: Job, isCompleted: boolean) => {
    const filename = job.file_info?.filename?.toLowerCase() || '';
    if (isCompleted) {
      return theme.palette.mode === 'dark' 
        ? 'rgba(127, 19, 236, 0.2)' 
        : 'rgba(127, 19, 236, 0.1)';
    }
    return theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.1)' 
      : 'rgba(0, 0, 0, 0.05)';
  };

  // Don't render if no active jobs
  if (activeJobs.length === 0) {
    return null;
  }

  // Sort jobs: completed first, then by creation date (newest first)
  const sortedJobs = [...activeJobs].sort((a, b) => {
    const aCompleted = a.status === 'completed';
    const bCompleted = b.status === 'completed';
    if (aCompleted !== bCompleted) {
      return aCompleted ? -1 : 1;
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // Calculate estimated time remaining (simple estimation)
  const calculateEstimatedTime = () => {
    const processingJobs = sortedJobs.filter(j => 
      ['queued', 'starting', 'processing', 'running'].includes(j.status)
    );
    if (processingJobs.length === 0) return '0 seconds';
    
    // Estimate ~10 seconds per job
    const estimatedSeconds = processingJobs.length * 10;
    return `${estimatedSeconds} second${estimatedSeconds !== 1 ? 's' : ''}`;
  };

  // Glass effect styles
  const glassEffect = {
    background: theme.palette.mode === 'dark' 
      ? 'rgba(25, 16, 34, 0.85)' 
      : 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  };

  const primaryColor = theme.palette.mode === 'dark' ? '#7f13ec' : '#7f13ec';
  const textSecondary = theme.palette.mode === 'dark' ? '#ab9db9' : '#6b7280';

  // Collapsed pill view
  if (isMinimized) {
    const processingCount = sortedJobs.filter(j => 
      ['queued', 'starting', 'processing', 'running'].includes(j.status)
    ).length;

    return (
      <Box
        sx={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 9999,
        }}
      >
        <Box
          onClick={() => setIsMinimized(false)}
          sx={{
            ...glassEffect,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 2,
            py: 1.5,
            borderRadius: '9999px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            cursor: 'pointer',
            transition: 'all 0.3s',
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' 
                ? 'rgba(255, 255, 255, 0.1)' 
                : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress
              size={24}
              thickness={4}
              sx={{
                color: primaryColor,
                '& .MuiCircularProgress-circle': {
                  strokeLinecap: 'round',
                },
              }}
            />
            <Typography
              sx={{
                position: 'absolute',
                fontSize: '10px',
                fontWeight: 700,
                color: primaryColor,
              }}
            >
              {activeJobs.length}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 700,
                color: theme.palette.text.primary,
                lineHeight: 1.2,
              }}
            >
              Processing {activeJobs.length} {activeJobs.length === 1 ? 'document' : 'documents'}...
            </Typography>
            <Typography
              sx={{
                fontSize: '10px',
                fontWeight: 500,
                color: textSecondary,
                lineHeight: 1,
              }}
            >
              Estimated: {calculateEstimatedTime()}
            </Typography>
          </Box>
          <Box
            sx={{
              ml: 1,
              pl: 1,
              borderLeft: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ExpandMore sx={{ fontSize: 20, color: textSecondary }} />
          </Box>
        </Box>
      </Box>
    );
  }

  // Expanded view
  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 32,
        right: 32,
        zIndex: 9999,
        width: 400,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Collapse in={!isMinimized} timeout={300}>
        <Box
          sx={{
            ...glassEffect,
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              px: 2,
              py: 1.5,
              borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTree sx={{ fontSize: 20, color: primaryColor }} />
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  letterSpacing: '-0.01em',
                }}
              >
                Processing Details
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                sx={{
                  p: 1,
                  color: textSecondary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <Minimize sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMinimized(true);
                }}
                sx={{
                  p: 1,
                  color: textSecondary,
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.1)' 
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                }}
              >
                <Close sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          </Box>

          {/* Scrollable Content */}
          <Box
            sx={{
              maxHeight: 400,
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: 'transparent',
              },
              '&::-webkit-scrollbar-thumb': {
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(255, 255, 255, 0.2)' 
                  : 'rgba(0, 0, 0, 0.2)',
                borderRadius: '3px',
              },
            }}
          >
            {sortedJobs.map((job, index) => {
              const progress = jobProgresses.get(job._id);
              const isCompleted = job.status === 'completed';
              const startTime = progress?.startTime ?? (job.started_at ? new Date(job.started_at).getTime() : undefined);
              const progressValue = progress?.progress ?? estimateProgressFromStatus(job.status, startTime);
              const statusText = progress?.message ?? getStatusMessage(job.status);

              return (
                <Box
                  key={job._id}
                  onClick={() => navigate('/voice/transcribe')}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    px: 2,
                    py: 1.5,
                    minHeight: 72,
                    borderBottom: index < sortedJobs.length - 1 
                      ? `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` 
                      : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(255, 255, 255, 0.05)' 
                        : 'rgba(0, 0, 0, 0.02)',
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: '8px',
                      bgcolor: getFileTypeColor(job, isCompleted),
                      color: isCompleted ? primaryColor : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'),
                      width: 48,
                      height: 48,
                      flexShrink: 0,
                    }}
                  >
                    {getFileIcon(job)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {isCompleted ? (
                      <>
                        <Typography
                          sx={{
                            fontSize: '0.875rem',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            lineHeight: 1.5,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatFileName(job)}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            color: textSecondary,
                            lineHeight: 1.5,
                          }}
                        >
                          {statusText}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Typography
                            sx={{
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              lineHeight: 1.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatFileName(job)}
                          </Typography>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              lineHeight: 1.5,
                            }}
                          >
                            {Math.round(progressValue)}%
                          </Typography>
                        </Box>
                        <Box
                          sx={{
                            width: '100%',
                            height: 6,
                            borderRadius: '9999px',
                            overflow: 'hidden',
                            bgcolor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.1)' 
                              : 'rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              borderRadius: '9999px',
                              bgcolor: primaryColor,
                              width: `${progressValue}%`,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </>
                    )}
                  </Box>
                  {isCompleted && (
                    <Box sx={{ flexShrink: 0 }}>
                      <CheckCircle sx={{ fontSize: 28, color: '#4caf50' }} />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Batch Summary Footer */}
          <Box
            sx={{
              p: 2,
              bgcolor: theme.palette.mode === 'dark' 
                ? 'rgba(127, 19, 236, 0.1)' 
                : 'rgba(127, 19, 236, 0.05)',
            }}
          >
            <Box
              sx={{
                borderRadius: '8px',
                p: 2,
                background: `linear-gradient(180deg, rgba(127, 19, 236, 0.2) 0%, rgba(127, 19, 236, 0.8) 100%)`,
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'space-between',
                gap: 2,
              }}
            >
              <Box sx={{ flex: 1, maxWidth: 440 }}>
                <Typography
                  sx={{
                    fontSize: '1.125rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    mb: 0.5,
                  }}
                >
                  Batch #{activeJobs.length > 0 ? activeJobs[0]._id.slice(-6).toUpperCase() : '000000'}
                </Typography>
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: 'rgba(255, 255, 255, 0.8)',
                    lineHeight: 1.5,
                  }}
                >
                  {sortedJobs.filter(j => ['queued', 'starting', 'processing', 'running'].includes(j.status)).length > 0
                    ? 'Processing in progress'
                    : 'All documents processed'}
                </Typography>
              </Box>
              <Box
                component="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Handle pause action
                }}
                sx={{
                  minWidth: 70,
                  height: 32,
                  px: 1.5,
                  borderRadius: '9999px',
                  bgcolor: '#ffffff',
                  color: primaryColor,
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:active': {
                    transform: 'scale(0.95)',
                  },
                  '&:hover': {
                    opacity: 0.9,
                  },
                }}
              >
                Pause
              </Box>
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Box>
  );
}

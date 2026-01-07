import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle,
  Error as ErrorIcon,
  Refresh,
  HourglassEmpty,
  PlayArrow,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getActiveBills, getBillStatus } from '../../lib/api/financialApi';
import { ActiveJob } from '../../types/financial';
import { useFinancialJobProgress } from '../../hooks/useFinancialJobProgress';

interface JobProgress extends ActiveJob {
  progress?: number;
  message?: string;
  step?: string;
  details?: any;
  streamUrl?: string;
}

export default function ProgressTab() {
  const { theme } = useTheme();
  const [jobs, setJobs] = useState<JobProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const sseConnectionsRef = useRef<Map<string, any>>(new Map());

  const fetchActiveJobs = useCallback(async () => {
    try {
      const response = await getActiveBills();
      if (response.success) {
        // Update jobs with new data, preserving progress info
        setJobs(prevJobs => {
          const jobMap = new Map(prevJobs.map(j => [j.job_id, j]));
          const newJobs: JobProgress[] = response.active_jobs.map(job => {
            const existing = jobMap.get(job.job_id);
            return {
              ...job,
              progress: existing?.progress ?? 0,
              message: existing?.message ?? '',
              step: existing?.step,
              details: existing?.details,
              streamUrl: existing?.streamUrl,
            };
          });
          return newJobs;
        });
        setError(null);
      } else {
        setError('Failed to fetch active jobs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch active jobs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // Fetch active jobs once on mount
    fetchActiveJobs();

    // No polling - rely on SSE connections for real-time updates
    // Jobs will update via SSE streams in JobProgressCard components

    return () => {
      // Clean up SSE connections
      sseConnectionsRef.current.forEach((cleanup) => cleanup());
      sseConnectionsRef.current.clear();
    };
  }, [fetchActiveJobs]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchActiveJobs();
  }, [fetchActiveJobs]);

  const activeJobs = jobs.filter(j => 
    j.status === 'queued' || j.status === 'processing'
  );
  const completedJobs = jobs.filter(j => j.status === 'completed');
  const failedJobs = jobs.filter(j => j.status === 'failed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      case 'queued':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'processing':
        return <PlayArrow fontSize="small" />;
      case 'queued':
        return <HourglassEmpty fontSize="small" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: theme.palette.text.primary,
          }}
        >
          Processing Status
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              color: theme.palette.text.primary,
            }}
          >
            <Refresh sx={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Summary */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Chip
          label={`Active: ${activeJobs.length}`}
          color="info"
          size="small"
        />
        <Chip
          label={`Completed: ${completedJobs.length}`}
          color="success"
          size="small"
        />
        <Chip
          label={`Failed: ${failedJobs.length}`}
          color="error"
          size="small"
        />
      </Box>

      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Active Processes ({activeJobs.length})
          </Typography>
          {activeJobs.map((job) => (
            <JobProgressCard
              key={job.job_id}
              job={job}
              theme={theme}
              onUpdate={(updatedJob) => {
                setJobs(prev => prev.map(j => 
                  j.job_id === updatedJob.job_id ? updatedJob : j
                ));
              }}
            />
          ))}
        </Box>
      )}

      {/* Completed Jobs */}
      {completedJobs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Recently Completed ({completedJobs.length})
          </Typography>
          {completedJobs.slice(0, 5).map((job) => (
            <JobProgressCard
              key={job.job_id}
              job={job}
              theme={theme}
              onUpdate={(updatedJob) => {
                setJobs(prev => prev.map(j => 
                  j.job_id === updatedJob.job_id ? updatedJob : j
                ));
              }}
            />
          ))}
        </Box>
      )}

      {/* Failed Jobs */}
      {failedJobs.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              mb: 2,
              color: theme.palette.text.primary,
            }}
          >
            Failed ({failedJobs.length})
          </Typography>
          {failedJobs.slice(0, 5).map((job) => (
            <JobProgressCard
              key={job.job_id}
              job={job}
              theme={theme}
              onUpdate={(updatedJob) => {
                setJobs(prev => prev.map(j => 
                  j.job_id === updatedJob.job_id ? updatedJob : j
                ));
              }}
            />
          ))}
        </Box>
      )}

      {jobs.length === 0 && !loading && (
        <Alert severity="info">
          No active or recent processes. Upload a bill to get started.
        </Alert>
      )}
    </Box>
  );
}

interface JobProgressCardProps {
  job: JobProgress;
  theme: any;
  onUpdate: (job: JobProgress) => void;
}

function JobProgressCard({ job, theme, onUpdate }: JobProgressCardProps) {
  const [streamUrl, setStreamUrl] = useState<string | undefined>(job.streamUrl);
  const [localJob, setLocalJob] = useState<JobProgress>(job);

  // Construct stream URL if not provided
  useEffect(() => {
    if (!streamUrl && job.job_id) {
      const sseBaseUrl = import.meta.env.VITE_SSE_BASE_URL || 'http://localhost:5002';
      const url = `${sseBaseUrl}/progress/stream/${job.job_id}`;
      setStreamUrl(url);
    }
  }, [job.job_id, streamUrl]);

  // Use SSE hook for real-time updates
  const { progress, status, message, step, details, isConnected } = useFinancialJobProgress(
    job.job_id,
    streamUrl
  );

  // Update local job when SSE data changes
  useEffect(() => {
    if (progress !== undefined || status || message || step) {
      const updated: JobProgress = {
        ...localJob,
        progress: progress !== undefined ? progress : localJob.progress,
        status: (status as any) || localJob.status,
        message: message || localJob.message,
        step: step || localJob.step,
        details: details || localJob.details,
      };
      setLocalJob(updated);
      onUpdate(updated);
    }
  }, [progress, status, message, step, details, localJob, onUpdate]);

  // Also update when job prop changes
  useEffect(() => {
    setLocalJob(job);
  }, [job.job_id, job.status]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      case 'queued':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle fontSize="small" />;
      case 'failed':
        return <ErrorIcon fontSize="small" />;
      case 'processing':
        return <PlayArrow fontSize="small" />;
      case 'queued':
        return <HourglassEmpty fontSize="small" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const isActive = localJob.status === 'processing' || localJob.status === 'queued';
  const currentProgress = localJob.progress ?? 0;

  return (
    <Card
      sx={{
        mb: 2,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="subtitle1"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontWeight: 600,
                color: theme.palette.text.primary,
                mb: 0.5,
              }}
            >
              {localJob.file_info?.filename || 'Unknown file'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.secondary,
                display: 'block',
              }}
            >
              Started: {formatDate(localJob.created_at)}
              {localJob.started_at && ` • Started at: ${formatDate(localJob.started_at)}`}
            </Typography>
            {localJob.file_info?.size && (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.secondary,
                  display: 'block',
                }}
              >
                Size: {formatFileSize(localJob.file_info.size)}
              </Typography>
            )}
          </Box>
          <Chip
            icon={getStatusIcon(localJob.status)}
            label={localJob.status}
            color={getStatusColor(localJob.status) as any}
            size="small"
            sx={{ ml: 2 }}
          />
        </Box>

        {isActive && (
          <Box sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                }}
              >
                {localJob.message || 'Processing...'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.secondary,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                {currentProgress}%
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={currentProgress}
              sx={{
                height: 8,
                borderRadius: 1,
                backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
              }}
            />
            {localJob.step && (
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  mt: 0.5,
                  display: 'block',
                }}
              >
                Step: {localJob.step}
              </Typography>
            )}
            {isConnected && (
              <Chip
                label="Live"
                size="small"
                color="success"
                sx={{ mt: 1, fontSize: '0.65rem', height: '20px' }}
              />
            )}
          </Box>
        )}

        {localJob.status === 'completed' && localJob.result && (
          <Alert severity="success" sx={{ mt: 1 }}>
            Processing completed successfully
            {localJob.result.transaction_id && (
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                Transaction ID: {localJob.result.transaction_id}
              </Typography>
            )}
          </Alert>
        )}

        {localJob.status === 'failed' && localJob.error && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {localJob.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}


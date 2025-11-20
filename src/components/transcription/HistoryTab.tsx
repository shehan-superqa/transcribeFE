/**
 * History tab component
 */

import { useEffect, useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  CircularProgress,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { jobStore } from '../../stores/jobStore';
import { useAuth } from '../../lib/auth';
import { formatRelativeTime } from '../../utils/formatters';
import type { Job } from '../../types/api';

const ITEMS_PER_PAGE = 10;

export default function HistoryTab() {
  const { user } = useAuth();
  const jobs = jobStore((state) => state.jobs);
  const isLoading = jobStore((state) => state.isLoading);
  const fetchJobs = jobStore((state) => state.fetchJobs);
  const cancelJob = jobStore((state) => state.cancelJob);
  const getJob = jobStore((state) => state.getJob);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [refreshingJob, setRefreshingJob] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs(user.id);
    }
  }, [user, fetchJobs]);

  // Filter and search jobs
  const filteredJobs = useMemo(() => {
    let filtered = jobs;

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter((job) => job.status === statusFilter);
    }

    // Search by filename
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((job) =>
        job.file_info?.filename?.toLowerCase().includes(query) ||
        job.prompt?.toLowerCase().includes(query) ||
        false
      );
    }

    // Sort by created_at (newest first)
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [jobs, statusFilter, searchQuery]);

  // Paginate jobs
  const paginatedJobs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredJobs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredJobs, currentPage]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  const handleViewJob = async (jobId: string) => {
    setRefreshingJob(jobId);
    try {
      const job = await getJob(jobId);
      if (job) {
        setSelectedJob(job);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
    } finally {
      setRefreshingJob(null);
    }
  };

  const handleDownload = (job: Job) => {
    if (!job.result?.text) {
      return;
    }

    const blob = new Blob([job.result.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = job.file_info?.filename 
      ? job.file_info.filename.replace(/\.[^/.]+$/, '')
      : `job_${job._id}`;
    a.download = `${filename}_transcription.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50';
      case 'error':
      case 'cancelled':
        return '#f44336';
      case 'processing':
      case 'running':
      case 'starting':
        return '#ff9800';
      case 'queued':
        return '#2196f3';
      default:
        return '#666666';
    }
  };

  const getProgress = (job: Job): number => {
    if (job.status === 'completed') return 100;
    if (job.status === 'error' || job.status === 'cancelled') return 0;
    if (job.status === 'queued') return 10;
    if (job.status === 'starting') return 20;
    if (job.status === 'processing' || job.status === 'running') return 50;
    return 0;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Transcription History
      </Typography>

      {/* Filters and Search */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search by filename..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#00c6ff' },
              },
              '& .MuiInputLabel-root': { color: '#a0a0a0' },
            }}
          />
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: '#a0a0a0' }}>Status</InputLabel>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              sx={{
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="queued">Queued</MenuItem>
              <MenuItem value="processing">Processing</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="error">Error</MenuItem>
              <MenuItem value="cancelled">Cancelled</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" sx={{ color: '#a0a0a0' }}>
            Showing {paginatedJobs.length} of {filteredJobs.length} jobs
          </Typography>
          <Button
            onClick={() => user && fetchJobs(user.id)}
            disabled={isLoading}
            sx={{
              borderColor: '#333333',
              color: '#e0e0e0',
              '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            }}
          >
            {isLoading ? <CircularProgress size={20} /> : 'Refresh'}
          </Button>
        </Box>
      </Paper>

      {/* Job List */}
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        {isLoading && jobs.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#00c6ff' }} />
          </Box>
        ) : paginatedJobs.length === 0 ? (
          <Typography sx={{ color: '#a0a0a0', textAlign: 'center', p: 4 }}>
            {searchQuery || statusFilter !== 'all'
              ? 'No jobs match your filters'
              : 'No jobs found'}
          </Typography>
        ) : (
          <>
            <List>
              {paginatedJobs.map((job) => (
                <ListItem
                  key={job._id}
                  sx={{
                    backgroundColor: '#121212',
                    border: '1px solid #333333',
                    borderRadius: 1,
                    mb: 1,
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    '&:hover': {
                      borderColor: '#00c6ff',
                      backgroundColor: '#1a1a1a',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                          <Typography sx={{ color: '#e0e0e0' }}>
                            {job.file_info?.filename || (job as any).prompt || `Job ${job._id}`}
                          </Typography>
                          <Chip
                            label={job.status}
                            size="small"
                            sx={{
                              backgroundColor: getStatusColor(job.status),
                              color: '#fff',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Typography sx={{ color: '#a0a0a0', mt: 0.5 }}>
                          Created: {formatRelativeTime(job.created_at)}
                          {job.engine_used && ` • Engine: ${job.engine_used}`}
                          {job.file_info?.size_mb && ` • Size: ${job.file_info.size_mb.toFixed(2)} MB`}
                        </Typography>
                      }
                    />
                    <Box>
                      {job.status === 'completed' && job.result && (
                        <>
                          <IconButton
                            onClick={() => handleViewJob(job._id)}
                            sx={{ color: '#00c6ff' }}
                            size="small"
                          >
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton
                            onClick={() => handleDownload(job)}
                            sx={{ color: '#4caf50' }}
                            size="small"
                          >
                            <DownloadIcon />
                          </IconButton>
                        </>
                      )}
                      {['queued', 'processing', 'running'].includes(job.status) && (
                        <IconButton
                          onClick={() => handleCancel(job._id)}
                          sx={{ color: '#f44336' }}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  {['queued', 'processing', 'running', 'starting'].includes(job.status) && (
                    <Box sx={{ width: '100%', mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={getProgress(job)}
                        sx={{
                          backgroundColor: '#333333',
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: getStatusColor(job.status),
                          },
                        }}
                      />
                    </Box>
                  )}
                </ListItem>
              ))}
            </List>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                <Pagination
                  count={totalPages}
                  page={currentPage}
                  onChange={(_, page) => setCurrentPage(page)}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      color: '#e0e0e0',
                      '&.Mui-selected': {
                        backgroundColor: '#00c6ff',
                        color: '#121212',
                      },
                      '&:hover': {
                        backgroundColor: '#1a1a1a',
                      },
                    },
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Paper>

      {/* Job Detail Dialog */}
      <Dialog
        open={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#1e1e1e',
            color: '#e0e0e0',
          },
        }}
      >
        {selectedJob && (
          <>
            <DialogTitle sx={{ color: '#e0e0e0', borderBottom: '1px solid #333333' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">
                  {selectedJob.file_info?.filename || (selectedJob as any).prompt || `Job ${selectedJob._id}`}
                </Typography>
                <Chip
                  label={selectedJob.status}
                  size="small"
                  sx={{
                    backgroundColor: getStatusColor(selectedJob.status),
                    color: '#fff',
                  }}
                />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                  <strong>Created:</strong> {new Date(selectedJob.created_at).toLocaleString()}
                </Typography>
                {selectedJob.started_at && (
                  <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                    <strong>Started:</strong> {new Date(selectedJob.started_at).toLocaleString()}
                  </Typography>
                )}
                {selectedJob.finished_at && (
                  <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                    <strong>Finished:</strong> {new Date(selectedJob.finished_at).toLocaleString()}
                  </Typography>
                )}
                <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                  <strong>Engine:</strong> {selectedJob.engine_used}
                </Typography>
                {selectedJob.file_info?.size_mb && (
                  <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                    <strong>File Size:</strong> {selectedJob.file_info.size_mb.toFixed(2)} MB
                  </Typography>
                )}
                {(selectedJob as any).prompt && (
                  <Typography variant="body2" sx={{ color: '#a0a0a0', mb: 1 }}>
                    <strong>Prompt:</strong> {(selectedJob as any).prompt}
                  </Typography>
                )}
                {selectedJob.error && (
                  <Alert severity="error" sx={{ mt: 2, backgroundColor: '#1e1e1e', color: '#f44336' }}>
                    {selectedJob.error}
                  </Alert>
                )}
              </Box>
              {selectedJob.result?.text ? (
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  value={selectedJob.result.text}
                  InputProps={{ readOnly: true }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#e0e0e0',
                      backgroundColor: '#121212',
                      '& fieldset': { borderColor: '#333333' },
                    },
                  }}
                />
              ) : (
                <Typography sx={{ color: '#a0a0a0', textAlign: 'center', p: 4 }}>
                  No transcription result available
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ borderTop: '1px solid #333333', p: 2 }}>
              {selectedJob.result?.text && (
                <Button
                  onClick={() => handleDownload(selectedJob)}
                  startIcon={<DownloadIcon />}
                  sx={{
                    color: '#00c6ff',
                    '&:hover': { backgroundColor: '#1a1a1a' },
                  }}
                >
                  Download
                </Button>
              )}
              <Button
                onClick={() => setSelectedJob(null)}
                sx={{
                  color: '#e0e0e0',
                  '&:hover': { backgroundColor: '#1a1a1a' },
                }}
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}

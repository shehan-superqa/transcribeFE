/**
 * History tab component
 */

import { useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { jobStore } from '../../stores/jobStore';
import { useAuth } from '../../lib/auth';
import { formatRelativeTime } from '../../utils/formatters';

export default function HistoryTab() {
  const { user } = useAuth();
  const jobs = jobStore((state) => state.jobs);
  const isLoading = jobStore((state) => state.isLoading);
  const fetchJobs = jobStore((state) => state.fetchJobs);
  const cancelJob = jobStore((state) => state.cancelJob);

  useEffect(() => {
    if (user) {
      fetchJobs(user.id);
    }
  }, [user, fetchJobs]);

  const handleCancel = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error('Error cancelling job:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Transcription History
      </Typography>
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#e0e0e0' }}>Job History</Typography>
          <Button 
            onClick={() => user && fetchJobs(user.id)}
            sx={{
              borderColor: '#333333',
              color: '#e0e0e0',
              '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            }}
          >
            Refresh
          </Button>
        </Box>
        {isLoading ? (
          <Typography sx={{ color: '#a0a0a0' }}>Loading...</Typography>
        ) : jobs.length === 0 ? (
          <Typography sx={{ color: '#a0a0a0' }}>No jobs found</Typography>
        ) : (
          <List>
            {jobs.map((job) => (
              <ListItem
                key={job._id}
                sx={{
                  backgroundColor: '#121212',
                  border: '1px solid #333333',
                  borderRadius: 1,
                  mb: 1,
                  '&:hover': {
                    borderColor: '#00c6ff',
                    backgroundColor: '#1a1a1a',
                  },
                }}
                secondaryAction={
                  ['queued', 'processing', 'running'].includes(job.status) && (
                    <IconButton
                      edge="end"
                      onClick={() => handleCancel(job._id)}
                      sx={{ color: '#f44336' }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  )
                }
              >
                <ListItemText
                  primary={<Typography sx={{ color: '#e0e0e0' }}>{job.file_info.filename}</Typography>}
                  secondary={
                    <Typography sx={{ color: '#a0a0a0' }}>
                      Status: {job.status} | Created: {formatRelativeTime(job.created_at)}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}


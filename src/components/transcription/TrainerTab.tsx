/**
 * Trainer tab component for custom model training
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
} from '@mui/material';

export default function TrainerTab() {
  const [language, setLanguage] = useState('sinhala');
  const [audioDir, setAudioDir] = useState('');
  const [transcriptionsFile, setTranscriptionsFile] = useState('');
  const [isTraining, setIsTraining] = useState(false);
  const [progress] = useState(0);

  const handleStartTraining = () => {
    setIsTraining(true);
    // Training logic here
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Custom Language Model Trainer
      </Typography>

      {/* Training Configuration */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Configuration
        </Typography>
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel sx={{ color: '#a0a0a0' }}>Target Language</InputLabel>
          <Select 
            value={language} 
            onChange={(e) => setLanguage(e.target.value)}
            sx={{ 
              color: '#e0e0e0',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
            }}
          >
            <MenuItem value="sinhala">Sinhala</MenuItem>
            <MenuItem value="tamil">Tamil</MenuItem>
            <MenuItem value="hindi">Hindi</MenuItem>
            <MenuItem value="custom">Custom</MenuItem>
          </Select>
        </FormControl>
        <TextField
          fullWidth
          label="Audio Files Directory"
          value={audioDir}
          onChange={(e) => setAudioDir(e.target.value)}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
          }}
        />
        <TextField
          fullWidth
          label="Transcriptions File"
          value={transcriptionsFile}
          onChange={(e) => setTranscriptionsFile(e.target.value)}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
          }}
        />
      </Paper>

      {/* Training Controls */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Controls
        </Typography>
        {isTraining && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={progress}
              sx={{
                backgroundColor: '#333333',
                '& .MuiLinearProgress-bar': {
                  backgroundColor: '#00c6ff',
                },
              }}
            />
            <Typography variant="body2" sx={{ mt: 1, color: '#a0a0a0' }}>
              Training in progress...
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleStartTraining}
            disabled={isTraining}
            sx={{
              backgroundColor: '#4caf50',
              color: '#fff',
              '&:hover': { backgroundColor: '#45a049' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Start Training
          </Button>
          <Button 
            variant="contained" 
            disabled={!isTraining}
            sx={{
              backgroundColor: '#f44336',
              color: '#fff',
              '&:hover': { backgroundColor: '#da190b' },
              '&:disabled': { backgroundColor: '#333333', color: '#666666' },
            }}
          >
            Stop Training
          </Button>
        </Box>
      </Paper>

      {/* Training Log */}
      <Paper sx={{ p: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Training Log
        </Typography>
        <TextField
          fullWidth
          multiline
          rows={8}
          value="Training log will appear here..."
          InputProps={{ readOnly: true }}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              backgroundColor: '#121212',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
          }}
        />
      </Paper>
    </Box>
  );
}


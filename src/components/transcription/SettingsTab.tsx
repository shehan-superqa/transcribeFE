/**
 * Settings tab component
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
} from '@mui/material';
import { settingsStore } from '../../stores/settingsStore';

export default function SettingsTab() {
  const audio = settingsStore((state) => state.audio);
  const output_dir = settingsStore((state) => state.output_dir);
  const api_key = settingsStore((state) => state.api_key);
  const updateAudioSettings = settingsStore((state) => state.updateAudioSettings);
  const updateOutputDir = settingsStore((state) => state.updateOutputDir);
  const updateApiKey = settingsStore((state) => state.updateApiKey);

  const [sampleRate, setSampleRate] = useState(audio.sample_rate);
  const [channels, setChannels] = useState(audio.channels);
  const [outputDir, setOutputDir] = useState(output_dir);
  const [apiKey, setApiKey] = useState(api_key);

  const handleSave = () => {
    updateAudioSettings({ sample_rate: sampleRate, channels });
    updateOutputDir(outputDir);
    updateApiKey(apiKey);
    // Show success message
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Settings
      </Typography>

      {/* Audio Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Audio Settings
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
          <TextField
            label="Sample Rate"
            type="number"
            value={sampleRate}
            onChange={(e) => setSampleRate(Number(e.target.value))}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#00c6ff' },
              },
              '& .MuiInputLabel-root': { color: '#a0a0a0' },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: '#a0a0a0' }}>Channels</InputLabel>
            <Select 
              value={channels} 
              onChange={(e) => setChannels(e.target.value as number)}
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              <MenuItem value={1}>Mono (1)</MenuItem>
              <MenuItem value={2}>Stereo (2)</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Output Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          Output Settings
        </Typography>
        <TextField
          fullWidth
          label="Output Directory"
          value={outputDir}
          onChange={(e) => setOutputDir(e.target.value)}
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
        <Button 
          variant="outlined"
          sx={{
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
          }}
        >
          Browse
        </Button>
      </Paper>

      {/* API Settings */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: '#1e1e1e', border: '1px solid #333333' }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#e0e0e0', mb: 2 }}>
          API Settings
        </Typography>
        <TextField
          fullWidth
          label="OpenAI API Key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
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

      <Button 
        variant="contained" 
        onClick={handleSave}
        sx={{
          backgroundColor: '#00c6ff',
          color: '#121212',
          '&:hover': { backgroundColor: '#00b0e6' },
        }}
      >
        Save Settings
      </Button>
    </Box>
  );
}


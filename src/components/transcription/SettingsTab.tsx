/**
 * Settings tab component
 */

import { useState, useEffect } from 'react';
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
  Alert,
  CircularProgress,
} from '@mui/material';
import { settingsStore } from '../../stores/settingsStore';
import { getUserSettings, saveUserSettings, type UserSettings } from '../../lib/api';

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
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Load settings from backend on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await getUserSettings();
      if (response.success && response.data) {
        // Handle new API response structure where sample_rate is directly on data
        // or old structure where it's nested under audio
        const sampleRate = (response.data as any).sample_rate ?? response.data.audio?.sample_rate;
        const channels = response.data.audio?.channels ?? 1; // Default to mono if not provided
        const outputDir = response.data.output_dir ?? '';
        const apiKey = response.data.api_key ?? '';
        
        if (sampleRate !== undefined) {
          setSampleRate(sampleRate);
          setChannels(channels);
          setOutputDir(outputDir);
          setApiKey(apiKey);
          // Also update local store
          updateAudioSettings({
            sample_rate: sampleRate,
            channels: channels,
          });
          updateOutputDir(outputDir);
          updateApiKey(apiKey);
        }
      }
    } catch (error: any) {
      // If settings don't exist yet, that's okay - use defaults
      console.warn('Failed to load settings from backend:', error);
      // Don't show error for 404 - settings might not exist yet
      if (error.response?.status !== 404) {
        setErrorMessage('Failed to load settings. Using default values.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateSettings = (): boolean => {
    const errors: Record<string, string> = {};

    if (sampleRate < 8000 || sampleRate > 192000) {
      errors.sampleRate = 'Sample rate must be between 8000 and 192000 Hz';
    }

    if (channels !== 1 && channels !== 2) {
      errors.channels = 'Channels must be 1 (mono) or 2 (stereo)';
    }

    if (outputDir.trim() === '') {
      errors.outputDir = 'Output directory is required';
    }

    // API key validation is optional - user might not have one yet
    // But if provided, check basic format
    if (apiKey.trim() !== '' && apiKey.length < 10) {
      errors.apiKey = 'API key appears to be invalid';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateSettings()) {
      setErrorMessage('Please fix validation errors before saving');
      return;
    }

    setSaving(true);
    try {
      const settings: UserSettings = {
        audio: {
          sample_rate: sampleRate,
          channels: channels,
        },
        output_dir: outputDir.trim(),
        api_key: apiKey.trim(),
      };

      const response = await saveUserSettings(settings);
      
      if (response.success) {
        // Update local store
        updateAudioSettings(settings.audio);
        updateOutputDir(settings.output_dir);
        updateApiKey(settings.api_key);
        setSuccessMessage('Settings saved successfully!');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        throw new Error(response.message || 'Failed to save settings');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to save settings';
      setErrorMessage(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress sx={{ color: '#00c6ff' }} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ color: '#e0e0e0', mb: 3 }}>
        Settings
      </Typography>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, backgroundColor: '#1e1e1e', color: '#4caf50' }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, backgroundColor: '#1e1e1e', color: '#f44336' }}>
          {errorMessage}
        </Alert>
      )}

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
            onChange={(e) => {
              setSampleRate(Number(e.target.value));
              if (validationErrors.sampleRate) {
                setValidationErrors((prev) => {
                  const newErrors = { ...prev };
                  delete newErrors.sampleRate;
                  return newErrors;
                });
              }
            }}
            error={!!validationErrors.sampleRate}
            helperText={validationErrors.sampleRate}
            inputProps={{ min: 8000, max: 192000, step: 1000 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#e0e0e0',
                '& fieldset': { borderColor: '#333333' },
                '&:hover fieldset': { borderColor: '#00c6ff' },
              },
              '& .MuiInputLabel-root': { color: '#a0a0a0' },
              '& .MuiFormHelperText-root': { color: '#f44336' },
            }}
          />
          <FormControl fullWidth error={!!validationErrors.channels}>
            <InputLabel sx={{ color: '#a0a0a0' }}>Channels</InputLabel>
            <Select 
              value={channels} 
              onChange={(e) => {
                setChannels(e.target.value as number);
                if (validationErrors.channels) {
                  setValidationErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors.channels;
                    return newErrors;
                  });
                }
              }}
              sx={{ 
                color: '#e0e0e0',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#333333' },
                '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#00c6ff' },
              }}
            >
              <MenuItem value={1}>Mono (1)</MenuItem>
              <MenuItem value={2}>Stereo (2)</MenuItem>
            </Select>
            {validationErrors.channels && (
              <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, ml: 1.75 }}>
                {validationErrors.channels}
              </Typography>
            )}
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
          onChange={(e) => {
            setOutputDir(e.target.value);
            if (validationErrors.outputDir) {
              setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.outputDir;
                return newErrors;
              });
            }
          }}
          error={!!validationErrors.outputDir}
          helperText={validationErrors.outputDir || 'Path where transcription outputs will be saved'}
          sx={{ 
            mb: 2,
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
            '& .MuiFormHelperText-root': { color: validationErrors.outputDir ? '#f44336' : '#a0a0a0' },
          }}
        />
        <Button 
          variant="outlined"
          disabled
          sx={{
            borderColor: '#333333',
            color: '#666666',
            '&:disabled': { borderColor: '#333333', color: '#666666' },
          }}
        >
          Browse (Coming Soon)
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
          onChange={(e) => {
            setApiKey(e.target.value);
            if (validationErrors.apiKey) {
              setValidationErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors.apiKey;
                return newErrors;
              });
            }
          }}
          error={!!validationErrors.apiKey}
          helperText={validationErrors.apiKey || 'Optional: Your OpenAI API key for transcription'}
          sx={{
            '& .MuiOutlinedInput-root': {
              color: '#e0e0e0',
              '& fieldset': { borderColor: '#333333' },
              '&:hover fieldset': { borderColor: '#00c6ff' },
            },
            '& .MuiInputLabel-root': { color: '#a0a0a0' },
            '& .MuiFormHelperText-root': { color: validationErrors.apiKey ? '#f44336' : '#a0a0a0' },
          }}
        />
      </Paper>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button 
          variant="contained" 
          onClick={handleSave}
          disabled={saving}
          sx={{
            backgroundColor: '#00c6ff',
            color: '#121212',
            '&:hover': { backgroundColor: '#00b0e6' },
            '&:disabled': { backgroundColor: '#333333', color: '#666666' },
          }}
        >
          {saving ? (
            <>
              <CircularProgress size={20} sx={{ color: '#121212', mr: 1 }} />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
        <Button
          variant="outlined"
          onClick={loadSettings}
          disabled={saving || loading}
          sx={{
            borderColor: '#333333',
            color: '#e0e0e0',
            '&:hover': { borderColor: '#00c6ff', backgroundColor: '#1a1a1a' },
            '&:disabled': { borderColor: '#333333', color: '#666666' },
          }}
        >
          Reload from Server
        </Button>
      </Box>
    </Box>
  );
}

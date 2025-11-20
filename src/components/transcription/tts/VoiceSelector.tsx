/**
 * Voice selector component for TTS
 * Handles selection from 300+ voices with search and filtering
 */

import { useState, useMemo } from 'react';
import {
  Box,
  TextField,
  Typography,
  Chip,
  CircularProgress,
  Autocomplete,
} from '@mui/material';
import type { TTSVoice } from '../../../lib/api/ttsApi';

export interface VoiceSelectorProps {
  voices: TTSVoice[];
  selectedVoice: string;
  onVoiceSelect: (voiceId: string, voice: TTSVoice) => void;
  loading?: boolean;
  onReload?: () => void;
}

export default function VoiceSelector({
  voices,
  selectedVoice,
  onVoiceSelect,
  loading = false,
  onReload,
}: VoiceSelectorProps) {

  // No filtering - use all voices
  const filteredVoices = voices;

  // Group voices by language
  const voicesByLanguage = useMemo(() => {
    const grouped: Record<string, TTSVoice[]> = {};
    filteredVoices.forEach((voice) => {
      const lang = voice.language || 'unknown';
      if (!grouped[lang]) {
        grouped[lang] = [];
      }
      grouped[lang].push(voice);
    });
    return grouped;
  }, [filteredVoices]);


  const selectedVoiceObj = voices.find((v) => v.id === selectedVoice);

  return (
    <Box>
      {/* Voice Count */}
      <Typography 
        variant="body2" 
        sx={{ 
          color: '#a0a0a0', 
          mb: { xs: 1.5, md: 2 },
          fontSize: { xs: '0.75rem', md: '0.875rem' }
        }}
      >
        {filteredVoices.length} voice{filteredVoices.length !== 1 ? 's' : ''} available
      </Typography>

      {/* Voice Selection - Autocomplete for better UX with many voices */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress size={24} sx={{ color: '#00c6ff' }} />
        </Box>
      ) : (
        <Autocomplete
          options={filteredVoices}
          value={selectedVoiceObj || null}
          onChange={(_, newValue) => {
            if (newValue) {
              onVoiceSelect(newValue.id, newValue);
            }
          }}
          getOptionLabel={(option) => {
            const parts = [option.name];
            if (option.language) parts.push(`(${option.language.toUpperCase()})`);
            if (option.gender) parts.push(`- ${option.gender}`);
            if (option.accent) parts.push(`[${option.accent}]`);
            return parts.join(' ');
          }}
          groupBy={(option) => (option.language || 'unknown').toUpperCase()}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Voice"
              placeholder="Search and select a voice..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#e0e0e0',
                  fontSize: { xs: '0.875rem', md: '1rem' },
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
                '& .MuiInputLabel-root': {
                  color: '#a0a0a0',
                  fontSize: { xs: '0.875rem', md: '1rem' },
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} key={option.id}>
              <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                <Typography 
                  sx={{ 
                    color: '#e0e0e0',
                    fontSize: { xs: '0.875rem', md: '1rem' },
                    wordBreak: 'break-word'
                  }}
                >
                  {option.name}
                </Typography>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 0.5, md: 1 }, 
                    mt: 0.5,
                    flexWrap: 'wrap'
                  }}>
                  {option.language && (
                    <Chip
                      label={option.language.toUpperCase()}
                      size="small"
                      sx={{
                        height: { xs: 18, md: 20 },
                        fontSize: { xs: '0.65rem', md: '0.7rem' },
                        bgcolor: '#333333',
                        color: '#a0a0a0',
                      }}
                    />
                  )}
                  {option.gender && (
                    <Chip
                      label={option.gender}
                      size="small"
                      sx={{
                        height: { xs: 18, md: 20 },
                        fontSize: { xs: '0.65rem', md: '0.7rem' },
                        bgcolor: '#333333',
                        color: '#a0a0a0',
                      }}
                    />
                  )}
                  {option.accent && (
                    <Chip
                      label={option.accent}
                      size="small"
                      sx={{
                        height: { xs: 18, md: 20 },
                        fontSize: { xs: '0.65rem', md: '0.7rem' },
                        bgcolor: '#333333',
                        color: '#a0a0a0',
                      }}
                    />
                  )}
                  {option.provider && (
                    <Chip
                      label={option.provider}
                      size="small"
                      sx={{
                        height: { xs: 18, md: 20 },
                        fontSize: { xs: '0.65rem', md: '0.7rem' },
                        bgcolor: '#1e3a5f',
                        color: '#a0a0a0',
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          )}
          sx={{
            '& .MuiAutocomplete-popper': {
              '& .MuiPaper-root': {
                bgcolor: '#1e1e1e',
                border: '1px solid #333333',
              },
            },
          }}
        />
      )}

      {/* Selected Voice Info */}
      {selectedVoiceObj && (
        <Box sx={{ 
          mt: { xs: 1.5, md: 2 }, 
          p: { xs: 1.5, md: 2 }, 
          bgcolor: '#252525', 
          borderRadius: 1 
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              color: '#a0a0a0', 
              mb: 1,
              fontSize: { xs: '0.75rem', md: '0.875rem' }
            }}
          >
            Selected Voice:
          </Typography>
          <Typography 
            variant="body1" 
            sx={{ 
              color: '#e0e0e0', 
              fontWeight: 'bold',
              fontSize: { xs: '0.875rem', md: '1rem' },
              wordBreak: 'break-word'
            }}
          >
            {selectedVoiceObj.name}
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            gap: { xs: 0.5, md: 1 }, 
            mt: 1, 
            flexWrap: 'wrap' 
          }}>
            {selectedVoiceObj.language && (
              <Chip 
                label={`Language: ${selectedVoiceObj.language.toUpperCase()}`} 
                size="small"
                sx={{
                  fontSize: { xs: '0.65rem', md: '0.75rem' },
                  height: { xs: 20, md: 24 }
                }}
              />
            )}
            {selectedVoiceObj.gender && (
              <Chip 
                label={`Gender: ${selectedVoiceObj.gender}`} 
                size="small"
                sx={{
                  fontSize: { xs: '0.65rem', md: '0.75rem' },
                  height: { xs: 20, md: 24 }
                }}
              />
            )}
            {selectedVoiceObj.accent && (
              <Chip 
                label={`Accent: ${selectedVoiceObj.accent}`} 
                size="small"
                sx={{
                  fontSize: { xs: '0.65rem', md: '0.75rem' },
                  height: { xs: 20, md: 24 }
                }}
              />
            )}
            {selectedVoiceObj.provider && (
              <Chip 
                label={`Provider: ${selectedVoiceObj.provider}`} 
                size="small"
                sx={{
                  fontSize: { xs: '0.65rem', md: '0.75rem' },
                  height: { xs: 20, md: 24 }
                }}
              />
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}


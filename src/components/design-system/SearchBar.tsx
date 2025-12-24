import React, { useEffect, useRef } from 'react';
import { TextField, InputAdornment, Box, Typography } from '@mui/material';
import { Search } from '@mui/icons-material';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  shortcut?: string;
  onShortcutPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search',
  shortcut = 'Ctrl + K',
  onShortcutPress,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (Mac)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (onShortcutPress) {
          onShortcutPress();
        } else {
          inputRef.current?.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onShortcutPress]);

  return (
    <Box sx={{ position: 'relative', width: '100%' }}>
      <TextField
        inputRef={inputRef}
        fullWidth
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        variant="outlined"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.5rem',
            backgroundColor: '#ffffff',
            paddingRight: '120px',
            '& fieldset': {
              borderColor: '#e5e7eb',
            },
            '&:hover fieldset': {
              borderColor: '#9ca3af',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#6b21a8',
            },
          },
          '& .MuiInputBase-input': {
            padding: '0.75rem 1rem',
            fontSize: '0.875rem',
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ color: '#6b7280', fontSize: '1.25rem' }} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  border: '1px solid #e5e7eb',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '0.75rem',
                    color: '#6b7280',
                    fontFamily: 'monospace',
                    fontWeight: 500,
                  }}
                >
                  {shortcut}
                </Typography>
              </Box>
            </InputAdornment>
          ),
        }}
      />
    </Box>
  );
};

export default SearchBar;


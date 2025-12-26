/**
 * Reusable progress bar component
 */

import { LinearProgress, Box, Typography, useTheme } from '@mui/material';

export interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
}

export default function ProgressBar({
  value,
  label,
  showPercentage = true,
}: ProgressBarProps) {
  const theme = useTheme();
  
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="body2" sx={{ mb: 1, color: theme.palette.text.secondary }}>
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={Math.min(100, Math.max(0, value))}
          sx={{ 
            flexGrow: 1, 
            height: 8, 
            borderRadius: 1,
            backgroundColor: theme.palette.mode === 'dark' ? '#333333' : '#e5e7eb',
            '& .MuiLinearProgress-bar': {
              backgroundColor: theme.palette.primary.main,
            },
          }}
        />
        {showPercentage && (
          <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right', color: theme.palette.text.secondary }}>
            {Math.round(value)}%
          </Typography>
        )}
      </Box>
    </Box>
  );
}


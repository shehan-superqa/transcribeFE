/**
 * Reusable progress bar component
 */

import { LinearProgress, Box, Typography } from '@mui/material';

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
  return (
    <Box sx={{ width: '100%' }}>
      {label && (
        <Typography variant="body2" sx={{ mb: 1, color: '#e0e0e0' }}>
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
            backgroundColor: '#333333',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#00c6ff',
            },
          }}
        />
        {showPercentage && (
          <Typography variant="body2" sx={{ minWidth: 50, textAlign: 'right', color: '#e0e0e0' }}>
            {Math.round(value)}%
          </Typography>
        )}
      </Box>
    </Box>
  );
}


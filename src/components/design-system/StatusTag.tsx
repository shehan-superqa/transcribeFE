import React from 'react';
import { Chip } from '@mui/material';

export type StatusType = 'awaiting' | 'open' | 'completed' | 'error' | 'warning' | 'success';

interface StatusTagProps {
  status: StatusType;
  children: React.ReactNode;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

const statusColors: Record<StatusType, { bg: string; text: string; border?: string }> = {
  awaiting: {
    bg: '#6b21a8',
    text: '#ffffff',
  },
  open: {
    bg: '#10b981',
    text: '#ffffff',
  },
  completed: {
    bg: '#6b7280',
    text: '#ffffff',
  },
  error: {
    bg: '#ef4444',
    text: '#ffffff',
  },
  warning: {
    bg: '#f59e0b',
    text: '#ffffff',
  },
  success: {
    bg: '#10b981',
    text: '#ffffff',
  },
};

export const StatusTag: React.FC<StatusTagProps> = ({
  status,
  children,
  size = 'medium',
  variant = 'filled',
}) => {
  const colors = statusColors[status];

  return (
    <Chip
      label={children}
      size={size}
      variant={variant}
      sx={{
        backgroundColor: variant === 'filled' ? colors.bg : 'transparent',
        color: variant === 'filled' ? colors.text : colors.bg,
        border: variant === 'outlined' ? `1px solid ${colors.bg}` : 'none',
        borderRadius: '0.5rem',
        fontWeight: 500,
        fontSize: size === 'small' ? '0.75rem' : '0.875rem',
        height: size === 'small' ? '24px' : '32px',
        '& .MuiChip-label': {
          padding: size === 'small' ? '0 0.5rem' : '0 0.75rem',
        },
      }}
    />
  );
};

export default StatusTag;


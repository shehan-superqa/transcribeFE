/**
 * Status label component
 */

import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

export interface StatusLabelProps {
  status: 'ready' | 'processing' | 'completed' | 'error';
  message: string;
}

const statusConfig = {
  ready: {
    color: 'success' as const,
    icon: <RadioButtonUncheckedIcon />,
  },
  processing: {
    color: 'warning' as const,
    icon: <HourglassEmptyIcon />,
  },
  completed: {
    color: 'success' as const,
    icon: <CheckCircleIcon />,
  },
  error: {
    color: 'error' as const,
    icon: <ErrorIcon />,
  },
};

export default function StatusLabel({ status, message }: StatusLabelProps) {
  const config = statusConfig[status];

  return (
    <Chip
      icon={config.icon}
      label={message}
      color={config.color}
      sx={{ 
        fontWeight: 'bold',
        backgroundColor: status === 'processing' ? '#ff9800' : status === 'error' ? '#f44336' : '#4caf50',
        color: '#fff',
      }}
    />
  );
}


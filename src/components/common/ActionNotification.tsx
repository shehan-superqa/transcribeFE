import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Button } from '@mui/material';
import {
  TaskAlt as TaskAltIcon,
  Close as CloseIcon,
  ArrowOutward as ArrowOutwardIcon,
} from '@mui/icons-material';

export interface NotificationAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

export interface ActionNotificationData {
  id: string;
  title: string;
  message: string;
  icon?: React.ReactNode;
  actions?: NotificationAction[];
  duration?: number; // Auto-dismiss duration in milliseconds (default: 8000ms)
  type?: 'success' | 'info' | 'warning' | 'error';
}

interface ActionNotificationProps {
  notification: ActionNotificationData;
  onClose: (id: string) => void;
  onDismiss: (id: string) => void;
}

export default function ActionNotification({
  notification,
  onClose,
  onDismiss,
}: ActionNotificationProps) {
  const [progress, setProgress] = useState(100);
  const duration = notification.duration || 8000;

  useEffect(() => {
    // Animate progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev - (100 / (duration / 50));
        return newProgress <= 0 ? 0 : newProgress;
      });
    }, 50);

    // Auto-dismiss after duration
    const timeout = setTimeout(() => {
      onDismiss(notification.id);
    }, duration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [duration, notification.id, onDismiss]);

  const getIconColor = () => {
    switch (notification.type) {
      case 'success':
        return '#7f13ec'; // primary purple
      case 'error':
        return '#ef4444';
      case 'warning':
        return '#f59e0b';
      default:
        return '#7f13ec';
    }
  };

  const getIconBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'rgba(127, 19, 236, 0.2)'; // primary purple with opacity
      case 'error':
        return 'rgba(239, 68, 68, 0.2)';
      case 'warning':
        return 'rgba(245, 158, 11, 0.2)';
      default:
        return 'rgba(127, 19, 236, 0.2)';
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minWidth: '380px',
        maxWidth: '420px',
        backgroundColor: '#0a0514',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        boxShadow: '0 25px 50px -12px rgba(127, 19, 236, 0.25)',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        {/* Status Icon */}
        <Box
          sx={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: getIconBgColor(),
            color: getIconColor(),
          }}
        >
          {notification.icon || (
            <TaskAltIcon sx={{ fontSize: 28 }} />
          )}
        </Box>

        {/* Text Content */}
        <Box sx={{ flex: 1, pr: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography
              sx={{
                color: '#ffffff',
                fontSize: '16px',
                fontWeight: 700,
                lineHeight: 1.2,
                fontFamily: "'Manrope', sans-serif",
              }}
            >
              {notification.title}
            </Typography>
          </Box>
          <Typography
            sx={{
              color: '#ab9db9',
              fontSize: '14px',
              fontWeight: 400,
              lineHeight: 1.5,
              fontFamily: "'Manrope', sans-serif",
              mb: notification.actions && notification.actions.length > 0 ? 2 : 0,
            }}
          >
            {notification.message}
          </Typography>

          {/* Actions */}
          {notification.actions && notification.actions.length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant === 'primary' ? 'contained' : 'text'}
                  sx={{
                    px: action.variant === 'primary' ? 2.5 : 2,
                    py: 1,
                    borderRadius: '9999px',
                    fontSize: '14px',
                    fontWeight: action.variant === 'primary' ? 700 : 500,
                    textTransform: 'none',
                    fontFamily: "'Manrope', sans-serif",
                    backgroundColor: action.variant === 'primary' ? '#7f13ec' : 'rgba(255, 255, 255, 0.05)',
                    color: action.variant === 'primary' ? '#ffffff' : 'rgba(255, 255, 255, 0.7)',
                    '&:hover': {
                      backgroundColor: action.variant === 'primary' ? 'rgba(127, 19, 236, 0.8)' : 'rgba(255, 255, 255, 0.1)',
                    },
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  {action.label}
                  {action.variant === 'primary' && (
                    <ArrowOutwardIcon sx={{ fontSize: 14 }} />
                  )}
                </Button>
              ))}
              <Button
                onClick={() => onDismiss(notification.id)}
                sx={{
                  px: 1.5,
                  py: 1,
                  borderRadius: '9999px',
                  fontSize: '14px',
                  fontWeight: 500,
                  textTransform: 'none',
                  fontFamily: "'Manrope', sans-serif",
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Dismiss
              </Button>
            </Box>
          )}
        </Box>

        {/* Close Button */}
        <IconButton
          onClick={() => onClose(notification.id)}
          sx={{
            flexShrink: 0,
            color: '#ab9db9',
            '&:hover': {
              color: '#ffffff',
            },
            p: 0.5,
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Animated Progress Bar */}
      <Box
        sx={{
          height: 4,
          width: '100%',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        <Box
          sx={{
            height: '100%',
            width: `${progress}%`,
            backgroundColor: '#7f13ec',
            transition: 'width 0.05s linear',
          }}
        />
      </Box>
    </Box>
  );
}

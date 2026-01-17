import { useState, useEffect } from 'react';
import { Typography, Box } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface CountdownTimerProps {
  targetDate: string; // ISO date string
  showSeconds?: boolean;
  compact?: boolean;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // milliseconds
}

export default function CountdownTimer({ 
  targetDate, 
  showSeconds = true,
  compact = false 
}: CountdownTimerProps) {
  const { theme } = useTheme();
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    const calculateTimeRemaining = (): TimeRemaining => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const difference = target - now;

      if (difference <= 0) {
        return {
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          total: 0,
        };
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000),
        total: difference,
      };
    };

    // Calculate immediately
    setTimeRemaining(calculateTimeRemaining());

    // Update every second
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeRemaining) {
    return null;
  }

  // If time has passed
  if (timeRemaining.total <= 0) {
    return (
      <Typography
        sx={{
          fontSize: compact ? '11px' : '13px',
          fontWeight: 600,
          color: '#EF4444',
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Due now
      </Typography>
    );
  }

  // Format the countdown display
  const formatTime = () => {
    const parts: string[] = [];

    if (timeRemaining.days > 0) {
      parts.push(`${timeRemaining.days}d`);
    }
    if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.hours}h`);
    }
    if (timeRemaining.minutes > 0 || timeRemaining.hours > 0 || timeRemaining.days > 0) {
      parts.push(`${timeRemaining.minutes}m`);
    }
    if (showSeconds && (timeRemaining.seconds > 0 || parts.length === 0)) {
      parts.push(`${timeRemaining.seconds}s`);
    }

    return parts.length > 0 ? parts.join(' ') : '0s';
  };

  // Determine color based on urgency
  const getColor = () => {
    const totalHours = timeRemaining.total / (1000 * 60 * 60);
    if (totalHours < 24) return '#EF4444'; // Red for less than 24 hours
    if (totalHours < 72) return '#F59E0B'; // Amber for less than 3 days
    return theme.palette.text.secondary; // Default color
  };

  if (compact) {
    return (
      <Typography
        sx={{
          fontSize: '11px',
          fontWeight: 600,
          color: getColor(),
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {formatTime()}
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
      <Typography
        sx={{
          fontSize: '11px',
          color: theme.palette.text.secondary,
          fontFamily: "'Inter', sans-serif",
        }}
      >
        Next occurrence in:
      </Typography>
      <Typography
        sx={{
          fontSize: '13px',
          fontWeight: 700,
          color: getColor(),
          fontFamily: "'Inter', sans-serif",
        }}
      >
        {formatTime()}
      </Typography>
    </Box>
  );
}

import { Box, Card, CardContent, Typography, IconButton } from '@mui/material';
import { TrendingUp, TrendingDown, Warning, Info, CheckCircle, Error } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

export interface InsightCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  type?: 'success' | 'warning' | 'error' | 'info';
  icon?: React.ReactNode;
  onClick?: () => void;
  actionLabel?: string;
}

export default function InsightCard({
  title,
  value,
  subtitle,
  trend,
  type = 'info',
  icon,
  onClick,
  actionLabel,
}: InsightCardProps) {
  const { theme } = useTheme();

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp sx={{ fontSize: 20 }} />;
    if (trend === 'down') return <TrendingDown sx={{ fontSize: 20 }} />;
    return null;
  };

  const getTypeIcon = () => {
    if (icon) return icon;
    switch (type) {
      case 'success':
        return <CheckCircle sx={{ fontSize: 24 }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 24 }} />;
      case 'error':
        return <Error sx={{ fontSize: 24 }} />;
      default:
        return <Info sx={{ fontSize: 24 }} />;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'success':
        return theme.palette.mode === 'dark' ? '#10b981' : '#059669';
      case 'warning':
        return theme.palette.mode === 'dark' ? '#f59e0b' : '#d97706';
      case 'error':
        return theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626';
      default:
        return theme.palette.primary.main;
    }
  };

  const getTrendColor = () => {
    if (trend === 'up') return theme.palette.mode === 'dark' ? '#10b981' : '#059669';
    if (trend === 'down') return theme.palette.mode === 'dark' ? '#ef4444' : '#dc2626';
    return theme.palette.text.secondary;
  };

  return (
    <Card
      elevation={2}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick
          ? {
              elevation: 4,
              transform: 'translateY(-2px)',
              borderColor: getColor(),
            }
          : {},
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyPress={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      aria-label={onClick ? `${title}: ${value}${actionLabel ? `. ${actionLabel}` : ''}` : undefined}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Box
              sx={{
                color: getColor(),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {getTypeIcon()}
            </Box>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '0.875rem',
              }}
            >
              {title}
            </Typography>
          </Box>
          {trend && (
            <Box
              sx={{
                color: getTrendColor(),
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {getTrendIcon()}
            </Box>
          )}
        </Box>
        <Typography
          variant="h4"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 700,
            fontSize: { xs: '1.75rem', sm: '2rem' },
            mb: subtitle ? 0.5 : 0,
            lineHeight: 1.2,
          }}
        >
          {typeof value === 'number' ? `Rs. ${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : value}
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: '0.75rem',
              display: 'block',
              mt: 0.5,
            }}
          >
            {subtitle}
          </Typography>
        )}
        {actionLabel && onClick && (
          <Typography
            variant="caption"
            sx={{
              color: getColor(),
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'block',
              mt: 1,
              textDecoration: 'underline',
            }}
          >
            {actionLabel} →
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

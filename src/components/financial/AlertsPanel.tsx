import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Badge,
} from '@mui/material';
import { Warning, Error, CheckCircle, Close, MarkEmailRead } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getAlerts, markAlertRead, markAllAlertsRead } from '../../lib/api/financialApi';
import { BudgetAlert } from '../../types/financial';

interface AlertsPanelProps {
  compact?: boolean;
  maxItems?: number;
  onAlertClick?: (alert: BudgetAlert) => void;
}

export default function AlertsPanel({ compact = false, maxItems = 10, onAlertClick }: AlertsPanelProps) {
  const { theme } = useTheme();
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAlerts();
    // Refresh alerts every 30 seconds
    const interval = setInterval(loadAlerts, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getAlerts({ unread_only: compact });
      if (response.success) {
        const alertsToShow = compact ? response.alerts.slice(0, maxItems) : response.alerts;
        setAlerts(alertsToShow);
        setUnreadCount(response.unread_count);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (alertId: string) => {
    try {
      await markAlertRead(alertId);
      await loadAlerts();
    } catch (err: any) {
      setError(err.message || 'Failed to mark alert as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAlertsRead();
      await loadAlerts();
    } catch (err: any) {
      setError(err.message || 'Failed to mark all alerts as read');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'exceeded':
      case 'critical':
        return <Error sx={{ color: theme.palette.error.main }} />;
      case 'warning':
        return <Warning sx={{ color: theme.palette.warning.main }} />;
      default:
        return <CheckCircle sx={{ color: theme.palette.success.main }} />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'exceeded':
      case 'critical':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'success';
    }
  };

  if (loading && alerts.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const unreadAlerts = alerts.filter((alert) => !alert.read);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Paper 
        elevation={0} 
        sx={{ 
          p: compact ? '1rem' : '1.5rem', 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: '1.5rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Typography 
              variant={compact ? 'h6' : 'h5'} 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.primary, 
                fontWeight: 600,
                fontSize: compact ? '1rem' : '1.25rem',
                lineHeight: 1.2,
              }}
            >
              Budget Alerts
            </Typography>
            {unreadCount > 0 && (
              <Badge badgeContent={unreadCount} color="error">
                <Warning />
              </Badge>
            )}
          </Box>
          {!compact && unreadAlerts.length > 0 && (
            <Button
              size="small"
              startIcon={<MarkEmailRead />}
              onClick={handleMarkAllRead}
              aria-label="Mark all alerts as read"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Mark All Read
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {alerts.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: '2rem' }}>
            <CheckCircle sx={{ fontSize: 48, color: theme.palette.success.main, mb: '0.5rem' }} />
            <Typography 
              variant="body1" 
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1.5,
                color: theme.palette.text.secondary,
              }}
            >
              No alerts at this time
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.75rem',
                fontWeight: 400,
                lineHeight: 1.5,
                color: theme.palette.text.secondary,
                display: 'block', 
                mt: '0.25rem',
              }}
            >
              You're staying within your budgets
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {alerts.map((alert) => (
              <ListItem
                key={alert._id}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '8px',
                  mb: '0.75rem',
                  p: '1rem',
                  backgroundColor: alert.read
                    ? theme.palette.background.paper
                    : theme.palette.mode === 'dark'
                    ? 'rgba(255, 193, 7, 0.1)'
                    : 'rgba(255, 193, 7, 0.05)',
                  cursor: onAlertClick ? 'pointer' : 'default',
                  opacity: alert.read ? 0.7 : 1,
                }}
                onClick={onAlertClick ? () => onAlertClick(alert) : undefined}
                role={onAlertClick ? 'button' : undefined}
                tabIndex={onAlertClick ? 0 : undefined}
                onKeyPress={onAlertClick ? (e) => e.key === 'Enter' && onAlertClick(alert) : undefined}
              >
                <ListItemIcon>{getSeverityIcon(alert.severity)}</ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <Typography 
                        variant="subtitle2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.875rem',
                          fontWeight: alert.read ? 400 : 600,
                          lineHeight: 1.2,
                        }}
                      >
                        {alert.title}
                      </Typography>
                      <Chip
                        label={alert.severity}
                        size="small"
                        color={getSeverityColor(alert.severity) as any}
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.75rem', 
                          height: 20,
                          borderRadius: '8px',
                        }}
                      />
                      {!alert.read && (
                        <Chip 
                          label="New" 
                          size="small" 
                          color="primary" 
                          sx={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.75rem', 
                            height: 20,
                            borderRadius: '8px',
                          }} 
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          color: theme.palette.text.secondary,
                          mt: '0.25rem',
                        }}
                      >
                        {alert.message}
                      </Typography>
                      {alert.amount && (
                        <Typography 
                          variant="caption" 
                          sx={{ 
                            fontFamily: "'Inter', sans-serif",
                            fontSize: '0.75rem',
                            fontWeight: 400,
                            lineHeight: 1.5,
                            color: theme.palette.text.secondary,
                            display: 'block', 
                            mt: '0.25rem',
                          }}
                        >
                          Amount: Rs. {alert.amount.toFixed(2)}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        {new Date(alert.created_at).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                />
                {!alert.read && (
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMarkRead(alert._id);
                    }}
                    aria-label="Mark alert as read"
                  >
                    <Close fontSize="small" />
                  </IconButton>
                )}
              </ListItem>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}





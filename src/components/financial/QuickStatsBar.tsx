import { Box, Paper, Typography, Skeleton, Badge } from '@mui/material';
import { Warning } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpendingSummary, getAlerts } from '../../lib/api/financialApi';
import { SpendingSummaryResponse } from '../../types/financial';
import { useState, useEffect } from 'react';
import InsightCard from './InsightCard';

interface QuickStatsBarProps {
  onStatClick?: (stat: string) => void;
}

export default function QuickStatsBar({ onStatClick }: QuickStatsBarProps) {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
    // Refresh alerts every 30 seconds
    const interval = setInterval(() => {
      loadAlerts();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const [summaryRes, alertsRes] = await Promise.all([
        getSpendingSummary({ period: 'monthly' }),
        getAlerts({ unread_only: true }).catch(() => ({ success: false, alerts: [], unread_count: 0 })),
      ]);
      
      if (summaryRes.success) {
        setSummary(summaryRes);
      }
      
      if (alertsRes.success) {
        setAlertsCount(alertsRes.unread_count);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAlerts = async () => {
    try {
      const response = await getAlerts({ unread_only: true });
      if (response.success) {
        setAlertsCount(response.unread_count);
      }
    } catch (error) {
      // Silently fail for alerts refresh
    }
  };

  const topCategory = summary?.summary.by_category[0];
  const totalSpending = summary?.summary.total || 0;
  const transactionCount = summary?.summary.transaction_count || 0;

  return (
    <Paper
      elevation={0}
      sx={{
        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
        borderBottom: `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
        p: 2,
        mb: 3,
      }}
      role="region"
      aria-label="Quick financial statistics"
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'repeat(2, 1fr)',
            sm: 'repeat(3, 1fr)',
            md: 'repeat(4, 1fr)',
          },
          gap: 2,
          alignItems: 'stretch',
          width: '100%',
        }}
      >
        {loading ? (
          <>
            <Skeleton variant="rectangular" height={100} sx={{ width: '100%' }} />
            <Skeleton variant="rectangular" height={100} sx={{ width: '100%' }} />
            <Skeleton variant="rectangular" height={100} sx={{ width: '100%' }} />
            <Skeleton variant="rectangular" height={100} sx={{ width: '100%' }} />
          </>
        ) : (
          <>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              <InsightCard
                title="Total Spending"
                value={totalSpending}
                subtitle="This month"
                type="info"
                onClick={onStatClick ? () => onStatClick('spending') : undefined}
                actionLabel="View details"
              />
            </Box>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              <InsightCard
                title="Transactions"
                value={transactionCount}
                subtitle="This month"
                type="info"
                onClick={onStatClick ? () => onStatClick('transactions') : undefined}
                actionLabel="View all"
              />
            </Box>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              {topCategory ? (
                <InsightCard
                  title="Top Category"
                  value={topCategory.category_name}
                  subtitle={`Rs. ${topCategory.amount.toFixed(2)} (${topCategory.percentage.toFixed(1)}%)`}
                  type="info"
                  onClick={onStatClick ? () => onStatClick('category') : undefined}
                  actionLabel="View breakdown"
                />
              ) : (
                <InsightCard
                  title="Top Category"
                  value="No data"
                  subtitle="Upload bills to get started"
                  type="info"
                />
              )}
            </Box>
            <Box sx={{ width: '100%', minWidth: 0 }}>
              {alertsCount > 0 ? (
                <InsightCard
                  title="Budget Alerts"
                  value={alertsCount}
                  subtitle={alertsCount === 1 ? 'Unread alert' : 'Unread alerts'}
                  type="warning"
                  onClick={onStatClick ? () => onStatClick('alerts') : undefined}
                  actionLabel="View alerts"
                />
              ) : (
                <InsightCard
                  title="Avg per Transaction"
                  value={transactionCount > 0 ? (totalSpending / transactionCount) : 0}
                  subtitle={transactionCount > 0 ? "This month" : "No transactions"}
                  type="info"
                />
              )}
            </Box>
          </>
        )}
      </Box>
    </Paper>
  );
}












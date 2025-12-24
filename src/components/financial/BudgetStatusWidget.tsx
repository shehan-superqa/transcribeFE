import { useState, useEffect } from 'react';
import { Box, Paper, Typography, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { Warning, Error, CheckCircle } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getBudgetStatus } from '../../lib/api/financialApi';
import { BudgetStatusResponse } from '../../types/financial';
import InsightCard from './InsightCard';

interface BudgetStatusWidgetProps {
  budgetId: string;
  budgetName: string;
  onClick?: () => void;
}

export default function BudgetStatusWidget({ budgetId, budgetName, onClick }: BudgetStatusWidgetProps) {
  const { theme } = useTheme();
  const [status, setStatus] = useState<BudgetStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Refresh every 30 seconds
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, [budgetId]);

  const loadStatus = async () => {
    try {
      const response = await getBudgetStatus(budgetId);
      if (response.success) {
        setStatus(response);
      }
    } catch (error) {
      console.error('Failed to load budget status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '120px' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (!status) return null;

  const { budget, status: budgetStatus } = status;
  const percentageUsed = budgetStatus.percentage_used;
  const remaining = budgetStatus.remaining;

  const getAlertLevel = () => {
    if (percentageUsed >= 100) return 'exceeded';
    if (percentageUsed >= budget.alert_thresholds.critical) return 'critical';
    if (percentageUsed >= budget.alert_thresholds.warning) return 'warning';
    return 'ok';
  };

  const alertLevel = getAlertLevel();

  return (
    <InsightCard
      title={budgetName}
      value={`Rs. ${budgetStatus.current_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
      subtitle={`${percentageUsed.toFixed(1)}% used • Rs. ${remaining >= 0 ? remaining.toFixed(2) : Math.abs(remaining).toFixed(2)} ${remaining >= 0 ? 'remaining' : 'over'}`}
      type={
        alertLevel === 'exceeded' || alertLevel === 'critical'
          ? 'error'
          : alertLevel === 'warning'
          ? 'warning'
          : 'success'
      }
      trend={percentageUsed >= 100 ? 'up' : percentageUsed >= budget.alert_thresholds.warning ? 'up' : 'neutral'}
      onClick={onClick}
      actionLabel="View details"
    />
  );
}




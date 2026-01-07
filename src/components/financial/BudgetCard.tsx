import { Box, Card, CardContent, Typography, LinearProgress, IconButton, Chip, Tooltip } from '@mui/material';
import { Edit, Delete, Warning, CheckCircle, Error } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { Budget, BudgetStatusResponse } from '../../types/financial';

interface BudgetCardProps {
  budgetStatus: BudgetStatusResponse;
  categoryName?: string;
  onEdit?: (budget: Budget) => void;
  onDelete?: (budgetId: string) => void;
  onViewDetails?: (budgetId: string) => void;
}

export default function BudgetCard({
  budgetStatus,
  categoryName,
  onEdit,
  onDelete,
  onViewDetails,
}: BudgetCardProps) {
  const { theme } = useTheme();
  const { budget, status } = budgetStatus;

  const getAlertColor = () => {
    switch (status.alert_level) {
      case 'exceeded':
        return theme.palette.error.main;
      case 'critical':
        return theme.palette.error.main;
      case 'warning':
        return theme.palette.warning.main;
      default:
        return theme.palette.success.main;
    }
  };

  const getAlertIcon = () => {
    switch (status.alert_level) {
      case 'exceeded':
      case 'critical':
        return <Error sx={{ fontSize: 20 }} />;
      case 'warning':
        return <Warning sx={{ fontSize: 20 }} />;
      default:
        return <CheckCircle sx={{ fontSize: 20 }} />;
    }
  };

  const percentageUsed = status.percentage_used;
  const isOverBudget = percentageUsed >= 100;
  const isWarning = percentageUsed >= budget.alert_thresholds.warning && percentageUsed < budget.alert_thresholds.critical;
  const isCritical = percentageUsed >= budget.alert_thresholds.critical && percentageUsed < 100;

  return (
    <Card
      elevation={2}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `2px solid ${getAlertColor()}`,
        borderRadius: 2,
        transition: 'all 0.2s ease-in-out',
        cursor: onViewDetails ? 'pointer' : 'default',
        '&:hover': onViewDetails
          ? {
              elevation: 4,
              transform: 'translateY(-2px)',
            }
          : {},
      }}
      onClick={onViewDetails ? () => onViewDetails(budget._id) : undefined}
      role={onViewDetails ? 'button' : undefined}
      tabIndex={onViewDetails ? 0 : undefined}
      onKeyPress={onViewDetails ? (e) => e.key === 'Enter' && onViewDetails(budget._id) : undefined}
      aria-label={`Budget: ${budget.name} - ${percentageUsed.toFixed(1)}% used`}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {budget.name}
              </Typography>
              <Chip
                icon={getAlertIcon()}
                label={status.alert_level === 'ok' ? 'On Track' : status.alert_level}
                size="small"
                color={
                  status.alert_level === 'exceeded' || status.alert_level === 'critical'
                    ? 'error'
                    : status.alert_level === 'warning'
                    ? 'warning'
                    : 'success'
                }
                sx={{ fontSize: '0.7rem', height: 20 }}
              />
            </Box>
            {categoryName && (
              <Typography variant="caption" color="text.secondary">
                Category: {categoryName}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Period: {budget.period} • {status.days_remaining} days remaining
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {onEdit && (
              <Tooltip title="Edit budget">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(budget);
                  }}
                  aria-label="Edit budget"
                >
                  <Edit fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {onDelete && (
              <Tooltip title="Delete budget">
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(budget._id);
                  }}
                  color="error"
                  aria-label="Delete budget"
                >
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Spending vs Budget */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
            <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
              Rs. {status.current_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              of Rs. {budget.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={Math.min(percentageUsed, 100)}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              '& .MuiLinearProgress-bar': {
                backgroundColor: getAlertColor(),
                borderRadius: 5,
              },
            }}
            aria-label={`Budget usage: ${percentageUsed.toFixed(1)}%`}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {percentageUsed.toFixed(1)}% used
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: status.remaining >= 0 ? theme.palette.success.main : theme.palette.error.main,
                fontWeight: 600,
              }}
            >
              {status.remaining >= 0 ? `Rs. ${status.remaining.toFixed(2)} remaining` : `Rs. ${Math.abs(status.remaining).toFixed(2)} over`}
            </Typography>
          </Box>
        </Box>

        {/* Projections */}
        {status.projected_spending !== undefined && (
          <Box sx={{ mb: 2, p: 1.5, backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
              Projected Spending
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Rs. {status.projected_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Typography>
            {status.projected_over_budget && (
              <Typography variant="caption" sx={{ color: theme.palette.error.main, display: 'block', mt: 0.5 }}>
                Warning: Projected to exceed budget
              </Typography>
            )}
          </Box>
        )}

        {/* Alerts */}
        {status.alerts && status.alerts.length > 0 && (
          <Box sx={{ mt: 2 }}>
            {status.alerts.map((alert, index) => (
              <Chip
                key={index}
                icon={alert.type === 'exceeded' || alert.type === 'critical' ? <Error /> : <Warning />}
                label={alert.message}
                size="small"
                color={alert.type === 'exceeded' || alert.type === 'critical' ? 'error' : 'warning'}
                sx={{ fontSize: '0.7rem', mb: 0.5, mr: 0.5 }}
              />
            ))}
          </Box>
        )}

        {/* Recommendations */}
        {status.recommendations && status.recommendations.length > 0 && (
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
              Recommendations:
            </Typography>
            {status.recommendations.map((rec, index) => (
              <Typography key={index} variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                • {rec}
              </Typography>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}












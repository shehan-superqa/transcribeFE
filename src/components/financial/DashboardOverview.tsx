import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpendingSummary, getSpendingTrends, getAnomalies, listTransactions, listBudgets, getBudgetStatus, getAlerts } from '../../lib/api/financialApi';
import { SpendingSummaryResponse, SpendingTrendsResponse, AnomaliesResponse, Transaction, BudgetStatusResponse } from '../../types/financial';
import InsightCard from './InsightCard';
import BudgetStatusWidget from './BudgetStatusWidget';
import AlertsPanel from './AlertsPanel';
import { ArrowUpward, ArrowDownward, TrendingUp, Warning, CloudUpload } from '@mui/icons-material';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

interface DashboardOverviewProps {
  onViewTransactions?: () => void;
  onViewAnalytics?: () => void;
  onUploadClick?: () => void;
  onViewBudgets?: () => void;
  categories?: Array<{ _id: string; category_name: string }>;
}

export default function DashboardOverview({
  onViewTransactions,
  onViewAnalytics,
  onUploadClick,
  onViewBudgets,
  categories = [],
}: DashboardOverviewProps) {
  const { theme } = useTheme();
  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [trends, setTrends] = useState<SpendingTrendsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatusResponse[]>([]);
  const [alertsCount, setAlertsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [summaryRes, trendsRes, anomaliesRes, transactionsRes, budgetsRes, alertsRes] = await Promise.all([
        getSpendingSummary({ period: 'monthly' }),
        getSpendingTrends({ period: 'monthly', months_back: 2 }),
        getAnomalies({ limit: 5 }),
        listTransactions({ limit: 5 }),
        listBudgets({ active_only: true }).catch(() => ({ success: false, budgets: [], total: 0 })),
        getAlerts({ unread_only: true }).catch(() => ({ success: false, alerts: [], unread_count: 0 })),
      ]);

      if (summaryRes.success) setSummary(summaryRes);
      if (trendsRes.success) setTrends(trendsRes);
      if (anomaliesRes.success) setAnomalies(anomaliesRes);
      if (transactionsRes.success) setRecentTransactions(transactionsRes.transactions);
      
      // Load budget statuses
      if (budgetsRes.success && budgetsRes.budgets.length > 0) {
        const statuses = await Promise.all(
          budgetsRes.budgets.slice(0, 3).map(async (budget) => {
            try {
              const statusRes = await getBudgetStatus(budget._id);
              return statusRes;
            } catch (err) {
              return null;
            }
          })
        );
        setBudgetStatuses(statuses.filter((s): s is BudgetStatusResponse => s !== null));
      }
      
      if (alertsRes.success) {
        setAlertsCount(alertsRes.unread_count);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c._id === categoryId);
    return category?.category_name || 'Unknown';
  };

  const summaryChartData = summary
    ? {
        labels: summary.summary.by_category.slice(0, 5).map((item) => item.category_name),
        datasets: [
          {
            label: 'Amount (Rs.)',
            data: summary.summary.by_category.slice(0, 5).map((item) => item.amount),
            backgroundColor: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              '#10b981',
              '#f59e0b',
              '#ef4444',
            ],
          },
        ],
      }
    : null;

  const pieChartData = summary
    ? {
        labels: summary.summary.by_category.slice(0, 5).map((item) => item.category_name),
        datasets: [
          {
            data: summary.summary.by_category.slice(0, 5).map((item) => item.amount),
            backgroundColor: [
              theme.palette.primary.main,
              theme.palette.secondary.main,
              '#10b981',
              '#f59e0b',
              '#ef4444',
            ],
          },
        ],
      }
    : null;

  const currentMonthTotal = summary?.summary.total || 0;
  const previousMonthTotal =
    trends?.trends.comparisons.length > 0 ? trends.trends.comparisons[0].previous_total : 0;
  const growthRate = previousMonthTotal > 0 ? ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100 : 0;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const hasData = summary && summary.summary.transaction_count > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Empty State */}
      {!hasData && (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `2px dashed ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ color: theme.palette.text.primary, mb: 2 }}>
            Welcome to Your Financial Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Get started by uploading your first bill or receipt. We'll automatically track your spending and provide
            insights.
          </Typography>
          {onUploadClick && (
            <Button variant="contained" size="large" onClick={onUploadClick} startIcon={<CloudUpload />}>
              Upload Your First Bill
            </Button>
          )}
        </Paper>
      )}

      {/* Key Insights Cards */}
      {hasData && (
        <>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <InsightCard
                title="This Month"
                value={currentMonthTotal}
                subtitle={`${summary?.summary.transaction_count || 0} transactions`}
                trend={growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral'}
                type={growthRate > 10 ? 'warning' : 'info'}
                onClick={onViewAnalytics}
                actionLabel="View details"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InsightCard
                title="vs Last Month"
                value={`${growthRate >= 0 ? '+' : ''}${growthRate.toFixed(1)}%`}
                subtitle={
                  growthRate > 0
                    ? `Spent Rs. ${(currentMonthTotal - previousMonthTotal).toFixed(2)} more`
                    : `Saved Rs. ${(previousMonthTotal - currentMonthTotal).toFixed(2)}`
                }
                trend={growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral'}
                type={growthRate > 10 ? 'warning' : growthRate < -5 ? 'success' : 'info'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InsightCard
                title="Top Category"
                value={summary?.summary.by_category[0]?.category_name || 'N/A'}
                subtitle={
                  summary?.summary.by_category[0]
                    ? `Rs. ${summary.summary.by_category[0].amount.toFixed(2)} (${summary.summary.by_category[0].percentage.toFixed(1)}%)`
                    : 'No data'
                }
                type="info"
                onClick={onViewAnalytics}
                actionLabel="View breakdown"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <InsightCard
                title="Anomalies"
                value={anomalies?.count || 0}
                subtitle={anomalies && anomalies.count > 0 ? 'Need review' : 'All normal'}
                type={anomalies && anomalies.count > 0 ? 'warning' : 'success'}
                onClick={anomalies && anomalies.count > 0 ? onViewAnalytics : undefined}
                actionLabel={anomalies && anomalies.count > 0 ? 'Review now' : undefined}
              />
            </Grid>
            {alertsCount > 0 && (
              <Grid item xs={12} sm={6} md={3}>
                <InsightCard
                  title="Budget Alerts"
                  value={alertsCount}
                  subtitle={alertsCount === 1 ? 'Unread alert' : 'Unread alerts'}
                  type={alertsCount > 0 ? 'warning' : 'success'}
                  onClick={onViewBudgets}
                  actionLabel="View alerts"
                />
              </Grid>
            )}
          </Grid>

          {/* Budget Status Widgets */}
          {budgetStatuses.length > 0 && (
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Active Budgets
                </Typography>
                {onViewBudgets && (
                  <Button size="small" onClick={onViewBudgets} aria-label="View all budgets">
                    View All →
                  </Button>
                )}
              </Box>
              <Grid container spacing={2}>
                {budgetStatuses.map((budgetStatus) => (
                  <Grid item xs={12} sm={6} md={4} key={budgetStatus.budget._id}>
                    <BudgetStatusWidget
                      budgetId={budgetStatus.budget._id}
                      budgetName={budgetStatus.budget.name}
                      onClick={onViewBudgets}
                    />
                  </Grid>
                ))}
              </Grid>
            </Paper>
          )}

          {/* Spending Overview */}
          <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                Spending Overview
              </Typography>
              {onViewAnalytics && (
                <Button size="small" onClick={onViewAnalytics} aria-label="View detailed analytics">
                  View Details →
                </Button>
              )}
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                {summaryChartData && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Top Categories (Bar Chart)
                    </Typography>
                    <Box sx={{ height: '300px', mt: 1 }}>
                      <Bar
                        data={summaryChartData}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => `Rs. ${context.parsed.y.toFixed(2)}`,
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                {pieChartData && (
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Category Distribution
                    </Typography>
                    <Box sx={{ height: '300px', mt: 1 }}>
                      <Pie
                        data={pieChartData}
                        options={{
                          maintainAspectRatio: false,
                          responsive: true,
                          plugins: {
                            legend: {
                              position: 'bottom',
                            },
                            tooltip: {
                              callbacks: {
                                label: (context) => {
                                  const label = context.label || '';
                                  const value = context.parsed || 0;
                                  const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${label}: Rs. ${value.toFixed(2)} (${percentage}%)`;
                                },
                              },
                            },
                          },
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Recent Transactions */}
          <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                Recent Transactions
              </Typography>
              {onViewTransactions && (
                <Button size="small" onClick={onViewTransactions} aria-label="View all transactions">
                  View All →
                </Button>
              )}
            </Box>
            {recentTransactions.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent transactions. Upload a bill to get started.
              </Typography>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {recentTransactions.map((transaction) => (
                  <Card
                    key={transaction._id}
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      backgroundColor: theme.palette.background.paper,
                    }}
                  >
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography variant="subtitle1" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                            Rs. {transaction.amount.toFixed(2)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getCategoryName(transaction.category_id)} •{' '}
                            {new Date(transaction.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          {transaction.anomaly_flag && (
                            <Chip
                              icon={<Warning />}
                              label="Anomaly"
                              size="small"
                              color="warning"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          )}
                          <Chip
                            label={transaction.status}
                            size="small"
                            color={transaction.status === 'confirmed' ? 'success' : 'default'}
                            sx={{ fontSize: '0.7rem' }}
                          />
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>

          {/* Budget Alerts */}
          {alertsCount > 0 && (
            <AlertsPanel compact maxItems={3} onAlertClick={onViewBudgets} />
          )}

          {/* Anomalies Alert */}
          {anomalies && anomalies.anomalies.length > 0 && (
            <Alert
              severity="warning"
              icon={<Warning />}
              action={
                onViewAnalytics ? (
                  <Button color="inherit" size="small" onClick={onViewAnalytics}>
                    Review
                  </Button>
                ) : undefined
              }
            >
              <Typography variant="subtitle2" gutterBottom>
                {anomalies.count} transaction{anomalies.count !== 1 ? 's' : ''} flagged for review
              </Typography>
              <Typography variant="body2">
                Some transactions appear unusual compared to your spending patterns. Review them to ensure accuracy.
              </Typography>
            </Alert>
          )}
        </>
      )}
    </Box>
  );
}

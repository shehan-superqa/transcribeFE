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
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpendingSummary, getSpendingTrends, getAnomalies, listTransactions, listBudgets, getBudgetStatus, getAlerts } from '../../lib/api/financialApi';
import { formatCurrency, getDisplayCategoryName, checkMissingPriceFields, getMissingFieldStyle, getMissingFieldRowStyle, getTransactionType } from '../../utils/transactionHelpers';
import { SpendingSummaryResponse, SpendingTrendsResponse, AnomaliesResponse, Transaction, BudgetStatusResponse } from '../../types/financial';
import InsightCard from './InsightCard';
import BudgetStatusWidget from './BudgetStatusWidget';
import AlertsPanel from './AlertsPanel';
import { ArrowUpward, ArrowDownward, TrendingUp, TrendingDown, Warning, CloudUpload, ExpandMore, ExpandLess } from '@mui/icons-material';

// Recharts doesn't need registration

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
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [showAllItems, setShowAllItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDashboardData();
  }, []);

// Recharts handles responsive sizing automatically

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

  const toggleItemsExpansion = (transactionId: string) => {
    setExpandedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
        // Also reset showAllItems when collapsing
        setShowAllItems((prevItems) => {
          const newItemsSet = new Set(prevItems);
          newItemsSet.delete(transactionId);
          return newItemsSet;
        });
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const toggleShowAllItems = (transactionId: string) => {
    setShowAllItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
      }
      return newSet;
    });
  };

  const getBillItems = (transaction: Transaction) => {
    return transaction.normalized_output?.items || transaction.parsing_output?.items || [];
  };

  const barChartData = summary
    ? summary.summary.by_category.slice(0, 5).map((item) => ({
        name: item.category_name,
        amount: item.amount,
      }))
    : [];

  const pieChartData = summary
    ? summary.summary.by_category.slice(0, 5).map((item) => ({
        name: item.category_name,
        value: item.amount,
      }))
    : [];

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#10b981',
    '#f59e0b',
    '#ef4444',
  ];

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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%' }}>
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
          <Grid container spacing={2} sx={{ alignItems: 'stretch', width: '100%' }}>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
              <Box sx={{ width: '100%', display: 'flex', minWidth: 0 }}>
                <InsightCard
                  title="This Month"
                  value={currentMonthTotal}
                  subtitle={`${summary?.summary.transaction_count || 0} transactions`}
                  trend={growthRate > 0 ? 'up' : growthRate < 0 ? 'down' : 'neutral'}
                  type={growthRate > 10 ? 'warning' : 'info'}
                  onClick={onViewAnalytics}
                  actionLabel="View details"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
              <Box sx={{ width: '100%', display: 'flex', minWidth: 0 }}>
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
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
              <Box sx={{ width: '100%', display: 'flex', minWidth: 0 }}>
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
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
              <Box sx={{ width: '100%', display: 'flex', minWidth: 0 }}>
                <InsightCard
                  title="Anomalies"
                  value={anomalies?.count || 0}
                  subtitle={anomalies && anomalies.count > 0 ? 'Need review' : 'All normal'}
                  type={anomalies && anomalies.count > 0 ? 'warning' : 'success'}
                  onClick={anomalies && anomalies.count > 0 ? onViewAnalytics : undefined}
                  actionLabel={anomalies && anomalies.count > 0 ? 'Review now' : undefined}
                />
              </Box>
            </Grid>
            {alertsCount > 0 && (
              <Grid item xs={12} sm={6} md={3} sx={{ display: 'flex', minWidth: 0 }}>
                <Box sx={{ width: '100%', display: 'flex', minWidth: 0 }}>
                  <InsightCard
                    title="Budget Alerts"
                    value={alertsCount}
                    subtitle={alertsCount === 1 ? 'Unread alert' : 'Unread alerts'}
                    type={alertsCount > 0 ? 'warning' : 'success'}
                    onClick={onViewBudgets}
                    actionLabel="View alerts"
                  />
                </Box>
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
          <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, width: '100%' }}>
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
            <Box sx={{ display: 'flex', gap: 3, width: '100%', flexDirection: { xs: 'column', md: 'row' } }}>
              <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Top Categories (Bar Chart)
                  </Typography>
                  {barChartData.length > 0 ? (
                    <Box 
                      sx={{ 
                        height: '400px', 
                        mt: 1, 
                        width: '100%',
                        flex: 1,
                        minHeight: '400px',
                        position: 'relative',
                      }}
                    >
                      <ResponsiveContainer width="100%" height={400}>
                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            stroke={theme.palette.text.secondary}
                            tick={{ fontSize: 12 }}
                          />
                          <YAxis 
                            stroke={theme.palette.text.secondary}
                            tick={{ fontSize: 12 }}
                            tickFormatter={(value) => `Rs. ${value}`}
                          />
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              color: theme.palette.text.primary,
                            }}
                            formatter={(value: number) => [`Rs. ${value.toFixed(2)}`, 'Amount']}
                          />
                          <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: '400px', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
              <Box sx={{ flex: 1, minWidth: 0, width: { xs: '100%', md: '50%' }, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', width: '100%', flex: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Category Distribution
                  </Typography>
                  {pieChartData.length > 0 ? (
                    <Box 
                      sx={{ 
                        height: '400px', 
                        mt: 1, 
                        width: '100%',
                        flex: 1,
                        minHeight: '400px',
                        position: 'relative',
                      }}
                    >
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={pieChartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {pieChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{
                              backgroundColor: theme.palette.background.paper,
                              border: `1px solid ${theme.palette.divider}`,
                              color: theme.palette.text.primary,
                            }}
                            formatter={(value: number) => `Rs. ${value.toFixed(2)}`}
                          />
                          <Legend 
                            wrapperStyle={{ color: theme.palette.text.primary }}
                            iconType="circle"
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  ) : (
                    <Box sx={{ height: '400px', mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        No data available
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
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
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle1" sx={{ 
                            color: getTransactionType(transaction) === 'earning' 
                              ? theme.palette.success.main 
                              : theme.palette.error.main, 
                            fontWeight: 600 
                          }}>
                            {formatCurrency(transaction.amount, transaction.currency)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {getDisplayCategoryName(transaction, getCategoryName(transaction.category_id), getBillItems(transaction))} •{' '}
                            {new Date(transaction.date).toLocaleDateString()}
                          </Typography>
                          {getBillItems(transaction).length > 0 && (
                            <Button
                              size="small"
                              onClick={() => toggleItemsExpansion(transaction._id)}
                              startIcon={expandedTransactions.has(transaction._id) ? <ExpandLess /> : <ExpandMore />}
                              sx={{ mt: 0.5, textTransform: 'none', fontSize: '0.75rem', p: 0, minWidth: 'auto' }}
                            >
                              {expandedTransactions.has(transaction._id) ? 'Hide' : `${getBillItems(transaction).length} items`}
                            </Button>
                          )}
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
                      
                      {/* Bill Items List */}
                      {getBillItems(transaction).length > 0 && (
                        <Collapse in={expandedTransactions.has(transaction._id)} timeout="auto" unmountOnExit>
                          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, position: 'relative' }}>
                            <Box sx={{ position: 'relative' }}>
                              <TableContainer 
                                component="div"
                                ref={(el) => {
                                  if (el) {
                                    const topIndicator = el.previousElementSibling as HTMLElement;
                                    const bottomIndicator = el.nextElementSibling as HTMLElement;
                                    const isScrollable = el.scrollHeight > el.clientHeight;
                                    const isAtBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 1;
                                    if (bottomIndicator) {
                                      bottomIndicator.style.opacity = isScrollable && !isAtBottom ? '1' : '0';
                                    }
                                  }
                                }}
                                onScroll={(e) => {
                                  const target = e.target as HTMLElement;
                                  const topIndicator = target.previousElementSibling as HTMLElement;
                                  const bottomIndicator = target.nextElementSibling as HTMLElement;
                                  if (topIndicator) {
                                    topIndicator.style.opacity = target.scrollTop > 0 ? '1' : '0';
                                  }
                                  if (bottomIndicator) {
                                    const isScrollable = target.scrollHeight > target.clientHeight;
                                    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
                                    bottomIndicator.style.opacity = isScrollable && !isAtBottom ? '1' : '0';
                                  }
                                }}
                                sx={{ 
                                  width: '100%',
                                  maxHeight: '400px',
                                  overflow: 'auto',
                                  '&::-webkit-scrollbar': {
                                    display: 'none',
                                    width: 0,
                                    height: 0,
                                  },
                                  '&::-webkit-scrollbar-track': {
                                    display: 'none',
                                  },
                                  '&::-webkit-scrollbar-thumb': {
                                    display: 'none',
                                  },
                                  scrollbarWidth: 'none',
                                  msOverflowStyle: 'none',
                                  WebkitOverflowScrolling: 'touch',
                                }}
                              >
                              <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, width: '40px', minWidth: '40px' }}></TableCell>
                                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, minWidth: '150px' }}>Item</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, width: '80px', minWidth: '80px' }}>Qty</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, width: '120px', minWidth: '120px' }}>Unit</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, width: '120px', minWidth: '120px' }}>Total</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {(showAllItems.has(transaction._id) 
                                    ? getBillItems(transaction) 
                                    : getBillItems(transaction).slice(0, 5)
                                  ).map((item: any, index: number) => {
                                    // Check for missing price fields
                                    const missingFields = checkMissingPriceFields(item);
                                    const transactionType = getTransactionType(transaction);
                                    
                                    return (
                                      <TableRow 
                                        key={index}
                                        sx={getMissingFieldRowStyle(missingFields.hasMissingFields, theme)}
                                      >
                                        <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, width: '40px', minWidth: '40px' }}>
                                          {transactionType === 'expense' ? (
                                            <TrendingDown sx={{ fontSize: '0.875rem', color: theme.palette.error.main }} />
                                          ) : (
                                            <TrendingUp sx={{ fontSize: '0.875rem', color: theme.palette.success.main }} />
                                          )}
                                        </TableCell>
                                        <TableCell sx={{ color: theme.palette.text.primary, fontSize: '0.75rem', py: 0.5, minWidth: '150px' }}>{item.name || 'N/A'}</TableCell>
                                        <TableCell 
                                          align="right" 
                                          sx={{ 
                                            fontSize: '0.75rem', 
                                            py: 0.5,
                                            ...getMissingFieldStyle(missingFields.quantity, theme)
                                          }}
                                        >
                                          {item.quantity || 'N/A'}
                                        </TableCell>
                                        <TableCell 
                                          align="right" 
                                          sx={{ 
                                            fontSize: '0.75rem', 
                                            py: 0.5,
                                            ...getMissingFieldStyle(missingFields.unitPrice, theme)
                                          }}
                                        >
                                          {item.unit_price && item.unit_price > 0 ? `Rs. ${item.unit_price.toFixed(2)}` : 'N/A'}
                                        </TableCell>
                                        <TableCell 
                                          align="right" 
                                          sx={{ 
                                            fontSize: '0.75rem', 
                                            py: 0.5, 
                                            fontWeight: 500,
                                            ...getMissingFieldStyle(missingFields.totalPrice, theme)
                                          }}
                                        >
                                          {item.total_price && item.total_price > 0 ? `Rs. ${item.total_price.toFixed(2)}` : 'N/A'}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                  {getBillItems(transaction).length > 5 && !showAllItems.has(transaction._id) && (
                                    <TableRow 
                                      onClick={() => toggleShowAllItems(transaction._id)}
                                      sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                                        },
                                      }}
                                    >
                                      <TableCell 
                                        colSpan={5} 
                                        align="center" 
                                        sx={{ 
                                          color: theme.palette.primary.main, 
                                          fontSize: '0.75rem', 
                                          py: 0.5,
                                          textDecoration: 'underline',
                                          fontWeight: 500,
                                        }}
                                      >
                                        +{getBillItems(transaction).length - 5} more items
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {getBillItems(transaction).length > 5 && showAllItems.has(transaction._id) && (
                                    <TableRow 
                                      onClick={() => toggleShowAllItems(transaction._id)}
                                      sx={{ 
                                        cursor: 'pointer',
                                        '&:hover': {
                                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                                        },
                                      }}
                                    >
                                      <TableCell 
                                        colSpan={5} 
                                        align="center" 
                                        sx={{ 
                                          color: theme.palette.primary.main, 
                                          fontSize: '0.75rem', 
                                          py: 0.5,
                                          textDecoration: 'underline',
                                          fontWeight: 500,
                                        }}
                                      >
                                        Show less
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                              </TableContainer>
                              {/* Top scroll indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '20px',
                                  background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, transparent 100%)`,
                                  pointerEvents: 'none',
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  zIndex: 1,
                                }}
                              />
                              {/* Bottom scroll indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '20px',
                                  background: `linear-gradient(to top, ${theme.palette.background.paper} 0%, transparent 100%)`,
                                  pointerEvents: 'none',
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  zIndex: 1,
                                }}
                              />
                            </Box>
                          </Box>
                        </Collapse>
                      )}
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













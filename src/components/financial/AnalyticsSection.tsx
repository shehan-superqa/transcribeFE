import { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent, Alert, CircularProgress } from '@mui/material';
import { Bar, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpendingSummary, getSpendingTrends, getAnomalies } from '../../lib/api/financialApi';
import { SpendingSummaryResponse, SpendingTrendsResponse, AnomaliesResponse } from '../../types/financial';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

export default function AnalyticsSection() {
  const { theme } = useTheme();
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [trends, setTrends] = useState<SpendingTrendsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, trendsRes, anomaliesRes] = await Promise.all([
        getSpendingSummary({ period }),
        getSpendingTrends({ period: 'monthly' }),
        getAnomalies({ limit: 50 }),
      ]);
      if (summaryRes.success) setSummary(summaryRes);
      if (trendsRes.success) setTrends(trendsRes);
      if (anomaliesRes.success) setAnomalies(anomaliesRes);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const summaryChartData = summary
    ? {
        labels: summary.summary.by_category.map((item) => item.category_name),
        datasets: [
          {
            label: 'Amount (Rs.)',
            data: summary.summary.by_category.map((item) => item.amount),
            backgroundColor: theme.palette.primary.main,
          },
        ],
      }
    : null;

  const trendsChartData = trends
    ? {
        labels: trends.trends.comparisons.map((item) => item.period),
        datasets: [
          {
            label: 'Current',
            data: trends.trends.comparisons.map((item) => item.current_total),
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(59, 130, 246, 0.1)' 
              : 'rgba(59, 130, 246, 0.1)',
          },
          {
            label: 'Previous',
            data: trends.trends.comparisons.map((item) => item.previous_total),
            borderColor: theme.palette.success.main,
            backgroundColor: theme.palette.mode === 'dark'
              ? 'rgba(16, 185, 129, 0.1)'
              : 'rgba(16, 185, 129, 0.1)',
          },
        ],
      }
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {loading && !summary && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      )}
      <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Spending Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Detailed breakdown of your spending patterns
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="period-select-label">Period</InputLabel>
            <Select
              labelId="period-select-label"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              label="Period"
              aria-label="Select time period for analytics"
            >
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {summary && (
        <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Spending Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', mb: 2 }}>
              <Box>
                <Typography variant="h3" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                  Rs. {summary.summary.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total spending ({period})
                </Typography>
              </Box>
              <Box>
                <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  {summary.summary.transaction_count}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transactions
                </Typography>
              </Box>
              {summary.summary.transaction_count > 0 && (
                <Box>
                  <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                    Rs. {(summary.summary.total / summary.summary.transaction_count).toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Average per transaction
                  </Typography>
                </Box>
              )}
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
              This shows your total spending and transaction count for the selected period. Use the chart below to see category breakdown.
            </Typography>
          </Box>
          {summaryChartData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                Spending by Category
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Visual breakdown showing how much you spent in each category
              </Typography>
              <Box sx={{ height: '400px' }}>
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
                          label: (context) => `Rs. ${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        },
                      },
                    },
                  }}
                  key={`summary-${period}`}
                  aria-label="Bar chart showing spending by category"
                />
              </Box>
            </Box>
          )}
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
              Category Breakdown
            </Typography>
            <TableContainer>
              <Table size="small" aria-label="Spending breakdown by category">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Category</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Amount</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Count</TableCell>
                    <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summary.summary.by_category.map((item) => (
                    <TableRow key={item.category_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box
                            sx={{
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              backgroundColor: summaryChartData?.datasets[0].backgroundColor[
                                summary.summary.by_category.indexOf(item) % (summaryChartData?.datasets[0].backgroundColor.length || 1)
                              ] || theme.palette.primary.main,
                            }}
                          />
                          {item.category_name}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          Rs. {item.amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {item.percentage.toFixed(1)}%
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Paper>
      )}

      {trends && (
        <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Spending Trends
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                {trends.trends.overall_growth_rate >= 0 ? '+' : ''}
                {trends.trends.overall_growth_rate.toFixed(2)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Overall growth rate
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontStyle: 'italic' }}>
              Compare your spending across different time periods to identify trends and patterns.
            </Typography>
          </Box>
          {trendsChartData && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ fontWeight: 600 }}>
                Month-over-Month Comparison
              </Typography>
              <Box sx={{ height: '400px' }}>
                <Line 
                  data={trendsChartData} 
                  options={{ 
                    maintainAspectRatio: false,
                    responsive: true,
                    plugins: {
                      legend: {
                        display: true,
                        position: 'top',
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => `${context.dataset.label}: Rs. ${context.parsed.y.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                        },
                      },
                    },
                    elements: {
                      point: {
                        radius: 5,
                        hoverRadius: 7,
                      },
                    },
                  }}
                  key="trends-chart"
                  aria-label="Line chart showing spending trends over time"
                />
              </Box>
            </Box>
          )}
        </Paper>
      )}

      {anomalies && anomalies.anomalies.length > 0 && (
        <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
          <Box sx={{ mb: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Unusual Transactions ({anomalies.count})
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              These transactions appear unusual compared to your normal spending patterns. Review them to ensure accuracy.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {anomalies.anomalies.map((anomaly) => (
              <Card key={anomaly._id} elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, backgroundColor: theme.palette.background.paper }}>
                <CardContent>
                  <Typography variant="subtitle2">
                    Rs. {anomaly.amount.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {anomaly.anomaly_reason}
                  </Typography>
                  {(anomaly.merchant_name || anomaly.category_name) && (
                    <Typography variant="caption" color="text.secondary">
                      {anomaly.merchant_name && `Merchant: ${anomaly.merchant_name}`}
                      {anomaly.merchant_name && anomaly.category_name && ' • '}
                      {anomaly.category_name && `Category: ${anomaly.category_name}`}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}

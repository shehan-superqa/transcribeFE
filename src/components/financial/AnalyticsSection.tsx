import { useState, useEffect } from 'react';
import { Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Card, CardContent } from '@mui/material';
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
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [trends, setTrends] = useState<SpendingTrendsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [period]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [summaryRes, trendsRes, anomaliesRes] = await Promise.all([
        getSpendingSummary({ period }),
        getSpendingTrends({ period: 'monthly' }),
        getAnomalies({ limit: 50 }),
      ]);
      if (summaryRes.success) setSummary(summaryRes);
      if (trendsRes.success) setTrends(trendsRes);
      if (anomaliesRes.success) setAnomalies(anomaliesRes);
    } catch (error) {
      console.error('Failed to load analytics:', error);
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
            backgroundColor: '#3b82f6',
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
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
          },
          {
            label: 'Previous',
            data: trends.trends.comparisons.map((item) => item.previous_total),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
          },
        ],
      }
    : null;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={1} sx={{ p: 2, backgroundColor: '#ffffff' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: '#111827' }}>Analytics</Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Period</InputLabel>
            <Select value={period} onChange={(e) => setPeriod(e.target.value as any)} label="Period">
              <MenuItem value="daily">Daily</MenuItem>
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {summary && (
        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#ffffff' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#111827' }}>
            Spending Summary
          </Typography>
          <Typography variant="body1" gutterBottom>
            Total: Rs. {summary.summary.total.toFixed(2)} ({summary.summary.transaction_count} transactions)
          </Typography>
          {summaryChartData && (
            <Box sx={{ height: '400px', mt: 2 }}>
              <Bar 
                data={summaryChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                }}
                key={`summary-${period}`}
              />
            </Box>
          )}
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ backgroundColor: '#f9fafb', color: '#111827', fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#f9fafb', color: '#111827', fontWeight: 600 }}>Amount</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#f9fafb', color: '#111827', fontWeight: 600 }}>Count</TableCell>
                  <TableCell align="right" sx={{ backgroundColor: '#f9fafb', color: '#111827', fontWeight: 600 }}>Percentage</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summary.summary.by_category.map((item) => (
                  <TableRow key={item.category_id}>
                    <TableCell>{item.category_name}</TableCell>
                    <TableCell align="right">Rs. {item.amount.toFixed(2)}</TableCell>
                    <TableCell align="right">{item.count}</TableCell>
                    <TableCell align="right">{item.percentage.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {trends && (
        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#ffffff' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#111827' }}>
            Spending Trends
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Overall Growth Rate: {trends.trends.overall_growth_rate.toFixed(2)}%
          </Typography>
          {trendsChartData && (
            <Box sx={{ height: '400px', mt: 2 }}>
              <Line 
                data={trendsChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                  elements: {
                    point: {
                      radius: 4,
                    },
                  },
                }}
                key="trends-chart"
              />
            </Box>
          )}
        </Paper>
      )}

      {anomalies && anomalies.anomalies.length > 0 && (
        <Paper elevation={1} sx={{ p: 2, backgroundColor: '#ffffff' }}>
          <Typography variant="h6" gutterBottom sx={{ color: '#111827' }}>
            Anomalies ({anomalies.count})
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 2 }}>
            {anomalies.anomalies.map((anomaly) => (
              <Card key={anomaly._id} elevation={0} sx={{ border: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
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

import { useMemo, useCallback, useState } from 'react';
import { Box, Paper, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Snackbar, Alert } from '@mui/material';
import { Download, ContentCopy, Clear } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { Transaction, Merchant, Category } from '../../types/financial';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement
);

interface RightPanelProps {
  transactions: Transaction[];
  merchants?: Merchant[];
  categories?: Category[];
  activeSection: string;
  onClearFilters?: () => void;
  hasFilters?: boolean;
}

export default function RightPanel({
  transactions,
  merchants = [],
  categories = [],
  activeSection,
  onClearFilters,
  hasFilters = false,
}: RightPanelProps) {
  const { theme } = useTheme();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const getMerchantName = useCallback((merchantId: string) => {
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.merchant_name || merchantId || 'Unknown';
  }, [merchants]);

  const getCategoryName = useCallback((categoryId: string) => {
    const category = categories.find((c) => c._id === categoryId);
    return category?.category_name || categoryId || 'Unknown';
  }, [categories]);

  const csvData = useMemo(() => {
    return transactions.map((txn) => ({
      Date: new Date(txn.date).toLocaleDateString(),
      Merchant: getMerchantName(txn.merchant_id),
      Category: getCategoryName(txn.category_id),
      Amount: `Rs. ${txn.amount.toFixed(2)}`,
      Status: txn.status,
      Confidence: `${(txn.confidence_category * 100).toFixed(1)}%`,
    }));
  }, [transactions, getMerchantName, getCategoryName]);

  const csvString = useMemo(() => {
    if (csvData.length === 0) return '';
    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map((row) => Object.values(row).join(','));
    return [headers, ...rows].join('\n');
  }, [csvData]);

  const handleExportCSV = () => {
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(csvString);
      setSnackbar({ open: true, message: 'CSV data copied to clipboard!', severity: 'success' });
    } catch (err) {
      console.error('Failed to copy:', err);
      setSnackbar({ open: true, message: 'Failed to copy to clipboard', severity: 'error' });
    }
  };

  // Calculate spending by category for charts
  const spendingByCategory = useMemo(() => {
    const categoryMap = new Map<string, number>();
    transactions.forEach((txn) => {
      const categoryName = getCategoryName(txn.category_id);
      categoryMap.set(categoryName, (categoryMap.get(categoryName) || 0) + txn.amount);
    });
    return Array.from(categoryMap.entries())
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10); // Top 10 categories
  }, [transactions, getCategoryName]);

  const pieChartData = {
    labels: spendingByCategory.map((item) => item.name),
    datasets: [
      {
        data: spendingByCategory.map((item) => item.amount),
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e0b',
          '#ef4444',
          '#8b5cf6',
          '#ec4899',
          '#06b6d4',
          '#84cc16',
          '#f97316',
          '#6366f1',
        ],
      },
    ],
  };

  const barChartData = {
    labels: spendingByCategory.map((item) => item.name),
    datasets: [
      {
        label: 'Amount (Rs.)',
        data: spendingByCategory.map((item) => item.amount),
        backgroundColor: theme.palette.primary.main,
      },
    ],
  };

  const totalAmount = useMemo(() => {
    return transactions.reduce((sum, txn) => sum + txn.amount, 0);
  }, [transactions]);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header with actions */}
      <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Transactions Data</Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {hasFilters && onClearFilters && (
              <Button
                size="small"
                startIcon={<Clear />}
                onClick={onClearFilters}
                variant="outlined"
                sx={{
                  borderColor: theme.palette.divider,
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
                  },
                }}
              >
                Clear Filters
              </Button>
            )}
            <Button
              size="small"
              startIcon={<Download />}
              onClick={handleExportCSV}
              variant="contained"
              disabled={transactions.length === 0}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
                '&:disabled': {
                  backgroundColor: theme.palette.action.disabledBackground,
                  color: theme.palette.action.disabled,
                },
              }}
            >
              Export CSV
            </Button>
            <IconButton
              size="small"
              onClick={handleCopyToClipboard}
              disabled={transactions.length === 0}
              sx={{
                color: theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(0, 198, 255, 0.1)' : '#f0f9ff',
                },
                '&:disabled': {
                  color: theme.palette.action.disabled,
                },
              }}
            >
              <ContentCopy />
            </IconButton>
          </Box>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {transactions.length} transaction{transactions.length !== 1 ? 's' : ''} • Total: Rs.{' '}
          {totalAmount.toFixed(2)}
        </Typography>
      </Paper>

      {/* CSV Table View */}
      <Paper elevation={1} sx={{ flex: 1, overflow: 'auto', backgroundColor: theme.palette.background.paper }}>
        <TableContainer sx={{ maxHeight: '40vh' }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Merchant</TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Category</TableCell>
                <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Amount</TableCell>
                <TableCell sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', color: theme.palette.text.primary, fontWeight: 600 }}>Confidence</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ backgroundColor: theme.palette.background.paper }}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No transactions to display
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((txn, index) => (
                  <TableRow 
                    key={txn._id} 
                    hover
                    sx={{ 
                      backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                      },
                    }}
                  >
                    <TableCell sx={{ color: theme.palette.text.primary }}>{new Date(txn.date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>{getMerchantName(txn.merchant_id)}</TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary }}>{getCategoryName(txn.category_id)}</TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>Rs. {txn.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{
                          color:
                            txn.status === 'confirmed'
                              ? '#10b981'
                              : txn.status === 'pending'
                              ? '#f59e0b'
                              : '#ef4444',
                          fontWeight: 500,
                        }}
                      >
                        {txn.status}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                      {(txn.confidence_category * 100).toFixed(1)}%
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Charts */}
      {activeSection === 'transactions' && spendingByCategory.length > 0 && (
        <>
          <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Spending by Category
            </Typography>
            <Box sx={{ height: '300px' }}>
              <Pie 
                data={pieChartData} 
                options={{ 
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                }}
                key="pie-chart"
              />
            </Box>
          </Paper>

          <Paper elevation={1} sx={{ p: 2, backgroundColor: theme.palette.background.paper }}>
            <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Top Categories
            </Typography>
            <Box sx={{ height: '300px' }}>
              <Bar
                data={barChartData}
                options={{
                  maintainAspectRatio: false,
                  responsive: true,
                  plugins: {
                    legend: {
                      display: true,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function (value) {
                          return 'Rs. ' + value;
                        },
                      },
                    },
                  },
                }}
                key="bar-chart"
              />
            </Box>
          </Paper>
        </>
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}











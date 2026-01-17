import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CheckCircle as CheckCircleIcon,
  Add as AddIcon,
  Repeat as RepeatIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { UpcomingPayment } from '../../types/financial';
import RecurringPaymentsSection from './RecurringPaymentsSection';
import { getUpcomingPaymentsSummary } from '../../lib/api/financialApi';

interface NewPaymentForm {
  name: string;
  type: 'earning' | 'expense';
  amount: string;
  date: string;
  time: string;
  category_name: string;
  merchant_name: string;
}

export default function UpcomingPaymentsSection() {
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([]);
  const [summary, setSummary] = useState({
    totalUpcomingExpenses: 0,
    totalUpcomingEarnings: 0,
    netUpcoming: 0,
    currentBudget: 0,
    remainingAfterUpcoming: 0,
    remainingPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | '3_months' | '6_months'>('month');
  const [openDialog, setOpenDialog] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState<NewPaymentForm>({
    name: '',
    type: 'expense',
    amount: '',
    date: '',
    time: '',
    category_name: '',
    merchant_name: '',
  });

  // Fetch upcoming payments summary from API
  useEffect(() => {
    const fetchUpcomingPayments = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getUpcomingPaymentsSummary(period);
        
        if (response.success) {
          setUpcomingPayments(response.upcoming_payments);
          setSummary({
            totalUpcomingExpenses: response.total_upcoming_expenses,
            totalUpcomingEarnings: response.total_upcoming_earnings,
            netUpcoming: response.net_upcoming,
            currentBudget: response.current_budget,
            remainingAfterUpcoming: response.remaining_after_upcoming,
            remainingPercentage: response.remaining_percentage,
          });
        } else {
          setError('Failed to fetch upcoming payments');
        }
      } catch (err) {
        console.error('Error fetching upcoming payments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch upcoming payments');
        // Fallback to empty state on error
        setUpcomingPayments([]);
        setSummary({
          totalUpcomingExpenses: 0,
          totalUpcomingEarnings: 0,
          netUpcoming: 0,
          currentBudget: 0,
          remainingAfterUpcoming: 0,
          remainingPercentage: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingPayments();
  }, [period]);

  const sortedPayments = useMemo(() => {
    return [...upcomingPayments].sort((a, b) => a.days_until_due - b.days_until_due);
  }, [upcomingPayments]);

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getDaysUntilBgColor = (days: number) => {
    if (days <= 3) return '#EF4444'; // red-500
    if (days <= 7) return '#F59E0B'; // amber-500
    return '#10B981'; // emerald-500
  };

  const calculateDaysUntilDue = (dateString: string, timeString: string): number => {
    if (!dateString) return 0;
    
    const [year, month, day] = dateString.split('-').map(Number);
    const [hours = 0, minutes = 0] = timeString ? timeString.split(':').map(Number) : [0, 0];
    
    const dueDate = new Date(year, month - 1, day, hours, minutes);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 ? diffDays : 0;
  };

  const handleAddPayment = () => {
    if (!newPaymentForm.name || !newPaymentForm.amount || !newPaymentForm.date) {
      return;
    }

    const amount = parseFloat(newPaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      return;
    }

    const daysUntilDue = calculateDaysUntilDue(newPaymentForm.date, newPaymentForm.time);

    const newPayment: UpcomingPayment = {
      recurring_payment_id: `manual-${Date.now()}`,
      name: newPaymentForm.name,
      type: newPaymentForm.type,
      amount: amount,
      due_date: newPaymentForm.date, // Store date only for compatibility
      days_until_due: daysUntilDue,
      category_name: newPaymentForm.category_name || undefined,
      merchant_name: newPaymentForm.merchant_name || undefined,
    };

    setUpcomingPayments([...upcomingPayments, newPayment]);
    
    // Reset form
    setNewPaymentForm({
      name: '',
      type: 'expense',
      amount: '',
      date: '',
      time: '',
      category_name: '',
      merchant_name: '',
    });
    
    setOpenDialog(false);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewPaymentForm({
      name: '',
      type: 'expense',
      amount: '',
      date: '',
      time: '',
      category_name: '',
      merchant_name: '',
    });
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: '24px' }}>
            Upcoming Payments
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
            View and manage your upcoming recurring payments and their impact on your budget
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Period</InputLabel>
            <Select
              value={period}
              label="Period"
              onChange={(e) => setPeriod(e.target.value as 'week' | 'month' | '3_months' | '6_months')}
            >
              <MenuItem value="week">Next Week</MenuItem>
              <MenuItem value="month">Next Month</MenuItem>
              <MenuItem value="3_months">Next 3 Months</MenuItem>
              <MenuItem value="6_months">Next 6 Months</MenuItem>
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            startIcon={<RepeatIcon />}
            onClick={() => setRecurringModalOpen(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
              borderColor: isDark ? '#475569' : '#E2E8F0',
              color: isDark ? '#CBD5E1' : '#475569',
              '&:hover': {
                borderColor: '#6D28D9',
                color: '#6D28D9',
                bgcolor: isDark ? 'rgba(109, 40, 217, 0.1)' : 'rgba(109, 40, 217, 0.05)',
              },
            }}
          >
            Manage Recurring
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              borderRadius: '8px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1,
            }}
          >
            Add Payment
          </Button>
        </Box>
      </Box>

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error State */}
      {error && !loading && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Content - Only show when not loading */}
      {!loading && (
        <>

          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              bgcolor: isDark ? '#0F172A' : '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              height: '100%' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#EEF2FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6366F1',
                  }}
                >
                  <AccountBalanceIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '14px' }}>
                  Current Budget
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, fontSize: '24px' }}>
                ${summary.currentBudget.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              bgcolor: isDark ? '#0F172A' : '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              height: '100%' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#ECFDF5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                  }}
                >
                  <TrendingUpIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '14px' }}>
                  Upcoming Earnings
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', fontSize: '24px' }}>
                +${summary.totalUpcomingEarnings.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              bgcolor: isDark ? '#0F172A' : '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              height: '100%' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(244, 63, 94, 0.3)' : '#FEF2F2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#F43F5E',
                  }}
                >
                  <TrendingDownIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '14px' }}>
                  Upcoming Expenses
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#F43F5E', fontSize: '24px' }}>
                -${summary.totalUpcomingExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card 
            sx={{ 
              borderRadius: '16px', 
              border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
              bgcolor: isDark ? '#0F172A' : '#FFFFFF',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              height: '100%' 
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '12px',
                    bgcolor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#EFF6FF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#2563EB',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ fontSize: 20 }} />
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary', fontSize: '14px' }}>
                  Net Upcoming
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: '#2563EB',
                  fontSize: '24px'
                }}
              >
                +${summary.netUpcoming.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

          {/* Budget Impact Card */}
          <Card 
        sx={{ 
          borderRadius: '16px', 
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          bgcolor: isDark ? '#0F172A' : '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          mb: 4 
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 3, fontSize: '18px' }}>
            Budget Impact Analysis
          </Typography>
          
          <Grid container spacing={6}>
            <Grid item xs={12} lg={6}>
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                    Remaining After Upcoming Payments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px' }}>
                    ${summary.remainingAfterUpcoming.toFixed(2)}
                  </Typography>
                </Box>
                <Box 
                  sx={{ 
                    position: 'relative',
                    height: 16,
                    borderRadius: '9999px',
                    bgcolor: isDark ? '#1E293B' : '#F1F5F9',
                    overflow: 'visible',
                    mb: 1,
                  }}
                >
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      bgcolor: '#10B981',
                      width: `${summary.remainingPercentage}%`,
                      borderRadius: '9999px',
                      maxWidth: '100%',
                    }}
                  />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                    0%
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                    {summary.remainingPercentage.toFixed(1)}% of current budget
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                    100%
                  </Typography>
                </Box>
              </Box>

              <Box 
                sx={{ 
                  display: 'flex',
                  gap: 2,
                  p: 2,
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                  border: `1px solid ${isDark ? '#065F46' : '#A7F3D0'}`,
                  borderRadius: '12px',
                }}
              >
                <CheckCircleIcon sx={{ color: '#10B981', fontSize: 24 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px', color: isDark ? '#6EE7B7' : '#065F46', mb: 0.5 }}>
                    Budget Healthy
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '12px', color: isDark ? '#A7F3D0' : '#047857' }}>
                    You have sufficient budget remaining after upcoming payments.
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} lg={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}` }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
                    Current Budget:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, fontSize: '14px' }}>
                    ${summary.currentBudget.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}` }}>
                  <Typography variant="body2" sx={{ fontSize: '14px', color: '#10B981' }}>
                    + Upcoming Earnings:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#10B981', fontSize: '14px' }}>
                    ${summary.totalUpcomingEarnings.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1, borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}` }}>
                  <Typography variant="body2" sx={{ fontSize: '14px', color: '#F43F5E' }}>
                    - Upcoming Expenses:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: '#F43F5E', fontSize: '14px' }}>
                    ${summary.totalUpcomingExpenses.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '14px' }}>
                    Remaining Budget:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      fontSize: '18px'
                    }}
                  >
                    ${summary.remainingAfterUpcoming.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '12px' }}>
                    Percentage of Budget:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 500, fontSize: '12px' }}>
                    {summary.remainingPercentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

          {/* Upcoming Payments Table */}
          <Card 
        sx={{ 
          borderRadius: '16px', 
          border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          bgcolor: isDark ? '#0F172A' : '#FFFFFF',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: 3, borderBottom: `1px solid ${isDark ? '#1E293B' : '#F1F5F9'}` }}>
          <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
            Payment Schedule
          </Typography>
        </Box>
        
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC' }}>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Payment Name
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Type
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Amount
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Due Date
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Days Until
                </TableCell>
                <TableCell 
                  sx={{ 
                    fontWeight: 600, 
                    fontSize: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'text.secondary',
                    py: 2,
                    px: 3
                  }}
                >
                  Category
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPayments.map((payment) => (
                <TableRow 
                  key={payment.recurring_payment_id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: isDark ? 'rgba(30, 41, 59, 0.5)' : '#F8FAFC',
                      transition: 'background-color 0.2s',
                    },
                  }}
                >
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '14px', mb: payment.merchant_name ? 0.5 : 0 }}>
                      {payment.name}
                    </Typography>
                    {payment.merchant_name && (
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontSize: '10px',
                          color: 'text.secondary',
                          textTransform: 'uppercase',
                        }}
                      >
                        {payment.merchant_name}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Chip
                      label={payment.type === 'earning' ? 'EARNING' : 'EXPENSE'}
                      size="small"
                      sx={{ 
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        height: 20,
                        bgcolor: payment.type === 'earning' 
                          ? (isDark ? 'rgba(16, 185, 129, 0.3)' : '#D1FAE5')
                          : (isDark ? 'rgba(244, 63, 94, 0.3)' : '#FEE2E2'),
                        color: payment.type === 'earning' ? '#10B981' : '#F43F5E',
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        fontWeight: 700,
                        fontSize: '14px',
                        color: payment.type === 'earning' ? '#10B981' : '#F43F5E'
                      }}
                    >
                      {payment.type === 'earning' ? '+' : '-'}${payment.amount.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                      {new Date(payment.due_date).toLocaleDateString('en-US', { 
                        month: 'numeric', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Chip
                      label={`${payment.days_until_due} days`}
                      size="small"
                      sx={{ 
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 700,
                        height: 20,
                        bgcolor: getDaysUntilBgColor(payment.days_until_due),
                        color: '#FFFFFF',
                        border: 'none',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                      {payment.category_name || 'N/A'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

          {/* Add Payment Dialog */}
          <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '16px',
            bgcolor: isDark ? '#0F172A' : '#FFFFFF',
            border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '20px', pb: 2 }}>
          Add New Payment / Earning
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={newPaymentForm.name}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, name: e.target.value })}
              required
              placeholder="e.g., Monthly Salary, Rent Payment"
            />

            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select
                value={newPaymentForm.type}
                label="Type"
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, type: e.target.value as 'earning' | 'expense' })}
              >
                <MenuItem value="earning">Earning</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={newPaymentForm.amount}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, amount: e.target.value })}
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1, color: 'text.secondary' }}>$</Typography>,
              }}
              placeholder="0.00"
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={newPaymentForm.date}
                  onChange={(e) => setNewPaymentForm({ ...newPaymentForm, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={newPaymentForm.time}
                  onChange={(e) => setNewPaymentForm({ ...newPaymentForm, time: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    step: 300, // 5 minutes
                  }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Category (Optional)"
              value={newPaymentForm.category_name}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, category_name: e.target.value })}
              placeholder="e.g., Income, Utilities, Housing"
            />

            <TextField
              fullWidth
              label="Merchant / Source (Optional)"
              value={newPaymentForm.merchant_name}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, merchant_name: e.target.value })}
              placeholder="e.g., Company Name, Property Management"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={handleCloseDialog}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              color: 'text.secondary',
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddPayment}
            variant="contained"
            disabled={!newPaymentForm.name || !newPaymentForm.amount || !newPaymentForm.date}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
            }}
          >
            Add Payment
          </Button>
        </DialogActions>
      </Dialog>

          {/* Recurring Payments Modal */}
          <Dialog
        open={recurringModalOpen}
        onClose={() => setRecurringModalOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            maxHeight: '90vh',
            borderRadius: '16px',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
            pb: '1rem',
          }}
        >
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 600 }}>
            Manage Recurring Payments
          </Typography>
          <IconButton
            onClick={() => setRecurringModalOpen(false)}
            sx={{
              color: isDark ? '#9CA3AF' : '#6B7280',
              '&:hover': {
                backgroundColor: isDark ? '#1E293B' : '#F3F4F6',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent
          sx={{
            p: '1rem',
            overflow: 'auto',
            '& .MuiBox-root': {
              maxWidth: '100%',
              px: { xs: 1, sm: 1.5 },
            },
          }}
        >
          <RecurringPaymentsSection hideHeader={true} />
        </DialogContent>
      </Dialog>
        </>
      )}
    </Box>
  );
}

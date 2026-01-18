import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@mui/material/styles';
import { useNotification } from '../../contexts/NotificationContext';
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
  Autocomplete,
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
import { UpcomingPayment, Category } from '../../types/financial';
import RecurringPaymentsSection from './RecurringPaymentsSection';
import CountdownTimer from './CountdownTimer';
import { 
  getUpcomingPaymentsSummary, 
  createRecurringPayment,
  listCategories,
  listMerchants,
  listRecurringPayments,
} from '../../lib/api/financialApi';

interface NewPaymentForm {
  name: string;
  type: 'earning' | 'expense';
  amount: string;
  date: string;
  time: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom' | 'custom_minutes' | 'custom_hours' | 'custom_days';
  custom_interval_days: string;
  custom_interval_hours: string;
  custom_interval_minutes: string;
  end_date: string;
  category_name: string;
  merchant_name: string;
}

export default function UpcomingPaymentsSection() {
  const { showActionNotification } = useNotification();
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
  const [earningsDuration, setEarningsDuration] = useState<'1_day' | '3_days' | '1_week' | '1_month' | '1_year'>('1_month');
  const [expensesDuration, setExpensesDuration] = useState<'1_day' | '3_days' | '1_week' | '1_month' | '1_year'>('1_month');
  const [netDuration, setNetDuration] = useState<'1_day' | '3_days' | '1_week' | '1_month' | '1_year'>('1_month');
  const [openDialog, setOpenDialog] = useState(false);
  const [recurringModalOpen, setRecurringModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchants, setMerchants] = useState<Array<{ _id: string; name: string }>>([]);
  const [recurringPaymentsMap, setRecurringPaymentsMap] = useState<Map<string, { start_date: string; created_at: string }>>(new Map());
  const [newPaymentForm, setNewPaymentForm] = useState<NewPaymentForm>({
    name: '',
    type: 'expense',
    amount: '',
    date: '',
    time: '',
    frequency: 'monthly',
    custom_interval_days: '',
    custom_interval_hours: '',
    custom_interval_minutes: '',
    end_date: '',
    category_name: '',
    merchant_name: '',
  });

  // Fetch categories, merchants, and recurring payments (for time info)
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [categoriesResponse, merchantsResponse, recurringResponse] = await Promise.all([
          listCategories(),
          listMerchants(),
          listRecurringPayments({ active_only: true }),
        ]);
        
        if (categoriesResponse.success) {
          setCategories(categoriesResponse.categories || []);
        }
        if (merchantsResponse.success) {
          setMerchants(merchantsResponse.merchants || []);
        }
        if (recurringResponse.success && recurringResponse.recurring_payments) {
          const map = new Map<string, { start_date: string; created_at: string }>();
          recurringResponse.recurring_payments.forEach((payment) => {
            map.set(payment._id, { 
              start_date: payment.start_date,
              created_at: payment.created_at 
            });
          });
          setRecurringPaymentsMap(map);
        }
      } catch (err) {
        console.error('Error fetching filters:', err);
      }
    };

    fetchFilters();
  }, []);

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

  // Helper function to get days from duration
  const getDaysFromDuration = (duration: '1_day' | '3_days' | '1_week' | '1_month' | '1_year'): number => {
    switch (duration) {
      case '1_day': return 1;
      case '3_days': return 3;
      case '1_week': return 7;
      case '1_month': return 30;
      case '1_year': return 365;
      default: return 30;
    }
  };

  // Filter payments by duration
  const filterPaymentsByDuration = (payments: UpcomingPayment[], duration: '1_day' | '3_days' | '1_week' | '1_month' | '1_year'): UpcomingPayment[] => {
    const days = getDaysFromDuration(duration);
    return payments.filter(payment => payment.days_until_due <= days);
  };

  // Calculate filtered amounts
  const filteredEarnings = useMemo(() => {
    const filtered = filterPaymentsByDuration(
      upcomingPayments.filter(p => p.type === 'earning'),
      earningsDuration
    );
    return filtered.reduce((sum, p) => sum + p.amount, 0);
  }, [upcomingPayments, earningsDuration]);

  const filteredExpenses = useMemo(() => {
    const filtered = filterPaymentsByDuration(
      upcomingPayments.filter(p => p.type === 'expense'),
      expensesDuration
    );
    return filtered.reduce((sum, p) => sum + p.amount, 0);
  }, [upcomingPayments, expensesDuration]);

  const filteredNet = useMemo(() => {
    const earningsFiltered = filterPaymentsByDuration(
      upcomingPayments.filter(p => p.type === 'earning'),
      netDuration
    );
    const expensesFiltered = filterPaymentsByDuration(
      upcomingPayments.filter(p => p.type === 'expense'),
      netDuration
    );
    const earningsTotal = earningsFiltered.reduce((sum, p) => sum + p.amount, 0);
    const expensesTotal = expensesFiltered.reduce((sum, p) => sum + p.amount, 0);
    return earningsTotal - expensesTotal;
  }, [upcomingPayments, netDuration]);

  // Find next nearest payment dates
  const nextEarningDate = useMemo(() => {
    const earnings = upcomingPayments.filter(p => p.type === 'earning');
    if (earnings.length === 0) return null;
    const sorted = [...earnings].sort((a, b) => a.days_until_due - b.days_until_due);
    return sorted[0];
  }, [upcomingPayments]);

  const nextExpenseDate = useMemo(() => {
    const expenses = upcomingPayments.filter(p => p.type === 'expense');
    if (expenses.length === 0) return null;
    const sorted = [...expenses].sort((a, b) => a.days_until_due - b.days_until_due);
    return sorted[0];
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

  const handleAddPayment = async () => {
    if (!newPaymentForm.name || !newPaymentForm.amount || !newPaymentForm.date || !newPaymentForm.category_name) {
      setError('Please fill in all required fields');
      return;
    }

    const amount = parseFloat(newPaymentForm.amount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Combine date and time into ISO string
      const dateTime = newPaymentForm.time 
        ? `${newPaymentForm.date}T${newPaymentForm.time}:00`
        : `${newPaymentForm.date}T00:00:00`;
      
      const startDate = new Date(dateTime).toISOString();

      // Create recurring payment (one-time occurrence if no end date)
      // Find category_id if category_name matches an existing category
      const matchedCategory = newPaymentForm.category_name
        ? categories.find(
            c => c?.category_name?.toLowerCase() === newPaymentForm.category_name.toLowerCase()
          )
        : undefined;
      
      // Find merchant_id if merchant_name matches an existing merchant
      const matchedMerchant = newPaymentForm.merchant_name
        ? merchants.find(
            m => m?.name?.toLowerCase() === newPaymentForm.merchant_name.toLowerCase()
          )
        : undefined;

      const request: any = {
        name: newPaymentForm.name,
        type: newPaymentForm.type,
        amount: amount,
        frequency: newPaymentForm.frequency,
        start_date: startDate,
        end_date: newPaymentForm.end_date ? new Date(newPaymentForm.end_date).toISOString() : null,
        is_active: true,
      };

      // Add custom interval fields based on frequency
      if (newPaymentForm.frequency === 'custom_minutes' && newPaymentForm.custom_interval_minutes) {
        request.custom_interval_minutes = parseInt(newPaymentForm.custom_interval_minutes);
      } else if (newPaymentForm.frequency === 'custom_hours' && newPaymentForm.custom_interval_hours) {
        request.custom_interval_hours = parseInt(newPaymentForm.custom_interval_hours);
      } else if ((newPaymentForm.frequency === 'custom' || newPaymentForm.frequency === 'custom_days') && newPaymentForm.custom_interval_days) {
        request.custom_interval_days = parseInt(newPaymentForm.custom_interval_days);
      }

      // Add category - use ID if matched, otherwise use name
      if (newPaymentForm.category_name) {
        if (matchedCategory) {
          request.category_id = matchedCategory._id;
        } else {
          request.category_name = newPaymentForm.category_name;
        }
      }

      // Add merchant - use ID if matched, otherwise use name
      if (newPaymentForm.merchant_name) {
        if (matchedMerchant) {
          request.merchant_id = matchedMerchant._id;
        } else {
          request.merchant_name = newPaymentForm.merchant_name;
        }
      }

      const response = await createRecurringPayment(request);
      
      if (response.success) {
        // Show success notification
        showActionNotification({
          title: 'Recurring Payment Created',
          message: `Recurring payment "${newPaymentForm.name}" has been set up successfully.`,
          type: 'success',
          actions: [
            {
              label: 'View Payment',
              variant: 'primary',
              onClick: () => {
                setRecurringModalOpen(true);
                setOpenDialog(false);
              },
            },
          ],
        });

        // Refresh the upcoming payments list
        const refreshResponse = await getUpcomingPaymentsSummary(period);
        if (refreshResponse.success) {
          setUpcomingPayments(refreshResponse.upcoming_payments);
          setSummary({
            totalUpcomingExpenses: refreshResponse.total_upcoming_expenses,
            totalUpcomingEarnings: refreshResponse.total_upcoming_earnings,
            netUpcoming: refreshResponse.net_upcoming,
            currentBudget: refreshResponse.current_budget,
            remainingAfterUpcoming: refreshResponse.remaining_after_upcoming,
            remainingPercentage: refreshResponse.remaining_percentage,
          });
        }
        
        // Reset form
        setNewPaymentForm({
          name: '',
          type: 'expense',
          amount: '',
          date: '',
          time: '',
          frequency: 'monthly',
          custom_interval_days: '',
          custom_interval_hours: '',
          custom_interval_minutes: '',
          end_date: '',
          category_name: '',
          merchant_name: '',
        });
        
        setOpenDialog(false);
      } else {
        setError('Failed to create recurring payment');
      }
    } catch (err) {
      console.error('Error creating recurring payment:', err);
      setError(err instanceof Error ? err.message : 'Failed to create recurring payment');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError(null);
    setNewPaymentForm({
      name: '',
      type: 'expense',
      amount: '',
      date: '',
      time: '',
      frequency: 'monthly',
      custom_interval_days: '',
      custom_interval_hours: '',
      custom_interval_minutes: '',
      end_date: '',
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={earningsDuration}
                    onChange={(e) => setEarningsDuration(e.target.value as any)}
                    sx={{
                      fontSize: '11px',
                      height: '28px',
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                      },
                    }}
                  >
                    <MenuItem value="1_day">1 Day</MenuItem>
                    <MenuItem value="3_days">3 Days</MenuItem>
                    <MenuItem value="1_week">1 Week</MenuItem>
                    <MenuItem value="1_month">1 Month</MenuItem>
                    <MenuItem value="1_year">1 Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#10B981', fontSize: '24px', mb: 1 }}>
                +${filteredEarnings.toFixed(2)}
              </Typography>
              {nextEarningDate && (
                <Typography variant="caption" sx={{ fontSize: '12px', color: 'text.secondary', display: 'block' }}>
                  Next: {new Date(nextEarningDate.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={expensesDuration}
                    onChange={(e) => setExpensesDuration(e.target.value as any)}
                    sx={{
                      fontSize: '11px',
                      height: '28px',
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                      },
                    }}
                  >
                    <MenuItem value="1_day">1 Day</MenuItem>
                    <MenuItem value="3_days">3 Days</MenuItem>
                    <MenuItem value="1_week">1 Week</MenuItem>
                    <MenuItem value="1_month">1 Month</MenuItem>
                    <MenuItem value="1_year">1 Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#F43F5E', fontSize: '24px', mb: 1 }}>
                -${filteredExpenses.toFixed(2)}
              </Typography>
              {nextExpenseDate && (
                <Typography variant="caption" sx={{ fontSize: '12px', color: 'text.secondary', display: 'block' }}>
                  Next: {new Date(nextExpenseDate.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Typography>
              )}
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
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
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
                <FormControl size="small" sx={{ minWidth: 100 }}>
                  <Select
                    value={netDuration}
                    onChange={(e) => setNetDuration(e.target.value as any)}
                    sx={{
                      fontSize: '11px',
                      height: '28px',
                      '& .MuiSelect-select': {
                        py: 0.5,
                        px: 1,
                      },
                    }}
                  >
                    <MenuItem value="1_day">1 Day</MenuItem>
                    <MenuItem value="3_days">3 Days</MenuItem>
                    <MenuItem value="1_week">1 Week</MenuItem>
                    <MenuItem value="1_month">1 Month</MenuItem>
                    <MenuItem value="1_year">1 Year</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: '#2563EB',
                  fontSize: '24px'
                }}
              >
                {filteredNet >= 0 ? '+' : ''}${filteredNet.toFixed(2)}
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
                  Due Date & Time
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
                  Created Date
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
              {sortedPayments.map((payment, index) => (
                <TableRow 
                  key={payment.recurring_payment_id || `payment-${index}`}
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
                    {(() => {
                      // Parse the due_date - handle various formats (ISO, GMT, etc.)
                      const dueDateStr = payment.due_date;
                      const dueDate = new Date(dueDateStr);
                      
                      // Check if the date is valid
                      if (isNaN(dueDate.getTime())) {
                        return (
                          <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                            Invalid date
                          </Typography>
                        );
                      }
                      
                      // Check if due_date string contains time information
                      // Formats: ISO (2024-01-17T11:01:17), GMT (Sat, 17 Jan 2026 11:01:17 GMT), etc.
                      const hasTime = dueDateStr.includes(':') && 
                                     (dueDateStr.includes('T') || 
                                      dueDateStr.match(/\d{1,2}:\d{2}:\d{2}/) !== null ||
                                      dueDateStr.includes('GMT') ||
                                      dueDateStr.includes('UTC'));
                      
                      // Get time from recurring payment's start_date as fallback
                      const recurringPayment = recurringPaymentsMap.get(payment.recurring_payment_id);
                      let displayTime: string | null = null;
                      
                      if (hasTime) {
                        // Extract time from due_date
                        displayTime = dueDate.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        });
                      } else if (recurringPayment?.start_date) {
                        // Fallback: use time from recurring payment's start_date
                        try {
                          const startDate = new Date(recurringPayment.start_date);
                          if (!isNaN(startDate.getTime())) {
                            displayTime = startDate.toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit',
                              hour12: true 
                            });
                          }
                        } catch (e) {
                          console.error('Error parsing start_date:', e);
                        }
                      }
                      
                      return (
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                          <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary', fontWeight: 500 }}>
                            {dueDate.toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })}
                          </Typography>
                          {displayTime ? (
                            <Typography variant="caption" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                              {displayTime}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ fontSize: '11px', color: 'text.disabled', fontStyle: 'italic' }}>
                              Time not specified
                            </Typography>
                          )}
                        </Box>
                      );
                    })()}
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
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
                          alignSelf: 'flex-start',
                        }}
                      />
                      <CountdownTimer targetDate={payment.due_date} compact showSeconds={false} />
                    </Box>
                  </TableCell>
                  <TableCell sx={{ py: 2, px: 3 }}>
                    {(() => {
                      const recurringPayment = recurringPaymentsMap.get(payment.recurring_payment_id);
                      const createdDate = recurringPayment?.created_at;
                      
                      if (createdDate) {
                        const date = new Date(createdDate);
                        return (
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                            <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.primary', fontWeight: 500 }}>
                              {date.toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </Typography>
                            <Typography variant="caption" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                              {date.toLocaleTimeString('en-US', { 
                                hour: 'numeric', 
                                minute: '2-digit',
                                hour12: true 
                              })}
                            </Typography>
                          </Box>
                        );
                      }
                      
                      return (
                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                          N/A
                        </Typography>
                      );
                    })()}
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
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            <TextField
              fullWidth
              label="Name"
              value={newPaymentForm.name}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, name: e.target.value })}
              required
              placeholder="e.g., Monthly Salary, Rent Payment"
              error={!newPaymentForm.name && saving}
            />

            <FormControl fullWidth required>
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
              error={(!newPaymentForm.amount || parseFloat(newPaymentForm.amount) <= 0) && saving}
              inputProps={{ min: 0, step: 0.01 }}
            />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={newPaymentForm.date}
                  onChange={(e) => setNewPaymentForm({ ...newPaymentForm, date: e.target.value })}
                  required
                  InputLabelProps={{ shrink: true }}
                  error={!newPaymentForm.date && saving}
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

            <FormControl fullWidth required>
              <InputLabel>Frequency / Duration</InputLabel>
              <Select
                value={newPaymentForm.frequency}
                label="Frequency / Duration"
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, frequency: e.target.value as any })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="custom">Custom (Days)</MenuItem>
                <MenuItem value="custom_days">Custom Days</MenuItem>
                <MenuItem value="custom_hours">Custom Hours</MenuItem>
                <MenuItem value="custom_minutes">Custom Minutes</MenuItem>
              </Select>
            </FormControl>

            {(newPaymentForm.frequency === 'custom' || newPaymentForm.frequency === 'custom_days') && (
              <TextField
                fullWidth
                label="Custom Interval (days)"
                type="number"
                value={newPaymentForm.custom_interval_days}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, custom_interval_days: e.target.value })}
                required
                inputProps={{ min: 1 }}
                placeholder="e.g., 5, 10, 30"
              />
            )}

            {newPaymentForm.frequency === 'custom_hours' && (
              <TextField
                fullWidth
                label="Custom Interval (hours)"
                type="number"
                value={newPaymentForm.custom_interval_hours}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, custom_interval_hours: e.target.value })}
                required
                inputProps={{ min: 1 }}
                placeholder="e.g., 2, 6, 12, 24"
              />
            )}

            {newPaymentForm.frequency === 'custom_minutes' && (
              <TextField
                fullWidth
                label="Custom Interval (minutes)"
                type="number"
                value={newPaymentForm.custom_interval_minutes}
                onChange={(e) => setNewPaymentForm({ ...newPaymentForm, custom_interval_minutes: e.target.value })}
                required
                inputProps={{ min: 1 }}
                placeholder="e.g., 15, 30, 60"
              />
            )}

            <TextField
              fullWidth
              label="End Date (Optional)"
              type="date"
              value={newPaymentForm.end_date}
              onChange={(e) => setNewPaymentForm({ ...newPaymentForm, end_date: e.target.value })}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for ongoing recurring payment"
            />

            <Autocomplete
              freeSolo
              options={[...new Set(categories.map((category) => category.category_name).filter(Boolean))]}
              value={newPaymentForm.category_name || ''}
              onChange={(event, newValue) => {
                setNewPaymentForm({ ...newPaymentForm, category_name: typeof newValue === 'string' ? newValue : '' });
              }}
              onInputChange={(event, newInputValue, reason) => {
                // Only update on user input, not on selection
                if (reason === 'input' || reason === 'clear') {
                  setNewPaymentForm({ ...newPaymentForm, category_name: newInputValue || '' });
                }
              }}
              getOptionLabel={(option) => typeof option === 'string' ? option : ''}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Category"
                  placeholder="Select or type a category"
                  required
                  error={!newPaymentForm.category_name && saving}
                />
              )}
            />

            <Autocomplete
              freeSolo
              options={[...new Set(merchants.map((merchant) => merchant.name).filter(Boolean))]}
              value={newPaymentForm.merchant_name || ''}
              onChange={(event, newValue) => {
                setNewPaymentForm({ ...newPaymentForm, merchant_name: typeof newValue === 'string' ? newValue : '' });
              }}
              onInputChange={(event, newInputValue, reason) => {
                // Only update on user input, not on selection
                if (reason === 'input' || reason === 'clear') {
                  setNewPaymentForm({ ...newPaymentForm, merchant_name: newInputValue || '' });
                }
              }}
              getOptionLabel={(option) => typeof option === 'string' ? option : ''}
              renderOption={(props, option) => (
                <li {...props} key={option}>
                  {option}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Merchant / Source (Optional)"
                  placeholder="Select or type a merchant"
                />
              )}
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
            disabled={!newPaymentForm.name || !newPaymentForm.amount || !newPaymentForm.date || !newPaymentForm.category_name || saving}
            sx={{ 
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '8px',
              px: 3,
            }}
          >
            {saving ? 'Adding...' : 'Add Payment'}
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

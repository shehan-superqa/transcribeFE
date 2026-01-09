import { useState, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Checkbox,
  FormControlLabel,
  Chip,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { UpcomingPayment } from '../../types/financial';
import { createManualTransaction } from '../../lib/api/financialApi';
import { Category } from '../../types/financial';

// Dummy data - in real app, this would come from API
const dummyUpcomingPayments: UpcomingPayment[] = [
  {
    recurring_payment_id: '3',
    name: 'Freelance Income',
    type: 'earning',
    amount: 800,
    due_date: new Date().toISOString().split('T')[0], // Today
    days_until_due: 0,
    category_name: 'Income',
  },
  {
    recurring_payment_id: '1',
    name: 'Monthly Salary',
    type: 'earning',
    amount: 5000,
    due_date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
    days_until_due: -1,
    category_name: 'Income',
  },
  {
    recurring_payment_id: '7',
    name: 'Internet Bill',
    type: 'expense',
    amount: 80,
    due_date: new Date().toISOString().split('T')[0], // Today
    days_until_due: 0,
    category_name: 'Utilities',
    merchant_name: 'ISP Provider',
  },
  {
    recurring_payment_id: '2',
    name: 'Rent Payment',
    type: 'expense',
    amount: 1500,
    due_date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0], // 2 days ago
    days_until_due: -2,
    category_name: 'Housing',
    merchant_name: 'Property Management Co.',
  },
];

interface PaymentAlertsSectionProps {
  categories?: Category[];
  onTransactionCreated?: () => void;
}

export default function PaymentAlertsSection({ 
  categories = [],
  onTransactionCreated 
}: PaymentAlertsSectionProps) {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>(dummyUpcomingPayments);
  const [completedPayments, setCompletedPayments] = useState<Set<string>>(new Set());
  const [processingPayments, setProcessingPayments] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  // Filter payments that are due today or past due
  const duePayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return upcomingPayments.filter(payment => {
      const dueDate = new Date(payment.due_date);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate <= today && !completedPayments.has(payment.recurring_payment_id);
    });
  }, [upcomingPayments, completedPayments]);

  // Group by type
  const dueEarnings = useMemo(() => 
    duePayments.filter(p => p.type === 'earning'),
    [duePayments]
  );
  
  const dueExpenses = useMemo(() => 
    duePayments.filter(p => p.type === 'expense'),
    [duePayments]
  );

  const getCategoryId = (categoryName?: string): string | undefined => {
    if (!categoryName) return undefined;
    const category = categories.find(c => c.category_name.toLowerCase() === categoryName.toLowerCase());
    return category?._id;
  };

  const handleMarkAsCompleted = async (payment: UpcomingPayment) => {
    if (processingPayments.has(payment.recurring_payment_id)) {
      return;
    }

    setProcessingPayments(prev => new Set(prev).add(payment.recurring_payment_id));
    setError(null);

    try {
      // Create transaction from the payment
      const transactionDate = new Date(payment.due_date);
      transactionDate.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());

      const request = {
        transaction_type: payment.type,
        amount: payment.amount,
        date: transactionDate.toISOString(),
        merchant_name: payment.merchant_name,
        category_id: getCategoryId(payment.category_name),
        description: `${payment.name} - Payment completed`,
        currency: 'USD',
      };

      const response = await createManualTransaction(request);

      if (response.success) {
        // Mark as completed
        setCompletedPayments(prev => new Set(prev).add(payment.recurring_payment_id));
        
        // Remove from upcoming payments
        setUpcomingPayments(prev => 
          prev.filter(p => p.recurring_payment_id !== payment.recurring_payment_id)
        );

        // Notify parent component
        if (onTransactionCreated) {
          onTransactionCreated();
        }
      } else {
        setError(`Failed to create transaction: ${response.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Failed to create transaction. Please try again.');
    } finally {
      setProcessingPayments(prev => {
        const newSet = new Set(prev);
        newSet.delete(payment.recurring_payment_id);
        return newSet;
      });
    }
  };

  const getDaysText = (days: number): string => {
    if (days === 0) return 'Due today';
    if (days < 0) return `${Math.abs(days)} day${Math.abs(days) > 1 ? 's' : ''} overdue`;
    return `Due in ${days} day${days > 1 ? 's' : ''}`;
  };

  const getDaysColor = (days: number): string => {
    if (days < 0) return '#EF4444'; // red - overdue
    if (days === 0) return '#F59E0B'; // amber - due today
    return '#10B981'; // green
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: '24px' }}>
          Payment Alerts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
          Mark payments and earnings as completed when they occur. They will be added to your transaction history.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {duePayments.length === 0 ? (
        <Card
          sx={{
            borderRadius: '16px',
            border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
            bgcolor: isDark ? '#0F172A' : '#FFFFFF',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#10B981', mb: 2 }} />
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
              All Caught Up!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              No payments or earnings are due at this time.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {/* Earnings Section */}
          {dueEarnings.length > 0 && (
            <Grid item xs={12}>
              <Card
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
                  bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
                      Due Earnings
                    </Typography>
                    <Chip
                      label={dueEarnings.length}
                      size="small"
                      sx={{
                        bgcolor: '#10B981',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dueEarnings.map((payment) => {
                      const isProcessing = processingPayments.has(payment.recurring_payment_id);
                      const isCompleted = completedPayments.has(payment.recurring_payment_id);
                      const daysText = getDaysText(payment.days_until_due);

                      return (
                        <Card
                          key={payment.recurring_payment_id}
                          variant="outlined"
                          sx={{
                            bgcolor: isDark ? 'rgba(16, 185, 129, 0.05)' : '#ECFDF5',
                            border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0'}`,
                            borderRadius: '12px',
                          }}
                        >
                          <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isCompleted}
                                    onChange={() => handleMarkAsCompleted(payment)}
                                    disabled={isProcessing || isCompleted}
                                    sx={{
                                      color: '#10B981',
                                      '&.Mui-checked': {
                                        color: '#10B981',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '16px' }}>
                                        {payment.name}
                                      </Typography>
                                      <Chip
                                        label={daysText}
                                        size="small"
                                        sx={{
                                          bgcolor: getDaysColor(payment.days_until_due),
                                          color: '#FFFFFF',
                                          fontWeight: 700,
                                          fontSize: '10px',
                                          height: 20,
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                      <Typography
                                        variant="h6"
                                        sx={{
                                          fontWeight: 700,
                                          color: '#10B981',
                                          fontSize: '18px',
                                        }}
                                      >
                                        +${payment.amount.toFixed(2)}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <CalendarIcon sx={{ fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ fontSize: '14px' }}>
                                          {new Date(payment.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })}
                                        </Typography>
                                      </Box>
                                      {payment.category_name && (
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                                          {payment.category_name}
                                        </Typography>
                                      )}
                                    </Box>
                                    {isProcessing && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="caption" color="text.secondary">
                                          Processing...
                                        </Typography>
                                      </Box>
                                    )}
                                    {isCompleted && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                          Added to transactions
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                                sx={{ m: 0, alignItems: 'flex-start' }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Expenses Section */}
          {dueExpenses.length > 0 && (
            <Grid item xs={12}>
              <Card
                sx={{
                  borderRadius: '16px',
                  border: `1px solid ${isDark ? '#1E293B' : '#E2E8F0'}`,
                  bgcolor: isDark ? '#0F172A' : '#FFFFFF',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
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
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '18px' }}>
                      Due Payments
                    </Typography>
                    <Chip
                      label={dueExpenses.length}
                      size="small"
                      sx={{
                        bgcolor: '#F43F5E',
                        color: '#FFFFFF',
                        fontWeight: 700,
                        fontSize: '12px',
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dueExpenses.map((payment) => {
                      const isProcessing = processingPayments.has(payment.recurring_payment_id);
                      const isCompleted = completedPayments.has(payment.recurring_payment_id);
                      const daysText = getDaysText(payment.days_until_due);

                      return (
                        <Card
                          key={payment.recurring_payment_id}
                          variant="outlined"
                          sx={{
                            bgcolor: isDark ? 'rgba(244, 63, 94, 0.05)' : '#FEF2F2',
                            border: `1px solid ${isDark ? 'rgba(244, 63, 94, 0.3)' : '#FEE2E2'}`,
                            borderRadius: '12px',
                          }}
                        >
                          <CardContent sx={{ p: 2.5 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={isCompleted}
                                    onChange={() => handleMarkAsCompleted(payment)}
                                    disabled={isProcessing || isCompleted}
                                    sx={{
                                      color: '#F43F5E',
                                      '&.Mui-checked': {
                                        color: '#F43F5E',
                                      },
                                    }}
                                  />
                                }
                                label={
                                  <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                      <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: '16px' }}>
                                        {payment.name}
                                      </Typography>
                                      {payment.merchant_name && (
                                        <Typography variant="caption" sx={{ fontSize: '12px', color: 'text.secondary' }}>
                                          • {payment.merchant_name}
                                        </Typography>
                                      )}
                                      <Chip
                                        label={daysText}
                                        size="small"
                                        sx={{
                                          bgcolor: getDaysColor(payment.days_until_due),
                                          color: '#FFFFFF',
                                          fontWeight: 700,
                                          fontSize: '10px',
                                          height: 20,
                                        }}
                                      />
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                      <Typography
                                        variant="h6"
                                        sx={{
                                          fontWeight: 700,
                                          color: '#F43F5E',
                                          fontSize: '18px',
                                        }}
                                      >
                                        -${payment.amount.toFixed(2)}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
                                        <CalendarIcon sx={{ fontSize: 16 }} />
                                        <Typography variant="body2" sx={{ fontSize: '14px' }}>
                                          {new Date(payment.due_date).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric',
                                          })}
                                        </Typography>
                                      </Box>
                                      {payment.category_name && (
                                        <Typography variant="body2" sx={{ fontSize: '14px', color: 'text.secondary' }}>
                                          {payment.category_name}
                                        </Typography>
                                      )}
                                    </Box>
                                    {isProcessing && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <CircularProgress size={16} />
                                        <Typography variant="caption" color="text.secondary">
                                          Processing...
                                        </Typography>
                                      </Box>
                                    )}
                                    {isCompleted && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                                        <CheckCircleIcon sx={{ fontSize: 16, color: '#10B981' }} />
                                        <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 600 }}>
                                          Added to transactions
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>
                                }
                                sx={{ m: 0, alignItems: 'flex-start' }}
                              />
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}
    </Box>
  );
}


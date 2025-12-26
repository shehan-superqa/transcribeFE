import { useState, useMemo } from 'react';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Divider,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { UpcomingPayment } from '../../types/financial';

// Dummy data for demonstration
const dummyUpcomingPayments: UpcomingPayment[] = [
  {
    recurring_payment_id: '1',
    name: 'Monthly Salary',
    type: 'earning',
    amount: 5000,
    due_date: '2024-02-01',
    days_until_due: 3,
    category_name: 'Income',
  },
  {
    recurring_payment_id: '2',
    name: 'Rent Payment',
    type: 'expense',
    amount: 1500,
    due_date: '2024-02-05',
    days_until_due: 7,
    category_name: 'Housing',
    merchant_name: 'Property Management Co.',
  },
  {
    recurring_payment_id: '3',
    name: 'Freelance Income',
    type: 'earning',
    amount: 800,
    due_date: '2024-01-29',
    days_until_due: 1,
    category_name: 'Income',
  },
  {
    recurring_payment_id: '4',
    name: 'Gym Membership',
    type: 'expense',
    amount: 50,
    due_date: '2024-02-10',
    days_until_due: 12,
    category_name: 'Health & Fitness',
    merchant_name: 'FitLife Gym',
  },
  {
    recurring_payment_id: '5',
    name: 'Utility Bills',
    type: 'expense',
    amount: 200,
    due_date: '2024-02-15',
    days_until_due: 17,
    category_name: 'Utilities',
  },
  {
    recurring_payment_id: '6',
    name: 'Car Insurance',
    type: 'expense',
    amount: 150,
    due_date: '2024-02-20',
    days_until_due: 22,
    category_name: 'Insurance',
  },
  {
    recurring_payment_id: '7',
    name: 'Internet Bill',
    type: 'expense',
    amount: 80,
    due_date: '2024-02-03',
    days_until_due: 5,
    category_name: 'Utilities',
    merchant_name: 'ISP Provider',
  },
];

const CURRENT_BUDGET = 8000; // Dummy current budget

export default function UpcomingPaymentsSection() {
  const [upcomingPayments] = useState<UpcomingPayment[]>(dummyUpcomingPayments);

  const summary = useMemo(() => {
    const totalUpcomingExpenses = upcomingPayments
      .filter(p => p.type === 'expense')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const totalUpcomingEarnings = upcomingPayments
      .filter(p => p.type === 'earning')
      .reduce((sum, p) => sum + p.amount, 0);
    
    const netUpcoming = totalUpcomingEarnings - totalUpcomingExpenses;
    const remainingAfterUpcoming = CURRENT_BUDGET + netUpcoming;
    const remainingPercentage = (remainingAfterUpcoming / CURRENT_BUDGET) * 100;

    return {
      totalUpcomingExpenses,
      totalUpcomingEarnings,
      netUpcoming,
      currentBudget: CURRENT_BUDGET,
      remainingAfterUpcoming,
      remainingPercentage,
    };
  }, [upcomingPayments]);

  const sortedPayments = useMemo(() => {
    return [...upcomingPayments].sort((a, b) => a.days_until_due - b.days_until_due);
  }, [upcomingPayments]);

  const getDaysUntilColor = (days: number) => {
    if (days <= 3) return 'error';
    if (days <= 7) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Upcoming Payments
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View and manage your upcoming recurring payments and their impact on your budget
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <AccountBalanceIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Current Budget
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                ${summary.currentBudget.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Upcoming Earnings
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                +${summary.totalUpcomingEarnings.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon color="error" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Upcoming Expenses
                </Typography>
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                -${summary.totalUpcomingExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <CalendarIcon color="info" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Net Upcoming
                </Typography>
              </Box>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700,
                  color: summary.netUpcoming >= 0 ? 'success.main' : 'error.main'
                }}
              >
                {summary.netUpcoming >= 0 ? '+' : ''}${summary.netUpcoming.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Impact Card */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Budget Impact Analysis
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Remaining After Upcoming Payments
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    ${summary.remainingAfterUpcoming.toFixed(2)}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={Math.min(Math.max(summary.remainingPercentage, 0), 100)}
                  sx={{ 
                    height: 10, 
                    borderRadius: '5px',
                    backgroundColor: 'rgba(0,0,0,0.1)',
                    '& .MuiLinearProgress-bar': {
                      backgroundColor: summary.remainingPercentage > 50 ? 'success.main' : 
                                      summary.remainingPercentage > 25 ? 'warning.main' : 'error.main',
                    }
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    0%
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {summary.remainingPercentage.toFixed(1)}% of current budget
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    100%
                  </Typography>
                </Box>
              </Box>

              {summary.remainingPercentage < 25 && (
                <Alert severity="error" icon={<WarningIcon />} sx={{ borderRadius: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Budget Alert!
                  </Typography>
                  <Typography variant="caption">
                    Your remaining budget after upcoming payments will be critically low. Consider reviewing your expenses.
                  </Typography>
                </Alert>
              )}

              {summary.remainingPercentage >= 25 && summary.remainingPercentage < 50 && (
                <Alert severity="warning" sx={{ borderRadius: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Budget Warning
                  </Typography>
                  <Typography variant="caption">
                    Your remaining budget after upcoming payments is below 50%. Monitor your spending carefully.
                  </Typography>
                </Alert>
              )}

              {summary.remainingPercentage >= 50 && (
                <Alert severity="success" sx={{ borderRadius: '12px' }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Budget Healthy
                  </Typography>
                  <Typography variant="caption">
                    You have sufficient budget remaining after upcoming payments.
                  </Typography>
                </Alert>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Budget:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700 }}>
                    ${summary.currentBudget.toFixed(2)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="success.main">
                    + Upcoming Earnings:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${summary.totalUpcomingEarnings.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="error.main">
                    - Upcoming Expenses:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'error.main' }}>
                    ${summary.totalUpcomingExpenses.toFixed(2)}
                  </Typography>
                </Box>
                <Divider />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Remaining Budget:
                  </Typography>
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 700,
                      color: summary.remainingAfterUpcoming >= 0 ? 'success.main' : 'error.main'
                    }}
                  >
                    ${summary.remainingAfterUpcoming.toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    Percentage of Budget:
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 700 }}>
                    {summary.remainingPercentage.toFixed(1)}%
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Upcoming Payments Table */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Payment Schedule
          </Typography>
          
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Payment Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Due Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Days Until</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedPayments.map((payment) => (
                  <TableRow 
                    key={payment.recurring_payment_id}
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      backgroundColor: payment.days_until_due <= 3 ? 'error.lighter' : 'transparent',
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {payment.name}
                      </Typography>
                      {payment.merchant_name && (
                        <Typography variant="caption" color="text.secondary">
                          {payment.merchant_name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.type === 'earning' ? 'Earning' : 'Expense'}
                        size="small"
                        color={payment.type === 'earning' ? 'success' : 'error'}
                        sx={{ borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700,
                          color: payment.type === 'earning' ? 'success.main' : 'error.main'
                        }}
                      >
                        {payment.type === 'earning' ? '+' : '-'}${payment.amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(payment.due_date).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${payment.days_until_due} days`}
                        size="small"
                        color={getDaysUntilColor(payment.days_until_due)}
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {payment.category_name || 'N/A'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}

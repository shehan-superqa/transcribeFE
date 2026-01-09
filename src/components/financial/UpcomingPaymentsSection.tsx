import { useState, useMemo } from 'react';
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
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AccountBalance as AccountBalanceIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { UpcomingPayment } from '../../types/financial';

// Dummy data for demonstration - matching design
const dummyUpcomingPayments: UpcomingPayment[] = [
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
    recurring_payment_id: '1',
    name: 'Monthly Salary',
    type: 'earning',
    amount: 5000,
    due_date: '2024-02-01',
    days_until_due: 3,
    category_name: 'Income',
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

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const getDaysUntilBgColor = (days: number) => {
    if (days <= 3) return '#EF4444'; // red-500
    if (days <= 7) return '#F59E0B'; // amber-500
    return '#10B981'; // emerald-500
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5, fontSize: '24px' }}>
          Upcoming Payments
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '14px' }}>
          View and manage your upcoming recurring payments and their impact on your budget
        </Typography>
      </Box>

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
    </Box>
  );
}

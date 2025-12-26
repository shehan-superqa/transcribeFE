import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  EmojiEvents as TrophyIcon,
} from '@mui/icons-material';
import { FamilyAnalytics, UserFinancialSummary } from '../../types/financial';

// Dummy data
const dummyFamilyAnalytics: FamilyAnalytics = {
  family_group_id: 'family1',
  period: 'January 2024',
  total_earnings: 12500,
  total_expenses: 8750,
  net_balance: 3750,
  member_summaries: [
    {
      user_id: 'user1',
      name: 'John Doe',
      email: 'john@example.com',
      total_earnings: 5000,
      total_expenses: 3500,
      net_balance: 1500,
      transaction_count: 45,
      top_categories: [
        { category_name: 'Groceries', amount: 800, percentage: 22.9 },
        { category_name: 'Transportation', amount: 600, percentage: 17.1 },
        { category_name: 'Entertainment', amount: 400, percentage: 11.4 },
      ],
    },
    {
      user_id: 'user2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      total_earnings: 4500,
      total_expenses: 3200,
      net_balance: 1300,
      transaction_count: 38,
      top_categories: [
        { category_name: 'Shopping', amount: 900, percentage: 28.1 },
        { category_name: 'Dining', amount: 700, percentage: 21.9 },
        { category_name: 'Health', amount: 500, percentage: 15.6 },
      ],
    },
    {
      user_id: 'user3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      total_earnings: 3000,
      total_expenses: 2050,
      net_balance: 950,
      transaction_count: 28,
      top_categories: [
        { category_name: 'Utilities', amount: 600, percentage: 29.3 },
        { category_name: 'Groceries', amount: 500, percentage: 24.4 },
        { category_name: 'Transportation', amount: 400, percentage: 19.5 },
      ],
    },
  ],
  top_spender: {
    user_id: 'user1',
    name: 'John Doe',
    amount: 3500,
  },
  top_earner: {
    user_id: 'user1',
    name: 'John Doe',
    amount: 5000,
  },
  category_breakdown: [
    {
      category_name: 'Groceries',
      total_amount: 1300,
      by_user: [
        { user_id: 'user1', name: 'John Doe', amount: 800 },
        { user_id: 'user3', name: 'Bob Johnson', amount: 500 },
      ],
    },
    {
      category_name: 'Transportation',
      total_amount: 1000,
      by_user: [
        { user_id: 'user1', name: 'John Doe', amount: 600 },
        { user_id: 'user3', name: 'Bob Johnson', amount: 400 },
      ],
    },
    {
      category_name: 'Shopping',
      total_amount: 900,
      by_user: [
        { user_id: 'user2', name: 'Jane Smith', amount: 900 },
      ],
    },
  ],
};

export default function MultiUserAnalyticsSection() {
  const [analytics] = useState<FamilyAnalytics>(dummyFamilyAnalytics);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getColorForUser = (index: number) => {
    const colors = ['primary', 'secondary', 'success', 'warning', 'info', 'error'];
    return colors[index % colors.length];
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Family Analytics
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of financial activity across all family members for {analytics.period}
        </Typography>
      </Box>

      {/* Overall Summary */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Total Earnings
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${analytics.total_earnings.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon color="error" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Total Expenses
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                ${analytics.total_expenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrophyIcon color="primary" fontSize="small" />
                <Typography variant="caption" color="text.secondary">
                  Net Balance
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                ${analytics.net_balance.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Top Performers */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'success.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrophyIcon color="success" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Top Earner
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'success.main' }}>
                  {getInitials(analytics.top_earner.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {analytics.top_earner.name}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                    ${analytics.top_earner.amount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'error.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrophyIcon color="error" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Top Spender
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 56, height: 56, bgcolor: 'error.main' }}>
                  {getInitials(analytics.top_spender.name)}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {analytics.top_spender.name}
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'error.main' }}>
                    ${analytics.top_spender.amount.toFixed(2)}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Member Summaries */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider', mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Member Financial Summary
          </Typography>
          <Grid container spacing={2}>
            {analytics.member_summaries.map((member, index) => (
              <Grid item xs={12} md={4} key={member.user_id}>
                <Card sx={{ borderRadius: '12px', border: '1px solid', borderColor: 'divider' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: `${getColorForUser(index)}.main` }}>
                        {getInitials(member.name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                          {member.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.transaction_count} transactions
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Earnings
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'success.main' }}>
                            ${member.total_earnings.toFixed(2)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(member.total_earnings / analytics.total_earnings) * 100}
                          sx={{ height: 6, borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.1)' }}
                          color="success"
                        />
                      </Box>

                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">
                            Expenses
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>
                            ${member.total_expenses.toFixed(2)}
                          </Typography>
                        </Box>
                        <LinearProgress
                          variant="determinate"
                          value={(member.total_expenses / analytics.total_expenses) * 100}
                          sx={{ height: 6, borderRadius: '3px', backgroundColor: 'rgba(0,0,0,0.1)' }}
                          color="error"
                        />
                      </Box>

                      <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Net Balance
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontWeight: 700,
                              color: member.net_balance >= 0 ? 'success.main' : 'error.main'
                            }}
                          >
                            ${member.net_balance.toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ pt: 1 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block' }}>
                          Top Categories:
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {member.top_categories.slice(0, 3).map((cat, idx) => (
                            <Chip
                              key={idx}
                              label={`${cat.category_name} (${cat.percentage.toFixed(0)}%)`}
                              size="small"
                              sx={{ borderRadius: '6px', fontSize: '0.7rem' }}
                            />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
        <CardContent>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Category Breakdown by Member
          </Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '12px' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contributors</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {analytics.category_breakdown.map((category, index) => (
                  <TableRow key={index} sx={{ '&:hover': { backgroundColor: 'action.hover' } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {category.category_name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        ${category.total_amount.toFixed(2)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        {category.by_user.map((user) => (
                          <Box key={user.user_id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                              {user.name}
                            </Typography>
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              ${user.amount.toFixed(2)}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
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

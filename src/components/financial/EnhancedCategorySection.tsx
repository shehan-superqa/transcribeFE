import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Tab,
  Tabs,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  Category,
  ArrowBack,
  TrendingUp,
  TrendingDown,
  Timeline,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { generateDummyTransactions, DummyTransaction } from '../../lib/dummyData';

interface CategoryWithStats {
  name: string;
  totalSpent: number;
  transactionCount: number;
  avgTransaction: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

type TimePeriod = 'hour' | 'day' | 'week' | 'month' | 'year';

export default function EnhancedCategorySection() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<DummyTransaction[]>([]);
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithStats | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const dummyTransactions = generateDummyTransactions(200);
    setTransactions(dummyTransactions);

    // Calculate category stats
    const categoryMap = new Map<string, { total: number; count: number; transactions: DummyTransaction[] }>();

    dummyTransactions.filter(t => t.type === 'expense').forEach(tx => {
      if (!categoryMap.has(tx.category)) {
        categoryMap.set(tx.category, { total: 0, count: 0, transactions: [] });
      }
      const cat = categoryMap.get(tx.category)!;
      cat.total += tx.amount;
      cat.count++;
      cat.transactions.push(tx);
    });

    const categoriesWithStats: CategoryWithStats[] = Array.from(categoryMap.entries()).map(([name, data]) => {
      // Calculate trend (compare last month vs previous month)
      const now = new Date();
      const lastMonth = new Date(now);
      lastMonth.setMonth(now.getMonth() - 1);
      const twoMonthsAgo = new Date(now);
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      const lastMonthTotal = data.transactions
        .filter(t => new Date(t.date) >= lastMonth && new Date(t.date) < now)
        .reduce((sum, t) => sum + t.amount, 0);

      const prevMonthTotal = data.transactions
        .filter(t => new Date(t.date) >= twoMonthsAgo && new Date(t.date) < lastMonth)
        .reduce((sum, t) => sum + t.amount, 0);

      const trendPercentage = prevMonthTotal > 0 
        ? ((lastMonthTotal - prevMonthTotal) / prevMonthTotal) * 100 
        : 0;

      const trend: 'up' | 'down' | 'stable' = 
        trendPercentage > 5 ? 'up' : 
        trendPercentage < -5 ? 'down' : 
        'stable';

      return {
        name,
        totalSpent: data.total,
        transactionCount: data.count,
        avgTransaction: data.total / data.count,
        trend,
        trendPercentage,
      };
    });

    setCategories(categoriesWithStats.sort((a, b) => b.totalSpent - a.totalSpent));
  };

  const generateChartData = (category: string, period: TimePeriod) => {
    const categoryTransactions = transactions.filter(
      t => t.category === category && t.type === 'expense'
    );

    const now = new Date();
    const data: { label: string; amount: number }[] = [];

    switch (period) {
      case 'hour':
        // 24 hours
        for (let i = 0; i < 24; i++) {
          const hourTransactions = categoryTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getHours() === i;
          });
          data.push({
            label: `${i}:00`,
            amount: hourTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
        break;

      case 'day':
        // 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 0; i < 7; i++) {
          const dayTransactions = categoryTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getDay() === i;
          });
          data.push({
            label: days[i],
            amount: dayTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
        break;

      case 'week':
        // Last 4 weeks
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7) - 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);

          const weekTransactions = categoryTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate >= weekStart && txDate < weekEnd;
          });

          data.push({
            label: `Week ${4 - i}`,
            amount: weekTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
        break;

      case 'month':
        // Last 12 months
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        for (let i = 11; i >= 0; i--) {
          const monthDate = new Date(now);
          monthDate.setMonth(now.getMonth() - i);
          const monthIndex = monthDate.getMonth();

          const monthTransactions = categoryTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getMonth() === monthIndex && txDate.getFullYear() === monthDate.getFullYear();
          });

          data.push({
            label: months[monthIndex],
            amount: monthTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
        break;

      case 'year':
        // Last 3 years
        for (let i = 2; i >= 0; i--) {
          const year = now.getFullYear() - i;
          const yearTransactions = categoryTransactions.filter(t => {
            const txDate = new Date(t.date);
            return txDate.getFullYear() === year;
          });

          data.push({
            label: year.toString(),
            amount: yearTransactions.reduce((sum, t) => sum + t.amount, 0),
          });
        }
        break;
    }

    return data;
  };

  const chartData = selectedCategory ? generateChartData(selectedCategory.name, timePeriod) : [];

  if (selectedCategory) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
          }}
        >
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <IconButton onClick={() => setSelectedCategory(null)}>
              <ArrowBack />
            </IconButton>
            <Category sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" sx={{ fontFamily: "'Inter', sans-serif", fontWeight: 600 }}>
                {selectedCategory.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <Chip
                  label={`${selectedCategory.transactionCount} transactions`}
                  size="small"
                />
                <Chip
                  label={`Rs. ${selectedCategory.totalSpent.toLocaleString()}`}
                  size="small"
                  color="primary"
                />
                <Chip
                  label={`Avg: Rs. ${selectedCategory.avgTransaction.toLocaleString()}`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  label={`${selectedCategory.trendPercentage >= 0 ? '+' : ''}${selectedCategory.trendPercentage.toFixed(1)}%`}
                  size="small"
                  color={selectedCategory.trend === 'up' ? 'error' : selectedCategory.trend === 'down' ? 'success' : 'default'}
                  icon={selectedCategory.trend === 'up' ? <TrendingUp /> : selectedCategory.trend === 'down' ? <TrendingDown /> : <Timeline />}
                />
              </Box>
            </Box>
          </Box>

          {/* Time Period Selector */}
          <Box sx={{ mb: 3 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Time Period</InputLabel>
              <Select
                value={timePeriod}
                label="Time Period"
                onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
              >
                <MenuItem value="hour">Hour-wise (24 hours)</MenuItem>
                <MenuItem value="day">Day-wise (7 days)</MenuItem>
                <MenuItem value="week">Week-wise (4 weeks)</MenuItem>
                <MenuItem value="month">Month-wise (12 months)</MenuItem>
                <MenuItem value="year">Year-wise (3 years)</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Charts */}
          <Grid container spacing={3}>
            {/* Line Chart */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Spending Trend
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="label" 
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
                        }}
                        formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={theme.palette.primary.main} 
                        strokeWidth={2}
                        dot={{ fill: theme.palette.primary.main }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Bar Chart */}
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Spending Distribution
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="label" 
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
                        }}
                        formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Bar 
                        dataKey="amount" 
                        fill={theme.palette.secondary.main}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* Area Chart */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    Cumulative Spending
                  </Typography>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="label" 
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
                        }}
                        formatter={(value: number) => [`Rs. ${value.toLocaleString()}`, 'Amount']}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="amount" 
                        stroke={theme.palette.success.main}
                        fill={theme.palette.success.light}
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    );
  }

  // Categories List View
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontWeight: 600,
            color: theme.palette.text.primary,
            mb: 1,
          }}
        >
          Categories
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Inter', sans-serif",
            color: theme.palette.text.secondary,
            mb: 3,
          }}
        >
          View spending by category with detailed time-based analytics. Click on a category to see graphs.
        </Typography>

        <Grid container spacing={2}>
          {categories.map((category) => (
            <Grid item xs={12} sm={6} md={4} key={category.name}>
              <Card
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[4],
                  },
                }}
                onClick={() => setSelectedCategory(category)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Category sx={{ fontSize: 32, color: theme.palette.primary.main }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={`${category.trendPercentage >= 0 ? '+' : ''}${category.trendPercentage.toFixed(1)}%`}
                        size="small"
                        color={category.trend === 'up' ? 'error' : category.trend === 'down' ? 'success' : 'default'}
                        icon={category.trend === 'up' ? <TrendingUp /> : category.trend === 'down' ? <TrendingDown /> : <Timeline />}
                      />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Spent:
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="primary">
                        Rs. {category.totalSpent.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Transactions:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {category.transactionCount}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Avg Transaction:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {category.avgTransaction.toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </Box>
  );
}

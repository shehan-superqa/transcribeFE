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
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Category as CategoryIcon,
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
import { listCategories, getCategoryAnalytics, getCategoryTrends } from '../../lib/api/financialApi';
import { Category } from '../../types/financial';

interface CategoryWithStats {
  _id: string;
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
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryWithStats | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month');
  const [chartData, setChartData] = useState<Array<{ label: string; amount: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [loadingChart, setLoadingChart] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadChartData();
    } else {
      setChartData([]);
    }
  }, [selectedCategory, timePeriod]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const categoriesRes = await listCategories();
      
      if (categoriesRes.success && categoriesRes.categories) {
        // Load analytics for each category
        const categoriesWithStats = await Promise.all(
          categoriesRes.categories.map(async (category: Category) => {
            try {
              const analyticsRes = await getCategoryAnalytics(category._id, { period: 'month' });
              if (analyticsRes.success && analyticsRes.analytics) {
                return {
                  _id: category._id,
                  name: category.category_name,
                  totalSpent: analyticsRes.analytics.total_spent,
                  transactionCount: analyticsRes.analytics.transaction_count,
                  avgTransaction: analyticsRes.analytics.avg_transaction_amount,
                  trend: analyticsRes.analytics.trend,
                  trendPercentage: analyticsRes.analytics.trend_percentage,
                };
              }
            } catch (err) {
              console.error(`Failed to load analytics for category ${category._id}:`, err);
            }
            // Fallback if analytics fail
            return {
              _id: category._id,
              name: category.category_name,
              totalSpent: 0,
              transactionCount: 0,
              avgTransaction: 0,
              trend: 'stable' as const,
              trendPercentage: 0,
            };
          })
        );
        
        setCategories(categoriesWithStats.sort((a, b) => b.totalSpent - a.totalSpent));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load categories');
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPeriodLabel = (periodStart: string, periodType: TimePeriod): string => {
    const date = new Date(periodStart);
    
    switch (periodType) {
      case 'hour':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      case 'day':
        // Format as "Mon 25" or just day name for last 7 days
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
      case 'week':
        // Format as "Week of Jan 25" or similar
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week
        return `Week ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      case 'month':
        return date.toLocaleDateString('en-US', { month: 'short' });
      case 'year':
        return date.getFullYear().toString();
      default:
        return date.toLocaleDateString('en-US');
    }
  };

  const loadChartData = async () => {
    if (!selectedCategory) {
      setChartData([]);
      return;
    }
    
    try {
      setLoadingChart(true);
      const trendsRes = await getCategoryTrends(selectedCategory._id, {
        period: timePeriod,
        months_back: timePeriod === 'month' ? 12 : undefined,
      });
      
      if (trendsRes.success && trendsRes.trends && trendsRes.trends.spending_trend && Array.isArray(trendsRes.trends.spending_trend)) {
        // Extract data from spending_trend array and format for charts
        const normalizedData = trendsRes.trends.spending_trend.map((item) => {
          // Determine amount based on what type of transactions exist
          // For categories with both earnings and expenses, show net_amount
          // For categories with only expenses, show total_expenses
          // For categories with only earnings (income), show total_earnings
          let amount = 0;
          if (item.total_expenses > 0 && item.total_earnings > 0) {
            // Mixed: show net (could be negative)
            amount = Math.abs(item.net_amount);
          } else if (item.total_expenses > 0) {
            // Expense category
            amount = item.total_expenses;
          } else if (item.total_earnings > 0) {
            // Income category
            amount = item.total_earnings;
          } else {
            // Fallback to total_amount
            amount = item.total_amount || 0;
          }
          
          const label = formatPeriodLabel(item.period_start, timePeriod);
          
          return {
            label: label,
            amount: typeof amount === 'number' ? amount : 0,
          };
        });
        setChartData(normalizedData);
      } else {
        setChartData([]);
      }
    } catch (err: any) {
      console.error('Failed to load chart data:', err);
      setChartData([]);
    } finally {
      setLoadingChart(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

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
            <CategoryIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
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
                  {loadingChart ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={Array.isArray(chartData) ? chartData : []}>
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
                  )}
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
                  {loadingChart ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={Array.isArray(chartData) ? chartData : []}>
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
                  )}
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
                  {loadingChart ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={Array.isArray(chartData) ? chartData : []}>
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
                  )}
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
                    <CategoryIcon sx={{ fontSize: 32, color: theme.palette.primary.main }} />
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

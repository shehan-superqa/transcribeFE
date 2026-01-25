import { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Card, 
  CardContent, 
  Alert, 
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Chip,
  Grid,
} from '@mui/material';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Savings, 
  Business, 
  ShowChart,
  Lightbulb,
  CompareArrows,
  Inventory,
  Assessment,
  Security,
  Psychology,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getSpendingSummary, getSpendingTrends, getAnomalies, sendAIChat } from '../../lib/api/financialApi';
import { SpendingSummaryResponse, SpendingTrendsResponse, AnomaliesResponse } from '../../types/financial';

type AnalysisType = 'personal' | 'business' | 'investment';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AnalyticsSection() {
  const { theme } = useTheme();
  const [analysisType, setAnalysisType] = useState<AnalysisType>('personal');
  const [tabValue, setTabValue] = useState(0);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [summary, setSummary] = useState<SpendingSummaryResponse | null>(null);
  const [trends, setTrends] = useState<SpendingTrendsResponse | null>(null);
  const [anomalies, setAnomalies] = useState<AnomaliesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiInsights, setAiInsights] = useState<{ [key: string]: string }>({});
  const [loadingInsights, setLoadingInsights] = useState<{ [key: string]: boolean }>({});

  // Load data when period or tab changes - fetch fresh data for each tab
  useEffect(() => {
    loadAnalytics();
  }, [period, tabValue, analysisType]);

  useEffect(() => {
    if (summary) {
      loadAIInsights();
    }
  }, [summary, analysisType]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch data based on current analysis type and period
      const [summaryRes, trendsRes, anomaliesRes] = await Promise.all([
        getSpendingSummary({ period }),
        getSpendingTrends({ period: 'monthly' }),
        getAnomalies({ limit: 50 }),
      ]);
      if (summaryRes.success) setSummary(summaryRes);
      if (trendsRes.success) setTrends(trendsRes);
      if (anomaliesRes.success) setAnomalies(anomaliesRes);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
      setError(error.message || 'Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const loadAIInsights = async () => {
    if (!summary) return;
    
    const insightKey = `${analysisType}-${period}`;
    if (aiInsights[insightKey] || loadingInsights[insightKey]) return;

    setLoadingInsights(prev => ({ ...prev, [insightKey]: true }));
    
    try {
      let query = '';
      switch (analysisType) {
        case 'personal':
          query = `Analyze my monthly spending of Rs. ${summary.summary.total.toFixed(2)} across ${summary.summary.transaction_count} transactions. Provide savings suggestions and category optimization recommendations.`;
          break;
        case 'business':
          query = `Perform a profit & loss analysis, cost optimization suggestions, supplier comparison, and identify any inventory vs sales mismatches based on my transaction data.`;
          break;
        case 'investment':
          query = `Analyze my spending patterns for portfolio diversification opportunities, provide risk scoring, and suggest scenario simulations.`;
          break;
      }

      const response = await sendAIChat({ query });
      if (response.success) {
        setAiInsights(prev => ({ ...prev, [insightKey]: response.response }));
      }
    } catch (error) {
      console.error('Failed to load AI insights:', error);
    } finally {
      setLoadingInsights(prev => ({ ...prev, [insightKey]: false }));
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    const types: AnalysisType[] = ['personal', 'business', 'investment'];
    setAnalysisType(types[newValue]);
    // Data will be loaded by the useEffect hook when tabValue changes
  };

  const barChartData = summary
    ? summary.summary.by_category.slice(0, 10).map((item) => ({
        name: item.category_name.length > 15 ? item.category_name.substring(0, 15) + '...' : item.category_name,
        amount: item.amount,
        fullName: item.category_name,
      }))
    : [];

  const pieChartData = summary
    ? summary.summary.by_category.slice(0, 5).map((item) => ({
        name: item.category_name,
        value: item.amount,
      }))
    : [];

  const trendsChartData = trends
    ? trends.trends.comparisons.map((item) => ({
        period: item.period,
        current: item.current_total,
        previous: item.previous_total,
      }))
    : [];

  const chartColors = [
    theme.palette.primary.main,
    theme.palette.secondary.main,
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
  ];

  const insightKey = `${analysisType}-${period}`;
  const currentInsight = aiInsights[insightKey];
  const isLoadingInsight = loadingInsights[insightKey];

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Analysis Type Selector */}
      <Paper 
        elevation={0} 
        sx={{ 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            aria-label="Financial analysis types"
            sx={{
              '& .MuiTab-root': {
                fontFamily: "'Inter', sans-serif",
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.875rem',
                minHeight: { xs: 64, sm: 72 },
                padding: { xs: '0.5rem 0.75rem', sm: '0.75rem 1rem' },
                color: theme.palette.text.secondary,
                '&.Mui-selected': {
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: theme.palette.primary.main,
                height: 2,
              },
            }}
          >
            <Tab 
              icon={<Savings sx={{ mb: 0.5, fontSize: '1.25rem' }} />} 
              iconPosition="start"
              label={
                <Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      color: 'inherit',
                    }}
                  >
                    Personal / SME Finance
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      color: 'inherit', 
                      opacity: 0.7,
                    }}
                  >
                    Monthly spend, savings, optimization
                  </Typography>
                </Box>
              } 
            />
            <Tab 
              icon={<Business sx={{ mb: 0.5, fontSize: '1.25rem' }} />} 
              iconPosition="start"
              label={
                <Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      color: 'inherit',
                    }}
                  >
                    Business Finance
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      color: 'inherit', 
                      opacity: 0.7,
                    }}
                  >
                    P&L, costs, suppliers, inventory
                  </Typography>
                </Box>
              } 
            />
            <Tab 
              icon={<ShowChart sx={{ mb: 0.5, fontSize: '1.25rem' }} />} 
              iconPosition="start"
              label={
                <Box>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 600, 
                      fontSize: '0.875rem',
                      lineHeight: 1.2,
                      color: 'inherit',
                    }}
                  >
                    Investment Analysis
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.75rem',
                      lineHeight: 1.5,
                      color: 'inherit', 
                      opacity: 0.7,
                    }}
                  >
                    Portfolio, risk, scenarios
                  </Typography>
                </Box>
              } 
            />
          </Tabs>
        </Box>

        <Box sx={{ p: '1.5rem', display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 0 }, justifyContent: { xs: 'flex-start', sm: 'space-between' }, alignItems: { xs: 'flex-start', sm: 'center' } }}>
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.primary, 
                fontWeight: 700, 
                fontSize: '1.75rem',
                lineHeight: 1.2,
                mb: '0.5rem',
              }}
            >
              {analysisType === 'personal' && 'Personal / SME Finance Analysis'}
              {analysisType === 'business' && 'Business Finance Analysis'}
              {analysisType === 'investment' && 'Investment Analysis'}
            </Typography>
            <Typography 
              variant="body2" 
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 400,
                lineHeight: 1.5,
                color: theme.palette.text.secondary,
              }}
            >
              {analysisType === 'personal' && 'Monthly spend analysis, savings suggestions, and category optimization'}
              {analysisType === 'business' && 'Profit & loss analysis, cost optimization, supplier comparison, inventory vs sales'}
              {analysisType === 'investment' && 'Portfolio diversification, risk scoring, and scenario simulation'}
            </Typography>
          </Box>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiInputLabel-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          >
            <InputLabel 
              id="period-select-label" 
              sx={{ 
                fontFamily: "'Inter', sans-serif",
                color: theme.palette.text.primary,
                fontSize: '0.875rem',
              }}
            >
              Period
            </InputLabel>
            <Select
              labelId="period-select-label"
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              label="Period"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                color: theme.palette.text.primary,
                borderRadius: '8px',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.divider,
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: theme.palette.primary.main,
                },
                '& .MuiSvgIcon-root': {
                  color: theme.palette.text.primary,
                },
              }}
            >
              <MenuItem 
                value="daily" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                }}
              >
                Daily
              </MenuItem>
              <MenuItem 
                value="weekly" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                }}
              >
                Weekly
              </MenuItem>
              <MenuItem 
                value="monthly" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                }}
              >
                Monthly
              </MenuItem>
              <MenuItem 
                value="yearly" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: theme.palette.text.primary,
                }}
              >
                Yearly
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {loading && !summary && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
          <CircularProgress />
        </Box>
      )}

      {/* Personal / SME Finance Tab */}
      <TabPanel value={tabValue} index={0}>
        {summary && (
          <>
            {/* Monthly Spend Analysis */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: '1.5rem', 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                mb: '2rem',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '2rem' }}>
                <Assessment color="primary" sx={{ fontSize: '1.25rem' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                  }}
                >
                  Monthly Spend Analysis
                </Typography>
              </Box>
              
              <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: '2rem' }}>
                <Grid item xs={12} sm={4}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`, 
                      p: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontFamily: "'Inter', sans-serif",
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '2rem',
                        lineHeight: 1.2,
                        mb: '0.25rem',
                      }}
                    >
                      Rs. {summary.summary.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Total Spending
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`, 
                      p: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontFamily: "'Inter', sans-serif",
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '2rem',
                        lineHeight: 1.2,
                        mb: '0.25rem',
                      }}
                    >
                      {summary.summary.transaction_count}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Transactions
                    </Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      border: `1px solid ${theme.palette.divider}`, 
                      p: '1.5rem',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                    }}
                  >
                    <Typography 
                      variant="h4" 
                      sx={{ 
                        fontFamily: "'Inter', sans-serif",
                        color: theme.palette.text.primary, 
                        fontWeight: 700,
                        fontSize: '2rem',
                        lineHeight: 1.2,
                        mb: '0.25rem',
                      }}
                    >
                      Rs. {summary.summary.transaction_count > 0 ? (summary.summary.total / summary.summary.transaction_count).toFixed(2) : '0.00'}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: theme.palette.text.secondary,
                      }}
                    >
                      Avg per Transaction
                    </Typography>
                  </Card>
                </Grid>
              </Grid>

              {barChartData.length > 0 && (
                <Box sx={{ height: { xs: '300px', sm: '350px', md: '400px' }, mb: '2rem' }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: 10, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke={theme.palette.text.secondary}
                        tick={{ 
                          fontSize: 12,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      />
                      <YAxis 
                        stroke={theme.palette.text.secondary}
                        tick={{ 
                          fontSize: 12,
                          fontFamily: "'Inter', sans-serif",
                        }}
                        tickFormatter={(value) => `Rs. ${value}`}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary,
                        }}
                        formatter={(value: number, payload: any) => [`Rs. ${value.toFixed(2)}`, payload[0]?.payload?.fullName || 'Amount']}
                      />
                      <Bar dataKey="amount" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              )}
            </Paper>

            {/* Savings Suggestions */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: '1.5rem', 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                mb: '2rem',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1.5rem' }}>
                <Lightbulb color="warning" sx={{ fontSize: '1.25rem' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                  }}
                >
                  Savings Suggestions
                </Typography>
              </Box>
              
              {isLoadingInsight ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : currentInsight ? (
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word',
                      overflowWrap: 'break-word',
                      wordBreak: 'break-word',
                      color: theme.palette.text.primary,
                      lineHeight: 1.6,
                    }}
                  >
                    {currentInsight}
                  </Typography>
                </Card>
              ) : (
                <Alert severity="info">
                  Click "Generate Insights" to get AI-powered savings suggestions based on your spending patterns.
                </Alert>
              )}
            </Paper>

            {/* Category Optimization */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: '1.5rem', 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1.5rem' }}>
                <TrendingUp color="success" sx={{ fontSize: '1.25rem' }} />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                  }}
                >
                  Category Optimization
                </Typography>
              </Box>
              
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          color: theme.palette.text.primary, 
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        }}
                      >
                        Category
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          color: theme.palette.text.primary, 
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        }}
                      >
                        Amount
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          color: theme.palette.text.primary, 
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        }}
                      >
                        Percentage
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 600, 
                          fontSize: '0.875rem',
                          color: theme.palette.text.primary, 
                          backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        }}
                      >
                        Optimization
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {summary.summary.by_category.map((item, index) => {
                      const isHigh = item.percentage > 30;
                      const isMedium = item.percentage > 15 && item.percentage <= 30;
                      return (
                        <TableRow key={item.category_id}>
                          <TableCell 
                            sx={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.875rem',
                              color: theme.palette.text.primary,
                            }}
                          >
                            {item.category_name}
                          </TableCell>
                          <TableCell 
                            align="right" 
                            sx={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.875rem',
                              color: theme.palette.text.primary,
                            }}
                          >
                            Rs. {item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell 
                            align="right" 
                            sx={{ 
                              fontFamily: "'Inter', sans-serif",
                              fontSize: '0.875rem',
                              color: theme.palette.text.primary,
                            }}
                          >
                            {item.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell align="right">
                            {isHigh && <Chip label="High" color="error" size="small" sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }} />}
                            {isMedium && <Chip label="Medium" color="warning" size="small" sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }} />}
                            {!isHigh && !isMedium && <Chip label="Optimal" color="success" size="small" sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }} />}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* Business Finance Tab */}
      <TabPanel value={tabValue} index={1}>
        {summary && (
          <>
            {/* Profit & Loss Analysis */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Assessment color="primary" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Profit & Loss Analysis
                </Typography>
              </Box>
              
              {isLoadingInsight ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : currentInsight ? (
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: theme.palette.text.primary }}>
                    {currentInsight}
                  </Typography>
                </Card>
              ) : (
                <Alert severity="info">
                  AI-powered P&L analysis will be generated based on your transaction data.
                </Alert>
              )}
            </Paper>

            {/* Cost Optimization */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <TrendingDown color="error" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Cost Optimization Opportunities
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                {summary.summary.by_category
                  .sort((a, b) => b.amount - a.amount)
                  .slice(0, 5)
                  .map((item) => (
                    <Grid item xs={12} sm={6} md={4} key={item.category_id}>
                      <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.text.primary }}>
                          {item.category_name}
                        </Typography>
                        <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
                          Rs. {item.amount.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                          {item.percentage.toFixed(1)}% of total spending
                        </Typography>
                      </Card>
                    </Grid>
                  ))}
              </Grid>
            </Paper>

            {/* Supplier Comparison */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <CompareArrows color="info" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Supplier Comparison
                </Typography>
              </Box>
              <Alert severity="info">
                Supplier comparison analysis will be available once merchant data is enriched.
              </Alert>
            </Paper>

            {/* Inventory vs Sales Mismatch */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Inventory color="warning" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Inventory vs Sales Mismatch Detection
                </Typography>
              </Box>
              <Alert severity="info">
                Inventory analysis requires integration with inventory management systems.
              </Alert>
            </Paper>
          </>
        )}
      </TabPanel>

      {/* Investment Analysis Tab */}
      <TabPanel value={tabValue} index={2}>
        {summary && (
          <>
            {/* Portfolio Diversification */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <ShowChart color="primary" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Portfolio Diversification Analysis
                </Typography>
              </Box>
              
              {pieChartData.length > 0 && (
                <Box sx={{ height: { xs: '300px', sm: '350px', md: '400px' }, mb: 2 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={pieChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: theme.palette.background.paper,
                          border: `1px solid ${theme.palette.divider}`,
                          color: theme.palette.text.primary,
                        }}
                        formatter={(value: number) => `Rs. ${value.toFixed(2)}`}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
              )}
              
              {isLoadingInsight ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress />
                </Box>
              ) : currentInsight ? (
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2 }}>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', color: theme.palette.text.primary }}>
                    {currentInsight}
                  </Typography>
                </Card>
              ) : (
                <Alert severity="info">
                  AI-powered portfolio diversification recommendations will be generated based on your spending patterns.
                </Alert>
              )}
            </Paper>

            {/* Risk Scoring */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Security color="warning" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Risk Scoring
                </Typography>
              </Box>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: theme.palette.warning.main, fontWeight: 700 }}>
                      {anomalies?.count || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Anomalies Detected</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                      {summary.summary.by_category.length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Categories</Typography>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 2, textAlign: 'center' }}>
                    <Typography variant="h4" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                      {trends?.trends.overall_growth_rate ? `${trends.trends.overall_growth_rate >= 0 ? '+' : ''}${trends.trends.overall_growth_rate.toFixed(1)}%` : 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">Growth Rate</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Paper>

            {/* Scenario Simulation */}
            <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Psychology color="info" />
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  Scenario Simulation
                </Typography>
              </Box>
              
              {trendsChartData.length > 0 && (
                <Box sx={{ height: { xs: '300px', sm: '350px', md: '400px' }, mb: 2 }}>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={trendsChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} />
                      <XAxis 
                        dataKey="period" 
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
                          color: theme.palette.text.primary,
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="current" stroke={theme.palette.primary.main} strokeWidth={2} name="Current Period" />
                      <Line type="monotone" dataKey="previous" stroke={theme.palette.success.main} strokeWidth={2} name="Previous Period" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              )}
              
              <Alert severity="info">
                Use the trend chart above to simulate different scenarios. AI-powered scenario analysis coming soon.
              </Alert>
            </Paper>
          </>
        )}
      </TabPanel>
    </Box>
  );
}


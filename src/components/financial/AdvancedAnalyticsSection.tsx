import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  Alert,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Warning,
  CheckCircle,
  ExpandMore,
  Savings,
  AccountBalance,
  Security,
  HealthAndSafety,
  ContentCut,
  Timeline,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import {
  generateDummyTransactions,
  generateDummyLoans,
  generateDummySavingsGoals,
  generateDummyUserProfile,
  calculateSavingsTimeline,
  calculateLoanPayoffTimeline,
  calculateFinancialStability,
  identifyFinancialRisks,
  calculateEmergencyRunway,
  suggestExpenseCuts,
  calculateFinancialMetrics,
} from '../../lib/dummyData';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdvancedAnalyticsSection() {
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState(generateDummyTransactions(100));
  const [loans, setLoans] = useState(generateDummyLoans());
  const [savings, setSavings] = useState(generateDummySavingsGoals());
  const [profile, setProfile] = useState(generateDummyUserProfile());
  const [metrics, setMetrics] = useState(calculateFinancialMetrics(transactions, loans, savings));
  const [stability, setStability] = useState(calculateFinancialStability(transactions, loans, savings, profile));
  const [risks, setRisks] = useState(identifyFinancialRisks(transactions, loans, savings, profile));
  const [runway, setRunway] = useState(calculateEmergencyRunway(transactions, savings, profile));
  const [expenseCuts, setExpenseCuts] = useState(suggestExpenseCuts(transactions));

  useEffect(() => {
    // Recalculate all metrics when data changes
    const newMetrics = calculateFinancialMetrics(transactions, loans, savings);
    const newStability = calculateFinancialStability(transactions, loans, savings, profile);
    const newRisks = identifyFinancialRisks(transactions, loans, savings, profile);
    const newRunway = calculateEmergencyRunway(transactions, savings, profile);
    const newExpenseCuts = suggestExpenseCuts(transactions);

    setMetrics(newMetrics);
    setStability(newStability);
    setRisks(newRisks);
    setRunway(newRunway);
    setExpenseCuts(newExpenseCuts);
  }, [transactions, loans, savings, profile]);

  const getStabilityColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.info.main;
    if (score >= 40) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  const getRiskColor = (severity: 'high' | 'medium' | 'low') => {
    switch (severity) {
      case 'high':
        return theme.palette.error.main;
      case 'medium':
        return theme.palette.warning.main;
      case 'low':
        return theme.palette.info.main;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Header */}
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
          Advanced Financial Analytics
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Inter', sans-serif",
            color: theme.palette.text.secondary,
          }}
        >
          Comprehensive insights into your financial health, goals, and recommendations
        </Typography>
      </Paper>

      {/* Financial Stability Score */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Security sx={{ fontSize: 40, color: getStabilityColor(stability.score) }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Financial Stability Score
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Overall assessment of your financial health
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h3" sx={{ fontWeight: 700, color: getStabilityColor(stability.score) }}>
              {stability.score}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {stability.rating}
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {Object.entries(stability.breakdown).map(([key, value]) => (
            <Grid item xs={12} sm={6} md={3} key={key}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    <LinearProgress
                      variant="determinate"
                      value={value}
                      sx={{ flex: 1, height: 8, borderRadius: 4 }}
                    />
                    <Typography variant="body2" fontWeight={600}>
                      {value}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Risk Assessment */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Warning sx={{ fontSize: 40, color: theme.palette.warning.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Risk Assessment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Identified financial risks and recommendations
            </Typography>
          </Box>
        </Box>

        {risks.length === 0 ? (
          <Alert severity="success" icon={<CheckCircle />}>
            No significant financial risks identified. Keep up the good work!
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {risks.map((risk, index) => (
              <Alert
                key={index}
                severity={risk.severity === 'high' ? 'error' : risk.severity === 'medium' ? 'warning' : 'info'}
                icon={<Warning />}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {risk.title}
                </Typography>
                <Typography variant="body2">{risk.description}</Typography>
              </Alert>
            ))}
          </Box>
        )}
      </Paper>

      {/* Savings Goals Timeline */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Savings sx={{ fontSize: 40, color: theme.palette.success.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Savings Goals Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track progress and projected completion dates
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {savings.map((goal) => {
            const timeline = calculateSavingsTimeline(goal);
            return (
              <Grid item xs={12} md={6} key={goal.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {goal.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {goal.category}
                        </Typography>
                      </Box>
                      <Chip
                        label={timeline.onTrack ? 'On Track' : 'Behind'}
                        size="small"
                        color={timeline.onTrack ? 'success' : 'warning'}
                        icon={timeline.onTrack ? <CheckCircle /> : <Warning />}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" color="text.secondary">
                          Progress
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {timeline.percentComplete.toFixed(1)}%
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={timeline.percentComplete}
                        sx={{ height: 8, borderRadius: 4 }}
                      />
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Current
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {goal.currentAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Target
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {goal.targetAmount.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Contribution
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {goal.monthlyContribution.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Projected Completion
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {timeline.projectedCompletionDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Loan Payoff Timeline */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <AccountBalance sx={{ fontSize: 40, color: theme.palette.info.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Loan Payoff Timeline
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Projected payoff dates and total interest
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2}>
          {loans.filter(l => l.type === 'borrowed').map((loan) => {
            const timeline = calculateLoanPayoffTimeline(loan);
            return (
              <Grid item xs={12} md={6} key={loan.id}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {loan.counterparty}
                    </Typography>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Outstanding Balance
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="error">
                        Rs. {loan.outstandingBalance.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Interest Rate
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {loan.interestRate}%
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Monthly Payment
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        Rs. {loan.monthlyPayment.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Months Remaining
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {timeline.monthsNeeded}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Total Interest
                      </Typography>
                      <Typography variant="body2" fontWeight={600} color="warning.main">
                        Rs. {timeline.totalInterest.toLocaleString()}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">
                        Payoff Date
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {timeline.projectedPayoffDate.toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Emergency Fund Runway */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <HealthAndSafety sx={{ fontSize: 40, color: theme.palette.primary.main }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Emergency Fund Runway
            </Typography>
            <Typography variant="body2" color="text.secondary">
              How long you can survive without income
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
              {runway.months.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              months
            </Typography>
          </Box>
        </Box>

        <Alert
          severity={
            runway.status === 'Excellent' ? 'success' :
            runway.status === 'Good' ? 'info' :
            runway.status === 'Fair' ? 'warning' : 'error'
          }
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Status: {runway.status}
          </Typography>
          <Typography variant="body2">{runway.recommendation}</Typography>
        </Alert>
      </Paper>

      {/* Expense Cutting Recommendations */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ContentCut sx={{ fontSize: 40, color: theme.palette.secondary.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Expense Cutting Recommendations
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Potential savings: Rs. {expenseCuts.reduce((sum, s) => sum + s.savingsPerMonth, 0).toLocaleString()}/month
            </Typography>
          </Box>
        </Box>

        {expenseCuts.length === 0 ? (
          <Alert severity="success">
            Your spending is well-optimized! No major expense cuts recommended.
          </Alert>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {expenseCuts.map((suggestion, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
                    <Typography variant="subtitle1" fontWeight={600}>
                      {suggestion.category}
                    </Typography>
                    <Chip
                      label={`Save Rs. ${suggestion.savingsPerMonth.toLocaleString()}/month`}
                      size="small"
                      color="success"
                    />
                    <Chip
                      label={`${suggestion.suggestedReduction}% reduction`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Current Spending: Rs. {suggestion.currentSpending.toLocaleString()}/month
                    </Typography>
                  </Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tips to reduce expenses:
                  </Typography>
                  <List dense>
                    {suggestion.tips.map((tip, tipIndex) => (
                      <ListItem key={tipIndex}>
                        <ListItemIcon>
                          <CheckCircle fontSize="small" color="success" />
                        </ListItemIcon>
                        <ListItemText primary={tip} />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        )}
      </Paper>

      {/* Money Loss Detection */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <ErrorIcon sx={{ fontSize: 40, color: theme.palette.error.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Money Loss Detection
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Identify unnecessary expenses and potential fraud
            </Typography>
          </Box>
        </Box>

        <Alert severity="info">
          <Typography variant="body2">
            No suspicious transactions or money losses detected. Your spending patterns appear normal.
          </Typography>
        </Alert>
      </Paper>

      {/* Expense Anomalies */}
      <Paper
        elevation={0}
        sx={{
          p: 3,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Timeline sx={{ fontSize: 40, color: theme.palette.warning.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Expense Anomalies
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Unusual spending patterns detected
            </Typography>
          </Box>
        </Box>

        <Alert severity="warning">
          <Typography variant="body2">
            Your dining expenses increased by 45% this month compared to your average. Consider reviewing your restaurant visits.
          </Typography>
        </Alert>
      </Paper>
    </Box>
  );
}

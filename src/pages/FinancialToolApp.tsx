import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Tabs, Tab, Paper, Typography, CircularProgress, Collapse } from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../lib/auth';
import { listTransactions, listMerchants, listCategories } from '../lib/api/financialApi';
import { Transaction, Merchant, Category } from '../types/financial';
import BillUploadSection from '../components/financial/BillUploadSection';
import TransactionsSection, { TransactionFilters } from '../components/financial/TransactionsSection';
import MerchantsCategoriesSection from '../components/financial/MerchantsCategoriesSection';
import AnalyticsSection from '../components/financial/AnalyticsSection';
import AIChatSection from '../components/financial/AIChatSection';
import ModelStatusSection from '../components/financial/ModelStatusSection';
import BudgetSection from '../components/financial/BudgetSection';
import CategoryCapSection from '../components/financial/CategoryCapSection';
import AlertsPanel from '../components/financial/AlertsPanel';
import RightPanel from '../components/financial/RightPanel';
import QuickStatsBar from '../components/financial/QuickStatsBar';
import DashboardOverview from '../components/financial/DashboardOverview';
import QuickActions from '../components/financial/QuickActions';
import './FinancialToolApp.css';

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
      id={`financial-tabpanel-${index}`}
      aria-labelledby={`financial-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `financial-tab-${index}`,
    'aria-controls': `financial-tabpanel-${index}`,
  };
}

export default function FinancialToolApp() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [value, setValue] = useState(0);
  const [showDetailedViews, setShowDetailedViews] = useState(false);
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }

    // Listen for upload trigger from empty states
    const handleOpenUpload = () => {
      setValue(0);
      setShowDetailedViews(true);
    };
    window.addEventListener('financial:openUpload', handleOpenUpload);

    return () => {
      window.removeEventListener('financial:openUpload', handleOpenUpload);
    };
  }, [user]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadTransactions(), loadMerchants(), loadCategories()]);
    } catch (error) {
      console.error('Failed to load initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTransactions = useCallback(async () => {
    try {
      const params: any = {};
      if (filters.dateFrom) params.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) params.date_to = filters.dateTo.toISOString();
      if (filters.category) params.category = filters.category;
      if (filters.merchant) params.merchant = filters.merchant;

      const response = await listTransactions(params);
      if (response.success) {
        setTransactions(response.transactions);
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  }, [filters]);

  const loadMerchants = async () => {
    try {
      const response = await listMerchants();
      if (response.success) {
        setMerchants(response.merchants);
      }
    } catch (error) {
      console.error('Failed to load merchants:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await listCategories();
      if (response.success) {
        setCategories(response.categories);
      }
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  };

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    setShowDetailedViews(true);
  };

  const handleViewTransactions = () => {
    setValue(1);
    setShowDetailedViews(true);
  };

  const handleViewAnalytics = () => {
    setValue(3);
    setShowDetailedViews(true);
  };

  const handleViewBudgets = () => {
    setValue(6);
    setShowDetailedViews(true);
  };

  const handleUploadClick = () => {
    setValue(0);
    setShowDetailedViews(true);
  };

  const handleChatClick = () => {
    setShowChatWidget(true);
  };

  const handleTransactionCreated = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleTransactionsChange = useCallback(() => {
    loadTransactions();
  }, [loadTransactions]);

  const handleFiltersChange = useCallback((newFilters: TransactionFilters) => {
    setFilters(newFilters);
    // Reload transactions with new filters
    const loadFiltered = async () => {
      try {
        const params: any = {};
        if (newFilters.dateFrom) params.date_from = newFilters.dateFrom.toISOString();
        if (newFilters.dateTo) params.date_to = newFilters.dateTo.toISOString();
        if (newFilters.category) params.category = newFilters.category;
        if (newFilters.merchant) params.merchant = newFilters.merchant;

        const response = await listTransactions(params);
        if (response.success) {
          setTransactions(response.transactions);
        }
      } catch (error) {
        console.error('Failed to load filtered transactions:', error);
      }
    };
    loadFiltered();
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    loadTransactions();
  }, [loadTransactions]);

  const hasFilters = !!(filters.dateFrom || filters.dateTo || filters.category || filters.merchant);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="financial-tool-page">
          <Container maxWidth="xl">
            <Paper elevation={1} sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                Authentication Required
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Please log in to access the financial tool.
              </Typography>
            </Paper>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="financial-tool-page">
          <Container maxWidth="xl">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          </Container>
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="financial-tool-page">
        <Container maxWidth={false} sx={{ maxWidth: '100%', px: 2 }}>
          <Box className="financial-tool-header">
            <Typography variant="h4" component="h1" className="page-title">
              Financial Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary" className="page-subtitle">
              Track your spending, get insights, and manage your finances
            </Typography>
          </Box>

          {/* Quick Stats Bar - Always Visible */}
          <QuickStatsBar onStatClick={(stat) => {
            if (stat === 'spending' || stat === 'category') {
              handleViewAnalytics();
            } else if (stat === 'transactions') {
              handleViewTransactions();
            } else if (stat === 'alerts') {
              handleViewBudgets();
            }
          }} />

          {/* Dashboard Overview - Default View */}
          <DashboardOverview
            onViewTransactions={handleViewTransactions}
            onViewAnalytics={handleViewAnalytics}
            onUploadClick={handleUploadClick}
            onViewBudgets={handleViewBudgets}
            categories={categories}
          />

          {/* Detailed Views - Collapsible */}
          <Box sx={{ mt: 4 }}>
            <Paper
              elevation={1}
              sx={{
                mb: 2,
                backgroundColor: theme.palette.background.paper,
                cursor: 'pointer',
              }}
              onClick={() => setShowDetailedViews(!showDetailedViews)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === 'Enter' && setShowDetailedViews(!showDetailedViews)}
              aria-label={showDetailedViews ? 'Collapse detailed views' : 'Expand detailed views'}
            >
              <Tabs
                value={value}
                onChange={handleChange}
                aria-label="financial tool tabs"
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  '& .MuiTab-root': {
                    backgroundColor: theme.palette.background.paper,
                    color: theme.palette.text.secondary,
                    '&.Mui-selected': {
                      color: theme.palette.primary.main,
                      backgroundColor: theme.palette.background.paper,
                    },
                  },
                }}
              >
                <Tab label="Upload Bills" {...a11yProps(0)} />
                <Tab label="Transactions" {...a11yProps(1)} />
                <Tab label="Merchants & Categories" {...a11yProps(2)} />
                <Tab label="Analytics" {...a11yProps(3)} />
                <Tab label="AI Chat" {...a11yProps(4)} />
                <Tab label="Model Status" {...a11yProps(5)} />
                <Tab label="Budgets" {...a11yProps(6)} />
                <Tab label="Alerts" {...a11yProps(7)} />
              </Tabs>
            </Paper>

            <Collapse in={showDetailedViews}>
              <Box className="two-column-layout">
                <Box className="left-column">
                  <TabPanel value={value} index={0}>
                    <BillUploadSection onTransactionCreated={handleTransactionCreated} />
                  </TabPanel>

                  <TabPanel value={value} index={1}>
                    <TransactionsSection
                      transactions={transactions}
                      merchants={merchants}
                      categories={categories}
                      onTransactionsChange={handleTransactionsChange}
                      onFiltersChange={handleFiltersChange}
                    />
                  </TabPanel>

                  <TabPanel value={value} index={2}>
                    <MerchantsCategoriesSection onDataChange={handleTransactionsChange} />
                  </TabPanel>

                  <TabPanel value={value} index={3}>
                    <AnalyticsSection />
                  </TabPanel>

                  <TabPanel value={value} index={4}>
                    <AIChatSection />
                  </TabPanel>

                  <TabPanel value={value} index={5}>
                    <ModelStatusSection />
                  </TabPanel>

                  <TabPanel value={value} index={6}>
                    <BudgetSection categories={categories} onBudgetChange={handleTransactionsChange} />
                  </TabPanel>

                  <TabPanel value={value} index={7}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <AlertsPanel />
                      <CategoryCapSection categories={categories} onCapChange={handleTransactionsChange} />
                    </Box>
                  </TabPanel>
                </Box>

                {/* Right Column - CSV & Charts */}
                <Box className="right-column">
                  <RightPanel
                    transactions={transactions}
                    merchants={merchants}
                    categories={categories}
                    activeSection={value === 1 ? 'transactions' : value === 3 ? 'analytics' : 'other'}
                    onClearFilters={handleClearFilters}
                    hasFilters={hasFilters}
                  />
                </Box>
              </Box>
            </Collapse>
          </Box>

          {/* Quick Actions - Floating Buttons */}
          <QuickActions
            onUploadClick={handleUploadClick}
            onChatClick={handleChatClick}
            onAnalyticsClick={handleViewAnalytics}
            onSettingsClick={handleViewBudgets}
          />

          {/* Floating Chat Widget */}
          {showChatWidget && (
            <AIChatSection
              floating
              onClose={() => setShowChatWidget(false)}
              onMinimize={() => setShowChatWidget(false)}
            />
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}




import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Box, Container, Tabs, Tab, Paper, Typography, CircularProgress, Button, IconButton } from '@mui/material';
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
import { CollapsibleSection } from '../components/design-system';
import EditIcon from '@mui/icons-material/Edit';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
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
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [rightSidebarTab, setRightSidebarTab] = useState(0);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }

    // Listen for upload trigger from empty states
    const handleOpenUpload = () => {
      setValue(0);
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
  };

  const handleViewTransactions = () => {
    setValue(1);
  };

  const handleViewAnalytics = () => {
    setValue(3);
  };

  const handleViewBudgets = () => {
    setValue(6);
  };

  const handleUploadClick = () => {
    setValue(0);
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
        <Container maxWidth={false} sx={{ maxWidth: '100%', px: 0 }}>
          {/* Three Column Layout */}
          <Box className="financial-three-column-layout">
            {/* Left Sidebar - Narrow */}
            <Box className="financial-left-sidebar">
              <Paper
                elevation={0}
                sx={{
                  p: '1.5rem',
                  borderRadius: '12px',
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  height: 'fit-content',
                  position: 'sticky',
                  top: '1.25rem',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                {/* About Section */}
                <CollapsibleSection
                  title="About"
                  defaultExpanded={true}
                  actionButton={
                    <IconButton 
                      size="small" 
                      sx={{ 
                        color: theme.palette.primary.main,
                        padding: '0.25rem',
                        '&:hover': {
                          backgroundColor: 'transparent',
                        },
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', mt: '0.5rem' }}>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          display: 'block',
                          mb: '0.25rem',
                        }}
                      >
                        User
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 500, 
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {user?.name || user?.email || 'User'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          display: 'block',
                          mb: '0.25rem',
                        }}
                      >
                        Email
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.875rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {user?.email || 'N/A'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          display: 'block',
                          mb: '0.25rem',
                        }}
                      >
                        Total Transactions
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 500, 
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {transactions.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          color: theme.palette.text.secondary, 
                          fontSize: '0.75rem',
                          fontWeight: 400,
                          lineHeight: 1.5,
                          display: 'block',
                          mb: '0.25rem',
                        }}
                      >
                        Categories
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontWeight: 500, 
                          fontSize: '0.875rem',
                          lineHeight: 1.5,
                          color: theme.palette.text.primary,
                        }}
                      >
                        {categories.length}
                      </Typography>
                    </Box>
                  </Box>
                </CollapsibleSection>

                {/* Quick Stats Section */}
                <CollapsibleSection
                  title={`Quick Stats (${transactions.length})`}
                  defaultExpanded={false}
                  actionButton={
                    <IconButton size="small" sx={{ color: theme.palette.primary.main }}>
                      <ManageAccountsIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Box sx={{ mt: 1 }}>
                    <QuickStatsBar
                      onStatClick={(stat) => {
                        if (stat === 'spending' || stat === 'category') {
                          handleViewAnalytics();
                        } else if (stat === 'transactions') {
                          handleViewTransactions();
                        } else if (stat === 'alerts') {
                          handleViewBudgets();
                        }
                      }}
                    />
                  </Box>
                </CollapsibleSection>
              </Paper>
            </Box>

            {/* Main Content Area - Wide */}
            <Box className="financial-main-content">
              {/* Header */}
              <Box sx={{ mb: '2rem' }}>
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    fontSize: '1.25rem',
                    lineHeight: 1.2,
                    color: theme.palette.text.primary,
                    mb: '0.5rem',
                  }}
                >
                  Financial Dashboard
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
                  Track your spending, get insights, and manage your finances
                </Typography>
              </Box>

              {/* Main Content Tabs */}
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                  mb: '2rem',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Tabs
                  value={value}
                  onChange={handleChange}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    minHeight: '48px',
                    '& .MuiTab-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      textTransform: 'none',
                      fontSize: '0.875rem',
                      color: theme.palette.text.secondary,
                      minHeight: 48,
                      padding: '0.75rem 1rem',
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
                  <Tab label="Upload Bills" {...a11yProps(0)} />
                  <Tab label="Transactions" {...a11yProps(1)} />
                  <Tab label="Merchants & Categories" {...a11yProps(2)} />
                  <Tab label="Analytics" {...a11yProps(3)} />
                  <Tab label="AI Chat" {...a11yProps(4)} />
                  <Tab label="Model Status" {...a11yProps(5)} />
                  <Tab label="Budgets" {...a11yProps(6)} />
                  <Tab label="Alerts" {...a11yProps(7)} />
                </Tabs>

                <Box sx={{ p: '1.5rem' }}>
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
              </Paper>
            </Box>

            {/* Right Sidebar - Actions, Comments, History */}
            <Box className="financial-right-sidebar">
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '12px',
                  border: `1px solid ${theme.palette.divider}`,
                  overflow: 'hidden',
                  position: 'sticky',
                  top: '1.25rem',
                  maxHeight: 'calc(100vh - 2.5rem)',
                  display: 'flex',
                  flexDirection: 'column',
                  backgroundColor: theme.palette.background.paper,
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Tabs
                  value={rightSidebarTab}
                  onChange={(e, newValue) => setRightSidebarTab(newValue)}
                  variant="fullWidth"
                  sx={{
                    borderBottom: `1px solid ${theme.palette.divider}`,
                    minHeight: '48px',
                    '& .MuiTab-root': {
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 500,
                      textTransform: 'none',
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      minHeight: 48,
                      padding: '0.75rem 1rem',
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
                  <Tab label="Actions" />
                  <Tab label="Comments" />
                  <Tab label="History" />
                </Tabs>

                <Box sx={{ p: '1.5rem', overflowY: 'auto', flex: 1 }}>
                  {rightSidebarTab === 0 && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                      <CollapsibleSection
                        title="Quick Actions"
                        defaultExpanded={true}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', mt: '0.5rem' }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleUploadClick}
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              padding: '0.625rem 0.875rem',
                              borderRadius: '8px',
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            Upload Bill
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleViewAnalytics}
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              padding: '0.625rem 0.875rem',
                              borderRadius: '8px',
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            View Analytics
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={handleViewTransactions}
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              justifyContent: 'flex-start',
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              padding: '0.625rem 0.875rem',
                              borderRadius: '8px',
                              borderColor: theme.palette.divider,
                              color: theme.palette.text.primary,
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                backgroundColor: theme.palette.action.hover,
                              },
                            }}
                          >
                            View Transactions
                          </Button>
                        </Box>
                      </CollapsibleSection>

                      <CollapsibleSection
                        title="AI Assistant"
                        defaultExpanded={false}
                      >
                        <Box sx={{ mt: '0.5rem' }}>
                          <Button
                            variant="contained"
                            size="small"
                            onClick={handleChatClick}
                            sx={{
                              fontFamily: "'Inter', sans-serif",
                              textTransform: 'none',
                              fontSize: '0.875rem',
                              fontWeight: 500,
                              padding: '0.625rem 1rem',
                              borderRadius: '8px',
                              backgroundColor: theme.palette.primary.main,
                              '&:hover': {
                                backgroundColor: theme.palette.primary.dark,
                              },
                            }}
                          >
                            Open AI Chat
                          </Button>
                        </Box>
                      </CollapsibleSection>
                    </Box>
                  )}

                  {rightSidebarTab === 1 && (
                    <Box>
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
                        Comments feature coming soon
                      </Typography>
                    </Box>
                  )}

                  {rightSidebarTab === 2 && (
                    <Box>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: "'Inter', sans-serif",
                          fontSize: '0.875rem',
                          fontWeight: 500,
                          lineHeight: 1.5,
                          color: theme.palette.text.primary,
                          mb: '1.5rem',
                        }}
                      >
                        Recent Activity
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {transactions.slice(0, 5).map((transaction, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: '0.875rem',
                              borderRadius: '8px',
                              backgroundColor: theme.palette.action.hover,
                              border: `1px solid ${theme.palette.divider}`,
                            }}
                          >
                            <Typography 
                              variant="body2" 
                              sx={{ 
                                fontFamily: "'Inter', sans-serif",
                                fontWeight: 500, 
                                fontSize: '0.8125rem',
                                lineHeight: 1.5,
                                color: theme.palette.text.primary,
                                mb: '0.25rem',
                              }}
                            >
                              {transaction.merchant_name || 'Transaction'}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                fontFamily: "'Inter', sans-serif",
                                color: theme.palette.text.secondary, 
                                fontSize: '0.75rem',
                                fontWeight: 400,
                                lineHeight: 1.5,
                              }}
                            >
                              {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>

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





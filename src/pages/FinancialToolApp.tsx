import { useState, useEffect, useCallback } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Avatar,
  Box,
  Button,
  Container,
  IconButton,
  InputAdornment,
  Paper,
  Tab,
  Tabs,
  TextField,
  Typography,
  CircularProgress,
  useMediaQuery,
} from '@mui/material';
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
import DashboardOverview from '../components/financial/DashboardOverview';
import ItemsSection from '../components/financial/ItemsSection';
import RecurringPaymentsSection from '../components/financial/RecurringPaymentsSection';
import UpcomingPaymentsSection from '../components/financial/UpcomingPaymentsSection';
import PendingTransactionsSection from '../components/financial/PendingTransactionsSection';
import MultiUserAnalyticsSection from '../components/financial/MultiUserAnalyticsSection';
import SavingsSection from '../components/financial/SavingsSection';
import UserManagementSection from '../components/financial/UserManagementSection';
import LoansSection from '../components/financial/LoansSection';
import ManualTransactionDialog from '../components/financial/ManualTransactionDialog';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SmartToyIcon from '@mui/icons-material/SmartToy';
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
      {value === index && <Box sx={{ p: { xs: 1.25, sm: 2 } }}>{children}</Box>}
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
  const isSmallLayout = useMediaQuery(theme.breakpoints.down('lg'));

  // Nav (top tabs)
  const [value, setValue] = useState(0);

  // AI chat widget (floating)
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');
  const [askBarValue, setAskBarValue] = useState('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [showManualTransactionDialog, setShowManualTransactionDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadInitialData();
    }

    // Listen for upload trigger from empty states
    const handleOpenUpload = () => {
      // Upload Bills tab
      setValue(1);
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

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleViewTransactions = () => {
    setValue(2);
  };

  const handleViewAnalytics = () => {
    setValue(5);
  };

  const handleViewBudgets = () => {
    setValue(6);
  };

  const handleUploadClick = () => {
    setValue(1);
  };

  const handleChatClick = () => {
    setValue(8);
    setShowChatWidget(true);
  };

  const handleAskSubmit = () => {
    const q = askBarValue.trim();
    if (!q) return;
    setChatInitialQuery(q);
    setShowChatWidget(true);
    setAskBarValue('');
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

  // NOTE: filters are managed inside the Transactions view; keep state here for API fetching.

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
        <Container 
          maxWidth={false} 
          sx={{ 
            maxWidth: '100%', 
            px: { xs: 1, sm: 2, md: 3 },
            width: '100%',
            boxSizing: 'border-box',
          }}
        >
          <Box className="finance-shell">
            {/* Top Bar + Navigation */}
            <Paper
              elevation={0}
              className="finance-topbar"
              sx={{
                borderRadius: '16px',
                border: `1px solid ${theme.palette.divider}`,
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' ? '0 8px 30px rgba(0,0,0,0.25)' : '0 10px 30px rgba(15, 23, 42, 0.06)',
                overflow: 'hidden',
              }}
            >
              <Box className="finance-topbarRow">
                <Box className="finance-brand">
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: theme.palette.primary.main,
                      color: theme.palette.mode === 'dark' ? '#000' : '#fff',
                      fontWeight: 800,
                    }}
                  >
                    F
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography
                      variant="body1"
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontWeight: 800,
                        letterSpacing: '-0.02em',
                        lineHeight: 1.1,
                        color: theme.palette.text.primary,
                      }}
                      noWrap
                    >
                      Fiscally
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        color: theme.palette.text.secondary,
                        display: 'block',
                        lineHeight: 1.2,
                      }}
                      noWrap
                    >
                      Financial Dashboard
                    </Typography>
                  </Box>
                </Box>

                <Box className="finance-ask">
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Ask me anything..."
                    value={askBarValue}
                    onChange={(e) => setAskBarValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAskSubmit();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            size="small"
                            aria-label="Ask AI"
                            onClick={handleAskSubmit}
                            edge="end"
                          >
                            <SmartToyIcon fontSize="small" />
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>

                <Box className="finance-actions">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<CalendarMonthIcon />}
                    sx={{ textTransform: 'none', borderRadius: '10px' }}
                    onClick={handleViewAnalytics}
                  >
                    Monthly
                  </Button>
                  <IconButton
                    size="small"
                    aria-label="Open AI assistant"
                    onClick={() => {
                      setChatInitialQuery('');
                      handleChatClick();
                    }}
                  >
                    <SmartToyIcon />
                  </IconButton>
                  <Avatar
                    sx={{
                      width: 34,
                      height: 34,
                      bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#e5e7eb',
                      color: theme.palette.text.primary,
                      fontWeight: 700,
                    }}
                    aria-label="User"
                  >
                    {(user?.name || user?.email || 'U').slice(0, 1).toUpperCase()}
                  </Avatar>
                </Box>
              </Box>

              <Tabs
                value={value}
                onChange={handleChange}
                variant="scrollable"
                scrollButtons
                allowScrollButtonsMobile
                sx={{
                  borderTop: `1px solid ${theme.palette.divider}`,
                  '& .MuiTab-root': {
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    textTransform: 'none',
                    fontSize: '0.875rem',
                    minHeight: 48,
                    color: theme.palette.text.secondary,
                  },
                  '& .MuiTab-root.Mui-selected': {
                    color: theme.palette.primary.main,
                  },
                  '& .MuiTabs-indicator': {
                    backgroundColor: theme.palette.primary.main,
                    height: 3,
                  },
                }}
              >
                <Tab label="Dashboard" {...a11yProps(0)} />
                <Tab label="Upload Bills" {...a11yProps(1)} />
                <Tab label="Transactions" {...a11yProps(2)} />
                <Tab label="Pending" {...a11yProps(3)} />
                <Tab label="Recurring" {...a11yProps(4)} />
                <Tab label="Upcoming" {...a11yProps(5)} />
                <Tab label="Items" {...a11yProps(6)} />
                <Tab label="Merchants" {...a11yProps(7)} />
                <Tab label="Analytics" {...a11yProps(8)} />
                <Tab label="Family" {...a11yProps(9)} />
                <Tab label="Budgets" {...a11yProps(10)} />
                <Tab label="Savings" {...a11yProps(11)} />
                <Tab label="Loans" {...a11yProps(12)} />
                <Tab label="Users" {...a11yProps(13)} />
                <Tab label="Alerts" {...a11yProps(14)} />
                <Tab label="AI Chat" {...a11yProps(15)} />
                <Tab label="Model Status" {...a11yProps(16)} />
              </Tabs>
            </Paper>

            <Box className="finance-body">
              {/* Main Content */}
              <Box className="finance-main" sx={{ minWidth: 0 }}>
                <Paper
                  elevation={0}
                  className="finance-contentCard"
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    backgroundColor: theme.palette.background.paper,
                    boxShadow: theme.palette.mode === 'dark' ? '0 8px 30px rgba(0,0,0,0.25)' : '0 10px 30px rgba(15, 23, 42, 0.05)',
                    overflow: 'hidden',
                  }}
                >
                  <TabPanel value={value} index={0}>
                    <DashboardOverview
                      onViewTransactions={handleViewTransactions}
                      onViewAnalytics={handleViewAnalytics}
                      onUploadClick={handleUploadClick}
                      onViewBudgets={handleViewBudgets}
                      categories={categories as any}
                    />
                  </TabPanel>

                  <TabPanel value={value} index={1}>
                    <BillUploadSection onTransactionCreated={handleTransactionCreated} />
                  </TabPanel>

                  <TabPanel value={value} index={2}>
                    <TransactionsSection
                      transactions={transactions}
                      merchants={merchants}
                      categories={categories}
                      onTransactionsChange={handleTransactionsChange}
                      onFiltersChange={handleFiltersChange}
                    />
                  </TabPanel>

                  <TabPanel value={value} index={3}>
                    <PendingTransactionsSection />
                  </TabPanel>

                  <TabPanel value={value} index={4}>
                    <RecurringPaymentsSection />
                  </TabPanel>

                  <TabPanel value={value} index={5}>
                    <UpcomingPaymentsSection />
                  </TabPanel>

                  <TabPanel value={value} index={6}>
                    <ItemsSection />
                  </TabPanel>

                  <TabPanel value={value} index={7}>
                    <MerchantsCategoriesSection onDataChange={handleTransactionsChange} />
                  </TabPanel>

                  <TabPanel value={value} index={8}>
                    <AnalyticsSection />
                  </TabPanel>

                  <TabPanel value={value} index={9}>
                    <MultiUserAnalyticsSection />
                  </TabPanel>

                  <TabPanel value={value} index={10}>
                    <BudgetSection categories={categories} onBudgetChange={handleTransactionsChange} />
                  </TabPanel>

                  <TabPanel value={value} index={11}>
                    <SavingsSection />
                  </TabPanel>

                  <TabPanel value={value} index={12}>
                    <LoansSection />
                  </TabPanel>

                  <TabPanel value={value} index={13}>
                    <UserManagementSection />
                  </TabPanel>

                  <TabPanel value={value} index={14}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <AlertsPanel />
                      <CategoryCapSection categories={categories} onCapChange={handleTransactionsChange} />
                    </Box>
                  </TabPanel>

                  <TabPanel value={value} index={15}>
                    <AIChatSection />
                  </TabPanel>

                  <TabPanel value={value} index={16}>
                    <ModelStatusSection />
                  </TabPanel>
                </Paper>
              </Box>

              {/* Aside (collapses under main on smaller screens) */}
              <Box className="finance-aside" sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    p: 2,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 800,
                      color: theme.palette.text.primary,
                      mb: 1,
                    }}
                  >
                    Overview
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.25 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        User
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }} noWrap>
                        {user?.name || user?.email || 'User'}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Transactions
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                        {transactions.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Categories
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                        {categories.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        Merchants
                      </Typography>
                      <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 700 }}>
                        {merchants.length}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    p: 2,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 800,
                      color: theme.palette.text.primary,
                      mb: 1.5,
                    }}
                  >
                    Quick Actions
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Button variant="contained" onClick={handleUploadClick} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                      Upload Bill
                    </Button>
                    <Button variant="outlined" onClick={() => setShowManualTransactionDialog(true)} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                      Add Manual Transaction
                    </Button>
                    <Button variant="outlined" onClick={handleViewTransactions} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                      View Transactions
                    </Button>
                    <Button variant="outlined" onClick={handleViewAnalytics} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                      View Analytics
                    </Button>
                    <Button variant="outlined" onClick={handleViewBudgets} sx={{ borderRadius: '12px', textTransform: 'none' }}>
                      Budgets & Alerts
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setChatInitialQuery('');
                        handleChatClick();
                      }}
                      sx={{ borderRadius: '12px', textTransform: 'none' }}
                    >
                      Ask AI
                    </Button>
                  </Box>
                </Paper>

                <Paper
                  elevation={0}
                  sx={{
                    borderRadius: '16px',
                    border: `1px solid ${theme.palette.divider}`,
                    p: 2,
                    backgroundColor: theme.palette.background.paper,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontFamily: "'Inter', sans-serif",
                      fontWeight: 800,
                      color: theme.palette.text.primary,
                      mb: 1.5,
                    }}
                  >
                    Latest Activity
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {transactions.length === 0 ? (
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        No transactions yet.
                      </Typography>
                    ) : (
                      transactions.slice(0, isSmallLayout ? 3 : 5).map((transaction, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 1.25,
                            borderRadius: '12px',
                            border: `1px solid ${theme.palette.divider}`,
                            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(15, 23, 42, 0.03)',
                          }}
                        >
                          <Typography variant="body2" sx={{ fontWeight: 700, color: theme.palette.text.primary }} noWrap>
                            {transaction.merchant_id || 'Transaction'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                            {transaction.date ? new Date(transaction.date).toLocaleDateString() : 'N/A'}
                          </Typography>
                        </Box>
                      ))
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          </Box>

          {/* Floating Chat Widget */}
          {showChatWidget && (
            <AIChatSection
              floating
              initialQuery={chatInitialQuery}
              onClose={() => setShowChatWidget(false)}
              onMinimize={() => setShowChatWidget(false)}
            />
          )}

          {/* Manual Transaction Dialog */}
          <ManualTransactionDialog
            open={showManualTransactionDialog}
            onClose={() => setShowManualTransactionDialog(false)}
            onSave={(transaction) => {
              console.log('Manual transaction created:', transaction);
              handleTransactionCreated();
              setShowManualTransactionDialog(false);
            }}
            categories={categories}
          />
        </Container>
      </Box>
    </ThemeProvider>
  );
}





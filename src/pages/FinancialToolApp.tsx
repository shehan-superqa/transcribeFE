import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
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
import EnhancedBillUploadSection from '../components/financial/EnhancedBillUploadSection';
import TransactionsSection, { TransactionFilters } from '../components/financial/TransactionsSection';
import EnhancedMerchantsSection from '../components/financial/EnhancedMerchantsSection';
import EnhancedCategorySection from '../components/financial/EnhancedCategorySection';
import AnalyticsSection from '../components/financial/AnalyticsSection';
import AdvancedAnalyticsSection from '../components/financial/AdvancedAnalyticsSection';
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
import ShoppingListSection from '../components/financial/ShoppingListSection';
import UserProfileSection from '../components/financial/UserProfileSection';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import './FinancialToolApp.css';

function a11yProps(index: number) {
  return {
    id: `financial-tab-${index}`,
    'aria-controls': `financial-tabpanel-${index}`,
  };
}

// Tab to path mapping
const TAB_PATHS = [
  'dashboard',
  'upload',
  'transactions',
  'pending',
  'recurring',
  'upcoming',
  'items',
  'merchants',
  'categories',
  'analytics',
  'advanced-analytics',
  'family',
  'budgets',
  'savings',
  'loans',
  'shopping-lists',
  'user-profile',
  'users',
  'alerts',
  'ai-chat',
  'model-status',
];

// Path to tab index mapping
const PATH_TO_TAB: Record<string, number> = {
  'dashboard': 0,
  'upload': 1,
  'transactions': 2,
  'pending': 3,
  'recurring': 4,
  'upcoming': 5,
  'items': 6,
  'merchants': 7,
  'categories': 8,
  'analytics': 9,
  'advanced-analytics': 10,
  'family': 11,
  'budgets': 12,
  'savings': 13,
  'loans': 14,
  'shopping-lists': 15,
  'user-profile': 16,
  'users': 17,
  'alerts': 18,
  'ai-chat': 19,
  'model-status': 20,
};

export default function FinancialToolApp() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isSmallLayout = useMediaQuery(theme.breakpoints.down('lg'));
  const navigate = useNavigate();
  const location = useLocation();

  // Get current tab from URL path
  const getTabFromPath = useCallback(() => {
    const path = location.pathname.replace('/financialtool/app/', '').split('/')[0] || 'dashboard';
    return PATH_TO_TAB[path] ?? 0;
  }, [location.pathname]);

  // Nav (top tabs) - sync with URL
  const [value, setValue] = useState(() => getTabFromPath());

  // Update tab when URL changes
  useEffect(() => {
    const tabFromPath = getTabFromPath();
    if (tabFromPath !== value) {
      setValue(tabFromPath);
    }
  }, [location.pathname, getTabFromPath]);

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
    // Redirect to dashboard if on base path
    if (location.pathname === '/financialtool/app' || location.pathname === '/financialtool/app/') {
      navigate('/financialtool/app/dashboard', { replace: true });
      return;
    }

    if (user) {
      loadInitialData();
    }

    // Listen for upload trigger from empty states
    const handleOpenUpload = () => {
      // Upload Bills tab
      navigate('/financialtool/app/upload', { replace: true });
    };
    window.addEventListener('financial:openUpload', handleOpenUpload);

    return () => {
      window.removeEventListener('financial:openUpload', handleOpenUpload);
    };
  }, [user, location.pathname, navigate]);

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
    const path = TAB_PATHS[newValue] || 'dashboard';
    navigate(`/financialtool/app/${path}`, { replace: true });
  };

  const handleViewTransactions = () => {
    navigate('/financialtool/app/transactions', { replace: true });
  };

  const handleViewAnalytics = () => {
    navigate('/financialtool/app/analytics', { replace: true });
  };

  const handleViewBudgets = () => {
    navigate('/financialtool/app/budgets', { replace: true });
  };

  const handleUploadClick = () => {
    navigate('/financialtool/app/upload', { replace: true });
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
                <Tab label="Categories" {...a11yProps(8)} />
                <Tab label="Analytics" {...a11yProps(9)} />
                <Tab label="Advanced Analytics" {...a11yProps(10)} />
                <Tab label="Family" {...a11yProps(11)} />
                <Tab label="Budgets" {...a11yProps(12)} />
                <Tab label="Savings" {...a11yProps(13)} />
                <Tab label="Loans" {...a11yProps(14)} />
                <Tab label="Shopping Lists" {...a11yProps(15)} />
                <Tab label="User Profile" {...a11yProps(16)} />
                <Tab label="Users" {...a11yProps(17)} />
                <Tab label="Alerts" {...a11yProps(18)} />
                <Tab label="AI Chat" {...a11yProps(19)} />
                <Tab label="Model Status" {...a11yProps(20)} />
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
                  <Box sx={{ p: { xs: 1.25, sm: 2 } }}>
                    <Routes>
                      <Route path="/" element={<Navigate to="/financialtool/app/dashboard" replace />} />
                      <Route path="dashboard" element={
                        <DashboardOverview
                          onViewTransactions={handleViewTransactions}
                          onViewAnalytics={handleViewAnalytics}
                          onUploadClick={handleUploadClick}
                          onViewBudgets={handleViewBudgets}
                          categories={categories as any}
                        />
                      } />
                      <Route path="upload" element={
                        <EnhancedBillUploadSection
                          onTransactionCreated={handleTransactionCreated}
                          categories={categories}
                        />
                      } />
                      <Route path="transactions" element={
                        <TransactionsSection
                          transactions={transactions}
                          merchants={merchants}
                          categories={categories}
                          onTransactionsChange={handleTransactionsChange}
                          onFiltersChange={handleFiltersChange}
                        />
                      } />
                      <Route path="pending" element={<PendingTransactionsSection />} />
                      <Route path="recurring" element={<RecurringPaymentsSection />} />
                      <Route path="upcoming" element={<UpcomingPaymentsSection />} />
                      <Route path="items" element={<ItemsSection />} />
                      <Route path="merchants" element={<EnhancedMerchantsSection />} />
                      <Route path="categories" element={<EnhancedCategorySection />} />
                      <Route path="analytics" element={<AnalyticsSection />} />
                      <Route path="advanced-analytics" element={<AdvancedAnalyticsSection />} />
                      <Route path="family" element={<MultiUserAnalyticsSection />} />
                      <Route path="budgets" element={
                        <BudgetSection categories={categories} onBudgetChange={handleTransactionsChange} />
                      } />
                      <Route path="savings" element={<SavingsSection />} />
                      <Route path="loans" element={<LoansSection />} />
                      <Route path="shopping-lists" element={<ShoppingListSection />} />
                      <Route path="user-profile" element={<UserProfileSection />} />
                      <Route path="users" element={<UserManagementSection />} />
                      <Route path="alerts" element={
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <AlertsPanel />
                          <CategoryCapSection categories={categories} onCapChange={handleTransactionsChange} />
                        </Box>
                      } />
                      <Route path="ai-chat" element={<AIChatSection />} />
                      <Route path="model-status" element={<ModelStatusSection />} />
                      <Route path="*" element={<Navigate to="/financialtool/app/dashboard" replace />} />
                    </Routes>
                  </Box>
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





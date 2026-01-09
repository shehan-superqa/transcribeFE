import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  Avatar,
  Box,
  Button,
  IconButton,
  Paper,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';
import { useTheme } from '../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { listTransactions, listMerchants, listCategories } from '../lib/api/financialApi';
import { Transaction, Merchant, Category } from '../types/financial';
import { unifiedWebSocketClient } from '../lib/api/websocket';
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
import DashboardIcon from '@mui/icons-material/Dashboard';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import AddIcon from '@mui/icons-material/Add';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PendingIcon from '@mui/icons-material/Pending';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BarChartIcon from '@mui/icons-material/BarChart';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import MemoryIcon from '@mui/icons-material/Memory';
import EnergyPointsBalance from '../components/common/EnergyPointsBalance';
import { useAuth } from '../lib/auth';
import './FinancialToolApp.css';


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
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
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

  // Connect to unified socket server when financial app loads
  useEffect(() => {
    if (user) {
      // Connect to unified socket server
      unifiedWebSocketClient.connect().catch((error) => {
        console.error('[Financial App] Failed to connect to unified socket server:', error);
        // Connection will retry automatically, so we don't need to handle it here
      });
    }

    return () => {
      // Disconnect when component unmounts
      if (unifiedWebSocketClient.isConnectedToServer()) {
        unifiedWebSocketClient.disconnect();
      }
    };
  }, [user]);

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

  // Helper function to get merchant name
  const getMerchantName = useCallback((merchantId: string | null | undefined) => {
    if (!merchantId) return 'Unknown Merchant';
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.merchant_name || merchantId;
  }, [merchants]);

  // Helper function to determine transaction type (expense or earning)
  // Check if transaction has type field, otherwise infer from amount sign
  const getTransactionType = useCallback((transaction: Transaction): 'expense' | 'earning' => {
    // Check if transaction has a type field (might be in normalized_output or as a direct field)
    const transactionType = (transaction as any).transaction_type || (transaction as any).type;
    if (transactionType === 'earning' || transactionType === 'expense') {
      return transactionType;
    }
    // Infer from amount: negative amounts are typically expenses, positive are earnings
    // But in most financial systems, expenses are positive and marked with type
    // For now, default to expense if not specified
    return 'expense';
  }, []);

  // NOTE: filters are managed inside the Transactions view; keep state here for API fetching.
  // Note: Authentication is handled by ProtectedRoute, so user should always be available here

  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box className="financial-tool-page">
          <Box sx={{ maxWidth: '1600px', mx: 'auto', px: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
              <CircularProgress />
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    );
  }

  const { user: authUser, signOut } = useAuth();
  const displayUser = user || authUser;
  const userName = displayUser?.name || displayUser?.email || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box className="financial-tool-page" sx={{ bgcolor: theme.palette.mode === 'dark' ? '#111827' : '#F9FAFB', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <Box
          component="nav"
          sx={{
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'}`,
            bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <Box sx={{ maxWidth: '1600px', mx: 'auto', px: 3, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: '#6D28D9',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AccountBalanceWalletIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
                </Box>
                <Typography sx={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
                  VoiceCrypt.ai
                </Typography>
              </Box>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 6 }}>
                <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
                  Products
                </Button>
                <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
                  Tools
                </Button>
                <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
                  Pricing
                </Button>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F3F4F6', px: 1.5, py: 0.75, borderRadius: '9999px' }}>
                <EnergyPointsBalance showLabel={false} />
              </Box>
              <IconButton
                onClick={() => {
                  const html = document.documentElement;
                  html.classList.toggle('dark');
                }}
                sx={{
                  p: 1,
                  '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6' },
                  borderRadius: '50%',
                }}
              >
                <DarkModeIcon sx={{ color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563' }} />
              </IconButton>
              {displayUser ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`, ml: 1, pl: 3 }}>
                    <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                      <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary }}>
                        {userName.split('@')[0]}
                      </Typography>
                      {displayUser.isEmailVerified && (
                        <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Verified
                        </Typography>
                      )}
                    </Box>
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                        color: '#6D28D9',
                        fontWeight: 700,
                      }}
                    >
                      {userInitials}
                    </Avatar>
                  </Box>
                  <Button
                    onClick={() => {
                      signOut();
                      navigate('/auth/login');
                    }}
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                      '&:hover': {
                        color: '#6D28D9',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                      },
                    }}
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    onClick={() => navigate('/auth/signup')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                      '&:hover': {
                        color: '#6D28D9',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                      },
                    }}
                  >
                    Sign up
                  </Button>
                  <Button
                    onClick={() => navigate('/auth/login')}
                    sx={{
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                      '&:hover': {
                        color: '#6D28D9',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                      },
                    }}
                  >
                    Sign in
                  </Button>
                </>
              )}
            </Box>
          </Box>
        </Box>

        {/* Dashboard Header Section */}
        <Box
          sx={{
            borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'}`,
            bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
          }}
        >
          <Box sx={{ maxWidth: '1600px', mx: 'auto', px: 6, py: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: 'rgba(109, 40, 217, 0.1)',
                  color: '#6D28D9',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AccountBalanceIcon sx={{ fontSize: 18 }} />
              </Box>
              <Box>
                <Typography sx={{ fontSize: '16px', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
                  Fiscally Dashboard
                </Typography>
                <Typography sx={{ fontSize: '12px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', lineHeight: 1.2 }}>
                  Overview of your personal finances
                </Typography>
              </Box>
            </Box>
            <Box sx={{ position: 'relative', flex: 1, maxWidth: { md: '528px' }, mx: { md: 'auto' } }}>
              <SearchIcon sx={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#9CA3AF', fontSize: 16 }} />
              <TextField
                fullWidth
                size="small"
                placeholder="Ask me anything or search transactions..."
                value={askBarValue}
                onChange={(e) => setAskBarValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskSubmit();
                  }
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    pl: 8,
                    pr: 3,
                    py: 1,
                    bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                    border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px',
                    fontSize: '13px',
                    '& fieldset': {
                      border: 'none',
                    },
                    '&:hover': {
                      borderColor: '#6D28D9',
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                    '&.Mui-focused': {
                      borderColor: '#6D28D9',
                      boxShadow: '0 0 0 2px rgba(109, 40, 217, 0.1)',
                      '& fieldset': {
                        border: 'none',
                      },
                    },
                  },
                }}
              />
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<CalendarMonthIcon sx={{ fontSize: 12 }} />}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                  bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                  },
                }}
                onClick={handleViewAnalytics}
              >
                Monthly
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            minHeight: 0,
          }}
        >
          <Box 
            sx={{ 
              maxWidth: '1600px', 
              mx: 'auto', 
              px: 6, 
              py: 6,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '64px 1fr 288px' }, gap: 6, flex: 1, overflow: 'hidden', minHeight: 0 }}>
            {/* Left Sidebar Navigation */}
            <Box
              sx={{
                display: { xs: 'flex', lg: 'flex' },
                flexDirection: { xs: 'row', lg: 'column' },
                gap: 0.5,
                overflowX: { xs: 'auto', lg: 'hidden' },
                overflowY: { xs: 'visible', lg: 'auto' },
                pb: { xs: 1, lg: 0 },
                maxHeight: { lg: 'calc(100vh - 200px)' },
                width: { lg: '64px' },
                minWidth: { lg: '64px' },
                maxWidth: { lg: '64px' },
                scrollbarWidth: 'thin',
                scrollbarColor: `${theme.palette.mode === 'dark' ? '#374151' : '#D1D5DB'} transparent`,
                '&::-webkit-scrollbar': {
                  width: '4px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? '#374151' : '#D1D5DB',
                  borderRadius: '2px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: theme.palette.mode === 'dark' ? '#4B5563' : '#9CA3AF',
                },
              }}
            >
              <Box
                component={Link}
                to="/financialtool/app/dashboard"
                onClick={() => setValue(0)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 0 ? '#6D28D9' : 'transparent',
                  color: value === 0 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  textDecoration: 'none',
                  '&:hover': {
                    bgcolor: value === 0 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <DashboardIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Dashboard</Typography>
              </Box>
              <Box
                component={Link}
                to="/financialtool/app/upload"
                onClick={() => setValue(1)}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 1 ? '#6D28D9' : 'transparent',
                  color: value === 1 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  textDecoration: 'none',
                  '&:hover': {
                    bgcolor: value === 1 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <CloudUploadIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Upload Bills</Typography>
              </Box>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/transactions');
                  setValue(2);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 2 ? '#6D28D9' : 'transparent',
                  color: value === 2 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 2 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <SwapHorizIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Transactions</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/pending');
                  setValue(3);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 3 ? '#6D28D9' : 'transparent',
                  color: value === 3 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 3 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <PendingIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Pending</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/recurring');
                  setValue(4);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 4 ? '#6D28D9' : 'transparent',
                  color: value === 4 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 4 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <RepeatIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Recurring</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/upcoming');
                  setValue(5);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 5 ? '#6D28D9' : 'transparent',
                  color: value === 5 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 5 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <ScheduleIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Upcoming</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/items');
                  setValue(6);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 6 ? '#6D28D9' : 'transparent',
                  color: value === 6 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 6 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <InventoryIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Items</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/merchants');
                  setValue(7);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 7 ? '#6D28D9' : 'transparent',
                  color: value === 7 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 7 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <StoreIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Merchants</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/categories');
                  setValue(8);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 8 ? '#6D28D9' : 'transparent',
                  color: value === 8 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 8 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <CategoryIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Categories</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/analytics');
                  setValue(9);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 9 ? '#6D28D9' : 'transparent',
                  color: value === 9 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 9 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <AnalyticsIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Analytics</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/advanced-analytics');
                  setValue(10);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 10 ? '#6D28D9' : 'transparent',
                  color: value === 10 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 10 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <BarChartIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Advanced Analytics</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/family');
                  setValue(11);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 11 ? '#6D28D9' : 'transparent',
                  color: value === 11 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 11 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <FamilyRestroomIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Family</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/budgets');
                  setValue(12);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 12 ? '#6D28D9' : 'transparent',
                  color: value === 12 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 12 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <AccountBalanceWalletOutlinedIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Budgets</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/savings');
                  setValue(13);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 13 ? '#6D28D9' : 'transparent',
                  color: value === 13 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 13 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <SavingsIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Savings</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/loans');
                  setValue(14);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 14 ? '#6D28D9' : 'transparent',
                  color: value === 14 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 14 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <CreditCardIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Loans</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/shopping-lists');
                  setValue(15);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 15 ? '#6D28D9' : 'transparent',
                  color: value === 15 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 15 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <ShoppingCartIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Shopping Lists</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/user-profile');
                  setValue(16);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 16 ? '#6D28D9' : 'transparent',
                  color: value === 16 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 16 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <PersonIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>User Profile</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/users');
                  setValue(17);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 17 ? '#6D28D9' : 'transparent',
                  color: value === 17 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 17 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <PeopleIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Users</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/alerts');
                  setValue(18);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 18 ? '#6D28D9' : 'transparent',
                  color: value === 18 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 18 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <NotificationsIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Alerts</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/ai-chat');
                  setValue(19);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 19 ? '#6D28D9' : 'transparent',
                  color: value === 19 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 19 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <ChatIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>AI Chat</Typography>
              </IconButton>
              <IconButton
                onClick={() => {
                  navigate('/financialtool/app/model-status');
                  setValue(20);
                }}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  p: 1.5,
                  borderRadius: '12px',
                  width: { lg: '56px' },
                  minWidth: { lg: '56px' },
                  height: { lg: '56px' },
                  bgcolor: value === 20 ? '#6D28D9' : 'transparent',
                  color: value === 20 ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                  '&:hover': {
                    bgcolor: value === 20 ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                  },
                }}
              >
                <MemoryIcon sx={{ fontSize: { lg: '20px' } }} />
                <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>Model Status</Typography>
              </IconButton>
            </Box>

            {/* Main Content */}
            <Box sx={{ minWidth: 0, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
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

            {/* Right Sidebar */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Account Overview */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                  bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
                  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 700,
                    mb: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    color: theme.palette.text.primary,
                  }}
                >
                  <DonutLargeIcon sx={{ color: '#6D28D9', fontSize: 18 }} />
                  Account Overview
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      User
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {userName.split('@')[0]}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Total Tx
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
                      {transactions.length}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Categories
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
                      {categories.length}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB', borderRadius: '12px' }}>
                    <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', mb: 0.5 }}>
                      Merchants
                    </Typography>
                    <Typography sx={{ fontSize: '14px', fontWeight: 700, color: theme.palette.text.primary }}>
                      {merchants.length}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Quick Actions */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                  bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
                  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Typography
                  sx={{
                    fontSize: '14px',
                    fontWeight: 700,
                    mb: 2,
                    color: theme.palette.text.primary,
                  }}
                >
                  Quick Actions
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Button
                    variant="contained"
                    onClick={handleUploadClick}
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      bgcolor: '#6D28D9',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      py: 1.5,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '14px',
                      boxShadow: '0 4px 6px rgba(109, 40, 217, 0.2)',
                      '&:hover': {
                        bgcolor: '#7C3AED',
                        boxShadow: '0 6px 8px rgba(109, 40, 217, 0.3)',
                      },
                    }}
                  >
                    Upload Bill
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => setShowManualTransactionDialog(true)}
                    startIcon={<AddIcon />}
                    sx={{
                      borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                      bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
                      color: theme.palette.text.primary,
                      py: 1.25,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB',
                      },
                    }}
                  >
                    Manual Transaction
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setChatInitialQuery('');
                      handleChatClick();
                    }}
                    startIcon={<AutoAwesomeIcon />}
                    sx={{
                      borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                      bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
                      color: theme.palette.text.primary,
                      py: 1.25,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontSize: '14px',
                      fontWeight: 500,
                      '&:hover': {
                        borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                        bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F9FAFB',
                      },
                    }}
                  >
                    Ask AI
                  </Button>
                </Box>
              </Paper>

              {/* Latest Activity */}
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                  bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
                  boxShadow: theme.palette.mode === 'dark' ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.05)',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Typography
                    sx={{
                      fontSize: '14px',
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                    }}
                  >
                    Latest Activity
                  </Typography>
                  <Button
                    size="small"
                    sx={{
                      textTransform: 'none',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: '#6D28D9',
                      minWidth: 'auto',
                      p: 0,
                      '&:hover': {
                        textDecoration: 'underline',
                        bgcolor: 'transparent',
                      },
                    }}
                    onClick={handleViewTransactions}
                  >
                    See all
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {transactions.length === 0 ? (
                    <Typography sx={{ fontSize: '14px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                      No transactions yet.
                    </Typography>
                  ) : (
                    transactions.slice(0, 2).map((transaction) => {
                      const merchantName = getMerchantName(transaction.merchant_id);
                      const transactionType = getTransactionType(transaction);
                      const isEarning = transactionType === 'earning';
                      const amount = transaction.amount || 0;
                      const currency = transaction.currency || 'USD';
                      const date = transaction.date ? new Date(transaction.date) : new Date();
                      
                      return (
                        <Box
                          key={transaction._id}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: '50%',
                                bgcolor: '#EF4444',
                              }}
                            />
                            <Box>
                              <Typography sx={{ fontSize: '12px', fontWeight: 700, color: theme.palette.text.primary, overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px' }}>
                                {merchantName}
                              </Typography>
                              <Typography sx={{ fontSize: '10px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280' }}>
                                {date.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#EF4444' }}>
                            {isEarning ? '+' : '-'}{amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                          </Typography>
                        </Box>
                      );
                    })
                  )}
                </Box>
              </Paper>
            </Box>
          </Box>
            </Box>
          </Box>

        {/* Floating Chat Button */}
        <IconButton
          onClick={() => {
            setChatInitialQuery('');
            handleChatClick();
          }}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: 48,
            height: 48,
            bgcolor: '#6D28D9',
            color: '#FFFFFF',
            boxShadow: '0 10px 15px rgba(109, 40, 217, 0.3)',
            '&:hover': {
              bgcolor: '#7C3AED',
              transform: 'scale(1.1)',
            },
            transition: 'all 0.2s',
          }}
        >
          <QuestionAnswerIcon />
        </IconButton>

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
      </Box>
    </ThemeProvider>
  );
}





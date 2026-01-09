import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { listTransactions, listMerchants, listCategories } from '../lib/api/financialApi';
import { Transaction, Merchant, Category } from '../types/financial';
import { unifiedWebSocketClient } from '../lib/api/websocket';
import { TransactionFilters } from '../components/financial/TransactionsSection';
import AIChatSection from '../components/financial/AIChatSection';
import ManualTransactionDialog from '../components/financial/ManualTransactionDialog';
import TopNavigationBar from '../components/financial/layout/TopNavigationBar';
import DashboardHeader from '../components/financial/layout/DashboardHeader';
import MainContentArea from '../components/financial/layout/MainContentArea';
import FloatingChatButton from '../components/financial/FloatingChatButton';
import InitialLoadingScreen from '../components/financial/loading/InitialLoadingScreen';
import { useAuth } from '../lib/auth';
import '../css/pages/FinancialToolApp.css';


// Path to tab index mapping
const PATH_TO_TAB: Record<string, number> = {
  'dashboard': 0,
  'upload': 1,
  'transactions': 2,
  'recurring': 3,
  'upcoming': 4,
  'items': 5,
  'merchants': 6,
  'categories': 7,
  'analytics': 8,
  'advanced-analytics': 9,
  'family': 10,
  'budgets': 11,
  'savings': 12,
  'loans': 13,
  'shopping-lists': 14,
  'user-profile': 15,
  'users': 16,
  'alerts': 17,
  'ai-chat': 18,
  'model-status': 19,
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
  const [previousPath, setPreviousPath] = useState<string>(location.pathname);

  // Update tab when URL changes and handle route transitions
  useEffect(() => {
    const tabFromPath = getTabFromPath();
    if (tabFromPath !== value) {
      setValue(tabFromPath);
    }

    // Detect route changes for loading state
    if (previousPath !== location.pathname) {
      setIsRouteTransitioning(true);
      setPreviousPath(location.pathname);
      
      // Hide loading after a short delay to allow React Router to mount the component
      // Using requestAnimationFrame to ensure the route has started rendering
      const frameId = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            setIsRouteTransitioning(false);
          }, 150);
        });
      });
      
      return () => cancelAnimationFrame(frameId);
    }
  }, [location.pathname, getTabFromPath, value, previousPath]);

  // AI chat widget (floating)
  const [showChatWidget, setShowChatWidget] = useState(false);
  const [chatInitialQuery, setChatInitialQuery] = useState<string>('');

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [loading, setLoading] = useState(true);
  const [isRouteTransitioning, setIsRouteTransitioning] = useState(false);
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
    setValue(19);
    setShowChatWidget(true);
  };


  const handleAskAIClick = () => {
    setChatInitialQuery('');
    handleChatClick();
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

  // Show initial loading screen on first load
  if (loading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <InitialLoadingScreen />
      </ThemeProvider>
    );
  }

  const { user: authUser } = useAuth();
  const displayUser = user || authUser;
  const userName = displayUser?.name || displayUser?.email || 'User';

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
        <div className="financial-tool-page" style={{ backgroundColor: theme.palette.mode === 'dark' ? '#111827' : '#F9FAFB', height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Navigation Bar */}
        <TopNavigationBar />

        {/* Dashboard Header Section */}
        <DashboardHeader
          onViewAnalytics={handleViewAnalytics}
        />

        {/* Main Content Area */}
        <MainContentArea
          value={value}
          setValue={setValue}
          transactions={transactions}
          merchants={merchants}
          categories={categories}
          userName={userName}
          getMerchantName={getMerchantName}
          getTransactionType={getTransactionType}
          onViewTransactions={handleViewTransactions}
          onViewAnalytics={handleViewAnalytics}
          onUploadClick={handleUploadClick}
          onViewBudgets={handleViewBudgets}
          onTransactionCreated={handleTransactionCreated}
          onTransactionsChange={handleTransactionsChange}
          onFiltersChange={handleFiltersChange}
          onManualTransactionClick={() => setShowManualTransactionDialog(true)}
          onAskAIClick={handleAskAIClick}
          isRouteTransitioning={isRouteTransitioning}
        />

        {/* Floating Chat Button */}
        <FloatingChatButton
          onClick={() => {
            setChatInitialQuery('');
            handleChatClick();
          }}
        />

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
      </div>
    </ThemeProvider>
  );
}





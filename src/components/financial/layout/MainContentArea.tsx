import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import LeftSidebarNavigation from './LeftSidebarNavigation';
import RightSidebar from './RightSidebar';
import SkeletonLoadingScreen from '../loading/SkeletonLoadingScreen';
import { Transaction, Merchant, Category } from '../../../types/financial';
import EnhancedBillUploadSection from '../EnhancedBillUploadSection';
import TransactionsSection, { TransactionFilters } from '../TransactionsSection';
import MerchantsSection from '../MerchantsSection';
import EnhancedCategorySection from '../EnhancedCategorySection';
import AnalyticsSection from '../AnalyticsSection';
import AdvancedAnalyticsSection from '../AdvancedAnalyticsSection';
import AIChatSection from '../AIChatSection';
import ModelStatusSection from '../ModelStatusSection';
import BudgetSection from '../BudgetSection';
import CategoryCapSection from '../CategoryCapSection';
import AlertsPanel from '../AlertsPanel';
import DashboardOverview from '../DashboardOverview';
import ItemsSection from '../ItemsSection';
import RecurringPaymentsSection from '../RecurringPaymentsSection';
import UpcomingPaymentsSection from '../UpcomingPaymentsSection';
import PendingTransactionsSection from '../PendingTransactionsSection';
import MultiUserAnalyticsSection from '../MultiUserAnalyticsSection';
import SavingsSection from '../SavingsSection';
import UserManagementSection from '../UserManagementSection';
import LoansSection from '../LoansSection';
import ShoppingListSection from '../ShoppingListSection';
import UserProfileSection from '../UserProfileSection';

interface MainContentAreaProps {
  value: number;
  setValue: (value: number) => void;
  transactions: Transaction[];
  merchants: Merchant[];
  categories: Category[];
  userName: string;
  getMerchantName: (merchantId: string | null | undefined) => string;
  getTransactionType: (transaction: Transaction) => 'expense' | 'earning';
  onViewTransactions: () => void;
  onViewAnalytics: () => void;
  onUploadClick: () => void;
  onViewBudgets: () => void;
  onTransactionCreated: () => void;
  onTransactionsChange: () => void;
  onFiltersChange: (filters: TransactionFilters) => void;
  onManualTransactionClick: () => void;
  onAskAIClick: () => void;
  isRouteTransitioning?: boolean;
}

export default function MainContentArea({
  value,
  setValue,
  transactions,
  merchants,
  categories,
  userName,
  getMerchantName,
  getTransactionType,
  onViewTransactions,
  onViewAnalytics,
  onUploadClick,
  onViewBudgets,
  onTransactionCreated,
  onTransactionsChange,
  onFiltersChange,
  onManualTransactionClick,
  onAskAIClick,
  isRouteTransitioning = false,
}: MainContentAreaProps) {
  const { theme } = useTheme();
  
  return (
    <>
      <style>{`
        .main-content-wrapper {
          padding-left: 0px;
          padding-right: 0px;
        }
        
          /* Desktop - Large screens (1400px and above) */
        /* Full layout: Left Sidebar + Main Content + Right Sidebar */
        @media (min-width: 1400px) {
          .main-layout-container {
            gap: 48px;
          }
          .left-sidebar-container {
            width: 84px;
            flex-shrink: 0;
          }
          .main-content-container {
            flex: 1;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 0;
          }
          .right-sidebar-container {
            width: 288px;
            flex-shrink: 0;
            display: flex;
          }
        }
        
        /* Desktop - Medium screens (1280px - 1399px) */
        /* Full layout with adjusted spacing */
        @media (min-width: 1280px) and (max-width: 1399px) {
          .main-layout-container {
            gap: 32px;
          }
          .left-sidebar-container {
            width: 84px;
            flex-shrink: 0;
          }
          .main-content-container {
            flex: 1;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 0;
          }
          .right-sidebar-container {
            width: 240px;
            flex-shrink: 0;
            display: flex;
          }
        }
        
        /* Desktop Small / Tablet Landscape (1200px - 1279px) */
        /* Left Sidebar + Main Content, Right Sidebar hidden - Stable at 1200px */
        @media (min-width: 1200px) and (max-width: 1279px) {
          .main-layout-container {
            flex-direction: row !important;
            gap: 24px;
          }
          .left-sidebar-container {
            width: 84px !important;
            flex-shrink: 0;
          }
          .main-content-container {
            flex: 1;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 0;
          }
          .right-sidebar-container {
            display: none !important;
            width: 0;
            overflow: hidden;
          }
        }
        
        /* Tablet Landscape (992px - 1199px) */
        /* Left Sidebar + Main Content, Right Sidebar hidden */
        @media (min-width: 992px) and (max-width: 1199px) {
          .main-layout-container {
            flex-direction: row !important;
            gap: 24px;
          }
          .left-sidebar-container {
            width: 84px !important;
            flex-shrink: 0;
          }
          .main-content-container {
            flex: 1;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 0;
          }
          .right-sidebar-container {
            display: none !important;
            width: 0;
            overflow: hidden;
          }
        }
        
        /* Tablet Portrait (768px - 991px) */
        /* Left Sidebar + Main Content, Right Sidebar hidden */
        @media (min-width: 768px) and (max-width: 991px) {
          .main-layout-container {
            flex-direction: row !important;
            gap: 16px;
          }
          .left-sidebar-container {
            width: 84px !important;
            flex-shrink: 0;
          }
          .main-content-container {
            flex: 1;
            min-width: 0;
            width: 100%;
            max-width: 100%;
            height: 100%;
            min-height: 0;
          }
          .right-sidebar-container {
            display: none !important;
          }
        }
        
        /* Mobile Landscape and Small Tablets (480px - 767px) */
        /* Stacked layout: Left Sidebar (horizontal) + Main Content */
        @media (min-width: 480px) and (max-width: 767px) {
          .main-layout-container {
            flex-direction: column !important;
            gap: 16px;
            height: 100%;
          }
          .left-sidebar-container {
            width: 100% !important;
            height: auto !important;
            order: 1;
          }
          .main-content-container {
            order: 2;
            flex: 1;
            min-height: 0;
            padding-top: 8px;
          }
          .right-sidebar-container {
            display: none !important;
          }
        }
        
        /* Mobile Portrait (below 480px) */
        /* Stacked layout with reduced spacing */
        @media (max-width: 479px) {
          .main-layout-container {
            flex-direction: column !important;
            gap: 12px;
            height: 100%;
          }
          .left-sidebar-container {
            width: 100% !important;
            height: auto !important;
            order: 1;
          }
          .main-content-container {
            order: 2;
            flex: 1;
            min-height: 0;
            padding-top: 8px;
          }
          .right-sidebar-container {
            display: none !important;
          }
        }
      `}</style>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
        }}
      >
      <div 
        className="main-content-wrapper"
        style={{ 
          maxWidth: '1600px', 
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingTop: '0px',
          paddingBottom: '0px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          width: '100%',
        }}
      >
        <div 
          className="main-layout-container"
          style={{ 
            display: 'flex',
            flexDirection: 'row',
            gap: '48px',
            flex: 1,
            overflow: 'hidden',
            minHeight: 0,
            height: '100%',
          }}
        >
          {/* Left Sidebar Navigation */}
          <div 
            className="left-sidebar-container"
            style={{ flexShrink: 0, width: '84px', height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <LeftSidebarNavigation value={value} setValue={setValue} />
          </div>

          {/* Main Content */}
          <div 
            className="main-content-container"
            style={{ 
              minWidth: 0, 
              width: '100%',
              maxWidth: '100%',
              height: '100%',
              overflow: 'auto', 
              flex: 1, 
              paddingTop: '16px',
              display: 'flex', 
              flexDirection: 'column',
              minHeight: 0,
              position: 'relative',
            }}
          >
            {/* Always render Routes so React Router can mount components */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/financialtool/app/dashboard" replace />} />
              <Route path="dashboard" element={
                <DashboardOverview
                  onViewTransactions={onViewTransactions}
                  onViewAnalytics={onViewAnalytics}
                  onUploadClick={onUploadClick}
                  onViewBudgets={onViewBudgets}
                  categories={categories as any}
                />
              } />
              <Route path="upload" element={
                <EnhancedBillUploadSection
                  onTransactionCreated={onTransactionCreated}
                  categories={categories}
                />
              } />
              <Route path="transactions" element={
                <TransactionsSection
                  transactions={transactions}
                  merchants={merchants}
                  categories={categories}
                  onTransactionsChange={onTransactionsChange}
                  onFiltersChange={onFiltersChange}
                />
              } />
              <Route path="pending" element={<PendingTransactionsSection />} />
              <Route path="recurring" element={<RecurringPaymentsSection />} />
              <Route path="upcoming" element={<UpcomingPaymentsSection />} />
              <Route path="items" element={<ItemsSection />} />
              <Route path="merchants" element={<MerchantsSection />} />
              <Route path="categories" element={<EnhancedCategorySection />} />
              <Route path="analytics" element={<AnalyticsSection />} />
              <Route path="advanced-analytics" element={<AdvancedAnalyticsSection />} />
              <Route path="family" element={<MultiUserAnalyticsSection />} />
              <Route path="budgets" element={
                <BudgetSection categories={categories} onBudgetChange={onTransactionsChange} />
              } />
              <Route path="savings" element={<SavingsSection />} />
              <Route path="loans" element={<LoansSection />} />
              <Route path="shopping-lists" element={<ShoppingListSection />} />
              <Route path="user-profile" element={<UserProfileSection />} />
              <Route path="users" element={<UserManagementSection />} />
              <Route path="alerts" element={
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <AlertsPanel />
                  <CategoryCapSection categories={categories} onCapChange={onTransactionsChange} />
                </div>
              } />
              <Route path="ai-chat" element={<AIChatSection />} />
              <Route path="model-status" element={<ModelStatusSection />} />
              <Route path="*" element={<Navigate to="/financialtool/app/dashboard" replace />} />
            </Routes>
            </div>
            
            {/* Show skeleton as overlay during route transitions */}
            {isRouteTransitioning && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: 1000,
                  bgcolor: theme.palette.mode === 'dark' ? 'rgba(17, 24, 39, 0.98)' : 'rgba(249, 250, 251, 0.98)',
                  backdropFilter: 'blur(4px)',
                  overflow: 'auto',
                }}
              >
                <SkeletonLoadingScreen />
              </Box>
            )}
          </div>

          {/* Right Sidebar */}
          <div 
            className="right-sidebar-container"
            style={{ flexShrink: 0, width: '288px', paddingTop: '10px' }}
          >
            <RightSidebar
              userName={userName}
              transactions={transactions}
              merchants={merchants}
              categories={categories}
              getMerchantName={getMerchantName}
              getTransactionType={getTransactionType}
              onUploadClick={onUploadClick}
              onManualTransactionClick={onManualTransactionClick}
              onAskAIClick={onAskAIClick}
              onViewTransactions={onViewTransactions}
            />
          </div>
        </div>
        
        {/* Footer */}
        <footer
          style={{
            backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
            color: theme.palette.mode === 'dark' ? '#ffffff' : '#111827',
            padding: '0.5rem 1.5rem',
            marginTop: 'auto',
            borderTop: theme.palette.mode === 'dark' ? '1px solid #333333' : '1px solid #e5e7eb',
            width: '100%',
            flexShrink: 0,
          }}
        >
          <div style={{
            maxWidth: '1600px',
            margin: '0 auto',
            textAlign: 'center',
          }}>
            <p style={{
              opacity: theme.palette.mode === 'dark' ? 0.8 : 0.7,
              wordWrap: 'break-word',
              overflowWrap: 'break-word',
              margin: 0,
            }}>
              &copy; 2024 VoiceScribe. Transform voice to text instantly.
            </p>
          </div>
        </footer>
      </div>
    </div>
    </>
  );
}


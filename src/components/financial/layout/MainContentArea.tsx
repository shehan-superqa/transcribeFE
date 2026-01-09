import { Box } from '@mui/material';
import { Routes, Route, Navigate } from 'react-router-dom';
import LeftSidebarNavigation from './LeftSidebarNavigation';
import RightSidebar from './RightSidebar';
import { Transaction, Merchant, Category } from '../../../types/financial';
import EnhancedBillUploadSection from '../EnhancedBillUploadSection';
import TransactionsSection, { TransactionFilters } from '../TransactionsSection';
import EnhancedMerchantsSection from '../EnhancedMerchantsSection';
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
import ManualTransactionDialog from '../ManualTransactionDialog';
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
}: MainContentAreaProps) {
  return (
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
          <LeftSidebarNavigation value={value} setValue={setValue} />

          {/* Main Content */}
          <Box sx={{ minWidth: 0, overflow: 'auto', flex: 1, display: 'flex', flexDirection: 'column' }}>
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
              <Route path="merchants" element={<EnhancedMerchantsSection />} />
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
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <AlertsPanel />
                  <CategoryCapSection categories={categories} onCapChange={onTransactionsChange} />
                </Box>
              } />
              <Route path="ai-chat" element={<AIChatSection />} />
              <Route path="model-status" element={<ModelStatusSection />} />
              <Route path="*" element={<Navigate to="/financialtool/app/dashboard" replace />} />
            </Routes>
          </Box>

          {/* Right Sidebar */}
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
        </Box>
      </Box>
    </Box>
  );
}


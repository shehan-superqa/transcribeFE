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
    <>
      <style>{`
        @media (max-width: 1200px) {
          .main-layout-container {
            flex-direction: column !important;
            height: 100%;
          }
          .left-sidebar-container {
            width: 100% !important;
            order: 1;
          }
          .main-content-container {
            order: 2;
            height: 100%;
          }
          .right-sidebar-container {
            width: 100% !important;
            order: 3;
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
        style={{ 
          maxWidth: '1600px', 
          marginLeft: 'auto',
          marginRight: 'auto',
          paddingLeft: '0px',
          paddingRight: '0px',
          paddingTop: '0px',
          paddingBottom: '0px',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
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
          }}
        >
          {/* Left Sidebar Navigation */}
          <div 
            className="left-sidebar-container"
            style={{ flexShrink: 0, width: '64px', height: '100%', display: 'flex', flexDirection: 'column' }}
          >
            <LeftSidebarNavigation value={value} setValue={setValue} />
          </div>

          {/* Main Content */}
          <div 
            className="main-content-container"
            style={{ 
              minWidth: 0, 
              overflow: 'auto', 
              flex: 1, 
              paddingTop: '10px',
              display: 'flex', 
              flexDirection: 'column' 
            }}
          >
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

          {/* Right Sidebar */}
          <div 
            className="right-sidebar-container"
            style={{ flexShrink: 0, width: '288px' }}
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
      </div>
    </div>
    </>
  );
}


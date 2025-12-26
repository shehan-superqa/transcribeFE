// Financial API Types

export interface Transaction {
  _id: string;
  user_id: string;
  merchant_id: string;
  category_id: string;
  amount: number;
  currency: string;
  date: string;
  payment_method?: string;
  bill_image_url?: string;
  ocr_text?: string;
  parsing_output?: {
    merchant: string;
    date: string;
    total: number;
    items?: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      category?: string;
    }>;
  };
  normalized_output?: {
    merchant: string;
    date: string;
    total: number;
    items?: Array<{
      name: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      category?: string;
    }>;
  };
  embedding_vector?: number[];
  duplicate_of?: string | null;
  anomaly_flag: boolean;
  anomaly_reason?: string;
  confidence_category: number;
  confidence_ocr?: number;
  confidence_parsing?: number;
  versions?: TransactionVersion[];
  status: 'confirmed' | 'pending' | 'deleted';
  created_at: string;
  updated_at: string;
}

export interface TransactionVersion {
  field: string;
  old_value: any;
  new_value: any;
  timestamp: string;
  source: 'user' | 'system';
}

export interface Merchant {
  _id: string;
  merchant_name: string;
  aliases: string[];
  merchant_category?: string;
}

export interface Category {
  _id: string;
  category_name: string;
  parent_category?: string | null;
}

export interface BillUploadResponse {
  success: boolean;
  job_id: string;
  stream_url: string;
  message: string;
}

export interface JobStatus {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  finished_at?: string;
  result?: {
    success: boolean;
    transaction_id?: string;
    merchant_id?: string;
    category_id?: string;
    amount?: number;
    confidence_category?: number;
    is_duplicate?: boolean;
    is_anomaly?: boolean;
  };
}

export interface BillStatusResponse {
  success: boolean;
  job: JobStatus;
  transaction?: Transaction;
}

export interface TransactionsListResponse {
  success: boolean;
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

export interface TransactionsListParams {
  date_from?: string;
  date_to?: string;
  category?: string;
  merchant?: string;
  limit?: number;
  offset?: number;
}

export interface UpdateTransactionRequest {
  category?: string;
  merchant?: string;
  amount?: number;
  date?: string;
}

export interface UpdateTransactionResponse {
  success: boolean;
  transaction: Transaction;
}

export interface MergeTransactionRequest {
  merge_with: string;
}

export interface MergeTransactionResponse {
  success: boolean;
  merged_transaction: Transaction;
  message: string;
}

export interface MerchantsListResponse {
  success: boolean;
  merchants: Merchant[];
}

export interface UpdateMerchantRequest {
  aliases?: string[];
  merchant_category?: string;
}

export interface CategoriesListResponse {
  success: boolean;
  categories: Category[];
}

export interface CreateCategoryRequest {
  category_name: string;
  parent_category?: string;
}

export interface SpendingSummaryResponse {
  success: boolean;
  summary: {
    total: number;
    by_category: Array<{
      category_id: string;
      category_name: string;
      amount: number;
      count: number;
      percentage: number;
    }>;
    period: string;
    transaction_count: number;
  };
}

export interface SpendingTrendsResponse {
  success: boolean;
  trends: {
    period: string;
    comparisons: Array<{
      period: string;
      current_total: number;
      previous_total: number;
      growth_rate: number;
      current_count: number;
      previous_count: number;
    }>;
    overall_growth_rate: number;
  };
}

export interface AnomaliesResponse {
  success: boolean;
  anomalies: Array<{
    _id: string;
    amount: number;
    anomaly_flag: boolean;
    anomaly_reason: string;
    merchant_name?: string;
    category_name?: string;
  }>;
  count: number;
}

export interface AIChatRequest {
  query: string;
  context?: Record<string, any>;
}

export interface AIChatResponse {
  success: boolean;
  response: string;
  data?: {
    total_spending_30_days?: number;
    transaction_count?: number;
    top_categories?: any[];
  };
  model: string;
}

export interface FeedbackRequest {
  transaction_id: string;
  field: string;
  old_value: any;
  new_value: any;
  model_version?: string;
  confidence?: number;
}

export interface ModelStatusResponse {
  success: boolean;
  model_loaded: boolean;
  model_info?: {
    model_version: string;
    accuracy: number;
    training_samples: number;
    test_samples: number;
    categories: number;
    trained_at: string;
  };
  categorization_method: string;
}

export interface ReloadModelResponse {
  success: boolean;
  message: string;
  model_version: string;
}

export interface RetrainRequest {
  days_back?: number;
  min_samples?: number;
}

export interface RetrainResponse {
  success: boolean;
  message: string;
  results?: {
    samples_collected: number;
    training_samples: number;
    test_samples: number;
    accuracy: number;
    categories: number;
    model_version: string;
  };
}

// Budget Management Types

export interface Budget {
  _id: string;
  user_id: string;
  name: string;
  category_id: string | null;
  amount: number;
  period: 'monthly' | 'yearly' | 'weekly';
  start_date: string;
  end_date: string | null;
  alert_thresholds: {
    warning: number; // percentage (0-100)
    critical: number; // percentage (0-100)
  };
  created_at: string;
  updated_at: string;
}

export interface BudgetStatus {
  budget: Budget;
  status: {
    current_spending: number;
    budget_amount: number;
    remaining: number;
    percentage_used: number;
    days_remaining: number;
    projected_spending?: number;
    projected_over_budget?: boolean;
    alert_level: 'ok' | 'warning' | 'critical' | 'exceeded';
    alerts: Array<{
      type: 'warning' | 'critical' | 'exceeded';
      message: string;
      triggered_at: string;
    }>;
    on_track: boolean;
    recommendations: string[];
  };
}

export interface CategoryCap {
  _id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  alert_at_percentage: number;
  current_spending?: number;
  remaining?: number;
  alert_triggered?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BudgetAlert {
  _id: string;
  user_id: string;
  type: 'budget_warning' | 'budget_critical' | 'budget_exceeded' | 'category_cap_warning' | 'category_cap_exceeded';
  severity: 'warning' | 'critical' | 'exceeded';
  title: string;
  message: string;
  budget_id?: string;
  category_id?: string;
  amount?: number;
  threshold?: number;
  read: boolean;
  created_at: string;
}

export interface CreateBudgetRequest {
  name: string;
  category_id?: string | null;
  amount: number;
  period: 'monthly' | 'yearly' | 'weekly';
  start_date: string;
  end_date?: string | null;
  alert_thresholds: {
    warning: number;
    critical: number;
  };
}

export interface UpdateBudgetRequest {
  name?: string;
  amount?: number;
  alert_thresholds?: {
    warning?: number;
    critical?: number;
  };
}

export interface CreateCategoryCapRequest {
  category_id: string;
  monthly_limit: number;
  alert_at_percentage: number;
}

export interface BudgetsListResponse {
  success: boolean;
  budgets: Budget[];
  total: number;
}

export interface BudgetStatusResponse {
  success: boolean;
  budget: Budget;
  status: BudgetStatus['status'];
}

export interface CategoryCapsResponse {
  success: boolean;
  caps: Array<CategoryCap & {
    category_name: string;
    current_spending: number;
    remaining: number;
    alert_triggered: boolean;
  }>;
}

export interface AlertsResponse {
  success: boolean;
  alerts: BudgetAlert[];
  unread_count: number;
}

// Transaction Item Types

export interface TransactionItem {
  _id: string;
  transaction_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  category?: string;
  created_at: string;
  updated_at: string;
}

export interface FlattenedItem {
  id: string;
  transactionId: string;
  transactionDate: Date;
  transactionAmount: number;
  transactionStatus: string;
  merchantName: string;
  categoryName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemCategory?: string;
  _id?: string;
}

export interface TransactionItemsResponse {
  success: boolean;
  items: TransactionItem[];
}

export interface ItemsListResponse {
  success: boolean;
  items: TransactionItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface ItemsListParams {
  date_from?: string;
  date_to?: string;
  category?: string;
  merchant?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionItemResponse {
  success: boolean;
  item: TransactionItem;
}

export interface UpdateItemRequest {
  name?: string;
  quantity?: number;
  unit_price?: number;
  total_price?: number;
  category?: string;
}

export interface UpdateItemResponse {
  success: boolean;
  item: TransactionItem;
}

export interface DeleteItemResponse {
  success: boolean;
  message: string;
}

// Recurring Payments Types

export interface RecurringPayment {
  _id: string;
  user_id: string;
  name: string;
  type: 'earning' | 'expense';
  amount: number;
  currency: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  custom_interval_days?: number;
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  category_id?: string;
  merchant_id?: string;
  is_variable: boolean;
  variable_amounts?: Array<{
    date: string;
    amount: number;
  }>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpcomingPayment {
  recurring_payment_id: string;
  name: string;
  type: 'earning' | 'expense';
  amount: number;
  due_date: string;
  days_until_due: number;
  category_name?: string;
  merchant_name?: string;
}

export interface UpcomingPaymentsSummary {
  total_upcoming_expenses: number;
  total_upcoming_earnings: number;
  net_upcoming: number;
  current_budget: number;
  remaining_after_upcoming: number;
  remaining_percentage: number;
  upcoming_payments: UpcomingPayment[];
}

export interface CreateRecurringPaymentRequest {
  name: string;
  type: 'earning' | 'expense';
  amount: number;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  custom_interval_days?: number;
  start_date: string;
  end_date?: string | null;
  category_id?: string;
  merchant_id?: string;
  is_variable?: boolean;
}

export interface UpdateRecurringPaymentRequest {
  name?: string;
  amount?: number;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  custom_interval_days?: number;
  end_date?: string | null;
  category_id?: string;
  merchant_id?: string;
  is_active?: boolean;
}

// Multi-User / Family Types

export interface FamilyMember {
  _id: string;
  user_id: string;
  family_group_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  avatar_url?: string;
  joined_at: string;
  status: 'active' | 'invited' | 'inactive';
}

export interface FamilyGroup {
  _id: string;
  name: string;
  owner_id: string;
  members: FamilyMember[];
  created_at: string;
  updated_at: string;
}

export interface UserFinancialSummary {
  user_id: string;
  name: string;
  email: string;
  total_earnings: number;
  total_expenses: number;
  net_balance: number;
  transaction_count: number;
  top_categories: Array<{
    category_name: string;
    amount: number;
    percentage: number;
  }>;
}

export interface FamilyAnalytics {
  family_group_id: string;
  period: string;
  total_earnings: number;
  total_expenses: number;
  net_balance: number;
  member_summaries: UserFinancialSummary[];
  top_spender: {
    user_id: string;
    name: string;
    amount: number;
  };
  top_earner: {
    user_id: string;
    name: string;
    amount: number;
  };
  category_breakdown: Array<{
    category_name: string;
    total_amount: number;
    by_user: Array<{
      user_id: string;
      name: string;
      amount: number;
    }>;
  }>;
}

export interface InviteMemberRequest {
  email: string;
  name?: string;
  role?: 'admin' | 'member';
}

export interface InviteMemberResponse {
  success: boolean;
  invitation_id: string;
  message: string;
}

export interface RemoveMemberRequest {
  user_id: string;
}

// Savings Types

export interface SavingsGoal {
  _id: string;
  family_group_id?: string;
  user_id: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline?: string;
  category?: string;
  is_shared: boolean;
  contributors: Array<{
    user_id: string;
    name: string;
    contribution_amount: number;
    contribution_percentage: number;
  }>;
  auto_save_rules?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    amount: number;
    per_user?: boolean;
  };
  status: 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

export interface SavingsContribution {
  _id: string;
  savings_goal_id: string;
  user_id: string;
  amount: number;
  note?: string;
  created_at: string;
}

export interface CreateSavingsGoalRequest {
  name: string;
  description?: string;
  target_amount: number;
  deadline?: string;
  category?: string;
  is_shared?: boolean;
  auto_save_rules?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    amount: number;
    per_user?: boolean;
  };
}

export interface UpdateSavingsGoalRequest {
  name?: string;
  description?: string;
  target_amount?: number;
  deadline?: string;
  auto_save_rules?: {
    enabled?: boolean;
    frequency?: 'daily' | 'weekly' | 'monthly';
    amount?: number;
    per_user?: boolean;
  };
  status?: 'active' | 'completed' | 'cancelled';
}

export interface AddSavingsContributionRequest {
  amount: number;
  note?: string;
}

// Loans Types

export interface Loan {
  _id: string;
  user_id: string;
  type: 'borrowed' | 'lent';
  counterparty_name: string;
  counterparty_user_id?: string;
  principal_amount: number;
  outstanding_balance: number;
  currency: string;
  interest_rate?: number;
  start_date: string;
  due_date?: string;
  repayment_schedule?: 'one-time' | 'weekly' | 'monthly' | 'custom';
  installment_amount?: number;
  description?: string;
  status: 'active' | 'paid' | 'overdue' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface LoanPayment {
  _id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  created_at: string;
}

export interface LoanSummary {
  total_borrowed: number;
  total_lent: number;
  total_borrowed_outstanding: number;
  total_lent_outstanding: number;
  active_loans_count: number;
  overdue_loans_count: number;
  loans: Loan[];
}

export interface CreateLoanRequest {
  type: 'borrowed' | 'lent';
  counterparty_name: string;
  counterparty_user_id?: string;
  principal_amount: number;
  interest_rate?: number;
  start_date: string;
  due_date?: string;
  repayment_schedule?: 'one-time' | 'weekly' | 'monthly' | 'custom';
  installment_amount?: number;
  description?: string;
}

export interface UpdateLoanRequest {
  counterparty_name?: string;
  due_date?: string;
  repayment_schedule?: 'one-time' | 'weekly' | 'monthly' | 'custom';
  installment_amount?: number;
  description?: string;
  status?: 'active' | 'paid' | 'overdue' | 'cancelled';
}

export interface AddLoanPaymentRequest {
  amount: number;
  payment_date?: string;
  note?: string;
}

// Pending Transaction Types

export interface PendingTransaction extends Transaction {
  needs_confirmation: boolean;
  transaction_type?: 'earning' | 'expense';
  editable_fields: string[];
}

export interface ConfirmTransactionRequest {
  transaction_type: 'earning' | 'expense';
  confirmed_amount?: number;
  confirmed_category?: string;
  confirmed_merchant?: string;
  confirmed_date?: string;
}

// Manual Transaction Types

export interface CreateManualTransactionRequest {
  type: 'earning' | 'expense';
  amount: number;
  merchant_name?: string;
  category_id?: string;
  date: string;
  payment_method?: string;
  note?: string;
}

export interface CreateManualTransactionResponse {
  success: boolean;
  transaction: Transaction;
  message: string;
}




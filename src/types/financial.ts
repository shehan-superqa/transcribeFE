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
    items?: any[];
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

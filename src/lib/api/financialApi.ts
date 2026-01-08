import { authenticatedFetch, handleResponse, getAccessToken, refreshAccessToken, clearAuthData } from '../api';
import {
  BillUploadResponse,
  BillStatusResponse,
  BulkUploadResponse,
  BulkUploadStatusResponse,
  ActiveBillsResponse,
  ManualTransactionRequest,
  ManualTransactionResponse,
  TransactionsListResponse,
  TransactionsListParams,
  UpdateTransactionRequest,
  UpdateTransactionResponse,
  MergeTransactionRequest,
  MergeTransactionResponse,
  MerchantsListResponse,
  UpdateMerchantRequest,
  CategoriesListResponse,
  CreateCategoryRequest,
  SpendingSummaryResponse,
  SpendingTrendsResponse,
  AnomaliesResponse,
  AIChatRequest,
  AIChatResponse,
  FeedbackRequest,
  ModelStatusResponse,
  ReloadModelResponse,
  RetrainRequest,
  RetrainResponse,
  Budget,
  BudgetStatusResponse,
  BudgetsListResponse,
  CreateBudgetRequest,
  UpdateBudgetRequest,
  CategoryCap,
  CategoryCapsResponse,
  CreateCategoryCapRequest,
  BudgetAlert,
  AlertsResponse,
  TransactionItem,
  TransactionItemsResponse,
  TransactionItemResponse,
  UpdateItemRequest,
  UpdateItemResponse,
  DeleteItemResponse,
  ItemsListResponse,
  ItemsListParams,
  FiltersResponse,
} from '../../types/financial';

const FINANCIAL_API_BASE_URL = 'http://localhost:5000';

// Bill Processing

export async function uploadBill(
  file: File,
  options?: {
    transaction_type?: 'expense' | 'earning' | 'mix';
    category_override?: string;
    merchant_override?: string;
  }
): Promise<BillUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  
  // Support transaction_type parameter (expense, earning, or mix)
  if (options?.transaction_type) {
    formData.append('transaction_type', options.transaction_type);
  }
  
  // Support category and merchant overrides
  if (options?.category_override) {
    formData.append('category_override', options.category_override);
  }
  if (options?.merchant_override) {
    formData.append('merchant_override', options.merchant_override);
  }
  
  // Legacy support (for backward compatibility)
  if (options?.category_override && !formData.has('category_override')) {
    formData.append('category', options.category_override);
  }
  if (options?.merchant_override && !formData.has('merchant_override')) {
    formData.append('merchant', options.merchant_override);
  }

  let token = getAccessToken();
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  // Don't set Content-Type for FormData - browser will set it with boundary

  let response = await fetch(`${FINANCIAL_API_BASE_URL}/api/financial/bills`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Handle 401 and retry with token refresh
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${FINANCIAL_API_BASE_URL}/api/financial/bills`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      clearAuthData();
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  return handleResponse<BillUploadResponse>(response);
}

export async function getBillStatus(billId: string): Promise<BillStatusResponse> {
  const response = await authenticatedFetch(
    `/api/financial/bills/${billId}`,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<BillStatusResponse>(response);
}

export async function getActiveBills(): Promise<ActiveBillsResponse> {
  const response = await authenticatedFetch(
    '/api/financial/bills/active',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ActiveBillsResponse>(response);
}

// Bulk Upload
export async function uploadBillsBulk(
  files: File[],
  options?: {
    transaction_type?: 'expense' | 'earning' | 'mix';
    category_override?: string;
    merchant_override?: string;
  }
): Promise<BulkUploadResponse> {
  const formData = new FormData();
  
  // Append all files
  files.forEach((file) => {
    formData.append('files[]', file);
  });
  
  // Add transaction type and overrides
  if (options?.transaction_type) {
    formData.append('transaction_type', options.transaction_type);
  }
  if (options?.category_override) {
    formData.append('category_override', options.category_override);
  }
  if (options?.merchant_override) {
    formData.append('merchant_override', options.merchant_override);
  }

  let token = getAccessToken();
  
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${FINANCIAL_API_BASE_URL}/api/financial/bills/bulk`, {
    method: 'POST',
    headers,
    body: formData,
  });

  // Handle 401 and retry with token refresh
  if (response.status === 401 && token) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${FINANCIAL_API_BASE_URL}/api/financial/bills/bulk`, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else {
      clearAuthData();
      throw new Error('Authentication failed. Please log in again.');
    }
  }

  return handleResponse<BulkUploadResponse>(response);
}

export async function getBulkUploadStatus(batchJobId: string): Promise<BulkUploadStatusResponse> {
  const response = await authenticatedFetch(
    `/api/financial/bills/bulk/${batchJobId}`,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<BulkUploadStatusResponse>(response);
}

// Manual Transaction Entry
export async function createManualTransaction(
  request: ManualTransactionRequest
): Promise<ManualTransactionResponse> {
  const response = await authenticatedFetch(
    '/api/financial/transactions/manual',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ManualTransactionResponse>(response);
}

// Get Filter Initial Data
/**
 * Fetch initial filter options (categories, merchants, date ranges, etc.)
 * to populate filter dropdowns/selectors in the frontend.
 */
export async function getFilters(): Promise<FiltersResponse> {
  const response = await authenticatedFetch(
    '/api/financial/bills/filters',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<FiltersResponse>(response);
}

export async function listTransactions(
  params?: TransactionsListParams
): Promise<TransactionsListResponse> {
  const queryParams = new URLSearchParams();
  
  // Sorting parameters
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);
  
  // Filter parameters
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.merchant) queryParams.append('merchant', params.merchant);
  if (params?.transaction_type) queryParams.append('transaction_type', params.transaction_type);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.amount_min !== undefined) queryParams.append('amount_min', params.amount_min.toString());
  if (params?.amount_max !== undefined) queryParams.append('amount_max', params.amount_max.toString());
  
  // Pagination parameters
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/bills${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<TransactionsListResponse>(response);
}

/**
 * Get expenses with optional filters
 * Supports: date_from, date_to, category, merchant, limit, offset, sort_by, sort_order
 */
export async function getExpenses(
  params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    merchant?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'date' | 'scanned_date';
    sort_order?: 'asc' | 'desc';
  }
): Promise<TransactionsListResponse> {
  const queryParams = new URLSearchParams();
  
  // Filter parameters
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.merchant) queryParams.append('merchant', params.merchant);
  
  // Pagination parameters
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
  
  // Sorting parameters
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/expenses${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<TransactionsListResponse>(response);
}

/**
 * Get earnings with optional filters
 * Supports: date_from, date_to, category, merchant, limit, offset, sort_by, sort_order
 */
export async function getEarnings(
  params?: {
    date_from?: string;
    date_to?: string;
    category?: string;
    merchant?: string;
    limit?: number;
    offset?: number;
    sort_by?: 'date' | 'scanned_date';
    sort_order?: 'asc' | 'desc';
  }
): Promise<TransactionsListResponse> {
  const queryParams = new URLSearchParams();
  
  // Filter parameters
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.merchant) queryParams.append('merchant', params.merchant);
  
  // Pagination parameters
  if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
  if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
  
  // Sorting parameters
  if (params?.sort_by) queryParams.append('sort_by', params.sort_by);
  if (params?.sort_order) queryParams.append('sort_order', params.sort_order);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/earnings${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<TransactionsListResponse>(response);
}

// Transaction Management

export async function updateTransaction(
  transactionId: string,
  updates: UpdateTransactionRequest
): Promise<UpdateTransactionResponse> {
  const response = await authenticatedFetch(
    `/api/financial/transactions/${transactionId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<UpdateTransactionResponse>(response);
}

export async function deleteTransaction(transactionId: string): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(
    `/api/financial/transactions/${transactionId}`,
    { method: 'DELETE' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; message: string }>(response);
}

export async function mergeTransaction(
  transactionId: string,
  mergeData: MergeTransactionRequest
): Promise<MergeTransactionResponse> {
  const response = await authenticatedFetch(
    `/api/financial/transactions/${transactionId}/merge`,
    {
      method: 'POST',
      body: JSON.stringify(mergeData),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<MergeTransactionResponse>(response);
}

// Merchants

export async function listMerchants(): Promise<MerchantsListResponse> {
  const response = await authenticatedFetch(
    '/api/financial/merchants',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<MerchantsListResponse>(response);
}

export async function updateMerchant(
  merchantId: string,
  updates: UpdateMerchantRequest
): Promise<{ success: boolean; merchant: any }> {
  const response = await authenticatedFetch(
    `/api/financial/merchants/${merchantId}`,
    {
      method: 'PUT',
      body: JSON.stringify(updates),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; merchant: any }>(response);
}

// Categories

export async function listCategories(): Promise<CategoriesListResponse> {
  const response = await authenticatedFetch(
    '/api/financial/categories',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<CategoriesListResponse>(response);
}

export async function createCategory(
  categoryData: CreateCategoryRequest
): Promise<{ success: boolean; category: any }> {
  const response = await authenticatedFetch(
    '/api/financial/categories',
    {
      method: 'POST',
      body: JSON.stringify(categoryData),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; category: any }>(response);
}

// Analytics

export async function getSpendingSummary(params?: {
  period?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date_from?: string;
  date_to?: string;
}): Promise<SpendingSummaryResponse> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/analytics/summary${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<SpendingSummaryResponse>(response);
}

export async function getSpendingTrends(params?: {
  period?: 'monthly' | 'yearly';
  months_back?: number;
}): Promise<SpendingTrendsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.period) queryParams.append('period', params.period);
  if (params?.months_back) queryParams.append('months_back', params.months_back.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/analytics/trends${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<SpendingTrendsResponse>(response);
}

export async function getAnomalies(params?: { limit?: number }): Promise<AnomaliesResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/analytics/anomalies${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<AnomaliesResponse>(response);
}

// AI Features

export async function sendAIChat(request: AIChatRequest): Promise<AIChatResponse> {
  const response = await authenticatedFetch(
    '/api/financial/chat',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<AIChatResponse>(response);
}

export async function submitFeedback(feedback: FeedbackRequest): Promise<{ success: boolean }> {
  const response = await authenticatedFetch(
    '/api/financial/feedback',
    {
      method: 'POST',
      body: JSON.stringify(feedback),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean }>(response);
}

// Model Management

export async function getModelStatus(): Promise<ModelStatusResponse> {
  const response = await authenticatedFetch(
    '/api/financial/model/status',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ModelStatusResponse>(response);
}

export async function reloadModel(): Promise<ReloadModelResponse> {
  const response = await authenticatedFetch(
    '/api/financial/model/reload',
    { method: 'POST' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ReloadModelResponse>(response);
}

export async function triggerRetraining(
  params?: RetrainRequest
): Promise<RetrainResponse> {
  const response = await authenticatedFetch(
    '/api/financial/retrain',
    {
      method: 'POST',
      body: JSON.stringify(params || {}),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<RetrainResponse>(response);
}

// Budget Management

export async function createBudget(request: CreateBudgetRequest): Promise<{ success: boolean; budget: Budget }> {
  const response = await authenticatedFetch(
    '/api/financial/budgets',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; budget: Budget }>(response);
}

export async function listBudgets(params?: {
  active_only?: boolean;
  category_id?: string;
}): Promise<BudgetsListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.active_only) queryParams.append('active_only', 'true');
  if (params?.category_id) queryParams.append('category_id', params.category_id);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/budgets${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<BudgetsListResponse>(response);
}

export async function getBudgetStatus(budgetId: string): Promise<BudgetStatusResponse> {
  const response = await authenticatedFetch(
    `/api/financial/budgets/${budgetId}/status`,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<BudgetStatusResponse>(response);
}

export async function updateBudget(
  budgetId: string,
  request: UpdateBudgetRequest
): Promise<{ success: boolean; budget: Budget }> {
  const response = await authenticatedFetch(
    `/api/financial/budgets/${budgetId}`,
    {
      method: 'PUT',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; budget: Budget }>(response);
}

export async function deleteBudget(budgetId: string): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(
    `/api/financial/budgets/${budgetId}`,
    { method: 'DELETE' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; message: string }>(response);
}

// Category Spending Caps

export async function createCategoryCap(request: CreateCategoryCapRequest): Promise<{ success: boolean; cap: CategoryCap }> {
  const response = await authenticatedFetch(
    '/api/financial/budgets/category-caps',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; cap: CategoryCap }>(response);
}

export async function getCategoryCaps(): Promise<CategoryCapsResponse> {
  const response = await authenticatedFetch(
    '/api/financial/budgets/category-caps',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<CategoryCapsResponse>(response);
}

// Alerts

export async function getAlerts(params?: {
  unread_only?: boolean;
  severity?: 'warning' | 'critical' | 'exceeded';
}): Promise<AlertsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.unread_only) queryParams.append('unread_only', 'true');
  if (params?.severity) queryParams.append('severity', params.severity);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/budgets/alerts${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<AlertsResponse>(response);
}

export async function markAlertRead(alertId: string): Promise<{ success: boolean; alert: BudgetAlert }> {
  const response = await authenticatedFetch(
    `/api/financial/budgets/alerts/${alertId}/read`,
    { method: 'PUT' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; alert: BudgetAlert }>(response);
}

export async function markAllAlertsRead(): Promise<{ success: boolean; updated_count: number }> {
  const response = await authenticatedFetch(
    '/api/financial/budgets/alerts/read-all',
    { method: 'PUT' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; updated_count: number }>(response);
}

// Real-time Budget Updates (SSE Stream)

export function subscribeToBudgetUpdates(
  onUpdate: (data: { event: string; budgets?: BudgetStatusResponse[]; alert?: BudgetAlert }) => void,
  onError?: (error: Error) => void
): () => void {
  let eventSource: EventSource | null = null;

  try {
    const token = getAccessToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Note: EventSource doesn't support custom headers, so we may need to use a different approach
    // For now, we'll use a query parameter or implement WebSocket alternative
    const url = `${FINANCIAL_API_BASE_URL}/api/financial/budgets/status-stream?token=${encodeURIComponent(token)}`;
    
    eventSource = new EventSource(url);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onUpdate(data);
      } catch (error) {
        console.error('Failed to parse SSE message:', error);
        onError?.(error as Error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error);
      onError?.(new Error('Failed to connect to budget updates stream'));
      eventSource?.close();
    };

    // Return cleanup function
    return () => {
      if (eventSource) {
        eventSource.close();
        eventSource = null;
      }
    };
      } catch (error) {
    onError?.(error as Error);
    return () => {}; // Return no-op cleanup function
  }
}

// Transaction Items

/**
 * Get all items with optional filters
 */
export async function listItems(
  params?: ItemsListParams
): Promise<ItemsListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.merchant) queryParams.append('merchant', params.merchant);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/items${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ItemsListResponse>(response);
}

/**
 * Get all items for a transaction
 */
export async function getTransactionItems(transactionId: string): Promise<TransactionItemsResponse> {
  const response = await authenticatedFetch(
    `/api/financial/transactions/${transactionId}/items`,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );

  // Backend responses have varied between { items: [...] } and { transactions: [...] }.
  // Normalize into the frontend shape { success, items }.
  const data = await handleResponse<any>(response);
  const items = (data?.items || data?.transactions || data?.transaction_items || []) as TransactionItem[];
  return {
    success: Boolean(data?.success ?? true),
    items,
  };
}

/**
 * Get a single item by ID
 */
export async function getItem(itemId: string): Promise<TransactionItemResponse> {
  const response = await authenticatedFetch(
    `/api/financial/items/${itemId}`,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<TransactionItemResponse>(response);
}

/**
 * Update an item
 */
export async function updateItem(
  itemId: string,
  data: UpdateItemRequest
): Promise<UpdateItemResponse> {
  const response = await authenticatedFetch(
    `/api/financial/items/${itemId}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    }
    ,
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<UpdateItemResponse>(response);
}

/**
 * Delete an item
 */
export async function deleteItem(itemId: string): Promise<DeleteItemResponse> {
  const response = await authenticatedFetch(
    `/api/financial/items/${itemId}`,
    {
      method: 'DELETE',
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<DeleteItemResponse>(response);
}





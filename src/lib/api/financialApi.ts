import { authenticatedFetch, handleResponse, getAccessToken, refreshAccessToken, clearAuthData } from '../api';
import {
  BillUploadResponse,
  BillStatusResponse,
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
} from '../../types/financial';

const FINANCIAL_API_BASE_URL = 'http://localhost:5000';

// Bill Processing

export async function uploadBill(
  file: File,
  category?: string,
  merchant?: string
): Promise<BillUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  if (category) formData.append('category', category);
  if (merchant) formData.append('merchant', merchant);

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

export async function listTransactions(
  params?: TransactionsListParams
): Promise<TransactionsListResponse> {
  const queryParams = new URLSearchParams();
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.merchant) queryParams.append('merchant', params.merchant);
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

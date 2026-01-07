# Frontend Integration Plan for Financial API Features

**Date:** Generated during verification  
**Purpose:** Detailed plan for integrating missing frontend features with backend endpoints

---

## Overview

This plan provides step-by-step instructions for integrating the 5 missing frontend features identified during verification. Each section includes:
- Required API client functions
- TypeScript type definitions
- UI component specifications
- Integration steps

---

## Priority 1: Forecasting (#5) - Monthly Anxiety Reduction

### Backend Endpoint
- `GET /api/financial/analytics/forecast`

### Implementation Steps

#### 1. Add TypeScript Types (`src/types/financial.ts`)

```typescript
export interface ForecastResponse {
  success: boolean;
  forecast: {
    spending_forecast: {
      period: string; // e.g., "next_30_days"
      predicted_total: number;
      confidence_range: {
        low: number;
        high: number;
      };
      by_category?: Array<{
        category_id: string;
        category_name: string;
        predicted_amount: number;
      }>;
    };
    balance_forecast?: {
      current_balance: number;
      predicted_balance: number;
      date: string;
    };
    on_track?: {
      status: 'on_track' | 'over_budget' | 'under_budget';
      message: string;
      projected_savings?: number;
    };
  };
}
```

#### 2. Add API Client Function (`src/lib/api/financialApi.ts`)

```typescript
export async function getForecast(params?: {
  days_ahead?: number;
  include_balance?: boolean;
}): Promise<ForecastResponse> {
  const queryParams = new URLSearchParams();
  if (params?.days_ahead) queryParams.append('days_ahead', params.days_ahead.toString());
  if (params?.include_balance) queryParams.append('include_balance', 'true');

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/analytics/forecast${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ForecastResponse>(response);
}
```

#### 3. Create Forecast Component (`src/components/financial/ForecastSection.tsx`)

**Features:**
- Display spending forecast for next 30 days
- Show balance projection if available
- "On track" status indicator with color coding
- Confidence range visualization
- Category breakdown chart

**UI Elements:**
- Card with "On Track" / "Over Budget" / "Under Budget" badge
- Forecast amount with confidence range
- Line chart showing predicted spending trend
- Category breakdown pie chart
- Balance projection card (if available)

---

## Priority 2: Waste Detection (#6) - Subscription Management

### Backend Endpoints
- `GET /api/financial/recurring/waste`
- `POST /api/financial/recurring/<id>/mark-unused`

### Implementation Steps

#### 1. Add TypeScript Types (`src/types/financial.ts`)

```typescript
export interface Subscription {
  _id: string;
  user_id: string;
  merchant_id: string;
  merchant_name: string;
  category_id: string;
  category_name: string;
  amount: number;
  frequency: 'monthly' | 'yearly' | 'weekly';
  last_transaction_date: string;
  transaction_count: number;
  is_unused?: boolean;
  unused_since?: string;
  waste_score?: number; // 0-100, higher = more likely waste
}

export interface RecurringWasteResponse {
  success: boolean;
  subscriptions: Subscription[];
  total_monthly_cost: number;
  potential_savings: number;
  waste_alerts: Array<{
    subscription_id: string;
    reason: string;
    suggested_action: string;
  }>;
}
```

#### 2. Add API Client Functions (`src/lib/api/financialApi.ts`)

```typescript
export async function getRecurringWaste(): Promise<RecurringWasteResponse> {
  const response = await authenticatedFetch(
    '/api/financial/recurring/waste',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<RecurringWasteResponse>(response);
}

export async function markSubscriptionUnused(
  subscriptionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(
    `/api/financial/recurring/${subscriptionId}/mark-unused`,
    { method: 'POST' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; message: string }>(response);
}
```

#### 3. Create Subscription Component (`src/components/financial/SubscriptionSection.tsx`)

**Features:**
- List all recurring subscriptions
- Highlight unused/wasteful subscriptions
- Show potential savings
- Mark subscriptions as unused
- Filter by waste score

**UI Elements:**
- Table/list of subscriptions with:
  - Merchant name
  - Amount and frequency
  - Last transaction date
  - Waste score indicator (color-coded)
  - "Mark as Unused" button
- Summary card showing:
  - Total monthly cost
  - Potential savings
  - Number of unused subscriptions
- Waste alerts section with actionable recommendations

---

## Priority 3: Memory Features (#7) - Financial History & Habits

### Backend Endpoints
- `GET /api/financial/memory/last-spending`
- `GET /api/financial/memory/similar-transactions`
- `GET /api/financial/memory/habits`
- `GET /api/financial/memory/compare`

### Implementation Steps

#### 1. Add TypeScript Types (`src/types/financial.ts`)

```typescript
export interface LastSpendingResponse {
  success: boolean;
  last_spending: {
    amount: number;
    date: string;
    merchant_name: string;
    category_name: string;
    similar_amounts: Array<{
      amount: number;
      date: string;
      merchant_name: string;
    }>;
  };
}

export interface SimilarTransactionsResponse {
  success: boolean;
  similar_transactions: Transaction[];
  similarity_score: number;
  search_criteria: {
    amount?: number;
    merchant?: string;
    category?: string;
  };
}

export interface SpendingHabitsResponse {
  success: boolean;
  habits: Array<{
    pattern: string; // e.g., "Spends Rs. 2000-3000 at Keells every Friday"
    frequency: 'daily' | 'weekly' | 'monthly';
    confidence: number;
    examples: Transaction[];
  }>;
}

export interface PeriodCompareResponse {
  success: boolean;
  comparison: {
    period1: {
      label: string;
      total: number;
      transaction_count: number;
      by_category: Array<{
        category_name: string;
        amount: number;
      }>;
    };
    period2: {
      label: string;
      total: number;
      transaction_count: number;
      by_category: Array<{
        category_name: string;
        amount: number;
      }>;
    };
    differences: Array<{
      category_name: string;
      change_amount: number;
      change_percentage: number;
    }>;
  };
}
```

#### 2. Add API Client Functions (`src/lib/api/financialApi.ts`)

```typescript
export async function getLastSpending(params?: {
  merchant?: string;
  category?: string;
  amount?: number;
}): Promise<LastSpendingResponse> {
  const queryParams = new URLSearchParams();
  if (params?.merchant) queryParams.append('merchant', params.merchant);
  if (params?.category) queryParams.append('category', params.category);
  if (params?.amount) queryParams.append('amount', params.amount.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/memory/last-spending${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<LastSpendingResponse>(response);
}

export async function getSimilarTransactions(params: {
  amount?: number;
  merchant?: string;
  category?: string;
  limit?: number;
}): Promise<SimilarTransactionsResponse> {
  const queryParams = new URLSearchParams();
  if (params.amount) queryParams.append('amount', params.amount.toString());
  if (params.merchant) queryParams.append('merchant', params.merchant);
  if (params.category) queryParams.append('category', params.category);
  if (params.limit) queryParams.append('limit', params.limit.toString());

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/memory/similar-transactions${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<SimilarTransactionsResponse>(response);
}

export async function getSpendingHabits(): Promise<SpendingHabitsResponse> {
  const response = await authenticatedFetch(
    '/api/financial/memory/habits',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<SpendingHabitsResponse>(response);
}

export async function comparePeriods(params: {
  period1_start: string;
  period1_end: string;
  period2_start: string;
  period2_end: string;
}): Promise<PeriodCompareResponse> {
  const queryParams = new URLSearchParams();
  queryParams.append('period1_start', params.period1_start);
  queryParams.append('period1_end', params.period1_end);
  queryParams.append('period2_start', params.period2_start);
  queryParams.append('period2_end', params.period2_end);

  const endpoint = `/api/financial/memory/compare?${queryParams.toString()}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<PeriodCompareResponse>(response);
}
```

#### 3. Create Memory Component (`src/components/financial/MemorySection.tsx`)

**Features:**
- Search history by amount, merchant, or category
- Show "Last time you spent this much was..."
- Display similar transactions
- Show spending habits/patterns
- Compare two time periods

**UI Elements:**
- Search bar for history queries
- "Last Spending" card showing recent similar transactions
- Similar transactions list/grid
- Habits visualization (timeline or pattern cards)
- Period comparison tool with:
  - Date range selectors for two periods
  - Side-by-side comparison
  - Category difference highlights

---

## Priority 4: Decision Support (#8) - Affordability & Recommendations

### Backend Endpoints
- `POST /api/financial/decisions/affordability`
- `POST /api/financial/decisions/recommendations`
- `POST /api/financial/decisions/analyze-cut`
- `GET /api/financial/insights`

### Implementation Steps

#### 1. Add TypeScript Types (`src/types/financial.ts`)

```typescript
export interface AffordabilityRequest {
  amount: number;
  category?: string;
  description?: string;
}

export interface AffordabilityResponse {
  success: boolean;
  affordable: boolean;
  analysis: {
    current_balance?: number;
    projected_balance: number;
    monthly_income?: number;
    monthly_expenses: number;
    remaining_budget: number;
    risk_level: 'low' | 'medium' | 'high';
    recommendation: string;
    factors: Array<{
      factor: string;
      impact: 'positive' | 'negative' | 'neutral';
      explanation: string;
    }>;
  };
}

export interface RecommendationsResponse {
  success: boolean;
  recommendations: Array<{
    type: 'reduce_spending' | 'increase_savings' | 'optimize_category' | 'cancel_subscription';
    priority: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    potential_savings?: number;
    action_items: string[];
  }>;
}

export interface ExpenseCutAnalysisRequest {
  category_id?: string;
  merchant_id?: string;
  amount_reduction?: number;
  percentage_reduction?: number;
}

export interface ExpenseCutAnalysisResponse {
  success: boolean;
  analysis: {
    current_spending: number;
    proposed_spending: number;
    savings: number;
    impact: {
      monthly_savings: number;
      yearly_savings: number;
      balance_improvement: number;
    };
    feasibility: 'high' | 'medium' | 'low';
    recommendations: string[];
  };
}

export interface InsightsResponse {
  success: boolean;
  insights: Array<{
    type: 'spending_pattern' | 'anomaly' | 'opportunity' | 'warning';
    title: string;
    description: string;
    data?: any;
    actionable: boolean;
    action_items?: string[];
  }>;
}
```

#### 2. Add API Client Functions (`src/lib/api/financialApi.ts`)

```typescript
export async function checkAffordability(
  request: AffordabilityRequest
): Promise<AffordabilityResponse> {
  const response = await authenticatedFetch(
    '/api/financial/decisions/affordability',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<AffordabilityResponse>(response);
}

export async function getRecommendations(params?: {
  limit?: number;
  priority?: 'high' | 'medium' | 'low' | 'all';
}): Promise<RecommendationsResponse> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.priority) queryParams.append('priority', params.priority);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/decisions/recommendations${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<RecommendationsResponse>(response);
}

export async function analyzeExpenseCut(
  request: ExpenseCutAnalysisRequest
): Promise<ExpenseCutAnalysisResponse> {
  const response = await authenticatedFetch(
    '/api/financial/decisions/analyze-cut',
    {
      method: 'POST',
      body: JSON.stringify(request),
    },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<ExpenseCutAnalysisResponse>(response);
}

export async function getInsights(): Promise<InsightsResponse> {
  const response = await authenticatedFetch(
    '/api/financial/insights',
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<InsightsResponse>(response);
}
```

#### 3. Create Decision Support Component (`src/components/financial/DecisionSupportSection.tsx`)

**Features:**
- Affordability checker (input amount, get analysis)
- Recommendations widget (actionable suggestions)
- Expense cut analyzer (see impact of reducing spending)
- Insights dashboard (spending patterns, opportunities)

**UI Elements:**
- **Affordability Checker:**
  - Input form (amount, optional category/description)
  - Results card with:
    - Yes/No indicator
    - Risk level badge
    - Projected balance
    - Factors list
    - Recommendation text

- **Recommendations Widget:**
  - List of recommendations sorted by priority
  - Each card shows:
    - Priority badge
    - Title and description
    - Potential savings
    - Action items checklist

- **Expense Cut Analyzer:**
  - Form to select category/merchant and reduction amount
  - Results showing:
    - Current vs proposed spending
    - Savings breakdown (monthly/yearly)
    - Feasibility indicator
    - Recommendations

- **Insights Dashboard:**
  - Grid of insight cards
  - Color-coded by type (pattern, anomaly, opportunity, warning)
  - Actionable insights highlighted

---

## Priority 5: Privacy & Export (#9) - Data Ownership

### Backend Endpoints
- `GET /api/financial/data/export`
- `DELETE /api/financial/transactions/<id>/hard-delete`
- `DELETE /api/financial/data`

### Implementation Steps

#### 1. Add TypeScript Types (`src/types/financial.ts`)

```typescript
export interface DataExportResponse {
  success: boolean;
  export_url?: string;
  export_data?: {
    transactions: Transaction[];
    merchants: Merchant[];
    categories: Category[];
    metadata: {
      export_date: string;
      total_transactions: number;
      date_range: {
        start: string;
        end: string;
      };
    };
  };
  format: 'json' | 'csv';
}
```

#### 2. Add API Client Functions (`src/lib/api/financialApi.ts`)

```typescript
export async function exportAllData(params?: {
  format?: 'json' | 'csv';
  date_from?: string;
  date_to?: string;
}): Promise<DataExportResponse> {
  const queryParams = new URLSearchParams();
  if (params?.format) queryParams.append('format', params.format);
  if (params?.date_from) queryParams.append('date_from', params.date_from);
  if (params?.date_to) queryParams.append('date_to', params.date_to);

  const queryString = queryParams.toString();
  const endpoint = `/api/financial/data/export${queryString ? `?${queryString}` : ''}`;

  const response = await authenticatedFetch(
    endpoint,
    { method: 'GET' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<DataExportResponse>(response);
}

export async function hardDeleteTransaction(
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  const response = await authenticatedFetch(
    `/api/financial/transactions/${transactionId}/hard-delete`,
    { method: 'DELETE' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; message: string }>(response);
}

export async function deleteAllFinancialData(): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await authenticatedFetch(
    '/api/financial/data',
    { method: 'DELETE' },
    true,
    FINANCIAL_API_BASE_URL
  );
  return handleResponse<{ success: boolean; message: string }>(response);
}
```

#### 3. Create Privacy Components

**A. Data Export Component (`src/components/financial/DataExportSection.tsx`)**

**Features:**
- Export all data in JSON or CSV format
- Date range selector
- Download button
- Preview of export data structure

**UI Elements:**
- Format selector (JSON/CSV)
- Date range picker
- Export button
- Download link/button when ready
- Preview section showing data structure

**B. Privacy Settings Page (`src/pages/FinancialPrivacySettings.tsx`)**

**Features:**
- Data export section
- Hard delete transaction option
- Delete all data option (with confirmation)
- Privacy policy link
- Data retention information

**UI Elements:**
- Export section (reuse DataExportSection)
- Transaction hard delete:
  - Transaction selector/search
  - Confirmation dialog
  - Success/error feedback
- Delete all data:
  - Warning banner
  - Confirmation dialog with:
    - Checkbox: "I understand this cannot be undone"
    - Password confirmation (if required)
  - Success message

---

## Integration Checklist

### Phase 1: Types & API Functions
- [ ] Add all TypeScript types to `src/types/financial.ts`
- [ ] Add all API client functions to `src/lib/api/financialApi.ts`
- [ ] Test API functions with backend (if available)
- [ ] Update imports in components that use these functions

### Phase 2: Core Components
- [ ] Create `ForecastSection.tsx`
- [ ] Create `SubscriptionSection.tsx`
- [ ] Create `MemorySection.tsx`
- [ ] Create `DecisionSupportSection.tsx`
- [ ] Create `DataExportSection.tsx`
- [ ] Create `FinancialPrivacySettings.tsx`

### Phase 3: Integration
- [ ] Add ForecastSection to FinancialToolApp
- [ ] Add SubscriptionSection to FinancialToolApp
- [ ] Add MemorySection to FinancialToolApp
- [ ] Add DecisionSupportSection to FinancialToolApp
- [ ] Add DataExportSection to FinancialToolApp
- [ ] Add route for FinancialPrivacySettings page
- [ ] Update navigation to include new features

### Phase 4: Polish
- [ ] Add loading states to all components
- [ ] Add error handling
- [ ] Add empty states
- [ ] Add tooltips and help text
- [ ] Test all features end-to-end
- [ ] Update documentation

---

## Testing Strategy

### Unit Tests
- Test API client functions with mock responses
- Test component rendering with mock data
- Test form validation

### Integration Tests
- Test API calls with real backend (if available)
- Test component interactions
- Test error scenarios

### User Acceptance Tests
- Test each feature with real user data
- Verify UI/UX matches requirements
- Test on different screen sizes

---

## Notes

1. **Error Handling:** All API calls should have try-catch blocks with user-friendly error messages
2. **Loading States:** Show loading indicators during API calls
3. **Empty States:** Handle cases where no data is returned
4. **Responsive Design:** Ensure all components work on mobile devices
5. **Accessibility:** Follow WCAG guidelines for all new components
6. **Performance:** Consider pagination for large data sets
7. **Caching:** Consider caching forecast and insights data

---

**Plan Status:** Ready for implementation  
**Estimated Effort:** 
- Types & API Functions: 2-3 hours
- Core Components: 8-12 hours
- Integration: 2-3 hours
- Polish: 3-4 hours
- **Total: 15-22 hours**












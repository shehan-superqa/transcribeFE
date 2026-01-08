# Budget Management Frontend Integration Guide

**Version:** 1.0  
**Last Updated:** Generated during implementation  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [API Reference](#api-reference)
4. [TypeScript Types](#typescript-types)
5. [Component Usage](#component-usage)
6. [Real-time Updates](#real-time-updates)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

Budget management features allow users to:
- Create and manage budgets for overall spending or specific categories
- Set spending caps per category
- Receive alerts when approaching or exceeding limits
- Track budget status in real-time
- Get spending projections and recommendations

### Key Features

- **Budget Creation**: Set monthly, weekly, or yearly budgets
- **Category Caps**: Limit spending per category
- **Alert System**: Get warnings at 80% and critical alerts at 95%
- **Real-time Updates**: SSE stream for live budget status
- **Projections**: Forecast future spending based on trends

---

## Quick Start

### 1. Import Required Types and Functions

```typescript
import {
  Budget,
  BudgetStatusResponse,
  CreateBudgetRequest,
  CategoryCap,
  BudgetAlert,
  getAlerts,
  listBudgets,
  createBudget,
  getBudgetStatus,
} from '../lib/api/financialApi';
```

### 2. Create Your First Budget

```typescript
const handleCreateBudget = async () => {
  try {
    const budgetData: CreateBudgetRequest = {
      name: 'Monthly Groceries',
      category_id: 'cat123', // or null for overall budget
      amount: 5000.00,
      period: 'monthly',
      start_date: new Date().toISOString(),
      alert_thresholds: {
        warning: 80,  // Alert at 80%
        critical: 95,  // Critical alert at 95%
      },
    };

    const response = await createBudget(budgetData);
    if (response.success) {
      console.log('Budget created:', response.budget);
    }
  } catch (error) {
    console.error('Failed to create budget:', error);
  }
};
```

### 3. Display Budget Status

```typescript
const BudgetComponent = () => {
  const [budgetStatus, setBudgetStatus] = useState<BudgetStatusResponse | null>(null);

  useEffect(() => {
    loadBudgetStatus();
  }, []);

  const loadBudgetStatus = async () => {
    const response = await getBudgetStatus('budget_id_here');
    if (response.success) {
      setBudgetStatus(response);
    }
  };

  if (!budgetStatus) return <div>Loading...</div>;

  return (
    <div>
      <h3>{budgetStatus.budget.name}</h3>
      <p>Spent: Rs. {budgetStatus.status.current_spending}</p>
      <p>Budget: Rs. {budgetStatus.budget.amount}</p>
      <p>Status: {budgetStatus.status.alert_level}</p>
    </div>
  );
};
```

### 4. Check for Alerts

```typescript
const checkAlerts = async () => {
  const response = await getAlerts({ unread_only: true });
  if (response.success && response.unread_count > 0) {
    // Show notification badge
    console.log(`${response.unread_count} unread alerts`);
  }
};
```

---

## API Reference

### Budget Management Endpoints

#### Create Budget

**Endpoint:** `POST /api/financial/budgets`

**Request:**
```typescript
{
  name: string;
  category_id?: string | null;
  amount: number;
  period: 'monthly' | 'yearly' | 'weekly';
  start_date: string; // ISO format
  end_date?: string | null; // ISO format, optional
  alert_thresholds: {
    warning: number; // 0-100
    critical: number; // 0-100
  };
}
```

**Response:**
```typescript
{
  success: boolean;
  budget: Budget;
}
```

**Usage:**
```typescript
import { createBudget } from '../lib/api/financialApi';

const response = await createBudget({
  name: 'Monthly Budget',
  amount: 10000,
  period: 'monthly',
  start_date: new Date().toISOString(),
  alert_thresholds: { warning: 80, critical: 95 },
});
```

#### List Budgets

**Endpoint:** `GET /api/financial/budgets`

**Query Parameters:**
- `active_only` (boolean, optional): Return only active budgets
- `category_id` (string, optional): Filter by category

**Response:**
```typescript
{
  success: boolean;
  budgets: Budget[];
  total: number;
}
```

**Usage:**
```typescript
import { listBudgets } from '../lib/api/financialApi';

// Get all budgets
const allBudgets = await listBudgets();

// Get only active budgets
const activeBudgets = await listBudgets({ active_only: true });

// Get budgets for specific category
const categoryBudgets = await listBudgets({ category_id: 'cat123' });
```

#### Get Budget Status

**Endpoint:** `GET /api/financial/budgets/<budget_id>/status`

**Response:**
```typescript
{
  success: boolean;
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
```

**Usage:**
```typescript
import { getBudgetStatus } from '../lib/api/financialApi';

const status = await getBudgetStatus('budget_id_here');
if (status.success) {
  console.log(`Spent: ${status.status.current_spending} / ${status.budget.amount}`);
  console.log(`Alert Level: ${status.status.alert_level}`);
}
```

#### Update Budget

**Endpoint:** `PUT /api/financial/budgets/<budget_id>`

**Request:**
```typescript
{
  name?: string;
  amount?: number;
  alert_thresholds?: {
    warning?: number;
    critical?: number;
  };
}
```

**Usage:**
```typescript
import { updateBudget } from '../lib/api/financialApi';

const response = await updateBudget('budget_id', {
  amount: 12000,
  alert_thresholds: { warning: 75, critical: 90 },
});
```

#### Delete Budget

**Endpoint:** `DELETE /api/financial/budgets/<budget_id>`

**Usage:**
```typescript
import { deleteBudget } from '../lib/api/financialApi';

const response = await deleteBudget('budget_id');
```

### Category Spending Caps

#### Create/Update Category Cap

**Endpoint:** `POST /api/financial/budgets/category-caps`

**Request:**
```typescript
{
  category_id: string;
  monthly_limit: number;
  alert_at_percentage: number; // 0-100
}
```

**Usage:**
```typescript
import { createCategoryCap } from '../lib/api/financialApi';

const response = await createCategoryCap({
  category_id: 'cat123',
  monthly_limit: 3000,
  alert_at_percentage: 80,
});
```

#### Get Category Caps

**Endpoint:** `GET /api/financial/budgets/category-caps`

**Response:**
```typescript
{
  success: boolean;
  caps: Array<{
    _id: string;
    category_id: string;
    category_name: string;
    monthly_limit: number;
    current_spending: number;
    remaining: number;
    alert_triggered: boolean;
    alert_at_percentage: number;
  }>;
}
```

**Usage:**
```typescript
import { getCategoryCaps } from '../lib/api/financialApi';

const response = await getCategoryCaps();
response.caps.forEach(cap => {
  console.log(`${cap.category_name}: Rs. ${cap.current_spending} / ${cap.monthly_limit}`);
});
```

### Alert System

#### Get Alerts

**Endpoint:** `GET /api/financial/budgets/alerts`

**Query Parameters:**
- `unread_only` (boolean, optional): Return only unread alerts
- `severity` (string, optional): Filter by severity ('warning' | 'critical' | 'exceeded')

**Response:**
```typescript
{
  success: boolean;
  alerts: BudgetAlert[];
  unread_count: number;
}
```

**Usage:**
```typescript
import { getAlerts } from '../lib/api/financialApi';

// Get all unread alerts
const unreadAlerts = await getAlerts({ unread_only: true });

// Get critical alerts only
const criticalAlerts = await getAlerts({ severity: 'critical' });
```

#### Mark Alert as Read

**Endpoint:** `PUT /api/financial/budgets/alerts/<alert_id>/read`

**Usage:**
```typescript
import { markAlertRead } from '../lib/api/financialApi';

await markAlertRead('alert_id_here');
```

#### Mark All Alerts as Read

**Endpoint:** `PUT /api/financial/budgets/alerts/read-all`

**Usage:**
```typescript
import { markAllAlertsRead } from '../lib/api/financialApi';

const response = await markAllAlertsRead();
console.log(`Marked ${response.updated_count} alerts as read`);
```

---

## TypeScript Types

All budget-related types are defined in `src/types/financial.ts`:

### Core Types

```typescript
// Budget entity
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
    warning: number;
    critical: number;
  };
  created_at: string;
  updated_at: string;
}

// Budget status with spending data
export interface BudgetStatusResponse {
  success: boolean;
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

// Category spending cap
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

// Budget alert
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
```

### Request Types

```typescript
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
```

### Response Types

```typescript
export interface BudgetsListResponse {
  success: boolean;
  budgets: Budget[];
  total: number;
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
```

---

## Component Usage

### BudgetSection Component

Main component for budget management:

```typescript
import BudgetSection from '../components/financial/BudgetSection';

<BudgetSection
  categories={categories}
  onBudgetChange={() => {
    // Refresh data when budget changes
    loadBudgets();
  }}
/>
```

**Props:**
- `categories` (Category[]): List of categories for filtering
- `onBudgetChange` (() => void): Callback when budget is created/updated/deleted

**Features:**
- List all budgets with status
- Create new budgets
- Edit existing budgets
- Delete budgets
- Filter by category or active status

### BudgetCard Component

Display individual budget with status:

```typescript
import BudgetCard from '../components/financial/BudgetCard';

<BudgetCard
  budgetStatus={budgetStatus}
  categoryName="Groceries"
  onEdit={(budget) => {
    // Open edit form
  }}
  onDelete={(budgetId) => {
    // Confirm and delete
  }}
  onViewDetails={(budgetId) => {
    // Navigate to details
  }}
/>
```

**Props:**
- `budgetStatus` (BudgetStatusResponse): Budget with status data
- `categoryName` (string, optional): Category name for display
- `onEdit` ((budget: Budget) => void, optional): Edit handler
- `onDelete` ((budgetId: string) => void, optional): Delete handler
- `onViewDetails` ((budgetId: string) => void, optional): View details handler

### BudgetForm Component

Create or edit budget form:

```typescript
import BudgetForm from '../components/financial/BudgetForm';

<BudgetForm
  open={formOpen}
  onClose={() => setFormOpen(false)}
  onSubmit={async (data) => {
    if (editingBudget) {
      await updateBudget(editingBudget._id, data);
    } else {
      await createBudget(data);
    }
  }}
  budget={editingBudget}
  categories={categories}
  loading={saving}
/>
```

**Props:**
- `open` (boolean): Dialog open state
- `onClose` (() => void): Close handler
- `onSubmit` ((data: CreateBudgetRequest | UpdateBudgetRequest) => Promise<void>): Submit handler
- `budget` (Budget | null, optional): Budget to edit (null for create)
- `categories` (Category[], optional): Available categories
- `loading` (boolean, optional): Loading state

### AlertsPanel Component

Display and manage budget alerts:

```typescript
import AlertsPanel from '../components/financial/AlertsPanel';

<AlertsPanel
  compact={false}
  maxItems={10}
  onAlertClick={(alert) => {
    // Handle alert click
  }}
/>
```

**Props:**
- `compact` (boolean, optional): Compact display mode
- `maxItems` (number, optional): Maximum items to display
- `onAlertClick` ((alert: BudgetAlert) => void, optional): Alert click handler

### CategoryCapSection Component

Manage category spending caps:

```typescript
import CategoryCapSection from '../components/financial/CategoryCapSection';

<CategoryCapSection
  categories={categories}
  onCapChange={() => {
    // Refresh data
  }}
/>
```

**Props:**
- `categories` (Category[]): Available categories
- `onCapChange` (() => void): Callback when cap changes

### BudgetStatusWidget Component

Compact budget status widget for dashboard:

```typescript
import BudgetStatusWidget from '../components/financial/BudgetStatusWidget';

<BudgetStatusWidget
  budgetId="budget_id"
  budgetName="Monthly Budget"
  onClick={() => {
    // Navigate to budget details
  }}
/>
```

**Props:**
- `budgetId` (string): Budget ID
- `budgetName` (string): Budget name
- `onClick` (() => void, optional): Click handler

---

## Real-time Updates

### SSE Stream Setup

The budget status stream provides real-time updates when spending changes:

```typescript
import { subscribeToBudgetUpdates } from '../lib/api/financialApi';

useEffect(() => {
  const cleanup = subscribeToBudgetUpdates(
    (data) => {
      if (data.event === 'status_update') {
        // Update budget statuses
        if (data.budgets) {
          setBudgetStatuses(data.budgets);
        }
      } else if (data.event === 'alert') {
        // Show new alert notification
        if (data.alert) {
          showNotification(data.alert);
        }
      }
    },
    (error) => {
      console.error('SSE error:', error);
    }
  );

  return cleanup; // Cleanup on unmount
}, []);
```

### Event Types

- `status_update`: Budget status changed
- `alert`: New alert generated
- `heartbeat`: Connection alive (every 30 seconds)

### Connection Management

The `subscribeToBudgetUpdates` function returns a cleanup function. Always call it when the component unmounts:

```typescript
useEffect(() => {
  const cleanup = subscribeToBudgetUpdates(onUpdate, onError);
  return cleanup; // This will close the connection
}, []);
```

---

## Error Handling

### Common Errors

#### Authentication Errors

```typescript
try {
  const response = await createBudget(data);
} catch (error: any) {
  if (error.message.includes('Authentication')) {
    // Redirect to login
    navigate('/login');
  }
}
```

#### Validation Errors

```typescript
try {
  const response = await createBudget({
    amount: -100, // Invalid
    // ...
  });
} catch (error: any) {
  if (error.message.includes('amount')) {
    setError('Budget amount must be greater than 0');
  }
}
```

#### Network Errors

```typescript
try {
  const response = await getBudgetStatus(budgetId);
} catch (error: any) {
  if (error.message.includes('network') || error.message.includes('fetch')) {
    setError('Network error. Please check your connection.');
  } else {
    setError(error.message || 'Failed to load budget status');
  }
}
```

### Error Handling Pattern

```typescript
const handleBudgetOperation = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const response = await createBudget(budgetData);
    
    if (response.success) {
      // Success handling
      onSuccess();
    } else {
      setError('Failed to create budget');
    }
  } catch (err: any) {
    // Error handling
    const errorMessage = err.message || 'An unexpected error occurred';
    setError(errorMessage);
    
    // Log for debugging
    console.error('Budget operation error:', err);
  } finally {
    setLoading(false);
  }
};
```

---

## Best Practices

### 1. Loading States

Always show loading indicators during API calls:

```typescript
{loading ? (
  <CircularProgress />
) : (
  <BudgetList budgets={budgets} />
)}
```

### 2. Error Display

Show user-friendly error messages:

```typescript
{error && (
  <Alert severity="error" onClose={() => setError(null)}>
    {error}
  </Alert>
)}
```

### 3. Optimistic Updates

Update UI immediately, then sync with server:

```typescript
const handleDelete = async (budgetId: string) => {
  // Optimistic update
  setBudgets(budgets.filter(b => b._id !== budgetId));
  
  try {
    await deleteBudget(budgetId);
  } catch (error) {
    // Rollback on error
    loadBudgets();
    setError('Failed to delete budget');
  }
};
```

### 4. Polling vs SSE

- Use **polling** for infrequent updates (every 30-60 seconds)
- Use **SSE** for real-time updates when needed
- Always clean up SSE connections on unmount

### 5. Alert Thresholds

Recommended thresholds:
- **Warning**: 80% - User should be aware
- **Critical**: 95% - User needs to take action

### 6. Budget Periods

- **Monthly**: Most common, good for regular expenses
- **Weekly**: For short-term tracking
- **Yearly**: For annual budgets

### 7. Category Caps

- One cap per category (creating updates existing)
- Alert percentage should be between 70-95%
- Consider user's spending patterns when setting limits

---

## Troubleshooting

### Issue: Budget Status Not Updating

**Solution:**
- Check if SSE connection is established
- Verify authentication token is valid
- Check browser console for errors
- Ensure backend endpoint is accessible

### Issue: Alerts Not Showing

**Solution:**
- Verify alert thresholds are set correctly
- Check if spending has reached threshold
- Ensure `getAlerts()` is called regularly
- Check alert read status

### Issue: Category Cap Not Working

**Solution:**
- Verify category ID is correct
- Check if cap was created successfully
- Ensure monthly limit is greater than 0
- Check current spending calculation

### Issue: Budget Form Validation Errors

**Solution:**
- Ensure all required fields are filled
- Verify amount is greater than 0
- Check date formats (ISO 8601)
- Ensure warning < critical threshold

### Issue: SSE Connection Fails

**Solution:**
- Check if backend supports SSE
- Verify authentication token in URL
- Check CORS settings
- Fallback to polling if SSE unavailable

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Authentication required" | Missing/invalid token | Refresh token or redirect to login |
| "Budget amount must be greater than 0" | Invalid amount | Check form validation |
| "Warning threshold must be less than critical" | Invalid thresholds | Adjust slider values |
| "Category cap already exists" | Duplicate cap | Update existing cap instead |
| "Budget not found" | Invalid budget ID | Verify budget exists |

---

## Examples

### Complete Budget Management Flow

```typescript
import { useState, useEffect } from 'react';
import {
  listBudgets,
  createBudget,
  getBudgetStatus,
  updateBudget,
  deleteBudget,
  getAlerts,
} from '../lib/api/financialApi';
import BudgetSection from '../components/financial/BudgetSection';

function BudgetManagementPage() {
  const [budgets, setBudgets] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [budgetsRes, alertsRes] = await Promise.all([
        listBudgets({ active_only: true }),
        getAlerts({ unread_only: true }),
      ]);

      if (budgetsRes.success) {
        setBudgets(budgetsRes.budgets);
      }
      if (alertsRes.success) {
        setAlerts(alertsRes.alerts);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Budget Management</h1>
      {alerts.length > 0 && (
        <AlertBanner count={alerts.length} />
      )}
      <BudgetSection
        categories={categories}
        onBudgetChange={loadData}
      />
    </div>
  );
}
```

### Real-time Budget Monitoring

```typescript
import { useEffect } from 'react';
import { subscribeToBudgetUpdates, getBudgetStatus } from '../lib/api/financialApi';

function BudgetMonitor({ budgetId }: { budgetId: string }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    // Initial load
    loadStatus();

    // Subscribe to real-time updates
    const cleanup = subscribeToBudgetUpdates(
      (data) => {
        if (data.event === 'status_update' && data.budgets) {
          const budget = data.budgets.find(b => b.budget._id === budgetId);
          if (budget) {
            setStatus(budget);
          }
        }
      },
      (error) => {
        console.error('SSE error:', error);
        // Fallback to polling
        const pollInterval = setInterval(loadStatus, 5000);
        return () => clearInterval(pollInterval);
      }
    );

    return cleanup;
  }, [budgetId]);

  const loadStatus = async () => {
    const response = await getBudgetStatus(budgetId);
    if (response.success) {
      setStatus(response);
    }
  };

  // Render status...
}
```

---

## API Client Functions Reference

All functions are available in `src/lib/api/financialApi.ts`:

### Budget Functions

- `createBudget(request: CreateBudgetRequest): Promise<{ success: boolean; budget: Budget }>`
- `listBudgets(params?: { active_only?: boolean; category_id?: string }): Promise<BudgetsListResponse>`
- `getBudgetStatus(budgetId: string): Promise<BudgetStatusResponse>`
- `updateBudget(budgetId: string, request: UpdateBudgetRequest): Promise<{ success: boolean; budget: Budget }>`
- `deleteBudget(budgetId: string): Promise<{ success: boolean; message: string }>`

### Category Cap Functions

- `createCategoryCap(request: CreateCategoryCapRequest): Promise<{ success: boolean; cap: CategoryCap }>`
- `getCategoryCaps(): Promise<CategoryCapsResponse>`

### Alert Functions

- `getAlerts(params?: { unread_only?: boolean; severity?: string }): Promise<AlertsResponse>`
- `markAlertRead(alertId: string): Promise<{ success: boolean; alert: BudgetAlert }>`
- `markAllAlertsRead(): Promise<{ success: boolean; updated_count: number }>`

### Real-time Function

- `subscribeToBudgetUpdates(onUpdate, onError): () => void` - Returns cleanup function

---

## Integration Checklist

- [x] TypeScript types added to `src/types/financial.ts`
- [x] API client functions added to `src/lib/api/financialApi.ts`
- [x] BudgetSection component created
- [x] BudgetCard component created
- [x] BudgetForm component created
- [x] CategoryCapSection component created
- [x] AlertsPanel component created
- [x] BudgetStatusWidget component created
- [x] Integrated into DashboardOverview
- [x] Integrated into QuickStatsBar
- [x] Added Budget tab to FinancialToolApp
- [x] SSE stream handler implemented
- [x] Error handling added

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review API response errors
3. Check browser console for detailed errors
4. Verify backend endpoints are accessible

---

**Documentation Status:** Complete  
**Implementation Status:** Production Ready  
**Last Updated:** During implementation













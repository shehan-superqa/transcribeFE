import {
  Budget,
  BudgetStatusResponse,
  CategoryCap,
  BudgetAlert,
  CreateBudgetRequest,
} from '../../types/financial';

export const createMockBudget = (overrides?: Partial<Budget>): Budget => ({
  _id: 'budget_123',
  user_id: 'user_123',
  name: 'Monthly Groceries',
  category_id: 'cat_123',
  amount: 5000,
  period: 'monthly',
  start_date: new Date().toISOString(),
  end_date: null,
  alert_thresholds: {
    warning: 80,
    critical: 95,
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockBudgetStatus = (
  overrides?: Partial<BudgetStatusResponse>
): BudgetStatusResponse => ({
  success: true,
  budget: createMockBudget(),
  status: {
    current_spending: 3000,
    budget_amount: 5000,
    remaining: 2000,
    percentage_used: 60,
    days_remaining: 15,
    projected_spending: 4500,
    projected_over_budget: false,
    alert_level: 'ok',
    alerts: [],
    on_track: true,
    recommendations: [],
    ...overrides?.status,
  },
  ...overrides,
});

export const createMockCategoryCap = (overrides?: Partial<CategoryCap>): CategoryCap => ({
  _id: 'cap_123',
  user_id: 'user_123',
  category_id: 'cat_123',
  monthly_limit: 3000,
  alert_at_percentage: 80,
  current_spending: 2000,
  remaining: 1000,
  alert_triggered: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockAlert = (overrides?: Partial<BudgetAlert>): BudgetAlert => ({
  _id: 'alert_123',
  user_id: 'user_123',
  type: 'budget_warning',
  severity: 'warning',
  title: 'Budget Warning',
  message: 'You have reached 80% of your budget',
  budget_id: 'budget_123',
  category_id: null,
  amount: 4000,
  threshold: 80,
  read: false,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockBudgetList = (count: number = 3): Budget[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockBudget({
      _id: `budget_${i + 1}`,
      name: `Budget ${i + 1}`,
      amount: (i + 1) * 1000,
    })
  );
};

export const createMockCreateBudgetRequest = (
  overrides?: Partial<CreateBudgetRequest>
): CreateBudgetRequest => ({
  name: 'New Budget',
  category_id: null,
  amount: 5000,
  period: 'monthly',
  start_date: new Date().toISOString(),
  end_date: null,
  alert_thresholds: {
    warning: 80,
    critical: 95,
  },
  ...overrides,
});













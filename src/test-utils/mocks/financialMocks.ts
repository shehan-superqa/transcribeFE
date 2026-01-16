import {
  Transaction,
  Category,
  Merchant,
  SpendingSummaryResponse,
  SpendingTrendsResponse,
  AnomaliesResponse,
} from '../../types/financial';

export const createMockTransaction = (overrides?: Partial<Transaction>): Transaction => ({
  _id: 'trans_123',
  user_id: 'user_123',
  merchant_id: 'merchant_123',
  category_id: 'cat_123',
  amount: 100.5,
  currency: 'USD',
  date: new Date().toISOString(),
  payment_method: 'card',
  bill_image_url: null,
  ocr_text: null,
  parsing_output: null,
  embedding_vector: null,
  duplicate_of: null,
  anomaly_flag: false,
  anomaly_reason: null,
  confidence_category: 0.95,
  confidence_ocr: null,
  confidence_parsing: null,
  versions: [],
  status: 'confirmed',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCategory = (overrides?: Partial<Category>): Category => ({
  _id: 'cat_123',
  category_name: 'Groceries',
  parent_category: null,
  ...overrides,
});

export const createMockMerchant = (overrides?: Partial<Merchant>): Merchant => ({
  _id: 'merchant_123',
  merchant_name: 'Supermarket',
  aliases: ['Supermarket', 'Grocery Store'],
  merchant_category: 'Groceries',
  ...overrides,
});

export const createMockSpendingSummary = (
  overrides?: Partial<SpendingSummaryResponse>
): SpendingSummaryResponse => ({
  success: true,
  summary: {
    total: 5000,
    by_category: [
      {
        category_id: 'cat_123',
        category_name: 'Groceries',
        amount: 2000,
        count: 10,
        percentage: 40,
      },
      {
        category_id: 'cat_456',
        category_name: 'Transportation',
        amount: 1500,
        count: 5,
        percentage: 30,
      },
    ],
    period: 'monthly',
    transaction_count: 15,
  },
  ...overrides,
});

export const createMockSpendingTrends = (
  overrides?: Partial<SpendingTrendsResponse>
): SpendingTrendsResponse => ({
  success: true,
  trends: {
    period: 'monthly',
    comparisons: [
      {
        period: 'current_month',
        current_total: 5000,
        previous_total: 4500,
        growth_rate: 11.11,
        current_count: 15,
        previous_count: 12,
      },
    ],
    overall_growth_rate: 11.11,
  },
  ...overrides,
});

export const createMockAnomalies = (overrides?: Partial<AnomaliesResponse>): AnomaliesResponse => ({
  success: true,
  anomalies: [
    {
      _id: 'trans_123',
      amount: 500,
      anomaly_flag: true,
      anomaly_reason: 'Unusually high amount',
      merchant_name: 'Expensive Store',
      category_name: 'Shopping',
    },
  ],
  count: 1,
  ...overrides,
});

export const createMockTransactionList = (count: number = 5): Transaction[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockTransaction({
      _id: `trans_${i + 1}`,
      amount: (i + 1) * 50,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
    })
  );
};

export const createMockCategoryList = (count: number = 5): Category[] => {
  const categories = ['Groceries', 'Transportation', 'Entertainment', 'Bills', 'Shopping'];
  return Array.from({ length: count }, (_, i) =>
    createMockCategory({
      _id: `cat_${i + 1}`,
      category_name: categories[i] || `Category ${i + 1}`,
    })
  );
};















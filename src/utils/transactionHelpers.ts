/**
 * Helper functions for transaction data processing and display
 * Ensures proper handling of normalization data, categories, currency, and anomalies
 */

import { Transaction, TransactionItem } from '../types/financial';

/**
 * Get transaction name/caption with fallback logic
 */
export function getTransactionName(
  transaction: Transaction,
  merchantName: string,
  items: TransactionItem[] = []
): string {
  // Use name field if available
  if (transaction.name && transaction.name.trim()) {
    return transaction.name;
  }
  
  // Fallback: generate from merchant and items
  const itemCount = items.length || transaction.items?.length || 0;
  if (itemCount > 0) {
    return `${merchantName} - ${itemCount} item${itemCount > 1 ? 's' : ''}`;
  }
  
  // Final fallback
  return merchantName || 'Transaction';
}

/**
 * Get category name with fallback to items
 */
export function getDisplayCategoryName(
  transaction: Transaction,
  categoryName: string,
  items: TransactionItem[] = []
): string {
  // Use category_name if available and not "Uncategorized"
  if (transaction.category_name && transaction.category_name !== 'Uncategorized') {
    return transaction.category_name;
  }
  
  // Try to determine from items
  const transactionItems = items.length > 0 ? items : (transaction.items || []);
  
  // First, try to get categories from normalized_output items
  const normalizedItems = transaction.normalized_output?.items || [];
  const normalizedCategories = normalizedItems
    .map((item: any) => item.category)
    .filter(Boolean);
  
  // Then check transaction items directly
  const itemCategories = transactionItems
    .map(item => {
      // Check various possible category fields
      return (item as any).category || 
             (item as any).category_name;
    })
    .filter(Boolean);
  
  // Combine both sources
  const allCategories = [...normalizedCategories, ...itemCategories];
  
  if (allCategories.length > 0) {
    // Get most common category from items
    const categoryCounts: Record<string, number> = {};
    allCategories.forEach(cat => {
      const catStr = String(cat);
      categoryCounts[catStr] = (categoryCounts[catStr] || 0) + 1;
    });
    const sorted = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length > 0 && sorted[0][1] > 0) {
      return sorted[0][0];
    }
  }
  
  // Fallback to provided category name
  return categoryName || 'Uncategorized';
}

/**
 * Format currency amount with proper symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'CAD': 'C$',
    'EUR': '€',
    'GBP': '£',
    'LKR': 'Rs.',
    'INR': '₹',
    'AUD': 'A$',
    'JPY': '¥',
    'CNY': '¥',
    'CHF': 'CHF',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
  };
  
  const symbol = symbols[currency.toUpperCase()] || currency;
  return `${symbol} ${amount.toFixed(2)}`;
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currency: string = 'USD'): string {
  const symbols: Record<string, string> = {
    'USD': '$',
    'CAD': 'C$',
    'EUR': '€',
    'GBP': '£',
    'LKR': 'Rs.',
    'INR': '₹',
    'AUD': 'A$',
    'JPY': '¥',
    'CNY': '¥',
    'CHF': 'CHF',
    'SGD': 'S$',
    'HKD': 'HK$',
    'NZD': 'NZ$',
  };
  
  return symbols[currency.toUpperCase()] || currency;
}

/**
 * Check if transaction has anomaly and get reason
 */
export function getAnomalyInfo(transaction: Transaction): {
  hasAnomaly: boolean;
  reason: string | null;
} {
  return {
    hasAnomaly: transaction.anomaly_flag === true,
    reason: transaction.anomaly_reason || null,
  };
}

/**
 * Get merchant name with fallback
 */
export function getDisplayMerchantName(
  transaction: Transaction,
  merchantName: string
): string {
  // Use merchant_name if available
  if (transaction.merchant_name && transaction.merchant_name !== 'Unknown Merchant') {
    return transaction.merchant_name;
  }
  
  // Try to get from normalized_output
  if (transaction.normalized_output?.merchant) {
    return transaction.normalized_output.merchant;
  }
  
  // Try parsing_output
  if (transaction.parsing_output?.merchant) {
    return transaction.parsing_output.merchant;
  }
  
  // Fallback
  return merchantName || 'Unknown Merchant';
}

/**
 * Detect currency from transaction data
 */
export function detectCurrency(transaction: Transaction): string {
  // Use currency field if available
  if (transaction.currency && transaction.currency !== 'USD') {
    return transaction.currency;
  }
  
  // Try to detect from amount patterns or merchant location
  // This is a simple heuristic - backend should handle this properly
  const amount = transaction.amount;
  
  // If amount is very small (like 13.13), might be CAD or other currency
  // But we can't reliably detect without more context
  // Backend should provide proper currency detection
  
  return transaction.currency || 'USD';
}

/**
 * Format payment method name for display
 */
export function formatPaymentMethod(paymentMethod?: string | null): string {
  if (!paymentMethod) return 'N/A';
  
  // Convert common formats to readable names
  const formatted = paymentMethod
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  return formatted;
}

/**
 * Check if a bill item has missing price-related fields
 * Returns an object indicating which fields are missing
 */
export function checkMissingPriceFields(item: any): {
  hasMissingFields: boolean;
  missingFields: string[];
  quantity: boolean;
  unitPrice: boolean;
  totalPrice: boolean;
} {
  const missingFields: string[] = [];
  let quantity = false;
  let unitPrice = false;
  let totalPrice = false;

  // Check quantity
  if (!item.quantity || item.quantity === 0 || item.quantity === null || item.quantity === undefined) {
    missingFields.push('quantity');
    quantity = true;
  }

  // Check unit_price
  if (!item.unit_price || item.unit_price === 0 || item.unit_price === null || item.unit_price === undefined) {
    missingFields.push('unit_price');
    unitPrice = true;
  }

  // Check total_price
  if (!item.total_price || item.total_price === 0 || item.total_price === null || item.total_price === undefined) {
    missingFields.push('total_price');
    totalPrice = true;
  }

  return {
    hasMissingFields: missingFields.length > 0,
    missingFields,
    quantity,
    unitPrice,
    totalPrice,
  };
}

/**
 * Get styling for cells with missing price fields
 */
export function getMissingFieldStyle(hasMissing: boolean, theme: any): any {
  if (!hasMissing) return {};
  
  return {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 152, 0, 0.15)' 
      : 'rgba(255, 152, 0, 0.1)',
    borderLeft: `3px solid ${theme.palette.warning.main}`,
    color: theme.palette.warning.main,
    fontWeight: 500,
  };
}

/**
 * Get styling for rows with missing price fields
 */
export function getMissingFieldRowStyle(hasMissing: boolean, theme: any): any {
  if (!hasMissing) return {};
  
  return {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 152, 0, 0.08)' 
      : 'rgba(255, 152, 0, 0.05)',
    borderLeft: `3px solid ${theme.palette.warning.main}`,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' 
        ? 'rgba(255, 152, 0, 0.12)' 
        : 'rgba(255, 152, 0, 0.08)',
    },
  };
}

/**
 * Check if a transaction has any items with missing price fields
 * @param transaction - The transaction to check
 * @param items - Optional array of items (if not provided, will check transaction.items)
 */
export function transactionHasMissingFields(transaction: Transaction, items?: any[]): boolean {
  const transactionItems = items || transaction.items || [];
  
  if (transactionItems.length === 0) return false;
  
  // Check if at least one item has missing fields
  return transactionItems.some((item: any) => {
    const missingFields = checkMissingPriceFields(item);
    return missingFields.hasMissingFields;
  });
}

/**
 * Get all transaction metadata for display
 */
export function getTransactionMetadata(transaction: Transaction, items: TransactionItem[] = []) {
  const merchantName = getDisplayMerchantName(transaction, transaction.merchant_name || 'Unknown Merchant');
  const categoryName = getDisplayCategoryName(transaction, transaction.category_name || 'Uncategorized', items);
  const transactionName = getTransactionName(transaction, merchantName, items);
  const currency = detectCurrency(transaction);
  const formattedAmount = formatCurrency(transaction.amount, currency);
  const anomaly = getAnomalyInfo(transaction);
  const paymentMethod = formatPaymentMethod(transaction.payment_method);
  
  return {
    name: transactionName,
    merchantName,
    categoryName,
    currency,
    formattedAmount,
    anomaly,
    paymentMethod,
    invoiceNumber: transaction.invoice_number,
    hasItems: (items.length > 0 || (transaction.items?.length || 0) > 0),
    itemCount: items.length || transaction.items?.length || 0,
  };
}


# Normalization Data Capture - Frontend Implementation

## Overview
This document describes the frontend implementation for properly capturing and displaying normalization data from bill processing, including transaction names, categories, currency, and anomalies.

## Issues Addressed

### 1. **Transaction Name/Caption**
- **Problem**: Transaction `name` field was missing, making it hard to identify bills
- **Solution**: 
  - Frontend now displays `transaction.name` if available
  - Falls back to generating a name from merchant and item count
  - Helper function: `getTransactionName()`

### 2. **Category Detection**
- **Problem**: Transactions showing "Uncategorized" even when items have categories (e.g., "Groceries")
- **Solution**:
  - Frontend checks `transaction.category_name` first
  - If "Uncategorized", extracts category from items
  - Uses most common category from `transaction.items` or `normalized_output.items`
  - Helper function: `getDisplayCategoryName()`

### 3. **Currency Detection**
- **Problem**: Currency hardcoded as "Rs." or "USD" without proper detection
- **Solution**:
  - Frontend now uses `transaction.currency` field
  - Formats amounts with proper currency symbols ($, €, £, Rs., ₹, etc.)
  - Helper function: `formatCurrency()`

### 4. **Anomaly Detection**
- **Problem**: Anomaly information not displayed
- **Solution**:
  - Displays anomaly chip when `transaction.anomaly_flag === true`
  - Shows `transaction.anomaly_reason` in tooltip
  - Helper function: `getAnomalyInfo()`

### 5. **Merchant Name**
- **Problem**: Showing "Unknown Merchant" instead of actual merchant
- **Solution**:
  - Checks `transaction.merchant_name` first
  - Falls back to `normalized_output.merchant` or `parsing_output.merchant`
  - Helper function: `getDisplayMerchantName()`

## Frontend Implementation

### Helper Functions (`src/utils/transactionHelpers.ts`)

All helper functions are centralized in `src/utils/transactionHelpers.ts`:

1. **`getTransactionName(transaction, merchantName, items)`**
   - Returns transaction name/caption with fallback logic

2. **`getDisplayCategoryName(transaction, categoryName, items)`**
   - Returns category name, falling back to items if "Uncategorized"

3. **`formatCurrency(amount, currency)`**
   - Formats amount with proper currency symbol

4. **`getAnomalyInfo(transaction)`**
   - Returns anomaly flag and reason

5. **`getDisplayMerchantName(transaction, merchantName)`**
   - Returns merchant name with fallback logic

6. **`getTransactionMetadata(transaction, items)`**
   - Returns all metadata in one call

### Updated Components

All transaction display components now use the helper functions:

- `TransactionCard.tsx` - Card view with full metadata
- `TransactionsList.tsx` - List/table view
- `TransactionTable.tsx` - Table view
- `FullScreenTransactions.tsx` - Full screen modal
- `TransactionsSection.tsx` - Main transactions section
- `DashboardOverview.tsx` - Dashboard cards

## Backend Requirements

For proper data capture, the backend normalization process should ensure:

### 1. **Transaction Name/Caption**
```json
{
  "name": "Grocery Purchase at Loblaws"  // Overall bill description/caption
}
```

### 2. **Category Assignment**
```json
{
  "category_id": "695e7a4c83fc8faa9766d8bf",
  "category_name": "Groceries",  // Should match items, not "Uncategorized"
  "items": [
    {
      "category": "Groceries"  // Item-level category
    }
  ]
}
```

### 3. **Currency Detection**
```json
{
  "currency": "CAD",  // Properly detected currency (not always USD)
  "amount": 13.13
}
```

### 4. **Anomaly Detection**
```json
{
  "anomaly_flag": true,
  "anomaly_reason": "Amount is unusually high for this category"
}
```

### 5. **Merchant Information**
```json
{
  "merchant_id": "695e76815691c824729c98a3",
  "merchant_name": "Loblaws",  // Actual merchant name, not "Unknown Merchant"
  "normalized_output": {
    "merchant": "Loblaws"
  }
}
```

## Normalization Steps

The backend normalization process should capture:

1. **OCR & Parsing** → Extract raw data from bill image
2. **Normalization** → Clean and structure data:
   - Extract merchant name
   - Detect currency
   - Assign categories (transaction + items)
   - Generate transaction name/caption
   - Detect anomalies
3. **Final Transaction** → Store with all fields populated

## Testing

To verify proper data capture:

1. Upload a bill with clear merchant, items, and currency
2. Check that:
   - Transaction name appears (not just merchant)
   - Category matches items (not "Uncategorized")
   - Currency is correct (not hardcoded USD)
   - Anomalies are flagged if present
   - Merchant name is actual name (not "Unknown Merchant")

## Notes

- Frontend provides fallback logic for missing data
- Backend should ensure all normalization fields are populated
- Currency detection should happen during normalization
- Category should be determined from items if transaction category is "Uncategorized"
- Transaction name should be generated from merchant + context if not explicitly provided


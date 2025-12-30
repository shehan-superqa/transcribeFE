# Personal & Family Finance Management Platform - Complete Architecture

## Executive Summary

This document provides a complete, implementation-ready architecture for a scalable personal and family finance management platform. The system supports multi-user families, AI-driven analytics, bill processing, recurring payments, savings goals, loans, and comprehensive financial insights.

---

## 1. Screen Architecture & Responsibilities

### 1.1 Dashboard Screen (Overview)
**Route:** `/financial/dashboard`  
**Purpose:** High-level financial summary and quick insights

**Responsibilities:**
- Display aggregated financial metrics (read-only summary)
- Total earnings (current period)
- Total expenses (current period)
- Remaining budget
- Total loans outstanding
- Total savings across all goals
- Total upcoming payments (next month)
- Budget projections (3-6 months)
- Top spender in family
- Top earner in family
- Top spending categories (top 5)
- Quick action buttons to navigate to detailed screens

**Data Sources:**
- `/api/financial/analytics/dashboard-summary`
- `/api/financial/family/analytics`
- `/api/financial/recurring/upcoming-summary`

**Key Components:**
- `DashboardOverview` (existing)
- `QuickStatsBar`
- `TopSpendersCard`
- `CategoryBreakdownChart`
- `BudgetProjectionChart`

---

### 1.2 Upload Bills & Receipts Screen
**Route:** `/financial/upload`  
**Purpose:** Single and bulk document upload with type selection

**Entry Flow (Mandatory Order):**

1. **Step 1: Transaction Type Selection**
   - User MUST first select transaction type:
     - **Expense** button (red/orange accent)
     - **Earning** button (green accent)
   - This selection is required before any upload action

2. **Step 2: Upload Method Selection** (only after Step 1)
   - Camera capture
   - Manual value entry
   - File upload (single)
   - Bulk file upload

**Supported Formats:**
- Images: JPG, PNG, HEIC
- Documents: PDF
- Spreadsheets: Excel (.xlsx, .xls), CSV
- Mixed bulk uploads allowed (but all must be same type: earning OR expense)

**Bulk Upload Rules:**
- Multiple files can be uploaded at once
- Earnings and expenses MUST be uploaded separately
- Cannot mix earning + expense in same bulk session
- System validates type consistency before processing

**Processing & Status Screen:**

After upload, display a **Processing Table** with:

| Column | Description |
|--------|-------------|
| File Name | Original filename |
| Type | Earning / Expense (badge) |
| Status | Pending analysis / Extracted / Needs review / Confirmed |
| Amount | Editable field (extracted or manual) |
| Merchant | Editable field |
| Category | Editable dropdown |
| Date | Editable date picker |
| Actions | Confirm / Reject buttons |

**Status States:**
- **Pending analysis:** Document queued for OCR/AI processing
- **Extracted:** Data extracted, awaiting user review
- **Needs review:** Low confidence or unclear data
- **Confirmed:** User approved, transaction created
- **Rejected:** User rejected, document archived

**API Endpoints:**
- `POST /api/financial/bills/bulk` - Bulk upload with type
- `GET /api/financial/bills/processing-status` - Get processing table
- `PUT /api/financial/bills/:id/confirm` - Confirm extracted data
- `DELETE /api/financial/bills/:id/reject` - Reject document

**Key Components:**
- `BillUploadSection` (existing, needs enhancement)
- `TransactionTypeSelector` (new)
- `UploadMethodSelector` (new)
- `BulkUploadZone` (new)
- `ProcessingStatusTable` (new)
- `EditableTransactionRow` (new)

---

### 1.3 Transactions Screen
**Route:** `/financial/transactions`  
**Purpose:** View, filter, and manage all confirmed transactions

**Features:**
- Paginated transaction list
- Advanced filters:
  - Date range (this month, last month, custom)
  - Category
  - Merchant
  - Type (earning/expense)
  - Amount range
  - Status
- Sort options:
  - Date (newest/oldest)
  - Amount (high to low, low to high)
  - Merchant (A-Z)
- Bulk actions:
  - Delete selected
  - Export to CSV/Excel
  - Merge duplicates
- Individual transaction actions:
  - Edit
  - Delete
  - View items (if receipt has line items)
  - Flag as anomaly
  - Add to recurring

**API Endpoints:**
- `GET /api/financial/bills` (existing, with filters)
- `PUT /api/financial/transactions/:id` (existing)
- `DELETE /api/financial/transactions/:id` (existing)
- `POST /api/financial/transactions/bulk-delete`
- `POST /api/financial/transactions/export`

**Key Components:**
- `TransactionsSection` (existing)
- `TransactionFilters` (existing)
- `TransactionTable` (existing)
- `TransactionCard` (existing)

---

### 1.4 Pending Transactions Screen
**Route:** `/financial/pending`  
**Purpose:** Review and confirm transactions awaiting approval

**Features:**
- List of transactions with status "pending"
- Editable fields for each transaction
- Bulk confirm/reject actions
- Confidence scores displayed
- Anomaly warnings highlighted
- Duplicate detection alerts

**API Endpoints:**
- `GET /api/financial/transactions/pending`
- `PUT /api/financial/transactions/:id/confirm`
- `POST /api/financial/transactions/bulk-confirm`

**Key Components:**
- `PendingTransactionsSection` (existing)
- `PendingTransactionCard` (new)

---

### 1.5 Recurring Payments Screen
**Route:** `/financial/recurring`  
**Purpose:** Manage recurring earnings and expenses

**Features:**
- Add recurring payment:
  - Name
  - Type (earning/expense)
  - Amount (fixed or variable)
  - Frequency:
    - Daily
    - Weekly
    - Monthly
    - Yearly
    - Custom (specify days)
  - Start date
  - End date (optional)
  - Category
  - Merchant
- Variable amount configuration:
  - Enable variable amounts
  - Set different amounts per cycle
  - Historical amount tracking
- List view with filters:
  - Active/Inactive
  - Type (earning/expense)
  - Frequency
- Edit/Delete/Pause recurring payments
- View history of generated transactions

**API Endpoints:**
- `POST /api/financial/recurring` - Create recurring payment
- `GET /api/financial/recurring` - List recurring payments
- `PUT /api/financial/recurring/:id` - Update recurring payment
- `DELETE /api/financial/recurring/:id` - Delete recurring payment
- `PUT /api/financial/recurring/:id/pause` - Pause recurring payment
- `GET /api/financial/recurring/:id/history` - View generated transactions

**Key Components:**
- `RecurringPaymentsSection` (existing)
- `RecurringPaymentForm` (new)
- `RecurringPaymentCard` (new)
- `VariableAmountConfig` (new)

---

### 1.6 Upcoming Payments Screen
**Route:** `/financial/upcoming`  
**Purpose:** View all upcoming payments and budget impact

**Features:**
- Grouped view:
  - **Next Week** (7 days)
  - **Next Month** (30 days)
  - **Next 3 Months**
  - **Next 6 Months**
- For each group, show:
  - Total upcoming amount
  - Breakdown by type (earnings vs expenses)
  - Net impact (earnings - expenses)
  - Remaining budget after allocation
  - Percentage of budget consumed
- Individual payment cards showing:
  - Name
  - Amount
  - Due date
  - Days until due
  - Category
  - Merchant
- Budget impact visualization:
  - Current budget: $X
  - Upcoming expenses: $Y
  - Remaining after: $Z
  - Percentage: Z/X * 100%
- Alerts for:
  - Insufficient budget
  - High-impact payments
  - Overdue payments

**API Endpoints:**
- `GET /api/financial/recurring/upcoming` - Get upcoming payments
- `GET /api/financial/recurring/upcoming-summary` - Get summary with budget impact

**Key Components:**
- `UpcomingPaymentsSection` (existing)
- `UpcomingPaymentCard` (new)
- `BudgetImpactWidget` (new)
- `TimeGroupedPayments` (new)

---

### 1.7 Items / Purchase List Screen
**Route:** `/financial/items`  
**Purpose:** Non-financial to-do list for purchases

**Features:**
- Create shopping lists (e.g., "Groceries", "Hardware Store")
- Add items to lists:
  - Item name
  - Quantity (optional)
  - Notes (optional)
- Check off items when purchased
- Remove items from list
- **Important:** This does NOT affect finances
- Pure productivity feature
- Can optionally link to transaction after purchase

**API Endpoints:**
- `POST /api/financial/shopping-lists` - Create list
- `GET /api/financial/shopping-lists` - Get all lists
- `POST /api/financial/shopping-lists/:id/items` - Add item
- `PUT /api/financial/shopping-lists/:id/items/:itemId` - Update item
- `DELETE /api/financial/shopping-lists/:id/items/:itemId` - Remove item

**Key Components:**
- `ItemsSection` (existing, needs refactor)
- `ShoppingListCard` (new)
- `ShoppingItemRow` (new)

---

### 1.8 Merchants Screen
**Route:** `/financial/merchants/:merchantId`  
**Purpose:** View merchant-specific transactions and items

**Features:**
- **Tab 1: Transactions List**
  - All transactions from this merchant
  - Filters:
    - Date range (this month, last month, custom)
    - Amount (high → low, low → high)
    - Category
  - Total spent at merchant
  - Transaction frequency
  - Average transaction amount

- **Tab 2: Items Table**
  - All line items purchased from merchant
  - Columns:
    - Item name
    - Quantity
    - Unit price
    - Total price
    - Category
    - Purchase date
    - Transaction ID (link)
  - Filters:
    - Date range
    - Category
    - Price range
  - Use cases:
    - Track returns
    - Check warranties
    - Find expiry-related purchases
    - Identify frequently purchased items

**API Endpoints:**
- `GET /api/financial/merchants/:id/transactions` - Get merchant transactions
- `GET /api/financial/merchants/:id/items` - Get merchant items
- `GET /api/financial/merchants/:id/analytics` - Get merchant analytics

**Key Components:**
- `MerchantsCategoriesSection` (existing, needs split)
- `MerchantDetailView` (new)
- `MerchantTransactionsTab` (new)
- `MerchantItemsTab` (new)
- `MerchantAnalytics` (new)

---

### 1.9 Categories Screen
**Route:** `/financial/categories/:categoryId`  
**Purpose:** View category-specific spending trends and analytics

**Features:**
- **Analytics Graphs** showing spending over time:
  - **Hourly view:** Spending by hour of day (24-hour chart)
  - **Daily view:** Spending per day (last 30 days)
  - **Weekly view:** Spending per week (last 12 weeks)
  - **Monthly view:** Spending per month (last 12 months)
  - **Yearly view:** Spending per year (all years)
- Visualizations:
  - Line charts for trends
  - Bar charts for comparisons
  - Growth/reduction indicators
  - Seasonal pattern detection
- Insights:
  - Peak spending times
  - Spending growth rate
  - Anomalies detected
  - Budget vs actual
- Transaction list for category
- Top merchants in category
- Subcategory breakdown (if applicable)

**API Endpoints:**
- `GET /api/financial/categories/:id/analytics` - Get category analytics
- `GET /api/financial/categories/:id/trends` - Get time-based trends
- `GET /api/financial/categories/:id/transactions` - Get category transactions

**Key Components:**
- `CategoryDetailView` (new)
- `CategoryTrendsChart` (new)
- `TimeGranularitySelector` (new)
- `CategoryInsights` (new)

---

### 1.10 Analytics & Insights Screen (AI-Driven)
**Route:** `/financial/analytics`  
**Purpose:** Advanced AI-powered financial analysis and forecasting

**Section 1: Financial Forecasts**
- **Savings Goals Timeline:**
  - For each savings goal, calculate time to reach based on:
    - Current earning frequency
    - Average monthly savings
    - Projected income growth
  - Display: "You'll reach your goal in X months at current rate"
  - Recommendations to accelerate

- **Loan Repayment Timeline:**
  - For each loan, calculate:
    - Time to full repayment
    - Total interest to be paid
    - Monthly budget impact
  - Display: "Loan will be paid off in X months"
  - Recommendations for faster repayment

- **Budget Sustainability Score (0-100):**
  - Based on:
    - Income stability
    - Expense consistency
    - Savings rate
    - Debt-to-income ratio
  - Color-coded: Green (80+), Yellow (50-79), Red (<50)

- **Financial Stability Score (0-100):**
  - Based on:
    - Emergency fund adequacy
    - Income diversification
    - Expense volatility
    - Debt levels
  - Recommendations to improve

**Section 2: Risk Analysis**
- **Financial Risks Detected:**
  - Cash flow gaps (income < expenses in upcoming periods)
  - Overspending patterns
  - High debt burden
  - Insufficient emergency fund
  - Single income source dependency

- **Money Loss Detection:**
  - Duplicate charges
  - Subscription leaks (unused subscriptions)
  - Bank fees
  - Interest charges
  - Estimated total lost: $X

- **Expense Anomalies:**
  - Unusual spending patterns
  - Out-of-character purchases
  - Sudden category spikes
  - Merchant anomalies

**Section 3: Health & Life Risk Indicators**
- **Financial Preparedness:**
  - Health emergencies: X months of coverage
  - Job loss: X months of runway
  - Other hazards: Risk level (Low/Medium/High)

- **Survival Calculator:**
  - "If income stops today, you can survive for X months"
  - Based on:
    - Current savings
    - Emergency fund
    - Essential expenses only
    - Liquid assets
  - Breakdown by expense category

**API Endpoints:**
- `GET /api/financial/analytics/forecasts` - Get all forecasts
- `GET /api/financial/analytics/risks` - Get risk analysis
- `GET /api/financial/analytics/stability-score` - Get stability metrics
- `GET /api/financial/analytics/survival-calculator` - Get survival timeline
- `GET /api/financial/analytics/anomalies` (existing)

**Key Components:**
- `AnalyticsSection` (existing, needs major expansion)
- `ForecastsPanel` (new)
- `RiskAnalysisPanel` (new)
- `StabilityScoreCard` (new)
- `SurvivalCalculator` (new)
- `AnomaliesPanel` (new)

---

### 1.11 Expense Optimization Screen
**Route:** `/financial/optimization`  
**Purpose:** AI-generated suggestions to reduce expenses

**Features:**
- **Expense Cutting Suggestions:**
  - Each suggestion includes:
    - **Category:** Which expense category
    - **Reason:** Why this can be reduced
    - **Estimated Savings:** $X per month
    - **Impact Level:** Low/Medium/High
    - **Action Button:** "Apply" or "Ignore"
  
- **Example Suggestions:**
  - "You're spending $150/month on dining out. Reducing by 30% could save $45/month."
  - "You have 3 unused subscriptions totaling $35/month. Cancel them?"
  - "Your grocery spending is 40% above average. Meal planning could save $80/month."
  - "You're paying $12/month in bank fees. Switch to a fee-free account?"

- **Non-Essential Spending Identification:**
  - AI categorizes expenses as:
    - Essential (housing, utilities, groceries)
    - Important (insurance, healthcare)
    - Discretionary (entertainment, dining out)
    - Wasteful (unused subscriptions, duplicate services)
  - Visual breakdown with percentages

- **High-Impact Cost Reduction Areas:**
  - Top 5 categories with highest reduction potential
  - Ranked by potential savings
  - Actionable recommendations for each

- **Suggestion Actions:**
  - **Apply:** Create a budget cap for that category
  - **Ignore:** Dismiss suggestion
  - **Remind Later:** Snooze for 30 days

**API Endpoints:**
- `GET /api/financial/optimization/suggestions` - Get AI suggestions
- `POST /api/financial/optimization/apply` - Apply suggestion
- `POST /api/financial/optimization/ignore` - Ignore suggestion

**Key Components:**
- `ExpenseOptimizationSection` (new)
- `OptimizationSuggestionCard` (new)
- `NonEssentialBreakdown` (new)
- `HighImpactAreasChart` (new)

---

### 1.12 User Profiles & Future Expense Prediction Screen
**Route:** `/financial/profiles`  
**Purpose:** Manage user profiles and get AI-driven future expense predictions

**User Profile Information:**
Each user can enter:
- **Personal Details:**
  - Age
  - Occupation
  - Income level
  - Employment status
- **Family Status:**
  - Marital status
  - Number of children (with ages)
  - Number of dependents
  - Parents (ages, health status)
- **Life Stage:**
  - Student
  - Young professional
  - Mid-career
  - Pre-retirement
  - Retired
- **Goals:**
  - Homeownership
  - Education
  - Retirement
  - Travel
  - Business

**AI-Driven Future Expense Predictions:**

Based on profile data, AI generates proactive suggestions:

**Example 1: Growing Children**
- **Prediction:** "Your children (ages 5, 8) will need education expenses in the future."
- **Suggestion:** "Start saving $300/month for college fund. Estimated need: $50,000 in 10 years."
- **Action Button:** "Add to Savings Goals"

**Example 2: Aging Parents**
- **Prediction:** "Your parents (ages 65, 68) may need medical/retirement support."
- **Suggestion:** "Consider setting aside $200/month for parent care. Estimated need: $30,000 over 5 years."
- **Action Button:** "Add to Savings Goals"

**Example 3: Career Stage**
- **Prediction:** "As a mid-career professional, you should prioritize retirement savings."
- **Suggestion:** "Increase retirement contributions to 15% of income. Current: 5%."
- **Action Button:** "Update Budget"

**Example 4: Homeownership**
- **Prediction:** "Based on your income and savings rate, you can afford a home in 3 years."
- **Suggestion:** "Save $1,500/month for down payment. Target: $60,000."
- **Action Button:** "Create Savings Goal"

**Suggestion Card Format:**
```
┌─────────────────────────────────────────┐
│ 🎓 Education Savings for Children       │
├─────────────────────────────────────────┤
│ Your children will need college funds   │
│ in 10-13 years.                         │
│                                         │
│ Recommended: $300/month                 │
│ Target Amount: $50,000                  │
│ Time Horizon: 10 years                  │
│                                         │
│ [Add to Savings] [Remind Later] [Dismiss]│
└─────────────────────────────────────────┘
```

**API Endpoints:**
- `GET /api/financial/users/profile` - Get user profile
- `PUT /api/financial/users/profile` - Update user profile
- `GET /api/financial/predictions/future-expenses` - Get AI predictions
- `POST /api/financial/predictions/apply` - Apply prediction to savings

**Key Components:**
- `UserProfileSection` (new)
- `ProfileForm` (new)
- `FutureExpensePredictions` (new)
- `PredictionSuggestionCard` (new)

---

### 1.13 Savings Management Screen
**Route:** `/financial/savings`  
**Purpose:** Manage savings goals and track progress

**Features:**
- **Create Savings Goal:**
  - Name (e.g., "Emergency Fund", "Vacation", "New Car")
  - Description
  - Target amount
  - Deadline (optional)
  - Category
  - Type:
    - Personal (individual)
    - Shared (family-level)
  - Auto-save rules:
    - Frequency (daily/weekly/monthly)
    - Amount per contribution
    - Per-user or pooled

- **Savings Goal Card:**
  - Progress bar (current / target)
  - Percentage complete
  - Amount remaining
  - Estimated completion date
  - Contributors (if shared):
    - User name
    - Contribution amount
    - Contribution percentage
  - Recent contributions list
  - Add contribution button

- **Contribution Tracking:**
  - Individual contributions tracked
  - Total progress visible
  - Contribution history
  - Leaderboard (for shared goals)

- **Auto-Save Configuration:**
  - Enable/disable auto-save
  - Set frequency and amount
  - Link to recurring income
  - Percentage-based (e.g., "Save 10% of each paycheck")

**API Endpoints:**
- `POST /api/financial/savings` - Create savings goal
- `GET /api/financial/savings` - List savings goals
- `PUT /api/financial/savings/:id` - Update savings goal
- `DELETE /api/financial/savings/:id` - Delete savings goal
- `POST /api/financial/savings/:id/contribute` - Add contribution
- `GET /api/financial/savings/:id/contributions` - Get contribution history

**Key Components:**
- `SavingsSection` (existing)
- `SavingsGoalForm` (new)
- `SavingsGoalCard` (new)
- `ContributionForm` (new)
- `ContributorsLeaderboard` (new)

---

### 1.14 Loans Screen
**Route:** `/financial/loans`  
**Purpose:** Track loans (borrowed and lent)

**Features:**
- **Create Loan:**
  - Type: Borrowed / Lent
  - Counterparty name
  - Principal amount
  - Interest rate (optional)
  - Start date
  - Due date (optional)
  - Repayment schedule:
    - One-time
    - Weekly
    - Monthly
    - Custom
  - Installment amount (if applicable)
  - Description

- **Loan Card:**
  - Type badge (Borrowed/Lent)
  - Counterparty name
  - Principal amount
  - Outstanding balance
  - Interest rate
  - Progress bar (paid / total)
  - Next payment date
  - Next payment amount
  - Time to full repayment
  - Monthly budget impact
  - Add payment button

- **Loan Summary:**
  - Total borrowed: $X
  - Total lent: $Y
  - Total borrowed outstanding: $Z
  - Total lent outstanding: $W
  - Active loans count
  - Overdue loans count

- **Payment Tracking:**
  - Record payments
  - Payment history
  - Remaining balance auto-calculated
  - Interest calculations
  - Amortization schedule

**API Endpoints:**
- `POST /api/financial/loans` - Create loan
- `GET /api/financial/loans` - List loans
- `GET /api/financial/loans/summary` - Get loan summary
- `PUT /api/financial/loans/:id` - Update loan
- `DELETE /api/financial/loans/:id` - Delete loan
- `POST /api/financial/loans/:id/payment` - Record payment
- `GET /api/financial/loans/:id/payments` - Get payment history

**Key Components:**
- `LoansSection` (existing)
- `LoanForm` (new)
- `LoanCard` (new)
- `LoanSummaryWidget` (new)
- `PaymentForm` (new)
- `AmortizationSchedule` (new)

---

### 1.15 Multi-User & Family Analytics Screen
**Route:** `/financial/family`  
**Purpose:** Family-level financial overview and comparisons

**Features:**
- **Family Overview:**
  - Total family earnings
  - Total family expenses
  - Net family balance
  - Family budget status

- **Per-User Summary Cards:**
  - User name and avatar
  - Total earnings
  - Total expenses
  - Net balance
  - Transaction count
  - Top categories
  - Contribution to family finances

- **Comparisons:**
  - **Top Spender:**
    - User name
    - Amount spent
    - Percentage of family expenses
  - **Top Earner:**
    - User name
    - Amount earned
    - Percentage of family income

- **Category Breakdown by User:**
  - For each category, show:
    - Total family spending
    - Breakdown by user
    - Percentage per user
  - Visual: Stacked bar chart

- **Shared Views:**
  - Each user sees own data
  - Shared family analytics visible to all
  - Privacy controls (optional)

**API Endpoints:**
- `GET /api/financial/family/analytics` - Get family analytics
- `GET /api/financial/family/members` - Get family members
- `GET /api/financial/family/user-summary/:userId` - Get user summary

**Key Components:**
- `MultiUserAnalyticsSection` (existing)
- `FamilyOverviewCard` (new)
- `UserSummaryCard` (new)
- `TopSpenderCard` (new)
- `CategoryByUserChart` (new)

---

### 1.16 User Management Screen
**Route:** `/financial/users`  
**Purpose:** Manage family members and permissions

**Features:**
- **Invite User:**
  - Email address
  - Name
  - Role:
    - Owner (full access)
    - Admin (manage users, view all data)
    - Member (view own data, contribute to shared goals)
  - Send invitation email

- **User List:**
  - User name
  - Email
  - Role
  - Status (Active/Invited/Inactive)
  - Joined date
  - Actions:
    - Edit role
    - Remove user
    - Resend invitation

- **Permissions:**
  - Owner: Full control
  - Admin: Manage users, budgets, shared goals
  - Member: View own data, contribute to shared items

**API Endpoints:**
- `POST /api/financial/family/invite` - Invite member
- `GET /api/financial/family/members` - List members
- `PUT /api/financial/family/members/:id` - Update member role
- `DELETE /api/financial/family/members/:id` - Remove member
- `POST /api/financial/family/members/:id/resend-invite` - Resend invitation

**Key Components:**
- `UserManagementSection` (existing)
- `InviteUserForm` (new)
- `UserListTable` (new)
- `UserRoleSelector` (new)

---

### 1.17 AI Chat Assistant Screen
**Route:** `/financial/chat`  
**Purpose:** Conversational AI for financial advice and queries

**Features:**
- **Chat Interface:**
  - Message input
  - Chat history
  - Typing indicators
  - Message timestamps

- **AI Capabilities:**
  - Answer finance questions
  - Explain analytics
  - Suggest actions
  - Recommend optimizations
  - Provide insights
  - Calculate scenarios

- **Context-Aware:**
  - Uses user's financial data
  - Knows savings goals
  - Understands risks
  - References recent transactions

- **Example Queries:**
  - "How much can I save this month?"
  - "When will I reach my vacation savings goal?"
  - "What are my biggest expenses?"
  - "Should I pay off my loan early?"
  - "How can I reduce my grocery spending?"

- **Action Buttons:**
  - AI can suggest actions with buttons:
    - "Create Budget"
    - "Add to Savings"
    - "View Transactions"
    - "Apply Suggestion"

**API Endpoints:**
- `POST /api/financial/chat` (existing)
- `GET /api/financial/chat/history` - Get chat history
- `DELETE /api/financial/chat/history` - Clear chat history

**Key Components:**
- `AIChatSection` (existing)
- `ChatMessage` (new)
- `ChatInput` (new)
- `ActionButton` (new)

---

## 2. Core Data Models & Relationships

### 2.1 User & Family Models

```typescript
interface User {
  _id: string;
  email: string;
  name: string;
  family_group_id?: string;
  role: 'owner' | 'admin' | 'member';
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

interface UserProfile {
  age?: number;
  occupation?: string;
  income_level?: string;
  employment_status?: 'employed' | 'self-employed' | 'unemployed' | 'retired';
  marital_status?: 'single' | 'married' | 'divorced' | 'widowed';
  children?: Array<{
    age: number;
    name?: string;
  }>;
  dependents?: number;
  parents?: Array<{
    age: number;
    health_status?: 'good' | 'fair' | 'poor';
  }>;
  life_stage?: 'student' | 'young_professional' | 'mid_career' | 'pre_retirement' | 'retired';
  goals?: Array<'homeownership' | 'education' | 'retirement' | 'travel' | 'business'>;
}

interface FamilyGroup {
  _id: string;
  name: string;
  owner_id: string;
  members: FamilyMember[];
  created_at: string;
  updated_at: string;
}

interface FamilyMember {
  user_id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  status: 'active' | 'invited' | 'inactive';
  joined_at: string;
}
```

### 2.2 Transaction Models

```typescript
interface Transaction {
  _id: string;
  user_id: string;
  family_group_id?: string;
  type: 'earning' | 'expense';
  merchant_id: string;
  merchant_name: string;
  category_id: string;
  category_name: string;
  amount: number;
  currency: string;
  date: string;
  payment_method?: string;
  
  // Bill processing
  bill_image_url?: string;
  ocr_text?: string;
  parsing_output?: ParsedBillData;
  
  // Line items
  items?: TransactionItem[];
  
  // AI/ML
  confidence_category: number;
  confidence_ocr?: number;
  anomaly_flag: boolean;
  anomaly_reason?: string;
  duplicate_of?: string | null;
  
  // Status
  status: 'pending' | 'confirmed' | 'deleted';
  needs_confirmation: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
}

interface TransactionItem {
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

interface ParsedBillData {
  merchant: string;
  date: string;
  total: number;
  subtotal?: number;
  tax?: number;
  tip?: number;
  items?: Array<{
    name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}
```

### 2.3 Recurring Payment Models

```typescript
interface RecurringPayment {
  _id: string;
  user_id: string;
  family_group_id?: string;
  name: string;
  type: 'earning' | 'expense';
  amount: number;
  currency: string;
  
  // Frequency
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  custom_interval_days?: number;
  
  // Dates
  start_date: string;
  end_date?: string | null;
  next_occurrence: string;
  
  // Categorization
  category_id?: string;
  merchant_id?: string;
  
  // Variable amounts
  is_variable: boolean;
  variable_amounts?: Array<{
    date: string;
    amount: number;
  }>;
  
  // Status
  is_active: boolean;
  
  // Metadata
  created_at: string;
  updated_at: string;
}

interface UpcomingPayment {
  recurring_payment_id: string;
  name: string;
  type: 'earning' | 'expense';
  amount: number;
  due_date: string;
  days_until_due: number;
  category_name?: string;
  merchant_name?: string;
}

interface UpcomingPaymentsSummary {
  period: 'week' | 'month' | '3_months' | '6_months';
  total_upcoming_expenses: number;
  total_upcoming_earnings: number;
  net_upcoming: number;
  current_budget: number;
  remaining_after_upcoming: number;
  remaining_percentage: number;
  upcoming_payments: UpcomingPayment[];
}
```

### 2.4 Budget Models

```typescript
interface Budget {
  _id: string;
  user_id: string;
  family_group_id?: string;
  name: string;
  category_id: string | null; // null = overall budget
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  start_date: string;
  end_date: string | null;
  
  // Alerts
  alert_thresholds: {
    warning: number; // percentage (0-100)
    critical: number; // percentage (0-100)
  };
  
  // Metadata
  created_at: string;
  updated_at: string;
}

interface BudgetStatus {
  budget: Budget;
  current_spending: number;
  budget_amount: number;
  remaining: number;
  percentage_used: number;
  days_remaining: number;
  projected_spending?: number;
  projected_over_budget?: boolean;
  alert_level: 'ok' | 'warning' | 'critical' | 'exceeded';
  on_track: boolean;
  recommendations: string[];
}

interface CategoryCap {
  _id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  alert_at_percentage: number;
  current_spending: number;
  remaining: number;
  alert_triggered: boolean;
  created_at: string;
  updated_at: string;
}

interface BudgetAlert {
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

### 2.5 Savings Models

```typescript
interface SavingsGoal {
  _id: string;
  user_id: string;
  family_group_id?: string;
  name: string;
  description?: string;
  target_amount: number;
  current_amount: number;
  currency: string;
  deadline?: string;
  category?: string;
  
  // Sharing
  is_shared: boolean;
  contributors: Array<{
    user_id: string;
    name: string;
    contribution_amount: number;
    contribution_percentage: number;
  }>;
  
  // Auto-save
  auto_save_rules?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    amount: number;
    per_user?: boolean;
  };
  
  // Status
  status: 'active' | 'completed' | 'cancelled';
  
  // Metadata
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface SavingsContribution {
  _id: string;
  savings_goal_id: string;
  user_id: string;
  amount: number;
  note?: string;
  created_at: string;
}
```

### 2.6 Loan Models

```typescript
interface Loan {
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

interface LoanPayment {
  _id: string;
  loan_id: string;
  amount: number;
  payment_date: string;
  note?: string;
  created_at: string;
}

interface LoanSummary {
  total_borrowed: number;
  total_lent: number;
  total_borrowed_outstanding: number;
  total_lent_outstanding: number;
  active_loans_count: number;
  overdue_loans_count: number;
  loans: Loan[];
}
```

### 2.7 Shopping List Models (Non-Financial)

```typescript
interface ShoppingList {
  _id: string;
  user_id: string;
  name: string;
  description?: string;
  items: ShoppingItem[];
  created_at: string;
  updated_at: string;
}

interface ShoppingItem {
  _id: string;
  name: string;
  quantity?: number;
  notes?: string;
  completed: boolean;
  completed_at?: string;
  linked_transaction_id?: string; // Optional link after purchase
}
```

### 2.8 Analytics Models

```typescript
interface DashboardSummary {
  period: string;
  total_earnings: number;
  total_expenses: number;
  remaining_budget: number;
  total_loans_outstanding: number;
  total_savings: number;
  total_upcoming_payments_next_month: number;
  budget_projections: Array<{
    month: string;
    projected_income: number;
    projected_expenses: number;
    projected_balance: number;
  }>;
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
  top_categories: Array<{
    category_id: string;
    category_name: string;
    amount: number;
    percentage: number;
  }>;
}

interface FinancialForecast {
  savings_goals_timeline: Array<{
    goal_id: string;
    goal_name: string;
    target_amount: number;
    current_amount: number;
    months_to_reach: number;
    estimated_completion_date: string;
    based_on_earning_frequency: string;
  }>;
  loan_repayment_timeline: Array<{
    loan_id: string;
    counterparty_name: string;
    outstanding_balance: number;
    months_to_repay: number;
    estimated_payoff_date: string;
    total_interest: number;
    monthly_budget_impact: number;
  }>;
  budget_sustainability_score: number; // 0-100
  financial_stability_score: number; // 0-100
}

interface RiskAnalysis {
  financial_risks: Array<{
    type: 'cash_flow_gap' | 'overspending' | 'high_debt' | 'insufficient_emergency_fund' | 'single_income_source';
    severity: 'low' | 'medium' | 'high';
    description: string;
    recommendation: string;
  }>;
  money_loss_detection: {
    duplicate_charges: number;
    subscription_leaks: number;
    bank_fees: number;
    interest_charges: number;
    total_lost: number;
    details: Array<{
      type: string;
      amount: number;
      description: string;
    }>;
  };
  expense_anomalies: Array<{
    transaction_id: string;
    amount: number;
    category: string;
    merchant: string;
    reason: string;
    date: string;
  }>;
}

interface HealthRiskIndicators {
  financial_preparedness: {
    health_emergencies: {
      months_of_coverage: number;
      risk_level: 'low' | 'medium' | 'high';
    };
    job_loss: {
      months_of_runway: number;
      risk_level: 'low' | 'medium' | 'high';
    };
    other_hazards: {
      risk_level: 'low' | 'medium' | 'high';
    };
  };
  survival_calculator: {
    months_can_survive: number;
    based_on: {
      current_savings: number;
      emergency_fund: number;
      essential_expenses_monthly: number;
      liquid_assets: number;
    };
    breakdown_by_category: Array<{
      category: string;
      monthly_amount: number;
      is_essential: boolean;
    }>;
  };
}

interface ExpenseOptimization {
  suggestions: Array<{
    id: string;
    category: string;
    reason: string;
    estimated_savings_monthly: number;
    impact_level: 'low' | 'medium' | 'high';
    action_type: 'reduce' | 'eliminate' | 'replace';
    details: string;
  }>;
  non_essential_spending: {
    total_discretionary: number;
    total_wasteful: number;
    breakdown: Array<{
      category: string;
      amount: number;
      classification: 'essential' | 'important' | 'discretionary' | 'wasteful';
      percentage: number;
    }>;
  };
  high_impact_areas: Array<{
    category: string;
    current_spending: number;
    potential_savings: number;
    reduction_percentage: number;
    recommendations: string[];
  }>;
}

interface FutureExpensePrediction {
  predictions: Array<{
    id: string;
    type: 'education' | 'healthcare' | 'retirement' | 'housing' | 'other';
    title: string;
    description: string;
    estimated_amount: number;
    time_horizon_months: number;
    recommended_monthly_savings: number;
    based_on: string[]; // Profile factors
    priority: 'low' | 'medium' | 'high';
  }>;
}
```

---

## 3. Processing Flows

### 3.1 Bill Upload & Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    BILL UPLOAD FLOW                         │
└─────────────────────────────────────────────────────────────┘

Step 1: Transaction Type Selection
┌──────────────────────────────────┐
│  Select Transaction Type:        │
│  ┌──────────┐  ┌──────────┐     │
│  │ EXPENSE  │  │ EARNING  │     │
│  └──────────┘  └──────────┘     │
└──────────────────────────────────┘
         │
         ▼
Step 2: Upload Method Selection
┌──────────────────────────────────┐
│  Choose Upload Method:           │
│  • Camera Capture                │
│  • Manual Entry                  │
│  • File Upload (Single)          │
│  • Bulk Upload                   │
└──────────────────────────────────┘
         │
         ▼
Step 3: File Upload (if applicable)
┌──────────────────────────────────┐
│  Upload Files:                   │
│  • Drag & drop                   │
│  • Click to browse               │
│  • Multiple files allowed        │
│  • Formats: JPG, PNG, PDF, etc.  │
└──────────────────────────────────┘
         │
         ▼
Step 4: Backend Processing
┌──────────────────────────────────┐
│  POST /api/financial/bills/bulk  │
│  {                               │
│    type: "expense",              │
│    files: [File, File, ...]      │
│  }                               │
└──────────────────────────────────┘
         │
         ▼
Step 5: Job Queue
┌──────────────────────────────────┐
│  For each file:                  │
│  1. Store file in S3/storage     │
│  2. Create job record            │
│  3. Queue for OCR processing     │
│  4. Return job_ids               │
└──────────────────────────────────┘
         │
         ▼
Step 6: OCR & Parsing (Async)
┌──────────────────────────────────┐
│  For each job:                   │
│  1. OCR extraction               │
│  2. Text parsing (GPT/Claude)    │
│  3. Entity extraction:           │
│     - Merchant                   │
│     - Date                       │
│     - Total amount               │
│     - Line items                 │
│  4. Confidence scoring           │
└──────────────────────────────────┘
         │
         ▼
Step 7: Categorization & Validation
┌──────────────────────────────────┐
│  1. Merchant matching/creation   │
│  2. Category prediction (ML)     │
│  3. Duplicate detection          │
│  4. Anomaly detection            │
│  5. Update job status            │
└──────────────────────────────────┘
         │
         ▼
Step 8: Processing Status Table (Frontend)
┌─────────────────────────────────────────────────────────────┐
│ File Name    │ Type    │ Status      │ Amount │ Actions    │
├─────────────────────────────────────────────────────────────┤
│ receipt1.jpg │ Expense │ Extracted   │ $45.23 │ ✓ Confirm  │
│ receipt2.pdf │ Expense │ Pending     │ -      │ ⏳ Wait    │
│ receipt3.png │ Expense │ Needs Review│ $12.50 │ ✏️ Edit    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
Step 9: User Review & Confirmation
┌──────────────────────────────────┐
│  User can:                       │
│  • Edit extracted data           │
│  • Confirm transaction           │
│  • Reject document               │
│  • Add missing info              │
└──────────────────────────────────┘
         │
         ▼
Step 10: Transaction Creation
┌──────────────────────────────────┐
│  PUT /api/financial/bills/:id/   │
│      confirm                     │
│  {                               │
│    transaction_type: "expense",  │
│    confirmed_amount: 45.23,      │
│    confirmed_category: "food",   │
│    confirmed_merchant: "Walmart" │
│  }                               │
└──────────────────────────────────┘
         │
         ▼
Step 11: Transaction Confirmed
┌──────────────────────────────────┐
│  • Transaction created           │
│  • Status: "confirmed"           │
│  • Visible in Transactions list  │
│  • Analytics updated             │
│  • Budget impact calculated      │
└──────────────────────────────────┘
```

### 3.2 Recurring Payment Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│              RECURRING PAYMENT PROCESSING                   │
└─────────────────────────────────────────────────────────────┘

Step 1: Create Recurring Payment
┌──────────────────────────────────┐
│  POST /api/financial/recurring   │
│  {                               │
│    name: "Salary",               │
│    type: "earning",              │
│    amount: 5000,                 │
│    frequency: "monthly",         │
│    start_date: "2024-01-01",     │
│    category_id: "income"         │
│  }                               │
└──────────────────────────────────┘
         │
         ▼
Step 2: Calculate Next Occurrence
┌──────────────────────────────────┐
│  Based on frequency:             │
│  • Daily: +1 day                 │
│  • Weekly: +7 days               │
│  • Monthly: +1 month             │
│  • Yearly: +1 year               │
│  • Custom: +N days               │
└──────────────────────────────────┘
         │
         ▼
Step 3: Background Job (Cron/Scheduler)
┌──────────────────────────────────┐
│  Every day at midnight:          │
│  1. Query all active recurring   │
│     payments                     │
│  2. Check if next_occurrence     │
│     is today                     │
│  3. Generate transactions        │
└──────────────────────────────────┘
         │
         ▼
Step 4: Transaction Generation
┌──────────────────────────────────┐
│  For each due payment:           │
│  1. Create transaction           │
│  2. Set status: "confirmed"      │
│  3. Link to recurring_payment_id │
│  4. Update next_occurrence       │
└──────────────────────────────────┘
         │
         ▼
Step 5: Upcoming Payments Calculation
┌──────────────────────────────────┐
│  GET /api/financial/recurring/   │
│      upcoming                    │
│                                  │
│  For each active recurring:      │
│  1. Calculate occurrences in     │
│     next 7/30/90/180 days        │
│  2. Group by time period         │
│  3. Calculate budget impact      │
└──────────────────────────────────┘
         │
         ▼
Step 6: Display Upcoming Payments
┌──────────────────────────────────┐
│  Next Week:                      │
│  • Salary: $5,000 (in 3 days)    │
│  • Rent: -$1,500 (in 5 days)     │
│                                  │
│  Next Month:                     │
│  • Netflix: -$15 (in 10 days)    │
│  • Gym: -$50 (in 15 days)        │
│                                  │
│  Budget Impact:                  │
│  • Current: $10,000              │
│  • After upcoming: $13,435       │
└──────────────────────────────────┘
```

### 3.3 AI Analytics Processing Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  AI ANALYTICS FLOW                          │
└─────────────────────────────────────────────────────────────┘

Step 1: Data Collection
┌──────────────────────────────────┐
│  Gather user data:               │
│  • All transactions              │
│  • Recurring payments            │
│  • Budgets                       │
│  • Savings goals                 │
│  • Loans                         │
│  • User profile                  │
└──────────────────────────────────┘
         │
         ▼
Step 2: Financial Forecasts
┌──────────────────────────────────┐
│  Savings Goals Timeline:         │
│  • Calculate avg monthly savings │
│  • Project time to reach goal    │
│  • Factor in earning frequency   │
│                                  │
│  Loan Repayment Timeline:        │
│  • Calculate monthly payments    │
│  • Project payoff date           │
│  • Calculate total interest      │
│                                  │
│  Stability Scores:               │
│  • Income stability (variance)   │
│  • Expense consistency           │
│  • Savings rate                  │
│  • Debt-to-income ratio          │
└──────────────────────────────────┘
         │
         ▼
Step 3: Risk Analysis
┌──────────────────────────────────┐
│  Cash Flow Analysis:             │
│  • Identify gaps (income < exp)  │
│  • Detect overspending patterns  │
│                                  │
│  Money Loss Detection:           │
│  • Find duplicate charges        │
│  • Identify unused subscriptions │
│  • Calculate bank fees           │
│                                  │
│  Anomaly Detection:              │
│  • Statistical outliers          │
│  • Unusual patterns              │
│  • Out-of-character purchases    │
└──────────────────────────────────┘
         │
         ▼
Step 4: Survival Calculator
┌──────────────────────────────────┐
│  Calculate runway:               │
│  1. Sum all liquid assets        │
│  2. Identify essential expenses  │
│  3. Calculate monthly burn rate  │
│  4. Divide: assets / burn rate   │
│  5. Result: months can survive   │
└──────────────────────────────────┘
         │
         ▼
Step 5: Expense Optimization
┌──────────────────────────────────┐
│  AI Analysis (GPT/Claude):       │
│  • Identify high spending areas  │
│  • Compare to benchmarks         │
│  • Detect non-essential spending │
│  • Generate suggestions          │
│                                  │
│  Example:                        │
│  "You spend $200/mo on dining.   │
│   Reducing by 25% saves $50/mo.  │
│   Action: Set budget cap."       │
└──────────────────────────────────┘
         │
         ▼
Step 6: Future Expense Predictions
┌──────────────────────────────────┐
│  Based on user profile:          │
│                                  │
│  IF children exist:              │
│    → Predict education costs     │
│                                  │
│  IF parents exist:               │
│    → Predict care costs          │
│                                  │
│  IF age > 30:                    │
│    → Suggest retirement savings  │
│                                  │
│  IF goal = homeownership:        │
│    → Calculate down payment      │
└──────────────────────────────────┘
         │
         ▼
Step 7: Display Analytics
┌──────────────────────────────────┐
│  Render analytics screens with:  │
│  • Forecasts                     │
│  • Risk indicators               │
│  • Optimization suggestions      │
│  • Future predictions            │
│  • Action buttons                │
└──────────────────────────────────┘
```

---

## 4. API Endpoints (Complete List)

### 4.1 Bill Processing

```
POST   /api/financial/bills                    # Upload single bill
POST   /api/financial/bills/bulk               # Bulk upload with type
GET    /api/financial/bills/:id                # Get bill status
GET    /api/financial/bills/processing-status  # Get processing table
PUT    /api/financial/bills/:id/confirm        # Confirm extracted data
DELETE /api/financial/bills/:id/reject         # Reject document
GET    /api/financial/bills                    # List transactions (with filters)
```

### 4.2 Transactions

```
GET    /api/financial/transactions              # List all transactions
GET    /api/financial/transactions/pending      # List pending transactions
GET    /api/financial/transactions/:id          # Get single transaction
PUT    /api/financial/transactions/:id          # Update transaction
DELETE /api/financial/transactions/:id          # Delete transaction
POST   /api/financial/transactions/:id/merge    # Merge duplicate
POST   /api/financial/transactions/bulk-delete  # Bulk delete
POST   /api/financial/transactions/export       # Export to CSV/Excel
POST   /api/financial/transactions/manual       # Create manual transaction
PUT    /api/financial/transactions/:id/confirm  # Confirm pending transaction
POST   /api/financial/transactions/bulk-confirm # Bulk confirm
```

### 4.3 Transaction Items

```
GET    /api/financial/items                           # List all items (with filters)
GET    /api/financial/transactions/:id/items          # Get items for transaction
GET    /api/financial/items/:id                       # Get single item
PUT    /api/financial/items/:id                       # Update item
DELETE /api/financial/items/:id                       # Delete item
```

### 4.4 Merchants

```
GET    /api/financial/merchants                       # List all merchants
GET    /api/financial/merchants/:id                   # Get merchant details
PUT    /api/financial/merchants/:id                   # Update merchant
GET    /api/financial/merchants/:id/transactions      # Get merchant transactions
GET    /api/financial/merchants/:id/items             # Get merchant items
GET    /api/financial/merchants/:id/analytics         # Get merchant analytics
```

### 4.5 Categories

```
GET    /api/financial/categories                      # List all categories
POST   /api/financial/categories                      # Create category
GET    /api/financial/categories/:id                  # Get category details
PUT    /api/financial/categories/:id                  # Update category
DELETE /api/financial/categories/:id                  # Delete category
GET    /api/financial/categories/:id/transactions     # Get category transactions
GET    /api/financial/categories/:id/analytics        # Get category analytics
GET    /api/financial/categories/:id/trends           # Get time-based trends
```

### 4.6 Recurring Payments

```
POST   /api/financial/recurring                       # Create recurring payment
GET    /api/financial/recurring                       # List recurring payments
GET    /api/financial/recurring/:id                   # Get recurring payment
PUT    /api/financial/recurring/:id                   # Update recurring payment
DELETE /api/financial/recurring/:id                   # Delete recurring payment
PUT    /api/financial/recurring/:id/pause             # Pause recurring payment
GET    /api/financial/recurring/:id/history           # View generated transactions
GET    /api/financial/recurring/upcoming              # Get upcoming payments
GET    /api/financial/recurring/upcoming-summary      # Get summary with budget impact
```

### 4.7 Budgets

```
POST   /api/financial/budgets                         # Create budget
GET    /api/financial/budgets                         # List budgets
GET    /api/financial/budgets/:id                     # Get budget
GET    /api/financial/budgets/:id/status              # Get budget status
PUT    /api/financial/budgets/:id                     # Update budget
DELETE /api/financial/budgets/:id                     # Delete budget
GET    /api/financial/budgets/status-stream           # SSE stream for real-time updates
```

### 4.8 Category Caps

```
POST   /api/financial/budgets/category-caps           # Create category cap
GET    /api/financial/budgets/category-caps           # List category caps
GET    /api/financial/budgets/category-caps/:id       # Get category cap
PUT    /api/financial/budgets/category-caps/:id       # Update category cap
DELETE /api/financial/budgets/category-caps/:id       # Delete category cap
```

### 4.9 Alerts

```
GET    /api/financial/budgets/alerts                  # List alerts
GET    /api/financial/budgets/alerts/:id              # Get alert
PUT    /api/financial/budgets/alerts/:id/read         # Mark alert as read
PUT    /api/financial/budgets/alerts/read-all         # Mark all alerts as read
DELETE /api/financial/budgets/alerts/:id              # Delete alert
```

### 4.10 Savings

```
POST   /api/financial/savings                         # Create savings goal
GET    /api/financial/savings                         # List savings goals
GET    /api/financial/savings/:id                     # Get savings goal
PUT    /api/financial/savings/:id                     # Update savings goal
DELETE /api/financial/savings/:id                     # Delete savings goal
POST   /api/financial/savings/:id/contribute          # Add contribution
GET    /api/financial/savings/:id/contributions       # Get contribution history
GET    /api/financial/savings/:id/contributors        # Get contributors
```

### 4.11 Loans

```
POST   /api/financial/loans                           # Create loan
GET    /api/financial/loans                           # List loans
GET    /api/financial/loans/summary                   # Get loan summary
GET    /api/financial/loans/:id                       # Get loan
PUT    /api/financial/loans/:id                       # Update loan
DELETE /api/financial/loans/:id                       # Delete loan
POST   /api/financial/loans/:id/payment               # Record payment
GET    /api/financial/loans/:id/payments              # Get payment history
GET    /api/financial/loans/:id/amortization          # Get amortization schedule
```

### 4.12 Shopping Lists (Non-Financial)

```
POST   /api/financial/shopping-lists                  # Create shopping list
GET    /api/financial/shopping-lists                  # List shopping lists
GET    /api/financial/shopping-lists/:id              # Get shopping list
PUT    /api/financial/shopping-lists/:id              # Update shopping list
DELETE /api/financial/shopping-lists/:id              # Delete shopping list
POST   /api/financial/shopping-lists/:id/items        # Add item
PUT    /api/financial/shopping-lists/:id/items/:itemId # Update item
DELETE /api/financial/shopping-lists/:id/items/:itemId # Remove item
```

### 4.13 Analytics

```
GET    /api/financial/analytics/dashboard-summary     # Dashboard overview
GET    /api/financial/analytics/summary               # Spending summary
GET    /api/financial/analytics/trends                # Spending trends
GET    /api/financial/analytics/anomalies             # Anomalies
GET    /api/financial/analytics/forecasts             # Financial forecasts
GET    /api/financial/analytics/risks                 # Risk analysis
GET    /api/financial/analytics/stability-score       # Stability metrics
GET    /api/financial/analytics/survival-calculator   # Survival timeline
```

### 4.14 Expense Optimization

```
GET    /api/financial/optimization/suggestions        # Get AI suggestions
POST   /api/financial/optimization/apply              # Apply suggestion
POST   /api/financial/optimization/ignore             # Ignore suggestion
GET    /api/financial/optimization/non-essential      # Get non-essential breakdown
GET    /api/financial/optimization/high-impact        # Get high-impact areas
```

### 4.15 User Profiles & Predictions

```
GET    /api/financial/users/profile                   # Get user profile
PUT    /api/financial/users/profile                   # Update user profile
GET    /api/financial/predictions/future-expenses     # Get AI predictions
POST   /api/financial/predictions/apply               # Apply prediction to savings
POST   /api/financial/predictions/dismiss             # Dismiss prediction
```

### 4.16 Family & Multi-User

```
GET    /api/financial/family                          # Get family group
POST   /api/financial/family/invite                   # Invite member
GET    /api/financial/family/members                  # List members
PUT    /api/financial/family/members/:id              # Update member role
DELETE /api/financial/family/members/:id              # Remove member
POST   /api/financial/family/members/:id/resend-invite # Resend invitation
GET    /api/financial/family/analytics                # Get family analytics
GET    /api/financial/family/user-summary/:userId     # Get user summary
```

### 4.17 AI Chat

```
POST   /api/financial/chat                            # Send chat message
GET    /api/financial/chat/history                    # Get chat history
DELETE /api/financial/chat/history                    # Clear chat history
```

### 4.18 Model Management

```
GET    /api/financial/model/status                    # Get model status
POST   /api/financial/model/reload                    # Reload model
POST   /api/financial/retrain                         # Trigger retraining
POST   /api/financial/feedback                        # Submit feedback
```

---

## 5. Frontend Code Examples

### 5.1 Transaction Type Selector Component

```typescript
// src/components/financial/TransactionTypeSelector.tsx

import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

interface TransactionTypeSelectorProps {
  onSelect: (type: 'earning' | 'expense') => void;
  selected?: 'earning' | 'expense';
}

export default function TransactionTypeSelector({ 
  onSelect, 
  selected 
}: TransactionTypeSelectorProps) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Step 1: Select Transaction Type
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Choose whether this is an earning or expense before uploading
      </Typography>
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          variant={selected === 'expense' ? 'contained' : 'outlined'}
          color="error"
          size="large"
          startIcon={<TrendingDownIcon />}
          onClick={() => onSelect('expense')}
          sx={{ flex: 1, py: 2 }}
        >
          Expense
        </Button>
        <Button
          variant={selected === 'earning' ? 'contained' : 'outlined'}
          color="success"
          size="large"
          startIcon={<TrendingUpIcon />}
          onClick={() => onSelect('earning')}
          sx={{ flex: 1, py: 2 }}
        >
          Earning
        </Button>
      </Box>
    </Box>
  );
}
```

### 5.2 Processing Status Table Component

```typescript
// src/components/financial/ProcessingStatusTable.tsx

import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  Select,
  MenuItem,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';

interface ProcessingJob {
  id: string;
  file_name: string;
  type: 'earning' | 'expense';
  status: 'pending' | 'processing' | 'extracted' | 'needs_review' | 'confirmed' | 'rejected';
  extracted_data?: {
    amount?: number;
    merchant?: string;
    category?: string;
    date?: string;
  };
  confidence?: number;
}

interface ProcessingStatusTableProps {
  jobs: ProcessingJob[];
  categories: Array<{ _id: string; category_name: string }>;
  onConfirm: (jobId: string, data: any) => void;
  onReject: (jobId: string) => void;
  onEdit: (jobId: string, field: string, value: any) => void;
}

export default function ProcessingStatusTable({
  jobs,
  categories,
  onConfirm,
  onReject,
  onEdit,
}: ProcessingStatusTableProps) {
  const [editingJob, setEditingJob] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
      case 'processing':
        return 'info';
      case 'extracted':
        return 'success';
      case 'needs_review':
        return 'warning';
      case 'confirmed':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const handleEdit = (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (job) {
      setEditingJob(jobId);
      setEditedData({
        amount: job.extracted_data?.amount || '',
        merchant: job.extracted_data?.merchant || '',
        category: job.extracted_data?.category || '',
        date: job.extracted_data?.date || '',
      });
    }
  };

  const handleSave = (jobId: string) => {
    onConfirm(jobId, editedData);
    setEditingJob(null);
    setEditedData({});
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>File Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Amount</TableCell>
            <TableCell>Merchant</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Date</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {jobs.map((job) => {
            const isEditing = editingJob === job.id;
            const canEdit = ['extracted', 'needs_review'].includes(job.status);
            const canConfirm = ['extracted', 'needs_review'].includes(job.status);

            return (
              <TableRow key={job.id}>
                <TableCell>{job.file_name}</TableCell>
                <TableCell>
                  <Chip
                    label={job.type}
                    color={job.type === 'earning' ? 'success' : 'error'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={getStatusLabel(job.status)}
                    color={getStatusColor(job.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      size="small"
                      type="number"
                      value={editedData.amount}
                      onChange={(e) =>
                        setEditedData({ ...editedData, amount: parseFloat(e.target.value) })
                      }
                    />
                  ) : (
                    job.extracted_data?.amount ? `$${job.extracted_data.amount.toFixed(2)}` : '-'
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      size="small"
                      value={editedData.merchant}
                      onChange={(e) =>
                        setEditedData({ ...editedData, merchant: e.target.value })
                      }
                    />
                  ) : (
                    job.extracted_data?.merchant || '-'
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <Select
                      size="small"
                      value={editedData.category}
                      onChange={(e) =>
                        setEditedData({ ...editedData, category: e.target.value })
                      }
                    >
                      {categories.map((cat) => (
                        <MenuItem key={cat._id} value={cat._id}>
                          {cat.category_name}
                        </MenuItem>
                      ))}
                    </Select>
                  ) : (
                    job.extracted_data?.category || '-'
                  )}
                </TableCell>
                <TableCell>
                  {isEditing ? (
                    <TextField
                      size="small"
                      type="date"
                      value={editedData.date}
                      onChange={(e) =>
                        setEditedData({ ...editedData, date: e.target.value })
                      }
                    />
                  ) : (
                    job.extracted_data?.date || '-'
                  )}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {job.status === 'pending' || job.status === 'processing' ? (
                      <CircularProgress size={20} />
                    ) : isEditing ? (
                      <>
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleSave(job.id)}
                        >
                          <CheckIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => setEditingJob(null)}
                        >
                          <CloseIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        {canEdit && (
                          <IconButton
                            size="small"
                            onClick={() => handleEdit(job.id)}
                          >
                            <EditIcon />
                          </IconButton>
                        )}
                        {canConfirm && (
                          <>
                            <IconButton
                              size="small"
                              color="success"
                              onClick={() => onConfirm(job.id, job.extracted_data)}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => onReject(job.id)}
                            >
                              <CloseIcon />
                            </IconButton>
                          </>
                        )}
                      </>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
```

### 5.3 Upcoming Payments Summary Component

```typescript
// src/components/financial/UpcomingPaymentsSummary.tsx

import React from 'react';
import { Box, Card, CardContent, Typography, Chip, LinearProgress } from '@mui/material';
import { UpcomingPaymentsSummary as SummaryType } from '../../types/financial';

interface UpcomingPaymentsSummaryProps {
  summary: SummaryType;
  period: 'week' | 'month' | '3_months' | '6_months';
}

export default function UpcomingPaymentsSummary({ 
  summary, 
  period 
}: UpcomingPaymentsSummaryProps) {
  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'Next Week';
      case 'month': return 'Next Month';
      case '3_months': return 'Next 3 Months';
      case '6_months': return 'Next 6 Months';
    }
  };

  const remainingPercentage = summary.remaining_percentage;
  const isNegative = summary.remaining_after_upcoming < 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {getPeriodLabel()} - Budget Impact
        </Typography>

        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Current Budget
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              ${summary.current_budget.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="success.main">
              Upcoming Earnings
            </Typography>
            <Typography variant="body2" color="success.main" fontWeight="bold">
              +${summary.total_upcoming_earnings.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="error.main">
              Upcoming Expenses
            </Typography>
            <Typography variant="body2" color="error.main" fontWeight="bold">
              -${summary.total_upcoming_expenses.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Net Impact
            </Typography>
            <Typography 
              variant="body2" 
              fontWeight="bold"
              color={summary.net_upcoming >= 0 ? 'success.main' : 'error.main'}
            >
              {summary.net_upcoming >= 0 ? '+' : ''}${summary.net_upcoming.toFixed(2)}
            </Typography>
          </Box>

          <Box sx={{ borderTop: 1, borderColor: 'divider', pt: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body1" fontWeight="bold">
                Remaining After
              </Typography>
              <Typography 
                variant="body1" 
                fontWeight="bold"
                color={isNegative ? 'error.main' : 'success.main'}
              >
                ${summary.remaining_after_upcoming.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Budget Remaining
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {remainingPercentage.toFixed(1)}%
            </Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={Math.max(0, Math.min(100, remainingPercentage))}
            color={isNegative ? 'error' : remainingPercentage < 20 ? 'warning' : 'success'}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {isNegative && (
          <Box sx={{ mt: 2 }}>
            <Chip 
              label="⚠️ Insufficient Budget" 
              color="error" 
              size="small" 
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## 6. Backend Code Examples

### 6.1 Bulk Upload Endpoint

```python
# backend/routes/bills.py

from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime

bills_bp = Blueprint('bills', __name__)

@bills_bp.route('/api/financial/bills/bulk', methods=['POST'])
@require_auth
def bulk_upload_bills(current_user):
    """
    Bulk upload bills with transaction type
    """
    # Get transaction type from form data
    transaction_type = request.form.get('type')
    if not transaction_type or transaction_type not in ['earning', 'expense']:
        return jsonify({
            'success': False,
            'error': 'Transaction type (earning/expense) is required'
        }), 400
    
    # Get uploaded files
    files = request.files.getlist('files')
    if not files:
        return jsonify({
            'success': False,
            'error': 'No files provided'
        }), 400
    
    # Validate file formats
    allowed_extensions = {'jpg', 'jpeg', 'png', 'heic', 'pdf', 'xlsx', 'xls', 'csv'}
    jobs = []
    
    for file in files:
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            if file_ext not in allowed_extensions:
                return jsonify({
                    'success': False,
                    'error': f'Unsupported file format: {file_ext}'
                }), 400
            
            # Generate unique job ID
            job_id = str(uuid.uuid4())
            
            # Save file to storage (S3/local)
            file_path = save_file_to_storage(file, current_user.id, job_id)
            
            # Create job record
            job = {
                'id': job_id,
                'user_id': current_user.id,
                'file_name': filename,
                'file_path': file_path,
                'type': transaction_type,
                'status': 'pending',
                'created_at': datetime.utcnow().isoformat()
            }
            
            # Save to database
            db.processing_jobs.insert_one(job)
            
            # Queue for processing
            queue_ocr_job(job_id)
            
            jobs.append({
                'job_id': job_id,
                'file_name': filename,
                'type': transaction_type,
                'status': 'pending'
            })
    
    return jsonify({
        'success': True,
        'jobs': jobs,
        'message': f'{len(jobs)} files queued for processing'
    }), 200


@bills_bp.route('/api/financial/bills/processing-status', methods=['GET'])
@require_auth
def get_processing_status(current_user):
    """
    Get processing status for all user's jobs
    """
    jobs = db.processing_jobs.find({
        'user_id': current_user.id,
        'status': {'$in': ['pending', 'processing', 'extracted', 'needs_review']}
    }).sort('created_at', -1)
    
    result = []
    for job in jobs:
        result.append({
            'id': job['id'],
            'file_name': job['file_name'],
            'type': job['type'],
            'status': job['status'],
            'extracted_data': job.get('extracted_data'),
            'confidence': job.get('confidence'),
            'created_at': job['created_at']
        })
    
    return jsonify({
        'success': True,
        'jobs': result
    }), 200


@bills_bp.route('/api/financial/bills/<job_id>/confirm', methods=['PUT'])
@require_auth
def confirm_bill(current_user, job_id):
    """
    Confirm extracted data and create transaction
    """
    data = request.json
    
    # Get job
    job = db.processing_jobs.find_one({'id': job_id, 'user_id': current_user.id})
    if not job:
        return jsonify({'success': False, 'error': 'Job not found'}), 404
    
    # Create transaction
    transaction = {
        '_id': str(uuid.uuid4()),
        'user_id': current_user.id,
        'type': job['type'],
        'amount': data.get('confirmed_amount') or job['extracted_data']['amount'],
        'merchant_name': data.get('confirmed_merchant') or job['extracted_data']['merchant'],
        'category_id': data.get('confirmed_category') or job['extracted_data']['category'],
        'date': data.get('confirmed_date') or job['extracted_data']['date'],
        'bill_image_url': job['file_path'],
        'status': 'confirmed',
        'created_at': datetime.utcnow().isoformat()
    }
    
    db.transactions.insert_one(transaction)
    
    # Update job status
    db.processing_jobs.update_one(
        {'id': job_id},
        {'$set': {'status': 'confirmed', 'transaction_id': transaction['_id']}}
    )
    
    return jsonify({
        'success': True,
        'transaction': transaction,
        'message': 'Transaction created successfully'
    }), 200
```

### 6.2 Upcoming Payments Calculation

```python
# backend/routes/recurring.py

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

recurring_bp = Blueprint('recurring', __name__)

@recurring_bp.route('/api/financial/recurring/upcoming-summary', methods=['GET'])
@require_auth
def get_upcoming_summary(current_user):
    """
    Calculate upcoming payments and budget impact
    """
    period = request.args.get('period', 'month')  # week, month, 3_months, 6_months
    
    # Calculate date range
    today = datetime.utcnow().date()
    if period == 'week':
        end_date = today + timedelta(days=7)
    elif period == 'month':
        end_date = today + timedelta(days=30)
    elif period == '3_months':
        end_date = today + timedelta(days=90)
    elif period == '6_months':
        end_date = today + timedelta(days=180)
    else:
        end_date = today + timedelta(days=30)
    
    # Get all active recurring payments
    recurring_payments = db.recurring_payments.find({
        'user_id': current_user.id,
        'is_active': True
    })
    
    upcoming_payments = []
    total_upcoming_expenses = 0
    total_upcoming_earnings = 0
    
    for payment in recurring_payments:
        # Calculate occurrences in date range
        occurrences = calculate_occurrences(
            payment['next_occurrence'],
            payment['frequency'],
            payment.get('custom_interval_days'),
            end_date
        )
        
        for occurrence_date in occurrences:
            amount = get_payment_amount(payment, occurrence_date)
            days_until = (occurrence_date - today).days
            
            upcoming_payments.append({
                'recurring_payment_id': payment['_id'],
                'name': payment['name'],
                'type': payment['type'],
                'amount': amount,
                'due_date': occurrence_date.isoformat(),
                'days_until_due': days_until,
                'category_name': get_category_name(payment.get('category_id')),
                'merchant_name': get_merchant_name(payment.get('merchant_id'))
            })
            
            if payment['type'] == 'expense':
                total_upcoming_expenses += amount
            else:
                total_upcoming_earnings += amount
    
    # Sort by due date
    upcoming_payments.sort(key=lambda x: x['due_date'])
    
    # Calculate budget impact
    current_budget = calculate_current_budget(current_user.id)
    net_upcoming = total_upcoming_earnings - total_upcoming_expenses
    remaining_after_upcoming = current_budget + net_upcoming
    remaining_percentage = (remaining_after_upcoming / current_budget * 100) if current_budget > 0 else 0
    
    return jsonify({
        'success': True,
        'period': period,
        'total_upcoming_expenses': total_upcoming_expenses,
        'total_upcoming_earnings': total_upcoming_earnings,
        'net_upcoming': net_upcoming,
        'current_budget': current_budget,
        'remaining_after_upcoming': remaining_after_upcoming,
        'remaining_percentage': remaining_percentage,
        'upcoming_payments': upcoming_payments
    }), 200


def calculate_occurrences(start_date, frequency, custom_days, end_date):
    """
    Calculate all occurrences of a recurring payment in date range
    """
    occurrences = []
    current_date = datetime.fromisoformat(start_date).date()
    
    while current_date <= end_date:
        occurrences.append(current_date)
        
        if frequency == 'daily':
            current_date += timedelta(days=1)
        elif frequency == 'weekly':
            current_date += timedelta(days=7)
        elif frequency == 'monthly':
            current_date += relativedelta(months=1)
        elif frequency == 'yearly':
            current_date += relativedelta(years=1)
        elif frequency == 'custom' and custom_days:
            current_date += timedelta(days=custom_days)
        else:
            break
    
    return occurrences


def get_payment_amount(payment, occurrence_date):
    """
    Get amount for a specific occurrence (handles variable amounts)
    """
    if payment.get('is_variable') and payment.get('variable_amounts'):
        # Find matching variable amount
        for var_amount in payment['variable_amounts']:
            if var_amount['date'] == occurrence_date.isoformat():
                return var_amount['amount']
    
    return payment['amount']
```

### 6.3 AI Analytics - Survival Calculator

```python
# backend/routes/analytics.py

from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/api/financial/analytics/survival-calculator', methods=['GET'])
@require_auth
def survival_calculator(current_user):
    """
    Calculate how long user can survive if income stops
    """
    # Get all liquid assets
    current_savings = get_total_savings(current_user.id)
    emergency_fund = get_emergency_fund(current_user.id)
    liquid_assets = current_savings + emergency_fund
    
    # Get essential expenses
    essential_expenses = calculate_essential_expenses(current_user.id)
    
    # Calculate monthly burn rate
    monthly_burn_rate = sum(exp['monthly_amount'] for exp in essential_expenses)
    
    # Calculate months can survive
    if monthly_burn_rate > 0:
        months_can_survive = liquid_assets / monthly_burn_rate
    else:
        months_can_survive = float('inf')
    
    return jsonify({
        'success': True,
        'months_can_survive': round(months_can_survive, 1),
        'based_on': {
            'current_savings': current_savings,
            'emergency_fund': emergency_fund,
            'liquid_assets': liquid_assets,
            'essential_expenses_monthly': monthly_burn_rate
        },
        'breakdown_by_category': essential_expenses
    }), 200


def calculate_essential_expenses(user_id):
    """
    Calculate essential monthly expenses by category
    """
    # Get last 3 months of transactions
    three_months_ago = datetime.utcnow() - timedelta(days=90)
    
    transactions = db.transactions.find({
        'user_id': user_id,
        'type': 'expense',
        'status': 'confirmed',
        'date': {'$gte': three_months_ago.isoformat()}
    })
    
    # Essential categories
    essential_categories = [
        'Housing', 'Utilities', 'Groceries', 'Healthcare', 
        'Insurance', 'Transportation', 'Debt Payments'
    ]
    
    category_totals = {}
    for transaction in transactions:
        category_name = get_category_name(transaction['category_id'])
        if category_name in essential_categories:
            if category_name not in category_totals:
                category_totals[category_name] = 0
            category_totals[category_name] += transaction['amount']
    
    # Calculate monthly average
    breakdown = []
    for category, total in category_totals.items():
        monthly_avg = total / 3  # 3 months average
        breakdown.append({
            'category': category,
            'monthly_amount': round(monthly_avg, 2),
            'is_essential': True
        })
    
    return breakdown
```

---

## 7. AI Analytics Logic Outline

### 7.1 Financial Stability Score Calculation

```python
def calculate_financial_stability_score(user_id):
    """
    Calculate financial stability score (0-100)
    
    Factors:
    - Income stability (30%): Variance in monthly income
    - Expense consistency (20%): Variance in monthly expenses
    - Savings rate (25%): Percentage of income saved
    - Debt-to-income ratio (25%): Total debt / annual income
    """
    # Get last 12 months data
    income_data = get_monthly_income(user_id, months=12)
    expense_data = get_monthly_expenses(user_id, months=12)
    savings_data = get_savings_rate(user_id)
    debt_data = get_debt_to_income_ratio(user_id)
    
    # Calculate income stability (lower variance = higher score)
    income_variance = calculate_variance(income_data)
    income_score = max(0, 100 - (income_variance * 10))
    
    # Calculate expense consistency (lower variance = higher score)
    expense_variance = calculate_variance(expense_data)
    expense_score = max(0, 100 - (expense_variance * 10))
    
    # Calculate savings rate score
    savings_rate = savings_data['rate']
    if savings_rate >= 20:
        savings_score = 100
    elif savings_rate >= 10:
        savings_score = 70
    elif savings_rate >= 5:
        savings_score = 40
    else:
        savings_score = 20
    
    # Calculate debt score (lower debt = higher score)
    debt_ratio = debt_data['ratio']
    if debt_ratio <= 0.2:
        debt_score = 100
    elif debt_ratio <= 0.4:
        debt_score = 70
    elif debt_ratio <= 0.6:
        debt_score = 40
    else:
        debt_score = 20
    
    # Weighted average
    stability_score = (
        income_score * 0.30 +
        expense_score * 0.20 +
        savings_score * 0.25 +
        debt_score * 0.25
    )
    
    return round(stability_score, 1)
```

### 7.2 Expense Optimization AI

```python
def generate_expense_optimization_suggestions(user_id):
    """
    Use AI to generate expense cutting suggestions
    """
    # Get user's spending data
    spending_data = get_spending_by_category(user_id, months=3)
    income_data = get_monthly_income(user_id, months=3)
    
    # Get benchmarks (average spending for similar users)
    benchmarks = get_spending_benchmarks(user_id)
    
    suggestions = []
    
    for category, amount in spending_data.items():
        benchmark = benchmarks.get(category, 0)
        
        # If spending is significantly above benchmark
        if amount > benchmark * 1.3:
            potential_savings = amount - benchmark
            
            # Generate AI suggestion using GPT
            prompt = f"""
            User is spending ${amount:.2f}/month on {category}.
            Average for similar users is ${benchmark:.2f}/month.
            Generate a specific, actionable suggestion to reduce this expense.
            Include estimated savings and impact level.
            """
            
            ai_response = call_gpt(prompt)
            
            suggestions.append({
                'id': str(uuid.uuid4()),
                'category': category,
                'reason': ai_response['reason'],
                'estimated_savings_monthly': potential_savings,
                'impact_level': ai_response['impact_level'],
                'action_type': ai_response['action_type'],
                'details': ai_response['details']
            })
    
    # Detect unused subscriptions
    subscriptions = detect_unused_subscriptions(user_id)
    for sub in subscriptions:
        suggestions.append({
            'id': str(uuid.uuid4()),
            'category': 'Subscriptions',
            'reason': f'Unused subscription: {sub["name"]}',
            'estimated_savings_monthly': sub['amount'],
            'impact_level': 'low',
            'action_type': 'eliminate',
            'details': f'Cancel {sub["name"]} subscription to save ${sub["amount"]}/month'
        })
    
    # Sort by potential savings
    suggestions.sort(key=lambda x: x['estimated_savings_monthly'], reverse=True)
    
    return suggestions
```

### 7.3 Future Expense Predictions

```python
def generate_future_expense_predictions(user_id):
    """
    Generate AI-driven future expense predictions based on user profile
    """
    user_profile = get_user_profile(user_id)
    predictions = []
    
    # Education expenses for children
    if user_profile.get('children'):
        for child in user_profile['children']:
            years_until_college = max(0, 18 - child['age'])
            if years_until_college <= 15:
                estimated_cost = 50000  # Average college cost
                monthly_savings = estimated_cost / (years_until_college * 12)
                
                predictions.append({
                    'id': str(uuid.uuid4()),
                    'type': 'education',
                    'title': f'College Fund for Child (Age {child["age"]})',
                    'description': f'Your child will need college funds in {years_until_college} years.',
                    'estimated_amount': estimated_cost,
                    'time_horizon_months': years_until_college * 12,
                    'recommended_monthly_savings': round(monthly_savings, 2),
                    'based_on': ['children_age', 'education_costs'],
                    'priority': 'high' if years_until_college <= 5 else 'medium'
                })
    
    # Retirement savings
    if user_profile.get('age'):
        age = user_profile['age']
        if age >= 30 and age < 65:
            years_until_retirement = 65 - age
            current_savings = get_retirement_savings(user_id)
            target_savings = 1000000  # Target retirement fund
            gap = target_savings - current_savings
            monthly_savings = gap / (years_until_retirement * 12)
            
            predictions.append({
                'id': str(uuid.uuid4()),
                'type': 'retirement',
                'title': 'Retirement Savings',
                'description': f'You have {years_until_retirement} years until retirement.',
                'estimated_amount': gap,
                'time_horizon_months': years_until_retirement * 12,
                'recommended_monthly_savings': round(monthly_savings, 2),
                'based_on': ['age', 'retirement_target'],
                'priority': 'high' if age >= 50 else 'medium'
            })
    
    # Parent care expenses
    if user_profile.get('parents'):
        for parent in user_profile['parents']:
            if parent['age'] >= 65:
                estimated_annual_care = 30000
                years_of_care = 10
                total_cost = estimated_annual_care * years_of_care
                monthly_savings = total_cost / (years_of_care * 12)
                
                predictions.append({
                    'id': str(uuid.uuid4()),
                    'type': 'healthcare',
                    'title': f'Parent Care Fund (Age {parent["age"]})',
                    'description': 'Your parents may need medical/care support.',
                    'estimated_amount': total_cost,
                    'time_horizon_months': years_of_care * 12,
                    'recommended_monthly_savings': round(monthly_savings, 2),
                    'based_on': ['parent_age', 'healthcare_costs'],
                    'priority': 'medium'
                })
    
    # Homeownership
    if 'homeownership' in user_profile.get('goals', []):
        current_savings = get_total_savings(user_id)
        down_payment_target = 60000  # 20% of $300k home
        gap = down_payment_target - current_savings
        
        if gap > 0:
            # Calculate based on current savings rate
            monthly_savings_rate = get_monthly_savings_rate(user_id)
            months_to_goal = gap / monthly_savings_rate if monthly_savings_rate > 0 else 36
            
            predictions.append({
                'id': str(uuid.uuid4()),
                'type': 'housing',
                'title': 'Home Down Payment',
                'description': f'You can afford a home in {round(months_to_goal/12, 1)} years.',
                'estimated_amount': gap,
                'time_horizon_months': round(months_to_goal),
                'recommended_monthly_savings': round(monthly_savings_rate, 2),
                'based_on': ['homeownership_goal', 'current_savings'],
                'priority': 'high'
            })
    
    return predictions
```

---

## 8. Database Schema

### 8.1 MongoDB Collections

```javascript
// users collection
{
  _id: ObjectId,
  email: String,
  name: String,
  password_hash: String,
  family_group_id: ObjectId (optional),
  role: String, // 'owner', 'admin', 'member'
  profile: {
    age: Number,
    occupation: String,
    income_level: String,
    employment_status: String,
    marital_status: String,
    children: [{
      age: Number,
      name: String
    }],
    dependents: Number,
    parents: [{
      age: Number,
      health_status: String
    }],
    life_stage: String,
    goals: [String]
  },
  created_at: ISODate,
  updated_at: ISODate
}

// family_groups collection
{
  _id: ObjectId,
  name: String,
  owner_id: ObjectId,
  members: [{
    user_id: ObjectId,
    name: String,
    email: String,
    role: String,
    status: String, // 'active', 'invited', 'inactive'
    joined_at: ISODate
  }],
  created_at: ISODate,
  updated_at: ISODate
}

// transactions collection
{
  _id: ObjectId,
  user_id: ObjectId,
  family_group_id: ObjectId (optional),
  type: String, // 'earning', 'expense'
  merchant_id: ObjectId,
  merchant_name: String,
  category_id: ObjectId,
  category_name: String,
  amount: Number,
  currency: String,
  date: ISODate,
  payment_method: String,
  bill_image_url: String,
  ocr_text: String,
  parsing_output: Object,
  items: [{
    _id: ObjectId,
    name: String,
    quantity: Number,
    unit_price: Number,
    total_price: Number,
    category: String
  }],
  confidence_category: Number,
  confidence_ocr: Number,
  anomaly_flag: Boolean,
  anomaly_reason: String,
  duplicate_of: ObjectId (optional),
  status: String, // 'pending', 'confirmed', 'deleted'
  needs_confirmation: Boolean,
  created_at: ISODate,
  updated_at: ISODate,
  confirmed_at: ISODate
}

// recurring_payments collection
{
  _id: ObjectId,
  user_id: ObjectId,
  family_group_id: ObjectId (optional),
  name: String,
  type: String, // 'earning', 'expense'
  amount: Number,
  currency: String,
  frequency: String, // 'daily', 'weekly', 'monthly', 'yearly', 'custom'
  custom_interval_days: Number,
  start_date: ISODate,
  end_date: ISODate (optional),
  next_occurrence: ISODate,
  category_id: ObjectId,
  merchant_id: ObjectId,
  is_variable: Boolean,
  variable_amounts: [{
    date: ISODate,
    amount: Number
  }],
  is_active: Boolean,
  created_at: ISODate,
  updated_at: ISODate
}

// budgets collection
{
  _id: ObjectId,
  user_id: ObjectId,
  family_group_id: ObjectId (optional),
  name: String,
  category_id: ObjectId (null for overall budget),
  amount: Number,
  period: String, // 'weekly', 'monthly', 'yearly'
  start_date: ISODate,
  end_date: ISODate (optional),
  alert_thresholds: {
    warning: Number, // percentage
    critical: Number // percentage
  },
  created_at: ISODate,
  updated_at: ISODate
}

// savings_goals collection
{
  _id: ObjectId,
  user_id: ObjectId,
  family_group_id: ObjectId (optional),
  name: String,
  description: String,
  target_amount: Number,
  current_amount: Number,
  currency: String,
  deadline: ISODate,
  category: String,
  is_shared: Boolean,
  contributors: [{
    user_id: ObjectId,
    name: String,
    contribution_amount: Number,
    contribution_percentage: Number
  }],
  auto_save_rules: {
    enabled: Boolean,
    frequency: String,
    amount: Number,
    per_user: Boolean
  },
  status: String, // 'active', 'completed', 'cancelled'
  created_at: ISODate,
  updated_at: ISODate,
  completed_at: ISODate
}

// loans collection
{
  _id: ObjectId,
  user_id: ObjectId,
  type: String, // 'borrowed', 'lent'
  counterparty_name: String,
  counterparty_user_id: ObjectId (optional),
  principal_amount: Number,
  outstanding_balance: Number,
  currency: String,
  interest_rate: Number,
  start_date: ISODate,
  due_date: ISODate,
  repayment_schedule: String, // 'one-time', 'weekly', 'monthly', 'custom'
  installment_amount: Number,
  description: String,
  status: String, // 'active', 'paid', 'overdue', 'cancelled'
  created_at: ISODate,
  updated_at: ISODate
}

// shopping_lists collection
{
  _id: ObjectId,
  user_id: ObjectId,
  name: String,
  description: String,
  items: [{
    _id: ObjectId,
    name: String,
    quantity: Number,
    notes: String,
    completed: Boolean,
    completed_at: ISODate,
    linked_transaction_id: ObjectId (optional)
  }],
  created_at: ISODate,
  updated_at: ISODate
}

// processing_jobs collection
{
  _id: ObjectId,
  id: String, // UUID
  user_id: ObjectId,
  file_name: String,
  file_path: String,
  type: String, // 'earning', 'expense'
  status: String, // 'pending', 'processing', 'extracted', 'needs_review', 'confirmed', 'rejected'
  extracted_data: {
    amount: Number,
    merchant: String,
    category: String,
    date: ISODate,
    items: Array
  },
  confidence: Number,
  transaction_id: ObjectId (optional),
  created_at: ISODate,
  updated_at: ISODate
}
```

---

## 9. Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)
- [ ] Set up database schema
- [ ] Implement authentication & user management
- [ ] Create family group management
- [ ] Build basic transaction CRUD

### Phase 2: Bill Processing (Weeks 3-4)
- [ ] Implement transaction type selector
- [ ] Build bulk upload system
- [ ] Integrate OCR (Tesseract/Cloud Vision)
- [ ] Implement AI parsing (GPT/Claude)
- [ ] Create processing status table
- [ ] Build confirmation workflow

### Phase 3: Recurring & Upcoming (Weeks 5-6)
- [ ] Implement recurring payments CRUD
- [ ] Build occurrence calculator
- [ ] Create background job scheduler
- [ ] Implement upcoming payments view
- [ ] Build budget impact calculator

### Phase 4: Analytics & AI (Weeks 7-9)
- [ ] Implement dashboard summary
- [ ] Build financial forecasts
- [ ] Create risk analysis engine
- [ ] Implement survival calculator
- [ ] Build expense optimization AI
- [ ] Create future expense predictions

### Phase 5: Savings & Loans (Weeks 10-11)
- [ ] Implement savings goals CRUD
- [ ] Build contribution tracking
- [ ] Create loans CRUD
- [ ] Implement payment tracking
- [ ] Build amortization calculator

### Phase 6: Advanced Features (Weeks 12-14)
- [ ] Implement merchant detail views
- [ ] Build category analytics
- [ ] Create shopping lists
- [ ] Implement AI chat assistant
- [ ] Build user profile management

### Phase 7: Polish & Testing (Weeks 15-16)
- [ ] UI/UX refinement
- [ ] Performance optimization
- [ ] Security audit
- [ ] Comprehensive testing
- [ ] Documentation

---

## 10. Scaling Considerations

### 10.1 Data Volume
- **Transactions:** Expect 100-500 transactions per user per year
- **Items:** 5-20 items per transaction (receipts)
- **Recurring:** 10-50 recurring payments per user
- **Years of data:** Plan for 10+ years of historical data

### 10.2 Performance Optimizations
- Index on `user_id`, `date`, `category_id`, `merchant_id`
- Cache dashboard summaries (Redis)
- Paginate transaction lists
- Lazy load analytics
- Background jobs for heavy computations

### 10.3 Storage
- Store bill images in S3/Cloud Storage
- Compress images before storage
- Implement CDN for image delivery
- Archive old transactions (>5 years) to cold storage

### 10.4 Multi-Tenancy
- Family groups as tenant boundaries
- Row-level security on all queries
- Separate data by `family_group_id`
- Implement role-based access control

---

## 11. Security & Privacy

### 11.1 Data Protection
- Encrypt sensitive data at rest
- Use HTTPS for all communications
- Implement rate limiting
- Sanitize all user inputs
- Prevent SQL/NoSQL injection

### 11.2 Access Control
- Role-based permissions (Owner/Admin/Member)
- Family members can only see shared data
- Personal transactions remain private
- Audit logs for sensitive operations

### 11.3 Compliance
- GDPR compliance (data export, deletion)
- PCI DSS for payment data (if applicable)
- Regular security audits
- Data retention policies

---

## Conclusion

This architecture provides a complete, scalable foundation for a personal & family finance management platform. All features from your requirements are included, with clear separation of concerns, explicit data flows, and implementation-ready specifications.

**Key Strengths:**
- ✅ Mandatory transaction type selection before upload
- ✅ Bulk upload with separate earning/expense sessions
- ✅ Processing status table with editable fields
- ✅ Comprehensive recurring payments with upcoming view
- ✅ Dashboard with aggregated analytics only
- ✅ Advanced AI-driven analytics screen
- ✅ Expense optimization suggestions
- ✅ User profiles with future expense predictions
- ✅ Multi-user family support
- ✅ Merchant and category detail views with time-based analytics
- ✅ Non-financial shopping lists
- ✅ Savings, loans, and budget management
- ✅ AI chat assistant

**Next Steps:**
1. Review and approve architecture
2. Set up development environment
3. Begin Phase 1 implementation
4. Iterate based on user feedback

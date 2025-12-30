// Dummy data for financial platform features

export interface DummyTransaction {
  id: string;
  type: 'earning' | 'expense';
  amount: number;
  merchant: string;
  category: string;
  date: Date;
  items?: DummyItem[];
}

export interface DummyItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  category?: string;
  expiryDate?: Date;
  purchaseDate: Date;
  merchant: string;
}

export interface DummySavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  category: string;
  monthlyContribution: number;
}

export interface DummyLoan {
  id: string;
  type: 'borrowed' | 'lent';
  counterparty: string;
  principalAmount: number;
  outstandingBalance: number;
  interestRate: number;
  startDate: Date;
  dueDate: Date;
  monthlyPayment: number;
}

export interface DummyUserProfile {
  name: string;
  age: number;
  familyMembers: {
    name: string;
    relationship: string;
    age: number;
  }[];
  monthlyIncome: number;
  occupation: string;
}

// Generate dummy transactions
export const generateDummyTransactions = (count: number = 50): DummyTransaction[] => {
  const merchants = [
    'Keells Super', 'Cargills Food City', 'Arpico', 'Laugfs', 'Abans',
    'Singer', 'Softlogic', 'Daraz', 'Uber', 'PickMe',
    'Dialog', 'Mobitel', 'SLT', 'CEB', 'NWSDB',
    'Nawaloka Hospital', 'Asiri Hospital', 'Durdans', 'Pharmacy',
    'Perera & Sons', 'Sarasavi', 'Vijitha Yapa', 'Cafe Mocha', 'KFC'
  ];

  const categories = [
    'Groceries', 'Transportation', 'Utilities', 'Healthcare', 'Education',
    'Entertainment', 'Dining', 'Shopping', 'Bills', 'Insurance',
    'Salary', 'Freelance', 'Investment', 'Rental Income', 'Business'
  ];

  const transactions: DummyTransaction[] = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * 180); // Last 6 months
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);

    const isEarning = Math.random() < 0.2; // 20% earnings
    const merchant = merchants[Math.floor(Math.random() * merchants.length)];
    const category = isEarning 
      ? categories[Math.floor(Math.random() * 5) + 10] // Earning categories
      : categories[Math.floor(Math.random() * 10)]; // Expense categories

    const amount = isEarning
      ? Math.floor(Math.random() * 150000) + 50000 // 50k-200k for earnings
      : Math.floor(Math.random() * 15000) + 500; // 500-15k for expenses

    transactions.push({
      id: `txn-${i}`,
      type: isEarning ? 'earning' : 'expense',
      amount,
      merchant,
      category,
      date,
      items: !isEarning && Math.random() < 0.6 ? generateDummyItems(merchant, date) : undefined,
    });
  }

  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Generate dummy items for a transaction
const generateDummyItems = (merchant: string, purchaseDate: Date): DummyItem[] => {
  const groceryItems = [
    'Rice 5kg', 'Dhal 1kg', 'Sugar 1kg', 'Tea 200g', 'Milk Powder 400g',
    'Bread', 'Eggs 12pcs', 'Chicken 1kg', 'Fish 500g', 'Vegetables',
    'Fruits', 'Cooking Oil 1L', 'Flour 1kg', 'Salt', 'Spices'
  ];

  const electronicItems = [
    'Phone Charger', 'USB Cable', 'Headphones', 'Mouse', 'Keyboard',
    'Power Bank', 'Memory Card', 'Phone Case', 'Screen Protector'
  ];

  const householdItems = [
    'Detergent', 'Soap', 'Shampoo', 'Toothpaste', 'Tissue Paper',
    'Cleaning Supplies', 'Dishwashing Liquid', 'Toilet Paper'
  ];

  let itemPool = groceryItems;
  if (merchant.includes('Singer') || merchant.includes('Softlogic') || merchant.includes('Abans')) {
    itemPool = electronicItems;
  } else if (merchant.includes('Keells') || merchant.includes('Cargills')) {
    itemPool = [...groceryItems, ...householdItems];
  }

  const itemCount = Math.floor(Math.random() * 8) + 2; // 2-10 items
  const items: DummyItem[] = [];

  for (let i = 0; i < itemCount; i++) {
    const itemName = itemPool[Math.floor(Math.random() * itemPool.length)];
    const quantity = Math.floor(Math.random() * 3) + 1;
    const unitPrice = Math.floor(Math.random() * 2000) + 100;
    const totalPrice = quantity * unitPrice;

    // Add expiry date for perishable items
    let expiryDate: Date | undefined;
    if (itemName.includes('Milk') || itemName.includes('Bread') || itemName.includes('Eggs') || 
        itemName.includes('Chicken') || itemName.includes('Fish') || itemName.includes('Vegetables')) {
      expiryDate = new Date(purchaseDate);
      expiryDate.setDate(expiryDate.getDate() + Math.floor(Math.random() * 14) + 3); // 3-17 days
    }

    items.push({
      id: `item-${i}-${Date.now()}`,
      name: itemName,
      quantity,
      unitPrice,
      totalPrice,
      category: itemName.includes('Rice') || itemName.includes('Dhal') ? 'Groceries' : undefined,
      expiryDate,
      purchaseDate,
      merchant,
    });
  }

  return items;
};

// Generate dummy savings goals
export const generateDummySavingsGoals = (): DummySavingsGoal[] => {
  return [
    {
      id: 'sg-1',
      name: "Children's Education Fund",
      targetAmount: 2000000,
      currentAmount: 450000,
      deadline: new Date(2028, 11, 31),
      category: 'Education',
      monthlyContribution: 25000,
    },
    {
      id: 'sg-2',
      name: 'Emergency Fund',
      targetAmount: 500000,
      currentAmount: 320000,
      deadline: new Date(2025, 5, 30),
      category: 'Savings',
      monthlyContribution: 30000,
    },
    {
      id: 'sg-3',
      name: 'Vacation Fund',
      targetAmount: 300000,
      currentAmount: 85000,
      deadline: new Date(2025, 11, 31),
      category: 'Travel',
      monthlyContribution: 15000,
    },
    {
      id: 'sg-4',
      name: 'Home Renovation',
      targetAmount: 1500000,
      currentAmount: 200000,
      deadline: new Date(2026, 5, 30),
      category: 'Home',
      monthlyContribution: 40000,
    },
    {
      id: 'sg-5',
      name: 'Retirement Fund',
      targetAmount: 10000000,
      currentAmount: 1200000,
      deadline: new Date(2045, 11, 31),
      category: 'Retirement',
      monthlyContribution: 50000,
    },
  ];
};

// Generate dummy loans
export const generateDummyLoans = (): DummyLoan[] => {
  return [
    {
      id: 'loan-1',
      type: 'borrowed',
      counterparty: 'Commercial Bank',
      principalAmount: 2000000,
      outstandingBalance: 1450000,
      interestRate: 12.5,
      startDate: new Date(2022, 0, 1),
      dueDate: new Date(2027, 0, 1),
      monthlyPayment: 45000,
    },
    {
      id: 'loan-2',
      type: 'borrowed',
      counterparty: 'Sampath Bank - Vehicle Loan',
      principalAmount: 3500000,
      outstandingBalance: 2100000,
      interestRate: 10.5,
      startDate: new Date(2023, 5, 1),
      dueDate: new Date(2028, 5, 1),
      monthlyPayment: 65000,
    },
    {
      id: 'loan-3',
      type: 'lent',
      counterparty: 'Friend - Kamal',
      principalAmount: 150000,
      outstandingBalance: 75000,
      interestRate: 0,
      startDate: new Date(2024, 8, 1),
      dueDate: new Date(2025, 8, 1),
      monthlyPayment: 12500,
    },
    {
      id: 'loan-4',
      type: 'borrowed',
      counterparty: 'Credit Card - HSBC',
      principalAmount: 250000,
      outstandingBalance: 180000,
      interestRate: 24.0,
      startDate: new Date(2024, 0, 1),
      dueDate: new Date(2025, 11, 31),
      monthlyPayment: 15000,
    },
  ];
};

// Generate dummy user profile
export const generateDummyUserProfile = (): DummyUserProfile => {
  return {
    name: 'Nimal Perera',
    age: 38,
    familyMembers: [
      { name: 'Kumari Perera', relationship: 'Spouse', age: 35 },
      { name: 'Sahan Perera', relationship: 'Son', age: 12 },
      { name: 'Nethmi Perera', relationship: 'Daughter', age: 8 },
      { name: 'Sunil Perera', relationship: 'Father', age: 68 },
      { name: 'Manel Perera', relationship: 'Mother', age: 65 },
    ],
    monthlyIncome: 185000,
    occupation: 'Software Engineer',
  };
};

// Calculate financial metrics
export const calculateFinancialMetrics = (transactions: DummyTransaction[], loans: DummyLoan[], savings: DummySavingsGoal[]) => {
  const now = new Date();
  const thisMonth = transactions.filter(t => {
    const txDate = new Date(t.date);
    return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
  });

  const totalExpenses = thisMonth.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const totalEarnings = thisMonth.filter(t => t.type === 'earning').reduce((sum, t) => sum + t.amount, 0);
  const budgetLeft = totalEarnings - totalExpenses;
  const budgetSpent = totalExpenses;

  const totalLoans = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.outstandingBalance, 0);
  const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);

  const monthlyLoanPayments = loans.filter(l => l.type === 'borrowed').reduce((sum, l) => sum + l.monthlyPayment, 0);
  const monthlySavingsContributions = savings.reduce((sum, s) => sum + s.monthlyContribution, 0);

  // Calculate upcoming payments for next month
  const upcomingPayments = monthlyLoanPayments + monthlySavingsContributions;

  // Calculate projections for next 3 months
  const avgMonthlyExpenses = totalExpenses;
  const avgMonthlyEarnings = totalEarnings;
  const projections = [];
  for (let i = 1; i <= 3; i++) {
    const projectedEarnings = avgMonthlyEarnings;
    const projectedExpenses = avgMonthlyExpenses;
    const projectedSavings = projectedEarnings - projectedExpenses - upcomingPayments;
    projections.push({
      month: i,
      earnings: projectedEarnings,
      expenses: projectedExpenses,
      savings: projectedSavings,
      balance: budgetLeft + (projectedSavings * i),
    });
  }

  // Find top spender and earner (by category)
  const categoryExpenses = new Map<string, number>();
  const categoryEarnings = new Map<string, number>();

  thisMonth.forEach(t => {
    if (t.type === 'expense') {
      categoryExpenses.set(t.category, (categoryExpenses.get(t.category) || 0) + t.amount);
    } else {
      categoryEarnings.set(t.category, (categoryEarnings.get(t.category) || 0) + t.amount);
    }
  });

  const topExpenseCategory = Array.from(categoryExpenses.entries())
    .sort((a, b) => b[1] - a[1])[0];
  const topEarningCategory = Array.from(categoryEarnings.entries())
    .sort((a, b) => b[1] - a[1])[0];

  return {
    totalExpenses,
    totalEarnings,
    budgetLeft,
    budgetSpent,
    totalLoans,
    totalSavings,
    upcomingPayments,
    projections,
    topExpenseCategory: topExpenseCategory ? { category: topExpenseCategory[0], amount: topExpenseCategory[1] } : null,
    topEarningCategory: topEarningCategory ? { category: topEarningCategory[0], amount: topEarningCategory[1] } : null,
  };
};

// Calculate savings goal timeline
export const calculateSavingsTimeline = (goal: DummySavingsGoal) => {
  const remaining = goal.targetAmount - goal.currentAmount;
  const monthsNeeded = Math.ceil(remaining / goal.monthlyContribution);
  const projectedCompletionDate = new Date();
  projectedCompletionDate.setMonth(projectedCompletionDate.getMonth() + monthsNeeded);

  const deadlineDate = new Date(goal.deadline);
  const onTrack = projectedCompletionDate <= deadlineDate;

  return {
    monthsNeeded,
    projectedCompletionDate,
    onTrack,
    percentComplete: (goal.currentAmount / goal.targetAmount) * 100,
  };
};

// Calculate loan payoff timeline
export const calculateLoanPayoffTimeline = (loan: DummyLoan) => {
  const monthlyInterest = (loan.interestRate / 100) / 12;
  const monthsNeeded = Math.ceil(
    Math.log(loan.monthlyPayment / (loan.monthlyPayment - loan.outstandingBalance * monthlyInterest)) /
    Math.log(1 + monthlyInterest)
  );

  const projectedPayoffDate = new Date();
  projectedPayoffDate.setMonth(projectedPayoffDate.getMonth() + monthsNeeded);

  const totalInterest = (loan.monthlyPayment * monthsNeeded) - loan.outstandingBalance;

  return {
    monthsNeeded,
    projectedPayoffDate,
    totalInterest,
    totalPayment: loan.monthlyPayment * monthsNeeded,
  };
};

// Calculate financial stability score (0-100)
export const calculateFinancialStability = (
  transactions: DummyTransaction[],
  loans: DummyLoan[],
  savings: DummySavingsGoal[],
  profile: DummyUserProfile
) => {
  const metrics = calculateFinancialMetrics(transactions, loans, savings);
  
  // Income stability (30 points)
  const incomeStability = Math.min(30, (metrics.totalEarnings / profile.monthlyIncome) * 30);
  
  // Debt-to-income ratio (25 points)
  const debtToIncome = metrics.totalLoans / (profile.monthlyIncome * 12);
  const debtScore = Math.max(0, 25 - (debtToIncome * 25));
  
  // Savings rate (25 points)
  const savingsRate = metrics.totalSavings / (profile.monthlyIncome * 6); // 6 months of income
  const savingsScore = Math.min(25, savingsRate * 25);
  
  // Expense control (20 points)
  const expenseRatio = metrics.totalExpenses / metrics.totalEarnings;
  const expenseScore = Math.max(0, 20 - (expenseRatio * 20));
  
  const totalScore = Math.round(incomeStability + debtScore + savingsScore + expenseScore);
  
  return {
    score: totalScore,
    rating: totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor',
    breakdown: {
      incomeStability: Math.round(incomeStability),
      debtManagement: Math.round(debtScore),
      savingsHealth: Math.round(savingsScore),
      expenseControl: Math.round(expenseScore),
    },
  };
};

// Identify financial risks
export const identifyFinancialRisks = (
  transactions: DummyTransaction[],
  loans: DummyLoan[],
  savings: DummySavingsGoal[],
  profile: DummyUserProfile
) => {
  const metrics = calculateFinancialMetrics(transactions, loans, savings);
  const risks: { severity: 'high' | 'medium' | 'low'; title: string; description: string }[] = [];

  // High debt-to-income ratio
  const debtToIncome = metrics.totalLoans / (profile.monthlyIncome * 12);
  if (debtToIncome > 0.4) {
    risks.push({
      severity: 'high',
      title: 'High Debt Burden',
      description: `Your debt-to-income ratio is ${(debtToIncome * 100).toFixed(1)}%, which is above the recommended 40%. Consider debt consolidation or increasing income.`,
    });
  }

  // Low emergency fund
  const emergencyFund = savings.find(s => s.name.toLowerCase().includes('emergency'));
  const recommendedEmergencyFund = profile.monthlyIncome * 6;
  if (!emergencyFund || emergencyFund.currentAmount < recommendedEmergencyFund * 0.5) {
    risks.push({
      severity: 'high',
      title: 'Insufficient Emergency Fund',
      description: `You should have at least Rs. ${recommendedEmergencyFund.toLocaleString()} (6 months of expenses) in emergency savings.`,
    });
  }

  // Overspending
  if (metrics.budgetLeft < 0) {
    risks.push({
      severity: 'high',
      title: 'Monthly Overspending',
      description: `You're spending Rs. ${Math.abs(metrics.budgetLeft).toLocaleString()} more than you earn this month.`,
    });
  }

  // High credit card debt
  const creditCardLoans = loans.filter(l => l.counterparty.toLowerCase().includes('credit card'));
  if (creditCardLoans.length > 0) {
    const totalCCDebt = creditCardLoans.reduce((sum, l) => sum + l.outstandingBalance, 0);
    if (totalCCDebt > profile.monthlyIncome * 2) {
      risks.push({
        severity: 'medium',
        title: 'High Credit Card Debt',
        description: `Credit card debt of Rs. ${totalCCDebt.toLocaleString()} is accumulating high interest. Prioritize paying this off.`,
      });
    }
  }

  // No retirement savings
  const retirementSavings = savings.find(s => s.name.toLowerCase().includes('retirement'));
  if (!retirementSavings && profile.age < 50) {
    risks.push({
      severity: 'medium',
      title: 'No Retirement Planning',
      description: 'You should start saving for retirement. Consider setting up a retirement fund.',
    });
  }

  return risks;
};

// Calculate emergency fund runway (how long can you survive without income)
export const calculateEmergencyRunway = (
  transactions: DummyTransaction[],
  savings: DummySavingsGoal[],
  profile: DummyUserProfile
) => {
  const metrics = calculateFinancialMetrics(transactions, [], savings);
  const monthlyExpenses = metrics.totalExpenses;
  const totalLiquidSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
  
  const monthsOfRunway = totalLiquidSavings / monthlyExpenses;
  
  return {
    months: monthsOfRunway,
    status: monthsOfRunway >= 6 ? 'Excellent' : monthsOfRunway >= 3 ? 'Good' : monthsOfRunway >= 1 ? 'Fair' : 'Critical',
    recommendation: monthsOfRunway < 6 
      ? `Build your emergency fund to cover at least 6 months of expenses (Rs. ${(monthlyExpenses * 6).toLocaleString()})`
      : 'Your emergency fund is healthy!',
  };
};

// Suggest expense cuts
export const suggestExpenseCuts = (transactions: DummyTransaction[]) => {
  const now = new Date();
  const lastMonth = transactions.filter(t => {
    const txDate = new Date(t.date);
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    return txDate >= monthAgo && t.type === 'expense';
  });

  const categoryTotals = new Map<string, number>();
  lastMonth.forEach(t => {
    categoryTotals.set(t.category, (categoryTotals.get(t.category) || 0) + t.amount);
  });

  const suggestions: { category: string; currentSpending: number; suggestedReduction: number; savingsPerMonth: number; tips: string[] }[] = [];

  // Dining out
  const dining = categoryTotals.get('Dining') || 0;
  if (dining > 15000) {
    suggestions.push({
      category: 'Dining',
      currentSpending: dining,
      suggestedReduction: 30,
      savingsPerMonth: dining * 0.3,
      tips: [
        'Cook at home more often',
        'Pack lunch for work',
        'Limit restaurant visits to once a week',
        'Use meal planning to reduce food waste',
      ],
    });
  }

  // Transportation
  const transport = categoryTotals.get('Transportation') || 0;
  if (transport > 20000) {
    suggestions.push({
      category: 'Transportation',
      currentSpending: transport,
      suggestedReduction: 20,
      savingsPerMonth: transport * 0.2,
      tips: [
        'Use public transportation when possible',
        'Carpool with colleagues',
        'Combine errands to reduce trips',
        'Consider a fuel-efficient vehicle',
      ],
    });
  }

  // Entertainment
  const entertainment = categoryTotals.get('Entertainment') || 0;
  if (entertainment > 10000) {
    suggestions.push({
      category: 'Entertainment',
      currentSpending: entertainment,
      suggestedReduction: 25,
      savingsPerMonth: entertainment * 0.25,
      tips: [
        'Look for free community events',
        'Use streaming services instead of cable',
        'Take advantage of library resources',
        'Host game nights at home',
      ],
    });
  }

  // Shopping
  const shopping = categoryTotals.get('Shopping') || 0;
  if (shopping > 25000) {
    suggestions.push({
      category: 'Shopping',
      currentSpending: shopping,
      suggestedReduction: 35,
      savingsPerMonth: shopping * 0.35,
      tips: [
        'Wait 24 hours before making non-essential purchases',
        'Use a shopping list and stick to it',
        'Buy generic brands when possible',
        'Take advantage of sales and discounts',
        'Unsubscribe from promotional emails',
      ],
    });
  }

  return suggestions;
};

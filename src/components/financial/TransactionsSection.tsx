import { useState, useEffect, useRef, useCallback } from 'react';
import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem, Snackbar, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip, IconButton, ToggleButtonGroup, ToggleButton, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Collapse, Tooltip, Tabs, Tab } from '@mui/material';
import { FilterList, CloudUpload, Search, ViewModule, ViewList, OpenInFull, Close, Edit, Delete, MergeType, ExpandLess, ExpandMore, Sort, Warning, TrendingDown, TrendingUp, Receipt, Inventory } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { updateTransaction, deleteTransaction, mergeTransaction, getTransactionItems, updateItem, deleteItem, listTransactions, listItems } from '../../lib/api/financialApi';
import { Transaction, Merchant, Category, TransactionItem, FlattenedItem } from '../../types/financial';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../contexts/ThemeContext';
import { getDisplayCategoryName, formatCurrency, getDisplayMerchantName, formatPaymentMethod, transactionHasMissingFields, getMissingFieldRowStyle, getExpenseAmount, getEarningAmount, getTaxAmount } from '../../utils/transactionHelpers';
import TransactionsList from './TransactionsList';
import TransactionPagination from './TransactionPagination';
import {
  EditTransactionDialog,
  DeleteTransactionDialog,
  MergeTransactionDialog,
  EditItemDialog,
  DeleteItemDialog
} from './TransactionDialogs';
import FullScreenTransactions from './FullScreenTransactions';

interface TransactionsSectionProps {
  transactions: Transaction[];
  merchants: Merchant[];
  categories: Category[];
  onTransactionsChange: () => void;
  onFiltersChange: (filters: TransactionFilters) => void;
}

export interface TransactionFilters {
  dateFrom?: Date | null;
  dateTo?: Date | null;
  category?: string;
  merchant?: string;
}

export default function TransactionsSection({
  transactions: initialTransactions,
  merchants,
  categories,
  onTransactionsChange,
  onFiltersChange,
}: TransactionsSectionProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mergeDialogOpen, setMergeDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editForm, setEditForm] = useState({
    category: '',
    merchant: '',
    amount: '',
    date: null as Date | null,
  });
  const [mergeWithId, setMergeWithId] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [totalTransactions, setTotalTransactions] = useState(initialTransactions.length || 0);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<'card' | 'table'>('table');
  const [activeTab, setActiveTab] = useState<0 | 1 | 2 | 3>(0); // 0: All, 1: Expenses, 2: Earnings, 3: Items
  const [itemsPerPage, setItemsPerPage] = useState(25);
  // State for all items from backend
  const [backendItems, setBackendItems] = useState<TransactionItem[]>([]);
  const [isLoadingAllItems, setIsLoadingAllItems] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  // API sorting - for server-side sorting
  const [apiSortBy, setApiSortBy] = useState<'date' | 'scanned_date'>('date');
  const [apiSortOrder, setApiSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fullScreenDialogOpen, setFullScreenDialogOpen] = useState(false);
  const [fullScreenSearchQuery, setFullScreenSearchQuery] = useState('');
  const [fullScreenSortBy, setFullScreenSortBy] = useState<'date' | 'amount' | 'merchant' | 'category'>('date');
  const [fullScreenSortOrder, setFullScreenSortOrder] = useState<'asc' | 'desc'>('desc');
  // Full screen API sorting
  const [fullScreenApiSortBy, setFullScreenApiSortBy] = useState<'date' | 'scanned_date'>('date');
  const [fullScreenApiSortOrder, setFullScreenApiSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Item management state
  const [transactionItems, setTransactionItems] = useState<Record<string, TransactionItem[]>>({});
  const [itemEditDialogOpen, setItemEditDialogOpen] = useState(false);
  const [itemDeleteDialogOpen, setItemDeleteDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<TransactionItem | null>(null);
  const [itemEditForm, setItemEditForm] = useState({
    name: '',
    quantity: '',
    unit_price: '',
    total_price: '',
    category: '',
  });
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({});

  const getMerchantName = (merchantId: string | null) => {
    if (!merchantId) return 'Unknown Merchant';
    const merchant = merchants.find((m) => m._id === merchantId);
    return merchant?.merchant_name || merchantId;
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Unknown Category';
    const category = categories.find((c) => c._id === categoryId);
    return category?.category_name || categoryId;
  };

  const toggleItemsExpansion = (transactionId: string) => {
    setExpandedTransactions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transactionId)) {
        newSet.delete(transactionId);
      } else {
        newSet.add(transactionId);
        // Load items when expanding
        loadTransactionItems(transactionId);
      }
      return newSet;
    });
  };

  const getBillItems = (transaction: Transaction) => {
    // First try to get items from API (if loaded), otherwise fall back to transaction data.
    // Important: return the API result even when it's an empty array (means "loaded but no items").
    if (Object.prototype.hasOwnProperty.call(transactionItems, transaction._id)) {
      return transactionItems[transaction._id] ?? [];
    }

    // Fallback to transaction's embedded items
    const embedded = transaction.normalized_output?.items || transaction.parsing_output?.items;
    if (embedded && embedded.length > 0) return embedded as unknown as TransactionItem[];

    // Some API variants return items directly on the transaction object.
    const txAny = transaction as unknown as {
      items?: unknown[];
      transactions?: unknown[];
      transaction_items?: unknown[];
    };

    return (txAny.items || txAny.transaction_items || txAny.transactions || []) as unknown as TransactionItem[];
  };

  const loadTransactionItems = async (transactionId: string) => {
    if (loadingItems[transactionId] || transactionItems[transactionId]) {
      return; // Already loading or loaded
    }
    
    setLoadingItems((prev) => ({ ...prev, [transactionId]: true }));
    try {
      const response = await getTransactionItems(transactionId);
      if (response.success) {
        setTransactionItems((prev) => ({ ...prev, [transactionId]: response.items }));
      }
    } catch (error) {
      console.error('Failed to load transaction items:', error);
    } finally {
      setLoadingItems((prev) => ({ ...prev, [transactionId]: false }));
    }
  };

  const handleItemEdit = (item: TransactionItem) => {
    setSelectedItem(item);
    setItemEditForm({
      name: item.name,
      quantity: item.quantity.toString(),
      unit_price: item.unit_price.toString(),
      total_price: item.total_price.toString(),
      category: item.category || '',
    });
    setItemEditDialogOpen(true);
  };

  const handleItemFieldUpdate = async (itemId: string, field: string, value: number) => {
    // Find the item to get its transaction_id
    let foundItem: TransactionItem | null = null;
    let transactionId: string | null = null;
    
    for (const txId in transactionItems) {
      const items = transactionItems[txId];
      const item = items.find(i => i._id === itemId);
      if (item) {
        foundItem = item;
        transactionId = txId;
        break;
      }
    }

    if (!foundItem || !transactionId) return;

    try {
      const updateData: any = { [field]: value };
      const response = await updateItem(itemId, updateData);
      
      if (response.success) {
        // Update the item in local state
        setTransactionItems((prev) => {
          const items = prev[transactionId!] || [];
          const updatedItems = items.map((item) => 
            item._id === itemId ? response.item : item
          );
          return { ...prev, [transactionId!]: updatedItems };
        });
        
        // Refresh transactions to get updated totals
        loadTransactionsWithPagination();
        onTransactionsChange();
        setSnackbar({ open: true, message: 'Item updated successfully', severity: 'success' });
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update item: ' + error.message, severity: 'error' });
    }
  };

  const handleItemSave = async () => {
    if (!selectedItem) return;

    try {
      const updateData: any = {};
      if (itemEditForm.name !== selectedItem.name) updateData.name = itemEditForm.name;
      if (parseFloat(itemEditForm.quantity) !== selectedItem.quantity) updateData.quantity = parseFloat(itemEditForm.quantity);
      if (parseFloat(itemEditForm.unit_price) !== selectedItem.unit_price) updateData.unit_price = parseFloat(itemEditForm.unit_price);
      if (parseFloat(itemEditForm.total_price) !== selectedItem.total_price) updateData.total_price = parseFloat(itemEditForm.total_price);
      if (itemEditForm.category !== (selectedItem.category || '')) updateData.category = itemEditForm.category || undefined;

      const response = await updateItem(selectedItem._id, updateData);
      if (response.success) {
        // Update the item in the local state
        setTransactionItems((prev) => {
          const transactionId = selectedItem.transaction_id;
          const items = prev[transactionId] || [];
          const updatedItems = items.map((item) => 
            item._id === selectedItem._id ? response.item : item
          );
          return { ...prev, [transactionId]: updatedItems };
        });
        setItemEditDialogOpen(false);
        setSnackbar({ open: true, message: 'Item updated successfully', severity: 'success' });
        onTransactionsChange();
      // Reload transactions after update/delete/merge
      loadTransactionsWithPagination(); // Refresh transactions to get updated totals
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update item: ' + error.message, severity: 'error' });
    }
  };

  const handleItemDelete = async () => {
    if (!selectedItem) return;

    try {
      const response = await deleteItem(selectedItem._id);
      if (response.success) {
        // Remove the item from local state
        setTransactionItems((prev) => {
          const transactionId = selectedItem.transaction_id;
          const items = prev[transactionId] || [];
          const updatedItems = items.filter((item) => item._id !== selectedItem._id);
          return { ...prev, [transactionId]: updatedItems };
        });
        setItemDeleteDialogOpen(false);
        setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
        onTransactionsChange();
      // Reload transactions after update/delete/merge
      loadTransactionsWithPagination(); // Refresh transactions to get updated totals
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to delete item: ' + error.message, severity: 'error' });
    }
  };

  // Load transactions with pagination
  const loadTransactionsWithPagination = useCallback(async (currentPage: number = page, currentTab: 0 | 1 | 2 | 3 = activeTab) => {
    setIsLoadingTransactions(true);
    try {
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
        sort_by: apiSortBy,
        sort_order: apiSortOrder,
      };
      
      if (filters.dateFrom) params.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) params.date_to = filters.dateTo.toISOString();
      if (filters.category) params.category = filters.category;
      if (filters.merchant) params.merchant = filters.merchant;
      
      // Add transaction_type filter based on active tab
      if (currentTab === 1) {
        params.transaction_type = 'expense';
      } else if (currentTab === 2) {
        params.transaction_type = 'earning';
      }
      // currentTab === 0 means "All", so no filter is applied

      console.log('Loading transactions with params:', params); // Debug log

      const response = await listTransactions(params);
      if (response.success) {
        setTransactions(response.transactions || []);
        setTotalTransactions(response.total || response.transactions?.length || 0);
      } else {
        console.error('Failed to load transactions: API returned success=false');
        setSnackbar({ open: true, message: 'Failed to load transactions', severity: 'error' });
      }
    } catch (error) {
      console.error('Failed to load transactions:', error);
      setSnackbar({ open: true, message: 'Failed to load transactions: ' + (error instanceof Error ? error.message : 'Unknown error'), severity: 'error' });
      // Don't clear transactions on error - keep previous page visible
    } finally {
      setIsLoadingTransactions(false);
    }
  }, [page, itemsPerPage, filters.dateFrom, filters.dateTo, filters.category, filters.merchant, apiSortBy, apiSortOrder, activeTab]);

  // Load all items from backend
  const loadAllItems = useCallback(async (currentPage: number = page) => {
    setIsLoadingAllItems(true);
    try {
      const params: any = {
        limit: itemsPerPage,
        offset: (currentPage - 1) * itemsPerPage,
      };
      
      if (filters.dateFrom) params.date_from = filters.dateFrom.toISOString();
      if (filters.dateTo) params.date_to = filters.dateTo.toISOString();
      if (filters.category) params.category = filters.category;
      if (filters.merchant) params.merchant = filters.merchant;

      console.log('Loading all items with params:', params); // Debug log

      const response = await listItems(params);
      if (response.success) {
        setBackendItems(response.items || []);
        setTotalItems(response.total || response.items?.length || 0);
      } else {
        console.error('Failed to load items: API returned success=false');
        setSnackbar({ open: true, message: 'Failed to load items', severity: 'error' });
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      setSnackbar({ open: true, message: 'Failed to load items: ' + (error instanceof Error ? error.message : 'Unknown error'), severity: 'error' });
    } finally {
      setIsLoadingAllItems(false);
    }
  }, [page, itemsPerPage, filters.dateFrom, filters.dateTo, filters.category, filters.merchant]);

  // Load transactions when page, itemsPerPage, or filters change
  // Note: Tab changes are handled directly in handleTabChange to ensure immediate request
  useEffect(() => {
    // Only load transactions if not on Items tab
    if (activeTab !== 3) {
      loadTransactionsWithPagination();
    }
  }, [loadTransactionsWithPagination, activeTab]);

  // Load items when on Items tab and dependencies change
  useEffect(() => {
    if (activeTab === 3) {
      loadAllItems();
    }
  }, [loadAllItems, activeTab]);

  // Reset to page 1 when filters, sort, or tab changes
  useEffect(() => {
    setPage(1);
  }, [filters.dateFrom, filters.dateTo, filters.category, filters.merchant, apiSortBy, apiSortOrder, activeTab]);

  const handleFilterChange: (key: keyof TransactionFilters, value: any) => void = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    // Page will be reset in useEffect when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setEditForm({
      category: transaction.category_id,
      merchant: transaction.merchant_id,
      amount: transaction.amount.toString(),
      date: new Date(transaction.date),
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedTransaction) return;

    try {
      await updateTransaction(selectedTransaction._id, {
        category: editForm.category || undefined,
        merchant: editForm.merchant || undefined,
        amount: parseFloat(editForm.amount) || undefined,
        date: editForm.date?.toISOString() || undefined,
      });
      setEditDialogOpen(false);
      setSnackbar({ open: true, message: 'Transaction updated successfully', severity: 'success' });
      onTransactionsChange();
      // Reload transactions after update/delete/merge
      loadTransactionsWithPagination();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update transaction: ' + error.message, severity: 'error' });
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;

    try {
      await deleteTransaction(selectedTransaction._id);
      setDeleteDialogOpen(false);
      setSnackbar({ open: true, message: 'Transaction deleted successfully', severity: 'success' });
      onTransactionsChange();
      // Reload transactions after update/delete/merge
      loadTransactionsWithPagination();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to delete transaction: ' + error.message, severity: 'error' });
    }
  };

  const handleMerge = async () => {
    if (!selectedTransaction || !mergeWithId) return;

    try {
      await mergeTransaction(selectedTransaction._id, { merge_with: mergeWithId });
      setMergeDialogOpen(false);
      setSnackbar({ open: true, message: 'Transactions merged successfully', severity: 'success' });
      onTransactionsChange();
      // Reload transactions after update/delete/merge
      loadTransactionsWithPagination();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to merge transactions: ' + error.message, severity: 'error' });
    }
  };

  // Filter and sort transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const merchantName = getMerchantName(transaction.merchant_id).toLowerCase();
    const categoryName = getCategoryName(transaction.category_id).toLowerCase();
    const amount = transaction.amount.toString();
    const date = new Date(transaction.date).toLocaleDateString().toLowerCase();
    
    return (
      merchantName.includes(query) ||
      categoryName.includes(query) ||
      amount.includes(query) ||
      date.includes(query)
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'merchant':
        comparison = getMerchantName(a.merchant_id).localeCompare(getMerchantName(b.merchant_id));
        break;
      case 'category':
        comparison = getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id));
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // For client-side filtering/searching, we still need to filter the loaded transactions
  // But pagination is handled server-side
  const paginatedTransactions = sortedTransactions;
  
  // Calculate total pages based on server-side total
  const totalPages = Math.ceil(totalTransactions / itemsPerPage);

  const handleSort = (field: 'date' | 'amount' | 'merchant' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    // Note: Sorting is client-side, so we don't need to reload from API
  };

  // Full screen dialog filtering and sorting
  const fullScreenFilteredTransactions = transactions.filter((transaction) => {
    if (!fullScreenSearchQuery) return true;
    const query = fullScreenSearchQuery.toLowerCase();
    const merchantName = getMerchantName(transaction.merchant_id).toLowerCase();
    const categoryName = getCategoryName(transaction.category_id).toLowerCase();
    const amount = transaction.amount.toString();
    const date = new Date(transaction.date).toLocaleDateString().toLowerCase();
    
    return (
      merchantName.includes(query) ||
      categoryName.includes(query) ||
      amount.includes(query) ||
      date.includes(query)
    );
  });

  const fullScreenSortedTransactions = [...fullScreenFilteredTransactions].sort((a, b) => {
    let comparison = 0;
    
    switch (fullScreenSortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'merchant':
        comparison = getMerchantName(a.merchant_id).localeCompare(getMerchantName(b.merchant_id));
        break;
      case 'category':
        comparison = getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id));
        break;
    }
    
    return fullScreenSortOrder === 'asc' ? comparison : -comparison;
  });

  const handleFullScreenSort = (field: 'date' | 'amount' | 'merchant' | 'category') => {
    if (fullScreenSortBy === field) {
      setFullScreenSortOrder(fullScreenSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setFullScreenSortBy(field);
      setFullScreenSortOrder('asc');
    }
  };

  // Items view filtering and sorting
  const [itemsSearchQuery, setItemsSearchQuery] = useState('');
  const [itemsSortBy, setItemsSortBy] = useState<'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate'>('transactionDate');
  const [itemsSortOrder, setItemsSortOrder] = useState<'asc' | 'desc'>('desc');

  const getAllItems = (): FlattenedItem[] => {
    const allItems: FlattenedItem[] = [];
    
    transactions.forEach((transaction) => {
      const items = getBillItems(transaction);
      items.forEach((item: any, index: number) => {
        allItems.push({
          id: `${transaction._id}-${index}`,
          transactionId: transaction._id,
          transactionDate: new Date(transaction.date),
          transactionAmount: transaction.amount,
          transactionStatus: transaction.status,
          merchantName: getMerchantName(transaction.merchant_id),
          categoryName: getCategoryName(transaction.category_id),
          itemName: item.name || 'N/A',
          quantity: item.quantity || 1,
          unitPrice: item.unit_price || 0,
          totalPrice: item.total_price || item.unit_price || 0,
          itemCategory: item.category,
        });
      });
    });
    
    return allItems;
  };

  const allItems = getAllItems();

  const filteredItems = allItems.filter((item) => {
    if (!itemsSearchQuery) return true;
    const query = itemsSearchQuery.toLowerCase();
    return (
      item.itemName.toLowerCase().includes(query) ||
      item.transactionId.toLowerCase().includes(query) ||
      item.merchantName.toLowerCase().includes(query) ||
      item.categoryName.toLowerCase().includes(query) ||
      (item.itemCategory && item.itemCategory.toLowerCase().includes(query)) ||
      item.quantity.toString().includes(query) ||
      item.unitPrice.toString().includes(query) ||
      item.totalPrice.toString().includes(query)
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    let comparison = 0;
    
    switch (itemsSortBy) {
      case 'itemName':
        comparison = a.itemName.localeCompare(b.itemName);
        break;
      case 'transactionId':
        comparison = a.transactionId.localeCompare(b.transactionId);
        break;
      case 'merchant':
        comparison = a.merchantName.localeCompare(b.merchantName);
        break;
      case 'category':
        comparison = a.categoryName.localeCompare(b.categoryName);
        break;
      case 'quantity':
        comparison = a.quantity - b.quantity;
        break;
      case 'unitPrice':
        comparison = a.unitPrice - b.unitPrice;
        break;
      case 'totalPrice':
        comparison = a.totalPrice - b.totalPrice;
        break;
      case 'transactionDate':
        comparison = a.transactionDate.getTime() - b.transactionDate.getTime();
        break;
    }
    
    return itemsSortOrder === 'asc' ? comparison : -comparison;
  });

  const paginatedItems = sortedItems.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const handleItemsSort = (field: 'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate') => {
    if (itemsSortBy === field) {
      setItemsSortOrder(itemsSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setItemsSortBy(field);
      setItemsSortOrder('asc');
    }
    setPage(1);
  };

  const hasFilters = !!(filters.dateFrom || filters.dateTo || filters.category || filters.merchant);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: 0 | 1 | 2 | 3) => {
    const tabNames = ['All', 'Expenses', 'Earnings', 'Items'];
    const tabName = tabNames[newValue];
    console.log('Tab changed to:', tabName); // Debug log
    setActiveTab(newValue);
    setPage(1); // Reset to first page when tab changes
    
    // Immediately trigger load with new tab value to ensure request is sent
    if (newValue === 3) {
      // Load items for Items tab
      loadAllItems(1);
    } else {
      // Load transactions for other tabs
      loadTransactionsWithPagination(1, newValue);
    }
  };

  return (
    <Box>
      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          mb: 2,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            borderBottom: `1px solid ${theme.palette.divider}`,
            '& .MuiTab-root': {
              fontFamily: "'Inter', sans-serif",
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.875rem',
              minHeight: 48,
              color: theme.palette.text.secondary,
            },
            '& .MuiTab-root.Mui-selected': {
              color: theme.palette.primary.main,
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 3,
            },
          }}
        >
          <Tab label="All Transactions" />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingDown sx={{ fontSize: '1rem' }} />
                Expenses
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TrendingUp sx={{ fontSize: '1rem' }} />
                Earnings
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Inventory sx={{ fontSize: '1rem' }} />
                Items
              </Box>
            } 
          />
        </Tabs>
      </Paper>

      {/* Beautiful Modern Filters with Pure Tailwind - Hide when on Items tab */}
      {activeTab !== 3 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg mb-6 overflow-hidden">
          {/* Active Filters Bar */}
          {hasFilters && (
            <div className="px-5 py-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                <FilterList className="text-purple-600 dark:text-purple-400 text-lg flex-shrink-0" />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 mr-1">Active filters:</span>
                {filters.dateFrom && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">From:</span>
                    <span>{filters.dateFrom.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <button
                      onClick={() => handleFilterChange('dateFrom', null)}
                      className="ml-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full p-0.5 transition-colors"
                      aria-label="Remove date from filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.dateTo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-lg border border-purple-200 dark:border-purple-700 transition-colors">
                    <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-semibold">To:</span>
                    <span>{filters.dateTo.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    <button
                      onClick={() => handleFilterChange('dateTo', null)}
                      className="ml-1 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-full p-0.5 transition-colors"
                      aria-label="Remove date to filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.category && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-700 transition-colors max-w-[160px]">
                    <svg className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span className="truncate">{categories.find(c => c._id === filters.category)?.category_name || 'Unknown'}</span>
                    <button
                      onClick={() => handleFilterChange('category', undefined)}
                      className="ml-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-full p-0.5 transition-colors flex-shrink-0"
                      aria-label="Remove category filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                {filters.merchant && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-gray-800 text-green-700 dark:text-green-300 text-xs font-medium rounded-lg border border-green-200 dark:border-green-700 transition-colors max-w-[160px]">
                    <svg className="w-3.5 h-3.5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <span className="truncate">{merchants.find(m => m._id === filters.merchant)?.merchant_name || 'Unknown'}</span>
                    <button
                      onClick={() => handleFilterChange('merchant', undefined)}
                      className="ml-1 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-full p-0.5 transition-colors flex-shrink-0"
                      aria-label="Remove merchant filter"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                )}
                <button
                  onClick={clearFilters}
                  className="ml-auto px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-white dark:hover:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}

          {/* Main Filter Controls - Two Rows for Better Alignment */}
          <div className="px-6 py-5 space-y-4">
            {/* Top Row: Filters */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Date Filters - Beautiful Tailwind Styled */}
              <div className="flex items-center gap-2">
                <div className="relative group">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : null)}
                    className="h-10 w-[140px] pl-9 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    placeholder="From"
                  />
                </div>
                <div className="relative group">
                  <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                    <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <input
                    type="date"
                    value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                    onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : null)}
                    className="h-10 w-[140px] pl-9 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                    placeholder="To"
                  />
                </div>
              </div>

              {/* Category & Merchant - Beautiful Selects */}
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="h-10 w-[160px] pl-9 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.category_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-green-500 dark:group-hover:text-green-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <select
                  value={filters.merchant || ''}
                  onChange={(e) => handleFilterChange('merchant', e.target.value || undefined)}
                  className="h-10 w-[160px] pl-9 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-green-500 dark:focus:border-green-400 appearance-none cursor-pointer transition-colors"
                >
                  <option value="">All Merchants</option>
                  {merchants.map((merchant) => (
                    <option key={merchant._id} value={merchant._id}>
                      {merchant.merchant_name}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Divider */}
              <div className="w-px h-10 bg-gray-300 dark:bg-gray-600" />

              {/* Search - Beautiful Styled */}
              <div className="relative group flex-1 min-w-[220px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  className="w-full h-10 pl-9 pr-3 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
                />
              </div>

              {/* Layout Toggle */}
              <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden h-10">
                <button
                  onClick={() => setLayout('card')}
                  className={`px-3 py-2 h-full flex items-center justify-center transition-colors ${
                    layout === 'card'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Card view"
                >
                  <ViewModule className="text-lg" />
                </button>
                <div className="w-px h-full bg-gray-300 dark:bg-gray-600" />
                <button
                  onClick={() => setLayout('table')}
                  className={`px-3 py-2 h-full flex items-center justify-center transition-colors ${
                    layout === 'table'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                  aria-label="Table view"
                >
                  <ViewList className="text-lg" />
                </button>
              </div>
            </div>

            {/* Bottom Row: Sort & Pagination Controls */}
            <div className="flex items-center gap-4 flex-wrap">
              {/* Sort Controls - Beautiful Selects */}
              <div className="relative group">
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10">
                  <Sort className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors" />
                </div>
                <select
                  value={apiSortBy}
                  onChange={(e) => {
                    setApiSortBy(e.target.value as 'date' | 'scanned_date');
                    setPage(1);
                  }}
                  className="h-10 w-[120px] pl-9 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 appearance-none cursor-pointer transition-colors"
                >
                  <option value="date">Date</option>
                  <option value="scanned_date">Scanned</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              <div className="relative group">
                <select
                  value={apiSortOrder}
                  onChange={(e) => {
                    setApiSortOrder(e.target.value as 'asc' | 'desc');
                    setPage(1);
                  }}
                  className="h-10 w-[110px] pl-3 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 appearance-none cursor-pointer transition-colors"
                >
                  <option value="desc">Newest</option>
                  <option value="asc">Oldest</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Per Page - Beautiful Select */}
              <div className="relative group">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setPage(1);
                  }}
                  className="h-10 w-[90px] pl-3 pr-9 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 appearance-none cursor-pointer transition-colors"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Results Count */}
              <div className="ml-auto flex items-center gap-4">
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {paginatedTransactions.length > 0 ? (page - 1) * itemsPerPage + 1 : 0}-{Math.min(page * itemsPerPage, totalTransactions)} of {totalTransactions}
                </span>

                {/* View All Button */}
                <Tooltip title="View All">
                  <button
                    onClick={() => setFullScreenDialogOpen(true)}
                    className="h-10 w-10 flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-500 dark:hover:border-purple-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    aria-label="View all transactions"
                  >
                    <OpenInFull className="text-lg" />
                  </button>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Items Tab Controls */}
      {activeTab === 3 && (
        <Paper
          elevation={0}
          sx={{
            p: '1rem',
            mb: '1.5rem',
            backgroundColor: theme.palette.background.paper,
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography
              variant="body2"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                color: theme.palette.text.secondary,
                whiteSpace: 'nowrap',
              }}
            >
              Showing {backendItems.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, totalItems)} of {totalItems} items
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Per Page</InputLabel>
              <Select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                label="Per Page"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Paper>
      )}

      {/* Items Tab Content */}
      {activeTab === 3 ? (
        <>
          {isLoadingAllItems && backendItems.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Loading items...
              </Typography>
            </Box>
          ) : (
            <>
              {isLoadingAllItems && backendItems.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              )}
              {backendItems.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
                  <Typography variant="body2" color="text.secondary">
                    No items found
                  </Typography>
                </Box>
              ) : (
                <TableContainer 
                  component={Paper}
                  elevation={0}
                  sx={{
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '12px',
                    overflow: 'auto',
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Item Name</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>Total Price</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Transaction ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {backendItems.map((item) => (
                        <TableRow key={item._id} hover>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell align="right">{formatCurrency(item.unit_price, 'LKR')}</TableCell>
                          <TableCell align="right">{formatCurrency(item.total_price, 'LKR')}</TableCell>
                          <TableCell>{item.category || 'N/A'}</TableCell>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {item.transaction_id?.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <IconButton
                                size="small"
                                onClick={() => handleItemEdit(item)}
                                color="primary"
                              >
                                <Edit sx={{ fontSize: '1rem' }} />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedItem(item);
                                  setItemDeleteDialogOpen(true);
                                }}
                                color="error"
                              >
                                <Delete sx={{ fontSize: '1rem' }} />
                              </IconButton>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </>
      ) : (
        /* Transactions List */
        <>
          {isLoadingTransactions && transactions.length === 0 ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
              <Typography variant="body2" color="text.secondary">
                Loading transactions...
              </Typography>
            </Box>
          ) : (
            <>
              {isLoadingTransactions && transactions.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 1, mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">
                    Loading...
                  </Typography>
                </Box>
              )}
              <TransactionsList
                layout={layout}
                transactions={transactions}
                merchants={merchants}
                categories={categories}
                expandedTransactions={expandedTransactions}
                transactionItems={transactionItems}
                loadingItems={loadingItems}
                paginatedTransactions={paginatedTransactions}
                paginatedItems={paginatedItems}
                itemsPerPage={itemsPerPage}
                page={page}
                onToggleItemsExpansion={toggleItemsExpansion}
                onEditTransaction={handleEdit}
                onDeleteTransaction={(transaction) => {
                  setSelectedTransaction(transaction);
                  setDeleteDialogOpen(true);
                }}
                onMergeTransaction={(transaction) => {
                  setSelectedTransaction(transaction);
                  setMergeDialogOpen(true);
                }}
                onEditItem={handleItemEdit}
                onDeleteItem={(item) => {
                  setSelectedItem(item);
                  setItemDeleteDialogOpen(true);
                }}
                onItemFieldUpdate={handleItemFieldUpdate}
                getMerchantName={getMerchantName}
                getCategoryName={getCategoryName}
                getBillItems={getBillItems}
              />
            </>
          )}
        </>
      )}

      {/* Pagination - Only show if total count is greater than items per page */}
      {(() => {
        const totalCount = activeTab === 3 ? totalItems : totalTransactions;
        const isLoading = activeTab === 3 ? isLoadingAllItems : isLoadingTransactions;
        
        if (isLoading) return null;
        
        // Only show pagination if we have more items than can fit on one page
        if (totalCount <= itemsPerPage) {
          return null;
        }
        
        const totalPages = Math.ceil(totalCount / itemsPerPage);
        // Also check that we have more than 1 page
        if (totalPages <= 1) {
          return null;
        }
        
        return (
          <TransactionPagination
            count={totalPages}
            page={page}
            onPageChange={(newPage) => {
              setPage(newPage);
              // Scroll to top when page changes
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        );
      })()}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Transaction</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                label="Category"
              >
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Merchant</InputLabel>
              <Select
                value={editForm.merchant}
                onChange={(e) => setEditForm({ ...editForm, merchant: e.target.value })}
                label="Merchant"
              >
                {merchants.map((merchant) => (
                  <MenuItem key={merchant._id} value={merchant._id}>
                    {merchant.merchant_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Amount"
              type="number"
              value={editForm.amount}
              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
              fullWidth
            />
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Date"
                value={editForm.date}
                onChange={(date) => setEditForm({ ...editForm, date })}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Transaction</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this transaction?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Merge Dialog */}
      <Dialog open={mergeDialogOpen} onClose={() => setMergeDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Merge Transaction</DialogTitle>
        <DialogContent>
          <Typography gutterBottom>
            Merge transaction Rs. {selectedTransaction?.amount.toFixed(2)} with:
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Select Transaction</InputLabel>
            <Select
              value={mergeWithId}
              onChange={(e) => setMergeWithId(e.target.value)}
              label="Select Transaction"
            >
              {transactions
                .filter((t) => t._id !== selectedTransaction?._id)
                .map((t) => (
                  <MenuItem key={t._id} value={t._id}>
                    Rs. {t.amount.toFixed(2)} - {new Date(t.date).toLocaleDateString()}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMergeDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleMerge} variant="contained" disabled={!mergeWithId}>
            Merge
          </Button>
          </DialogActions>
        </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={itemEditDialogOpen} onClose={() => setItemEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Item</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Item Name"
              value={itemEditForm.name}
              onChange={(e) => setItemEditForm({ ...itemEditForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Quantity"
              type="number"
              value={itemEditForm.quantity}
              onChange={(e) => setItemEditForm({ ...itemEditForm, quantity: e.target.value })}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              label="Unit Price"
              type="number"
              value={itemEditForm.unit_price}
              onChange={(e) => {
                const unitPrice = parseFloat(e.target.value) || 0;
                const quantity = parseFloat(itemEditForm.quantity) || 0;
                setItemEditForm({ 
                  ...itemEditForm, 
                  unit_price: e.target.value,
                  total_price: (unitPrice * quantity).toFixed(2)
                });
              }}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <TextField
              label="Total Price"
              type="number"
              value={itemEditForm.total_price}
              onChange={(e) => setItemEditForm({ ...itemEditForm, total_price: e.target.value })}
              fullWidth
              required
              inputProps={{ step: '0.01', min: '0' }}
            />
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={itemEditForm.category}
                onChange={(e) => setItemEditForm({ ...itemEditForm, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="">None</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat.category_name}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemEditDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleItemSave} 
            variant="contained"
            disabled={!itemEditForm.name || !itemEditForm.quantity || !itemEditForm.unit_price || !itemEditForm.total_price}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Item Dialog */}
      <Dialog open={itemDeleteDialogOpen} onClose={() => setItemDeleteDialogOpen(false)}>
        <DialogTitle>Delete Item</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedItem?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setItemDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleItemDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>

        {/* Full Screen Transactions Dialog */}
        <Dialog
          open={fullScreenDialogOpen}
          onClose={() => setFullScreenDialogOpen(false)}
          maxWidth={false}
          fullWidth
          PaperProps={{
            sx: {
              width: '95vw',
              height: '95vh',
              maxWidth: 'none',
              maxHeight: 'none',
              m: 0,
              borderRadius: '12px',
            },
          }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
              pb: '1rem',
              fontFamily: "'Inter', sans-serif",
              fontSize: '1.25rem',
              fontWeight: 600,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 600 }}>
                All Transactions ({fullScreenSortedTransactions.length})
              </Typography>
            </Box>
            <IconButton
              onClick={() => setFullScreenDialogOpen(false)}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                },
              }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent
            sx={{
              p: '1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              overflow: 'hidden',
            }}
          >
            {/* Search and Sort Controls */}
            <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                placeholder="Search transactions..."
                value={fullScreenSearchQuery}
                onChange={(e) => setFullScreenSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: <Search sx={{ mr: 1, color: theme.palette.text.secondary }} />,
                }}
                sx={{
                  flex: '1 1 300px',
                  minWidth: '200px',
                  '& .MuiOutlinedInput-root': {
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                  },
                }}
              />
              <Typography 
                variant="body2" 
                sx={{ 
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  color: theme.palette.text.secondary,
                  whiteSpace: 'nowrap',
                }}
              >
                {fullScreenSortedTransactions.length} transaction{fullScreenSortedTransactions.length !== 1 ? 's' : ''}
              </Typography>
            </Box>

            {/* Transactions Table */}
            <TableContainer 
              sx={{
                flex: 1,
                overflow: 'auto',
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '8px',
              }}
            >
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '120px',
                      }}
                      onClick={() => handleFullScreenSort('date')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Date
                        <Sort sx={{ fontSize: '1rem', opacity: fullScreenSortBy === 'date' ? 1 : 0.3 }} />
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '150px',
                      }}
                      onClick={() => handleFullScreenSort('merchant')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Merchant
                        <Sort sx={{ fontSize: '1rem', opacity: fullScreenSortBy === 'merchant' ? 1 : 0.3 }} />
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '150px',
                      }}
                      onClick={() => handleFullScreenSort('category')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        Category
                        <Sort sx={{ fontSize: '1rem', opacity: fullScreenSortBy === 'category' ? 1 : 0.3 }} />
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        cursor: 'pointer',
                        userSelect: 'none',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '120px',
                      }}
                      onClick={() => handleFullScreenSort('amount')}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        Amount
                        <Sort sx={{ fontSize: '1rem', opacity: fullScreenSortBy === 'amount' ? 1 : 0.3 }} />
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '120px',
                      }}
                    >
                      Payment Method
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '100px',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <TrendingDown sx={{ fontSize: '0.875rem', color: theme.palette.error.main }} />
                        Expense
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '100px',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <TrendingUp sx={{ fontSize: '0.875rem', color: theme.palette.success.main }} />
                        Earning
                      </Box>
                    </TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '80px',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                        <Receipt sx={{ fontSize: '0.875rem', color: theme.palette.warning.main }} />
                        Tax
                      </Box>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '100px',
                      }}
                    >
                      Status
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        fontWeight: 600, 
                        color: theme.palette.text.primary,
                        backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        minWidth: '120px',
                      }}
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fullScreenSortedTransactions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fullScreenSortedTransactions.map((transaction, index) => {
                      // Check if transaction has items with missing fields
                      const billItems = getBillItems(transaction);
                      const hasMissingFields = transactionHasMissingFields(transaction, billItems);
                      
                      return (
                        <TableRow 
                          key={transaction._id}
                          hover
                          sx={{
                            backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                            ...getMissingFieldRowStyle(hasMissingFields, theme),
                            '&:hover': {
                              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                            },
                          }}
                        >
                          <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {new Date(transaction.date).toLocaleDateString()}
                              {hasMissingFields && (
                                <Tooltip title="This transaction has items with missing price fields">
                                  <Warning sx={{ fontSize: '1rem', color: theme.palette.warning.main }} />
                                </Tooltip>
                              )}
                            </Box>
                          </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {getDisplayMerchantName(transaction, getMerchantName(transaction.merchant_id))}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {getDisplayCategoryName(transaction, getCategoryName(transaction.category_id), [])}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {formatCurrency(transaction.amount, transaction.currency)}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {formatPaymentMethod(transaction.payment_method)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.error.main, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500 }}>
                          {getExpenseAmount(transaction) > 0 ? formatCurrency(getExpenseAmount(transaction), transaction.currency) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.success.main, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', fontWeight: 500 }}>
                          {getEarningAmount(transaction) > 0 ? formatCurrency(getEarningAmount(transaction), transaction.currency) : '-'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {getTaxAmount(transaction) > 0 ? formatCurrency(getTaxAmount(transaction), transaction.currency) : '-'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={transaction.status}
                            size="small"
                            color={
                              transaction.status === 'confirmed'
                                ? 'success'
                                : transaction.status === 'pending'
                                ? 'warning'
                                : 'error'
                            }
                            sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                handleEdit(transaction);
                                setFullScreenDialogOpen(false);
                              }}
                              color="primary"
                              sx={{ padding: '0.25rem' }}
                            >
                              <Edit sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setDeleteDialogOpen(true);
                                setFullScreenDialogOpen(false);
                              }}
                              color="error"
                              sx={{ padding: '0.25rem' }}
                            >
                              <Delete sx={{ fontSize: '1rem' }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setSelectedTransaction(transaction);
                                setMergeDialogOpen(true);
                                setFullScreenDialogOpen(false);
                              }}
                              color="secondary"
                              sx={{ padding: '0.25rem' }}
                            >
                              <MergeType sx={{ fontSize: '1rem' }} />
                            </IconButton>
                          </Box>
                        </TableCell>
                      </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }



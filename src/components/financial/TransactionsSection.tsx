import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Chip,
  Pagination,
  Snackbar,
  Alert,
  Collapse,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Edit, Delete, MergeType, FilterList, CloudUpload, ExpandMore, ExpandLess, ViewList, ViewModule, Search, Sort, OpenInFull, Close } from '@mui/icons-material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { updateTransaction, deleteTransaction, mergeTransaction, getTransactionItems, updateItem, deleteItem } from '../../lib/api/financialApi';
import { Transaction, Merchant, Category, TransactionItem } from '../../types/financial';
import { useAuth } from '../../lib/auth';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });
  const [expandedTransactions, setExpandedTransactions] = useState<Set<string>>(new Set());
  const [layout, setLayout] = useState<'card' | 'table' | 'items'>('card');
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant' | 'category'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [fullScreenDialogOpen, setFullScreenDialogOpen] = useState(false);
  const [fullScreenSearchQuery, setFullScreenSearchQuery] = useState('');
  const [fullScreenSortBy, setFullScreenSortBy] = useState<'date' | 'amount' | 'merchant' | 'category'>('date');
  const [fullScreenSortOrder, setFullScreenSortOrder] = useState<'asc' | 'desc'>('desc');
  
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
    // First try to get items from API (if loaded), otherwise fall back to transaction data
    if (transactionItems[transaction._id] && transactionItems[transaction._id].length > 0) {
      return transactionItems[transaction._id];
    }
    // Fallback to transaction's embedded items
    return transaction.normalized_output?.items || transaction.parsing_output?.items || [];
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
        onTransactionsChange(); // Refresh transactions to get updated totals
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
        onTransactionsChange(); // Refresh transactions to get updated totals
      }
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to delete item: ' + error.message, severity: 'error' });
    }
  };

  useEffect(() => {
    setTransactions(initialTransactions);
  }, [initialTransactions]);

  const prevFiltersRef = useRef<TransactionFilters | null>(null);
  const isInitialMount = useRef(true);
  
  useEffect(() => {
    // Skip on initial mount - parent already loads transactions
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevFiltersRef.current = filters;
      return;
    }
    
    // Only call onFiltersChange if filters actually changed
    const prev = prevFiltersRef.current;
    const filtersChanged = 
      !prev ||
      prev.dateFrom?.getTime() !== filters.dateFrom?.getTime() ||
      prev.dateTo?.getTime() !== filters.dateTo?.getTime() ||
      prev.category !== filters.category ||
      prev.merchant !== filters.merchant;
    
    if (filtersChanged) {
      prevFiltersRef.current = filters;
      onFiltersChange(filters);
    }
  }, [filters, onFiltersChange]);

  const handleFilterChange = (key: keyof TransactionFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
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

  const paginatedTransactions = sortedTransactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage);

  const handleSort = (field: 'date' | 'amount' | 'merchant' | 'category') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
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

  // Flatten all items from all transactions with transaction reference
  interface TransactionItem {
    id: string; // Unique ID for the item
    transactionId: string;
    transactionDate: Date;
    transactionAmount: number;
    transactionStatus: string;
    merchantName: string;
    categoryName: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    itemCategory?: string;
  }

  const getAllItems = (): TransactionItem[] => {
    const allItems: TransactionItem[] = [];
    
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

  return (
    <Box>
      {/* Filters */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: '1.5rem', 
          mb: '2rem', 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1.5rem' }}>
          <FilterList sx={{ color: theme.palette.text.secondary, fontSize: '1.25rem' }} />
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              color: theme.palette.text.primary,
              fontSize: '1rem',
              fontWeight: 600,
              lineHeight: 1.2,
            }}
          >
            Filters
          </Typography>
          {hasFilters && (
            <Button 
              size="small" 
              onClick={clearFilters}
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                textTransform: 'none',
              }}
            >
              Clear
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date From"
              value={filters.dateFrom}
              onChange={(date) => handleFilterChange('dateFrom', date)}
              slotProps={{ textField: { size: 'small' } }}
            />
            <DatePicker
              label="Date To"
              value={filters.dateTo}
              onChange={(date) => handleFilterChange('dateTo', date)}
              slotProps={{ textField: { size: 'small' } }}
            />
          </LocalizationProvider>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={filters.category || ''}
              onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
              label="Category"
            >
              <MenuItem value="">All</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Merchant</InputLabel>
            <Select
              value={filters.merchant || ''}
              onChange={(e) => handleFilterChange('merchant', e.target.value || undefined)}
              label="Merchant"
            >
              <MenuItem value="">All</MenuItem>
              {merchants.map((merchant) => (
                <MenuItem key={merchant._id} value={merchant._id}>
                  {merchant.merchant_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {/* Controls Bar */}
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
          {/* Search */}
          <TextField
            size="small"
            placeholder={layout === 'items' ? "Search items..." : "Search transactions..."}
            value={layout === 'items' ? itemsSearchQuery : searchQuery}
            onChange={(e) => {
              if (layout === 'items') {
                setItemsSearchQuery(e.target.value);
              } else {
                setSearchQuery(e.target.value);
              }
              setPage(1);
            }}
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

          {/* Layout Toggle */}
          <ToggleButtonGroup
            value={layout}
            exclusive
            onChange={(_, newLayout) => newLayout && setLayout(newLayout)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                fontWeight: 500,
                textTransform: 'none',
                padding: '0.5rem 0.75rem',
              },
            }}
          >
            <ToggleButton value="card">
              <ViewModule sx={{ mr: 0.5, fontSize: '1rem' }} />
              Cards
            </ToggleButton>
            <ToggleButton value="table">
              <ViewList sx={{ mr: 0.5, fontSize: '1rem' }} />
              Table
            </ToggleButton>
            <ToggleButton value="items">
              <ViewList sx={{ mr: 0.5, fontSize: '1rem' }} />
              Items
            </ToggleButton>
          </ToggleButtonGroup>

          {/* Items Per Page */}
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

          {/* Results Count */}
          <Typography 
            variant="body2" 
            sx={{ 
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            Showing {paginatedTransactions.length > 0 ? (page - 1) * itemsPerPage + 1 : 0} - {Math.min(page * itemsPerPage, sortedTransactions.length)} of {sortedTransactions.length}
          </Typography>

          {/* Open Full Screen Button */}
          <Button
            variant="outlined"
            startIcon={<OpenInFull />}
            onClick={() => setFullScreenDialogOpen(true)}
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              textTransform: 'none',
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              '&:hover': {
                borderColor: theme.palette.primary.dark,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(107, 33, 168, 0.1)' : 'rgba(107, 33, 168, 0.05)',
              },
            }}
          >
            View All
          </Button>
        </Box>
      </Paper>

      {/* Transactions List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {paginatedTransactions.length === 0 ? (
          <Paper
            elevation={0}
            sx={{
              p: '3rem',
              textAlign: 'center',
              backgroundColor: theme.palette.background.paper,
              border: `1px dashed ${theme.palette.divider}`,
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
            }}
            role="status"
            aria-live="polite"
          >
            {transactions.length === 0 ? (
              <>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: theme.palette.text.primary, 
                    fontWeight: 600, 
                    fontSize: '1rem',
                    lineHeight: 1.2,
                    mb: '1rem',
                  }}
                >
                  No Transactions Yet
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: theme.palette.text.secondary,
                    mb: '1.5rem',
                  }}
                >
                  Get started by uploading your first bill or receipt. We'll automatically extract the details and track your spending.
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<CloudUpload />}
                  onClick={() => {
                    // Scroll to top where upload section would be
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                    // Dispatch custom event that parent can listen to
                    window.dispatchEvent(new CustomEvent('financial:openUpload'));
                  }}
                  aria-label="Upload your first bill"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                >
                  Upload Your First Bill
                </Button>
              </>
            ) : (
              <>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    color: theme.palette.text.primary, 
                    fontWeight: 600,
                    fontSize: '1rem',
                    lineHeight: 1.2,
                    mb: '1rem',
                  }}
                >
                  No Transactions Match Your Filters
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: theme.palette.text.secondary,
                    mb: '1rem',
                  }}
                >
                  Try adjusting your filters to see more transactions.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({});
                    onFiltersChange({});
                  }}
                  aria-label="Clear all filters"
                  sx={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    padding: '0.625rem 1rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                  }}
                >
                  Clear Filters
                </Button>
              </>
            )}
          </Paper>
        ) : layout === 'items' ? (
          /* Items View - All items from all transactions */
          <TableContainer 
            component={Paper}
            elevation={0}
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              maxHeight: 'calc(100vh - 400px)',
              overflow: 'auto',
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
                      minWidth: '150px',
                    }}
                    onClick={() => handleItemsSort('itemName')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Item Name
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'itemName' ? 1 : 0.3 }} />
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
                      minWidth: '200px',
                    }}
                    onClick={() => handleItemsSort('transactionId')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Transaction ID
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'transactionId' ? 1 : 0.3 }} />
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
                      minWidth: '120px',
                    }}
                    onClick={() => handleItemsSort('transactionDate')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Date
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'transactionDate' ? 1 : 0.3 }} />
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
                    onClick={() => handleItemsSort('merchant')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Merchant
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'merchant' ? 1 : 0.3 }} />
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
                    onClick={() => handleItemsSort('category')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Category
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'category' ? 1 : 0.3 }} />
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
                      minWidth: '80px',
                    }}
                    onClick={() => handleItemsSort('quantity')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Qty
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'quantity' ? 1 : 0.3 }} />
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
                      minWidth: '100px',
                    }}
                    onClick={() => handleItemsSort('unitPrice')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Unit Price
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'unitPrice' ? 1 : 0.3 }} />
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
                      minWidth: '100px',
                    }}
                    onClick={() => handleItemsSort('totalPrice')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Total Price
                      <Sort sx={{ fontSize: '1rem', opacity: itemsSortBy === 'totalPrice' ? 1 : 0.3 }} />
                    </Box>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                        No items found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedItems.map((item, index) => (
                    <TableRow 
                      key={item.id}
                      hover
                      sx={{
                        backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                        '&:hover': {
                          backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                        },
                      }}
                    >
                      <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        {item.itemName}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontSize: '0.75rem',
                            color: theme.palette.primary.main,
                            fontFamily: 'monospace',
                            wordBreak: 'break-all',
                          }}
                        >
                          {item.transactionId}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        {item.transactionDate.toLocaleDateString()}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        {item.merchantName}
                      </TableCell>
                      <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        {item.categoryName}
                      </TableCell>
                      <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        {item.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        Rs. {item.unitPrice.toFixed(2)}
                      </TableCell>
                      <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                        Rs. {item.totalPrice.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        ) : layout === 'table' ? (
          /* Table Layout */
          <TableContainer 
            component={Paper}
            elevation={0}
            sx={{
              backgroundColor: theme.palette.background.paper,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: '12px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              maxHeight: 'calc(100vh - 400px)',
              overflow: 'auto',
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
                    }}
                    onClick={() => handleSort('date')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Date
                      <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'date' ? 1 : 0.3 }} />
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
                    }}
                    onClick={() => handleSort('merchant')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Merchant
                      <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'merchant' ? 1 : 0.3 }} />
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
                    }}
                    onClick={() => handleSort('category')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      Category
                      <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'category' ? 1 : 0.3 }} />
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
                    }}
                    onClick={() => handleSort('amount')}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                      Amount
                      <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'amount' ? 1 : 0.3 }} />
                    </Box>
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 600, 
                      color: theme.palette.text.primary,
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '0.875rem',
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
                    }}
                  >
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedTransactions.map((transaction, index) => (
                  <TableRow 
                    key={transaction._id}
                    hover
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                      },
                    }}
                  >
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {new Date(transaction.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {getMerchantName(transaction.merchant_id)}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {getCategoryName(transaction.category_id)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      Rs. {transaction.amount.toFixed(2)}
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
                          onClick={() => handleEdit(transaction)}
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
                          }}
                          color="secondary"
                          sx={{ padding: '0.25rem' }}
                        >
                          <MergeType sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          /* Card Layout */
          paginatedTransactions.map((transaction) => (
            <Card 
              key={transaction._id} 
              elevation={0} 
              sx={{ 
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
              }}
            >
              <CardContent sx={{ p: '1.5rem' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography 
                      variant="h6" 
                      gutterBottom 
                      sx={{ 
                        fontFamily: "'Inter', sans-serif",
                        color: theme.palette.text.primary,
                        fontSize: '1rem',
                        fontWeight: 600,
                        lineHeight: 1.2,
                        mb: '0.5rem',
                      }}
                    >
                      Rs. {transaction.amount.toFixed(2)}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.875rem',
                        fontWeight: 400,
                        lineHeight: 1.5,
                        color: theme.palette.text.secondary,
                        mb: '0.5rem',
                      }}
                    >
                      {new Date(transaction.date).toLocaleDateString()}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={getMerchantName(transaction.merchant_id)}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={getCategoryName(transaction.category_id)}
                        size="small"
                        variant="outlined"
                      />
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
                      />
                      {transaction.anomaly_flag && (
                        <Chip label="Anomaly" size="small" color="error" />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                      Confidence: {(transaction.confidence_category * 100).toFixed(1)}%
                    </Typography>
                    
                    {/* Bill Items Toggle */}
                    {getBillItems(transaction).length > 0 && (
                      <Button
                        size="small"
                        onClick={() => toggleItemsExpansion(transaction._id)}
                        startIcon={expandedTransactions.has(transaction._id) ? <ExpandLess /> : <ExpandMore />}
                        sx={{ mt: 1, textTransform: 'none' }}
                      >
                        {expandedTransactions.has(transaction._id) ? 'Hide Items' : `Show Items (${getBillItems(transaction).length})`}
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleEdit(transaction)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setDeleteDialogOpen(true);
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedTransaction(transaction);
                        setMergeDialogOpen(true);
                      }}
                      color="secondary"
                    >
                      <MergeType />
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Bill Items List */}
                {getBillItems(transaction).length > 0 && (
                  <Collapse in={expandedTransactions.has(transaction._id)} timeout="auto" unmountOnExit>
                    <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                      <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 600 }}>
                        Bill Items
                      </Typography>
                      <TableContainer>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Item Name</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Quantity</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Unit Price</TableCell>
                              <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Total Price</TableCell>
                              {getBillItems(transaction).some((item: any) => item.category || (item as TransactionItem).category) && (
                                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Category</TableCell>
                              )}
                              {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Actions</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getBillItems(transaction).map((item: any, index: number) => {
                              // Check if this is an API item (has _id) or embedded item
                              const itemId = (item as TransactionItem)._id;
                              const apiItem = itemId && transactionItems[transaction._id] 
                                ? transactionItems[transaction._id].find(apiItem => apiItem._id === itemId)
                                : null;
                              const displayItem = apiItem || item;
                              const isApiItem = !!apiItem;
                              
                              return (
                                <TableRow key={itemId || index} hover>
                                  <TableCell sx={{ color: theme.palette.text.primary }}>{displayItem.name || 'N/A'}</TableCell>
                                  <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{displayItem.quantity || 1}</TableCell>
                                  <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                                    {displayItem.unit_price ? `Rs. ${displayItem.unit_price.toFixed(2)}` : 'N/A'}
                                  </TableCell>
                                  <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                    {displayItem.total_price ? `Rs. ${displayItem.total_price.toFixed(2)}` : 'N/A'}
                                  </TableCell>
                                  {getBillItems(transaction).some((i: any) => i.category || (i as TransactionItem).category) && (
                                    <TableCell sx={{ color: theme.palette.text.primary }}>
                                      {displayItem.category ? (
                                        <Chip label={displayItem.category} size="small" variant="outlined" />
                                      ) : (
                                        '-'
                                      )}
                                    </TableCell>
                                  )}
                                  {apiItem && (
                                    <TableCell>
                                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                                        <IconButton
                                          size="small"
                                          onClick={() => handleItemEdit(apiItem)}
                                          color="primary"
                                          sx={{ padding: '0.25rem' }}
                                        >
                                          <Edit fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                          size="small"
                                          onClick={() => {
                                            setSelectedItem(apiItem);
                                            setItemDeleteDialogOpen(true);
                                          }}
                                          color="error"
                                          sx={{ padding: '0.25rem' }}
                                        >
                                          <Delete fontSize="small" />
                                        </IconButton>
                                      </Box>
                                    </TableCell>
                                  )}
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Box>
                  </Collapse>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Pagination */}
      {(layout === 'items' ? sortedItems.length : sortedTransactions.length) > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
          <Pagination
            count={Math.ceil((layout === 'items' ? sortedItems.length : sortedTransactions.length) / itemsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
            showFirstButton
            showLastButton
            sx={{
              '& .MuiPaginationItem-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          />
        </Box>
      )}

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
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                          No transactions found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    fullScreenSortedTransactions.map((transaction, index) => (
                      <TableRow 
                        key={transaction._id}
                        hover
                        sx={{
                          backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                          '&:hover': {
                            backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                          },
                        }}
                      >
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {getMerchantName(transaction.merchant_id)}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          {getCategoryName(transaction.category_id)}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                          Rs. {transaction.amount.toFixed(2)}
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
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
        </Dialog>
      </Box>
    );
  }





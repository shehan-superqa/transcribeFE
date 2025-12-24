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
import { Edit, Delete, MergeType, FilterList, CloudUpload, ExpandMore, ExpandLess } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { updateTransaction, deleteTransaction, mergeTransaction } from '../../lib/api/financialApi';
import { Transaction, Merchant, Category } from '../../types/financial';
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
  const itemsPerPage = 10;

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
      }
      return newSet;
    });
  };

  const getBillItems = (transaction: Transaction) => {
    return transaction.normalized_output?.items || transaction.parsing_output?.items || [];
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

  const paginatedTransactions = transactions.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const hasFilters = !!(filters.dateFrom || filters.dateTo || filters.category || filters.merchant);

  return (
    <Box>
      {/* Filters */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FilterList sx={{ color: theme.palette.text.secondary }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Filters</Typography>
          {hasFilters && (
            <Button size="small" onClick={clearFilters}>
              Clear
            </Button>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
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

      {/* Transactions List */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {paginatedTransactions.length === 0 ? (
          <Paper
            elevation={2}
            sx={{
              p: 6,
              textAlign: 'center',
              backgroundColor: theme.palette.background.paper,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: 3,
            }}
            role="status"
            aria-live="polite"
          >
            {transactions.length === 0 ? (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                  No Transactions Yet
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
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
                >
                  Upload Your First Bill
                </Button>
              </>
            ) : (
              <>
                <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 2 }}>
                  No Transactions Match Your Filters
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  Try adjusting your filters to see more transactions.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilters({});
                    onFiltersChange({});
                  }}
                  aria-label="Clear all filters"
                >
                  Clear Filters
                </Button>
              </>
            )}
          </Paper>
        ) : (
          paginatedTransactions.map((transaction) => (
            <Card key={transaction._id} elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                      Rs. {transaction.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
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
                              {getBillItems(transaction).some((item: any) => item.category) && (
                                <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Category</TableCell>
                              )}
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getBillItems(transaction).map((item: any, index: number) => (
                              <TableRow key={index}>
                                <TableCell sx={{ color: theme.palette.text.primary }}>{item.name || 'N/A'}</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{item.quantity || 1}</TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                                  {item.unit_price ? `Rs. ${item.unit_price.toFixed(2)}` : 'N/A'}
                                </TableCell>
                                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                                  {item.total_price ? `Rs. ${item.total_price.toFixed(2)}` : 'N/A'}
                                </TableCell>
                                {getBillItems(transaction).some((i: any) => i.category) && (
                                  <TableCell sx={{ color: theme.palette.text.primary }}>
                                    {item.category ? (
                                      <Chip label={item.category} size="small" variant="outlined" />
                                    ) : (
                                      '-'
                                    )}
                                  </TableCell>
                                )}
                              </TableRow>
                            ))}
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
      {transactions.length > itemsPerPage && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={Math.ceil(transactions.length / itemsPerPage)}
            page={page}
            onChange={(_, value) => setPage(value)}
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
      </Box>
    );
  }




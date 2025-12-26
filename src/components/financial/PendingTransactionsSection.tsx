import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { PendingTransaction, Category } from '../../types/financial';

// Dummy pending transactions
const dummyPendingTransactions: PendingTransaction[] = [
  {
    _id: '1',
    user_id: 'user1',
    merchant_id: 'merchant1',
    category_id: 'cat1',
    amount: 125.50,
    currency: 'USD',
    date: '2024-01-28',
    bill_image_url: '/images/receipt1.jpg',
    ocr_text: 'Receipt from Store ABC...',
    anomaly_flag: false,
    confidence_category: 0.85,
    status: 'pending',
    created_at: '2024-01-28',
    updated_at: '2024-01-28',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
  {
    _id: '2',
    user_id: 'user1',
    merchant_id: 'merchant2',
    category_id: 'cat2',
    amount: 89.99,
    currency: 'USD',
    date: '2024-01-27',
    bill_image_url: '/images/receipt2.jpg',
    ocr_text: 'Invoice from Service Provider...',
    anomaly_flag: false,
    confidence_category: 0.92,
    status: 'pending',
    created_at: '2024-01-27',
    updated_at: '2024-01-27',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
  {
    _id: '3',
    user_id: 'user1',
    merchant_id: 'merchant3',
    category_id: 'cat3',
    amount: 1500.00,
    currency: 'USD',
    date: '2024-01-26',
    bill_image_url: '/images/receipt3.jpg',
    ocr_text: 'Payment received from Client...',
    anomaly_flag: false,
    confidence_category: 0.78,
    status: 'pending',
    created_at: '2024-01-26',
    updated_at: '2024-01-26',
    needs_confirmation: true,
    transaction_type: undefined,
    editable_fields: ['amount', 'category_id', 'merchant_id', 'date'],
  },
];

const dummyCategories: Category[] = [
  { _id: 'cat1', category_name: 'Groceries', parent_category: null },
  { _id: 'cat2', category_name: 'Utilities', parent_category: null },
  { _id: 'cat3', category_name: 'Income', parent_category: null },
  { _id: 'cat4', category_name: 'Transportation', parent_category: null },
  { _id: 'cat5', category_name: 'Entertainment', parent_category: null },
];

export default function PendingTransactionsSection() {
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>(dummyPendingTransactions);
  const [selectedTransaction, setSelectedTransaction] = useState<PendingTransaction | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  
  const [confirmData, setConfirmData] = useState({
    transaction_type: 'expense' as 'earning' | 'expense',
  });

  const [editData, setEditData] = useState({
    amount: '',
    category_id: '',
    merchant_id: '',
    date: '',
  });

  const handleOpenConfirmDialog = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setConfirmData({
      transaction_type: 'expense',
    });
    setOpenConfirmDialog(true);
  };

  const handleOpenEditDialog = (transaction: PendingTransaction) => {
    setSelectedTransaction(transaction);
    setEditData({
      amount: transaction.amount.toString(),
      category_id: transaction.category_id,
      merchant_id: transaction.merchant_id,
      date: transaction.date,
    });
    setOpenEditDialog(true);
  };

  const handleConfirm = () => {
    if (selectedTransaction) {
      // Remove from pending list
      setPendingTransactions(pendingTransactions.filter(t => t._id !== selectedTransaction._id));
      console.log('Confirmed transaction:', {
        ...selectedTransaction,
        transaction_type: confirmData.transaction_type,
        status: 'confirmed',
      });
    }
    setOpenConfirmDialog(false);
    setSelectedTransaction(null);
  };

  const handleSaveEdit = () => {
    if (selectedTransaction) {
      setPendingTransactions(pendingTransactions.map(t =>
        t._id === selectedTransaction._id
          ? {
              ...t,
              amount: parseFloat(editData.amount),
              category_id: editData.category_id,
              merchant_id: editData.merchant_id,
              date: editData.date,
              updated_at: new Date().toISOString(),
            }
          : t
      ));
    }
    setOpenEditDialog(false);
    setSelectedTransaction(null);
  };

  const handleDelete = (id: string) => {
    setPendingTransactions(pendingTransactions.filter(t => t._id !== id));
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
          Pending Transactions
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and confirm scanned transactions. Select whether each is an earning or expense.
        </Typography>
      </Box>

      {pendingTransactions.length === 0 ? (
        <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: '12px' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            All caught up!
          </Typography>
          <Typography variant="caption">
            You have no pending transactions to review.
          </Typography>
        </Alert>
      ) : (
        <>
          <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3, borderRadius: '12px' }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {pendingTransactions.length} transaction{pendingTransactions.length !== 1 ? 's' : ''} awaiting confirmation
            </Typography>
            <Typography variant="caption">
              Please review and confirm each transaction to classify it as an earning or expense.
            </Typography>
          </Alert>

          <Grid container spacing={2}>
            {pendingTransactions.map((transaction) => (
              <Grid item xs={12} key={transaction._id}>
                <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'warning.main' }}>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                          <Box
                            sx={{
                              width: 60,
                              height: 60,
                              borderRadius: '12px',
                              backgroundColor: 'action.hover',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <WarningIcon color="warning" />
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                              ${transaction.amount.toFixed(2)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              Merchant: {transaction.merchant_id}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Date: {new Date(transaction.date).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ mt: 1 }}>
                              <Chip
                                label={`Confidence: ${(transaction.confidence_category * 100).toFixed(0)}%`}
                                size="small"
                                variant="outlined"
                                sx={{ borderRadius: '8px' }}
                              />
                            </Box>
                          </Box>
                        </Box>
                      </Grid>

                      <Grid item xs={12} md={6}>
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: { xs: 'flex-start', md: 'flex-end' }, flexWrap: 'wrap' }}>
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleOpenConfirmDialog(transaction)}
                            sx={{ borderRadius: '12px', textTransform: 'none' }}
                          >
                            Confirm
                          </Button>
                          <Button
                            variant="outlined"
                            startIcon={<EditIcon />}
                            onClick={() => handleOpenEditDialog(transaction)}
                            sx={{ borderRadius: '12px', textTransform: 'none' }}
                          >
                            Edit
                          </Button>
                          <IconButton
                            color="error"
                            onClick={() => handleDelete(transaction._id)}
                            sx={{ border: '1px solid', borderColor: 'error.main' }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>

                    {transaction.ocr_text && (
                      <Box sx={{ mt: 2, p: 1.5, backgroundColor: 'action.hover', borderRadius: '8px' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          OCR Text: {transaction.ocr_text.substring(0, 100)}...
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Confirm Transaction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              <Typography variant="body2">
                Please specify whether this transaction is an earning or an expense. This helps us categorize it correctly.
              </Typography>
            </Alert>

            {selectedTransaction && (
              <Box sx={{ p: 2, backgroundColor: 'action.hover', borderRadius: '12px' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Transaction Details:
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  ${selectedTransaction.amount.toFixed(2)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Merchant: {selectedTransaction.merchant_id}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Date: {new Date(selectedTransaction.date).toLocaleDateString()}
                </Typography>
              </Box>
            )}

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                Transaction Type *
              </Typography>
              <ToggleButtonGroup
                value={confirmData.transaction_type}
                exclusive
                onChange={(_e, value) => value && setConfirmData({ ...confirmData, transaction_type: value })}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    borderRadius: '12px',
                    textTransform: 'none',
                    fontWeight: 600,
                    py: 1.5,
                  },
                }}
              >
                <ToggleButton
                  value="expense"
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'error.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'error.dark',
                      },
                    },
                  }}
                >
                  <TrendingDownIcon sx={{ mr: 1 }} />
                  Expense
                </ToggleButton>
                <ToggleButton
                  value="earning"
                  sx={{
                    '&.Mui-selected': {
                      backgroundColor: 'success.main',
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'success.dark',
                      },
                    },
                  }}
                >
                  <TrendingUpIcon sx={{ mr: 1 }} />
                  Earning
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenConfirmDialog(false)} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            variant="contained"
            color="success"
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Confirm Transaction
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={openEditDialog}
        onClose={() => setOpenEditDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          Edit Transaction
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: '12px' }}>
              <Typography variant="body2">
                Correct any errors in the extracted data before confirming the transaction.
              </Typography>
            </Alert>

            <TextField
              label="Amount"
              type="number"
              value={editData.amount}
              onChange={(e) => setEditData({ ...editData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />

            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={editData.category_id}
                label="Category"
                onChange={(e) => setEditData({ ...editData, category_id: e.target.value })}
              >
                {dummyCategories.map((category) => (
                  <MenuItem key={category._id} value={category._id}>
                    {category.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Merchant"
              value={editData.merchant_id}
              onChange={(e) => setEditData({ ...editData, merchant_id: e.target.value })}
              fullWidth
            />

            <TextField
              label="Date"
              type="date"
              value={editData.date}
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenEditDialog(false)} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSaveEdit}
            variant="contained"
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

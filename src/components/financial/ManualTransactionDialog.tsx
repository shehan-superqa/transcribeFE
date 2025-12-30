import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  ToggleButtonGroup,
  ToggleButton,
  Alert,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { Category } from '../../types/financial';
import { createManualTransaction } from '../../lib/api/financialApi';

interface ManualTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (transaction: any) => void;
  categories?: Category[];
}

export default function ManualTransactionDialog({
  open,
  onClose,
  onSave,
  categories = [],
}: ManualTransactionDialogProps) {
  const [formData, setFormData] = useState({
    type: 'expense' as 'earning' | 'expense',
    amount: '',
    merchant_name: '',
    category_id: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    note: '',
    currency: 'USD',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleTypeChange = (_event: React.MouseEvent<HTMLElement>, newType: 'earning' | 'expense' | null) => {
    if (newType !== null) {
      setFormData({ ...formData, type: newType });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    }

    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      // Convert date to ISO 8601 format with time (use current time for the date)
      const dateObj = new Date(formData.date);
      dateObj.setHours(new Date().getHours(), new Date().getMinutes(), new Date().getSeconds());
      
      const request = {
        transaction_type: formData.type,
        amount: parseFloat(formData.amount),
        date: dateObj.toISOString(),
        merchant_name: formData.merchant_name || undefined,
        category_id: formData.category_id || undefined,
        description: formData.note || undefined,
        payment_method: formData.payment_method || undefined,
        currency: formData.currency,
      };

      const response = await createManualTransaction(request);
      
      if (response.success) {
        onSave(response.transaction);
        handleClose();
      } else {
        setErrors({ general: 'Failed to create transaction. Please try again.' });
      }
    } catch (error: any) {
      console.error('Error creating manual transaction:', error);
      setErrors({ general: error.message || 'Failed to create transaction. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'expense',
      amount: '',
      merchant_name: '',
      category_id: '',
      date: new Date().toISOString().split('T')[0],
      payment_method: '',
      note: '',
      currency: 'USD',
    });
    setErrors({});
    setLoading(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: '16px' } }}
    >
      <DialogTitle sx={{ fontWeight: 700 }}>
        Add Manual Transaction
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <Alert severity="info" sx={{ borderRadius: '12px' }}>
            <Typography variant="body2">
              Use this form to manually add transactions when you don't have a receipt or need to record cash transactions.
            </Typography>
          </Alert>

          {/* Transaction Type Toggle */}
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
              Transaction Type *
            </Typography>
            <ToggleButtonGroup
              value={formData.type}
              exclusive
              onChange={handleTypeChange}
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

          {/* Amount */}
          <TextField
            label="Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            fullWidth
            required
            error={!!errors.amount}
            helperText={errors.amount}
            InputProps={{
              startAdornment: <Typography sx={{ mr: 1 }}>{formData.currency === 'USD' ? '$' : formData.currency === 'EUR' ? '€' : formData.currency === 'GBP' ? '£' : formData.currency === 'LKR' ? 'Rs.' : formData.currency === 'INR' ? '₹' : ''}</Typography>,
            }}
            inputProps={{
              step: '0.01',
              min: '0',
            }}
          />

          {/* Merchant/Source Name */}
          <TextField
            label={formData.type === 'earning' ? 'Source Name' : 'Merchant Name'}
            value={formData.merchant_name}
            onChange={(e) => setFormData({ ...formData, merchant_name: e.target.value })}
            fullWidth
            placeholder={formData.type === 'earning' ? 'e.g., Freelance Client' : 'e.g., Local Store'}
            helperText="Optional - Leave blank for generic entry"
          />

          {/* Category */}
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={formData.category_id}
              label="Category"
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category._id} value={category._id}>
                  {category.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Date */}
          <TextField
            label="Date"
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            fullWidth
            required
            error={!!errors.date}
            helperText={errors.date}
            InputLabelProps={{ shrink: true }}
          />

          {/* Payment Method */}
          <FormControl fullWidth>
            <InputLabel>Payment Method</InputLabel>
            <Select
              value={formData.payment_method}
              label="Payment Method"
              onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Credit Card">Credit Card</MenuItem>
              <MenuItem value="Debit Card">Debit Card</MenuItem>
              <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
              <MenuItem value="Mobile Payment">Mobile Payment</MenuItem>
              <MenuItem value="Check">Check</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Currency */}
          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select
              value={formData.currency}
              label="Currency"
              onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            >
              <MenuItem value="USD">USD ($)</MenuItem>
              <MenuItem value="EUR">EUR (€)</MenuItem>
              <MenuItem value="GBP">GBP (£)</MenuItem>
              <MenuItem value="LKR">LKR (Rs.)</MenuItem>
              <MenuItem value="INR">INR (₹)</MenuItem>
            </Select>
          </FormControl>

          {/* Note */}
          <TextField
            label="Description / Note"
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            fullWidth
            multiline
            rows={3}
            placeholder="Add any additional details about this transaction..."
          />

          {/* Error Message */}
          {errors.general && (
            <Alert severity="error" sx={{ borderRadius: '12px' }}>
              {errors.general}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={!formData.amount || !formData.date || loading}
          sx={{ borderRadius: '12px', textTransform: 'none', minWidth: 100 }}
        >
          {loading ? 'Creating...' : 'Add Transaction'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

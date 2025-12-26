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
  FormControlLabel,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Switch,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Repeat as RepeatIcon,
} from '@mui/icons-material';
import { RecurringPayment } from '../../types/financial';

// Dummy data for demonstration
const dummyRecurringPayments: RecurringPayment[] = [
  {
    _id: '1',
    user_id: 'user1',
    name: 'Monthly Salary',
    type: 'earning',
    amount: 5000,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-01',
    next_occurrence: '2024-02-01',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '2',
    user_id: 'user1',
    name: 'Rent Payment',
    type: 'expense',
    amount: 1500,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-05',
    next_occurrence: '2024-02-05',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '3',
    user_id: 'user1',
    name: 'Freelance Income',
    type: 'earning',
    amount: 800,
    currency: 'USD',
    frequency: 'weekly',
    start_date: '2024-01-01',
    next_occurrence: '2024-01-29',
    is_variable: true,
    variable_amounts: [
      { date: '2024-01-08', amount: 750 },
      { date: '2024-01-15', amount: 900 },
      { date: '2024-01-22', amount: 800 },
    ],
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '4',
    user_id: 'user1',
    name: 'Gym Membership',
    type: 'expense',
    amount: 50,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-10',
    next_occurrence: '2024-02-10',
    is_variable: false,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
  {
    _id: '5',
    user_id: 'user1',
    name: 'Utility Bills',
    type: 'expense',
    amount: 200,
    currency: 'USD',
    frequency: 'monthly',
    start_date: '2024-01-15',
    next_occurrence: '2024-02-15',
    is_variable: true,
    is_active: true,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  },
];

export default function RecurringPaymentsSection() {
  const [payments, setPayments] = useState<RecurringPayment[]>(dummyRecurringPayments);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPayment, setEditingPayment] = useState<RecurringPayment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense' as 'earning' | 'expense',
    amount: '',
    frequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom',
    custom_interval_days: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    is_variable: false,
    is_active: true,
  });

  const handleOpenDialog = (payment?: RecurringPayment) => {
    if (payment) {
      setEditingPayment(payment);
      setFormData({
        name: payment.name,
        type: payment.type,
        amount: payment.amount.toString(),
        frequency: payment.frequency,
        custom_interval_days: payment.custom_interval_days?.toString() || '',
        start_date: payment.start_date.split('T')[0],
        end_date: payment.end_date?.split('T')[0] || '',
        is_variable: payment.is_variable,
        is_active: payment.is_active,
      });
    } else {
      setEditingPayment(null);
      setFormData({
        name: '',
        type: 'expense',
        amount: '',
        frequency: 'monthly',
        custom_interval_days: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        is_variable: false,
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPayment(null);
  };

  const handleSave = () => {
    if (editingPayment) {
      // Update existing payment
      setPayments(payments.map(p => 
        p._id === editingPayment._id 
          ? {
              ...p,
              name: formData.name,
              type: formData.type,
              amount: parseFloat(formData.amount),
              frequency: formData.frequency,
              custom_interval_days: formData.custom_interval_days ? parseInt(formData.custom_interval_days) : undefined,
              end_date: formData.end_date || null,
              is_variable: formData.is_variable,
              is_active: formData.is_active,
              updated_at: new Date().toISOString(),
            }
          : p
      ));
    } else {
      // Create new payment
      const newPayment: RecurringPayment = {
        _id: Date.now().toString(),
        user_id: 'user1',
        name: formData.name,
        type: formData.type,
        amount: parseFloat(formData.amount),
        currency: 'USD',
        frequency: formData.frequency,
        custom_interval_days: formData.custom_interval_days ? parseInt(formData.custom_interval_days) : undefined,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        next_occurrence: formData.start_date,
        is_variable: formData.is_variable,
        is_active: formData.is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPayments([...payments, newPayment]);
    }
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    setPayments(payments.filter(p => p._id !== id));
  };

  const handleToggleActive = (id: string) => {
    setPayments(payments.map(p => 
      p._id === id ? { ...p, is_active: !p.is_active } : p
    ));
  };

  const activePayments = payments.filter(p => p.is_active);
  const totalEarnings = activePayments
    .filter(p => p.type === 'earning')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = activePayments
    .filter(p => p.type === 'expense')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Recurring Payments
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          sx={{ borderRadius: '12px', textTransform: 'none' }}
        >
          Add Recurring Payment
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingUpIcon color="success" />
                <Typography variant="body2" color="text.secondary">
                  Monthly Earnings
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'success.main' }}>
                ${totalEarnings.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <TrendingDownIcon color="error" />
                <Typography variant="body2" color="text.secondary">
                  Monthly Expenses
                </Typography>
              </Box>
              <Typography variant="h4" sx={{ fontWeight: 700, color: 'error.main' }}>
                ${totalExpenses.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: '16px', border: '1px solid', borderColor: 'divider' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <RepeatIcon color="primary" />
                <Typography variant="body2" color="text.secondary">
                  Net Monthly
                </Typography>
              </Box>
              <Typography 
                variant="h4" 
                sx={{ 
                  fontWeight: 700, 
                  color: totalEarnings - totalExpenses >= 0 ? 'success.main' : 'error.main' 
                }}
              >
                ${(totalEarnings - totalExpenses).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payments List */}
      <Grid container spacing={2}>
        {payments.map((payment) => (
          <Grid item xs={12} md={6} key={payment._id}>
            <Card 
              sx={{ 
                borderRadius: '16px', 
                border: '1px solid', 
                borderColor: 'divider',
                opacity: payment.is_active ? 1 : 0.6,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {payment.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={payment.type === 'earning' ? 'Earning' : 'Expense'}
                        size="small"
                        color={payment.type === 'earning' ? 'success' : 'error'}
                        sx={{ borderRadius: '8px' }}
                      />
                      <Chip
                        label={payment.frequency.charAt(0).toUpperCase() + payment.frequency.slice(1)}
                        size="small"
                        variant="outlined"
                        sx={{ borderRadius: '8px' }}
                      />
                      {payment.is_variable && (
                        <Chip
                          label="Variable"
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={{ borderRadius: '8px' }}
                        />
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton size="small" onClick={() => handleOpenDialog(payment)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(payment._id)} color="error">
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      ${payment.amount.toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Next: {new Date(payment.next_occurrence).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={payment.is_active}
                        onChange={() => handleToggleActive(payment._id)}
                        size="small"
                      />
                    }
                    label={<Typography variant="caption">Active</Typography>}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {payments.length === 0 && (
        <Alert severity="info" sx={{ borderRadius: '12px' }}>
          No recurring payments configured. Click "Add Recurring Payment" to get started.
        </Alert>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingPayment ? 'Edit Recurring Payment' : 'Add Recurring Payment'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Payment Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Type</InputLabel>
              <Select
                value={formData.type}
                label="Type"
                onChange={(e) => setFormData({ ...formData, type: e.target.value as 'earning' | 'expense' })}
              >
                <MenuItem value="earning">Earning</MenuItem>
                <MenuItem value="expense">Expense</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Amount"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              fullWidth
              required
              InputProps={{ startAdornment: '$' }}
            />

            <FormControl fullWidth required>
              <InputLabel>Frequency</InputLabel>
              <Select
                value={formData.frequency}
                label="Frequency"
                onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
              >
                <MenuItem value="daily">Daily</MenuItem>
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
                <MenuItem value="yearly">Yearly</MenuItem>
                <MenuItem value="custom">Custom</MenuItem>
              </Select>
            </FormControl>

            {formData.frequency === 'custom' && (
              <TextField
                label="Custom Interval (days)"
                type="number"
                value={formData.custom_interval_days}
                onChange={(e) => setFormData({ ...formData, custom_interval_days: e.target.value })}
                fullWidth
                required
              />
            )}

            <TextField
              label="Start Date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              fullWidth
              required
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="End Date (Optional)"
              type="date"
              value={formData.end_date}
              onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_variable}
                  onChange={(e) => setFormData({ ...formData, is_variable: e.target.checked })}
                />
              }
              label="Variable Amount"
            />

            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} sx={{ borderRadius: '12px', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained"
            disabled={!formData.name || !formData.amount}
            sx={{ borderRadius: '12px', textTransform: 'none' }}
          >
            {editingPayment ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

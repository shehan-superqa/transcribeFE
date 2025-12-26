import { useState, useEffect } from 'react';
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Slider,
  Alert,
} from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { Budget, CreateBudgetRequest, UpdateBudgetRequest, Category } from '../../types/financial';

interface BudgetFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBudgetRequest | UpdateBudgetRequest) => Promise<void>;
  budget?: Budget | null;
  categories?: Category[];
  loading?: boolean;
}

export default function BudgetForm({
  open,
  onClose,
  onSubmit,
  budget,
  categories = [],
  loading = false,
}: BudgetFormProps) {
  const { theme } = useTheme();
  const [formData, setFormData] = useState<CreateBudgetRequest>({
    name: '',
    category_id: null,
    amount: 0,
    period: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: null,
    alert_thresholds: {
      warning: 80,
      critical: 95,
    },
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (budget) {
      setFormData({
        name: budget.name,
        category_id: budget.category_id,
        amount: budget.amount,
        period: budget.period,
        start_date: budget.start_date.split('T')[0],
        end_date: budget.end_date ? budget.end_date.split('T')[0] : null,
        alert_thresholds: budget.alert_thresholds,
      });
    } else {
      setFormData({
        name: '',
        category_id: null,
        amount: 0,
        period: 'monthly',
        start_date: new Date().toISOString().split('T')[0],
        end_date: null,
        alert_thresholds: {
          warning: 80,
          critical: 95,
        },
      });
    }
    setError(null);
  }, [budget, open]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Budget name is required');
      return;
    }
    if (formData.amount <= 0) {
      setError('Budget amount must be greater than 0');
      return;
    }
    if (formData.alert_thresholds.warning >= formData.alert_thresholds.critical) {
      setError('Warning threshold must be less than critical threshold');
      return;
    }

    try {
      const submitData = budget
        ? ({
            name: formData.name,
            amount: formData.amount,
            alert_thresholds: formData.alert_thresholds,
          } as UpdateBudgetRequest)
        : ({
            ...formData,
            start_date: new Date(formData.start_date).toISOString(),
            end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
          } as CreateBudgetRequest);

      await onSubmit(submitData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save budget');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="budget-form-title">
      <DialogTitle id="budget-form-title">{budget ? 'Edit Budget' : 'Create Budget'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Budget Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            fullWidth
            required
            aria-label="Budget name"
          />

          <FormControl fullWidth>
            <InputLabel id="category-label">Category (Optional)</InputLabel>
            <Select
              labelId="category-label"
              value={formData.category_id || ''}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value || null })}
              label="Category (Optional)"
              aria-label="Select category for budget"
            >
              <MenuItem value="">All Categories (Overall Budget)</MenuItem>
              {categories.map((cat) => (
                <MenuItem key={cat._id} value={cat._id}>
                  {cat.category_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Budget Amount"
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
            fullWidth
            required
            inputProps={{ min: 0, step: 0.01 }}
            aria-label="Budget amount"
          />

          <FormControl fullWidth>
            <InputLabel id="period-label">Period</InputLabel>
            <Select
              labelId="period-label"
              value={formData.period}
              onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
              label="Period"
              aria-label="Budget period"
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Start Date"
            type="date"
            value={formData.start_date}
            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={!!budget}
            aria-label="Budget start date"
          />

          <TextField
            label="End Date (Optional)"
            type="date"
            value={formData.end_date || ''}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value || null })}
            fullWidth
            InputLabelProps={{ shrink: true }}
            disabled={!!budget}
            aria-label="Budget end date"
          />

          <Box>
            <Typography variant="subtitle2" gutterBottom sx={{ color: theme.palette.text.primary }}>
              Alert Thresholds
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              Set when you want to be notified about budget usage
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                Warning: {formData.alert_thresholds.warning}%
              </Typography>
              <Slider
                value={formData.alert_thresholds.warning}
                onChange={(_, value) =>
                  setFormData({
                    ...formData,
                    alert_thresholds: { ...formData.alert_thresholds, warning: value as number },
                  })
                }
                min={0}
                max={formData.alert_thresholds.critical - 1}
                step={5}
                marks
                aria-label="Warning threshold percentage"
              />
            </Box>

            <Box>
              <Typography variant="body2" gutterBottom>
                Critical: {formData.alert_thresholds.critical}%
              </Typography>
              <Slider
                value={formData.alert_thresholds.critical}
                onChange={(_, value) =>
                  setFormData({
                    ...formData,
                    alert_thresholds: { ...formData.alert_thresholds, critical: value as number },
                  })
                }
                min={formData.alert_thresholds.warning + 1}
                max={100}
                step={5}
                marks
                aria-label="Critical threshold percentage"
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading} aria-label="Cancel">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} aria-label="Save budget">
          {loading ? 'Saving...' : budget ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}







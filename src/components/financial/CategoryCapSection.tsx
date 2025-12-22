import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  LinearProgress,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add, Edit, Delete, Warning } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { getCategoryCaps, createCategoryCap } from '../../lib/api/financialApi';
import { CreateCategoryCapRequest, CategoryCap, Category } from '../../types/financial';

interface CategoryCapSectionProps {
  categories?: Category[];
  onCapChange?: () => void;
}

export default function CategoryCapSection({ categories = [], onCapChange }: CategoryCapSectionProps) {
  const { theme } = useTheme();
  const [caps, setCaps] = useState<Array<CategoryCap & { category_name: string; current_spending: number; remaining: number; alert_triggered: boolean }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCap, setEditingCap] = useState<CategoryCap | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [capToDelete, setCapToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCategoryCapRequest>({
    category_id: '',
    monthly_limit: 0,
    alert_at_percentage: 80,
  });

  useEffect(() => {
    loadCaps();
  }, []);

  const loadCaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getCategoryCaps();
      if (response.success) {
        setCaps(response.caps);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load category caps');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }
    if (formData.monthly_limit <= 0) {
      setError('Monthly limit must be greater than 0');
      return;
    }

    try {
      await createCategoryCap(formData);
      await loadCaps();
      setFormOpen(false);
      setFormData({ category_id: '', monthly_limit: 0, alert_at_percentage: 80 });
      setEditingCap(null);
      onCapChange?.();
    } catch (err: any) {
      setError(err.message || 'Failed to save category cap');
    }
  };

  const handleDelete = async () => {
    if (!capToDelete) return;
    // Note: Delete endpoint may need to be added to API
    // For now, we'll show an error
    setError('Delete functionality will be available soon');
    setDeleteDialogOpen(false);
  };

  const availableCategories = categories.filter((cat) => !caps.some((cap) => cap.category_id === cat._id));

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Category Spending Caps
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set monthly spending limits for specific categories
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingCap(null);
              setFormData({ category_id: '', monthly_limit: 0, alert_at_percentage: 80 });
              setFormOpen(true);
            }}
            disabled={availableCategories.length === 0}
            aria-label="Set category spending cap"
          >
            Set Cap
          </Button>
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {caps.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              No category caps set. Set spending limits to get alerts when you're approaching them.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table aria-label="Category spending caps">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Monthly Limit
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Current Spending
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Remaining
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 600 }}>
                    Status
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {caps.map((cap) => {
                  const percentageUsed = (cap.current_spending / cap.monthly_limit) * 100;
                  return (
                    <TableRow key={cap._id}>
                      <TableCell>{cap.category_name}</TableCell>
                      <TableCell align="right">
                        Rs. {cap.monthly_limit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        Rs. {cap.current_spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          sx={{
                            color: cap.remaining >= 0 ? theme.palette.success.main : theme.palette.error.main,
                            fontWeight: 600,
                          }}
                        >
                          Rs. {cap.remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                          <LinearProgress
                            variant="determinate"
                            value={Math.min(percentageUsed, 100)}
                            sx={{
                              width: '100%',
                              height: 6,
                              borderRadius: 3,
                              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                              '& .MuiLinearProgress-bar': {
                                backgroundColor:
                                  percentageUsed >= cap.alert_at_percentage
                                    ? theme.palette.error.main
                                    : percentageUsed >= cap.alert_at_percentage * 0.8
                                    ? theme.palette.warning.main
                                    : theme.palette.success.main,
                                borderRadius: 3,
                              },
                            }}
                          />
                          {cap.alert_triggered && (
                            <Chip
                              icon={<Warning />}
                              label="Alert"
                              size="small"
                              color="warning"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditingCap(cap);
                            setFormData({
                              category_id: cap.category_id,
                              monthly_limit: cap.monthly_limit,
                              alert_at_percentage: cap.alert_at_percentage,
                            });
                            setFormOpen(true);
                          }}
                          aria-label="Edit category cap"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setCapToDelete(cap._id);
                            setDeleteDialogOpen(true);
                          }}
                          aria-label="Delete category cap"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Form Dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth aria-labelledby="cap-form-title">
        <DialogTitle id="cap-form-title">{editingCap ? 'Edit Category Cap' : 'Set Category Spending Cap'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel id="category-label">Category</InputLabel>
              <Select
                labelId="category-label"
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                label="Category"
                disabled={!!editingCap}
                aria-label="Select category"
              >
                {availableCategories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Monthly Limit"
              type="number"
              value={formData.monthly_limit}
              onChange={(e) => setFormData({ ...formData, monthly_limit: parseFloat(e.target.value) || 0 })}
              fullWidth
              required
              inputProps={{ min: 0, step: 0.01 }}
              aria-label="Monthly spending limit"
            />

            <FormControl fullWidth>
              <InputLabel id="alert-label">Alert At Percentage</InputLabel>
              <Select
                labelId="alert-label"
                value={formData.alert_at_percentage}
                onChange={(e) => setFormData({ ...formData, alert_at_percentage: e.target.value as number })}
                label="Alert At Percentage"
                aria-label="Alert threshold percentage"
              >
                <MenuItem value={70}>70%</MenuItem>
                <MenuItem value={80}>80%</MenuItem>
                <MenuItem value={90}>90%</MenuItem>
                <MenuItem value={95}>95%</MenuItem>
              </Select>
            </FormControl>

            <Typography variant="caption" color="text.secondary">
              You'll receive an alert when spending reaches {formData.alert_at_percentage}% of the monthly limit.
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFormOpen(false)} aria-label="Cancel">
            Cancel
          </Button>
          <Button onClick={handleSubmit} variant="contained" aria-label="Save category cap">
            {editingCap ? 'Update' : 'Set Cap'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-cap-title">
        <DialogTitle id="delete-cap-title">Delete Category Cap</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to remove this spending cap? You will stop receiving alerts for this category.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} aria-label="Cancel">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained" aria-label="Confirm delete">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import { Add, FilterList } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import {
  listBudgets,
  getBudgetStatus,
  createBudget,
  updateBudget,
  deleteBudget,
  CreateBudgetRequest,
  UpdateBudgetRequest,
} from '../../lib/api/financialApi';
import { Budget, BudgetStatusResponse, Category } from '../../types/financial';
import BudgetCard from './BudgetCard';
import CreateBudgetModal from './CreateBudgetModal';

interface BudgetSectionProps {
  categories?: Category[];
  onBudgetChange?: () => void;
}

export default function BudgetSection({ categories = [], onBudgetChange }: BudgetSectionProps) {
  const { theme } = useTheme();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [budgetStatuses, setBudgetStatuses] = useState<BudgetStatusResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'category'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('');

  useEffect(() => {
    loadBudgets();
  }, [filter, categoryFilter]);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {};
      if (filter === 'active') params.active_only = true;
      if (categoryFilter) params.category_id = categoryFilter;

      const response = await listBudgets(params);
      if (response.success) {
        setBudgets(response.budgets);
        // Load status for each budget
        const statuses = await Promise.all(
          response.budgets.map(async (budget) => {
            try {
              const statusRes = await getBudgetStatus(budget._id);
              return statusRes;
            } catch (err) {
              console.error(`Failed to load status for budget ${budget._id}:`, err);
              return null;
            }
          })
        );
        setBudgetStatuses(statuses.filter((s): s is BudgetStatusResponse => s !== null));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBudget = async (data: CreateBudgetRequest) => {
    try {
      const response = await createBudget(data);
      if (response.success) {
        await loadBudgets();
        onBudgetChange?.();
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to create budget');
    }
  };

  const handleUpdateBudget = async (data: UpdateBudgetRequest) => {
    if (!editingBudget) return;
    try {
      const response = await updateBudget(editingBudget._id, data);
      if (response.success) {
        await loadBudgets();
        setEditingBudget(null);
        onBudgetChange?.();
      }
    } catch (err: any) {
      throw new Error(err.message || 'Failed to update budget');
    }
  };

  const handleDeleteBudget = async () => {
    if (!budgetToDelete) return;
    try {
      const response = await deleteBudget(budgetToDelete);
      if (response.success) {
        await loadBudgets();
        setBudgetToDelete(null);
        setDeleteDialogOpen(false);
        onBudgetChange?.();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to delete budget');
    }
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'All Categories';
    const category = categories.find((c) => c._id === categoryId);
    return category?.category_name || 'Unknown';
  };

  if (loading && budgets.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Paper elevation={2} sx={{ p: 3, backgroundColor: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 600, mb: 0.5 }}>
              Budget Management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Set spending limits and get alerts when you're approaching them
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => {
              setEditingBudget(null);
              setFormOpen(true);
            }}
            aria-label="Create new budget"
          >
            Create Budget
          </Button>
        </Box>

        {/* Filters */}
        <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', mt: '1.5rem' }}>
          <FormControl 
            size="small" 
            sx={{ 
              minWidth: 150,
              '& .MuiInputLabel-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          >
            <InputLabel id="filter-label">Filter</InputLabel>
            <Select
              labelId="filter-label"
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              label="Filter"
              aria-label="Filter budgets"
              sx={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                borderRadius: '8px',
              }}
            >
              <MenuItem 
                value="all"
                sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
              >
                All Budgets
              </MenuItem>
              <MenuItem 
                value="active"
                sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
              >
                Active Only
              </MenuItem>
              <MenuItem 
                value="category"
                sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
              >
                By Category
              </MenuItem>
            </Select>
          </FormControl>

          {filter === 'category' && (
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="category-filter-label">Category</InputLabel>
              <Select
                labelId="category-filter-label"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
                aria-label="Filter by category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((cat) => (
                  <MenuItem key={cat._id} value={cat._id}>
                    {cat.category_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {budgetStatuses.length === 0 ? (
        <Paper
          elevation={2}
          sx={{
            p: 6,
            textAlign: 'center',
            backgroundColor: theme.palette.background.paper,
            border: `2px dashed ${theme.palette.divider}`,
            borderRadius: 3,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
            No Budgets Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Create a budget to track your spending and get alerts when you're approaching your limits.
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)} aria-label="Create your first budget">
            Create Your First Budget
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {budgetStatuses.map((budgetStatus) => (
            <Grid item xs={12} sm={6} md={4} key={budgetStatus.budget._id}>
              <BudgetCard
                budgetStatus={budgetStatus}
                categoryName={getCategoryName(budgetStatus.budget.category_id)}
                onEdit={(budget) => {
                  setEditingBudget(budget);
                  setFormOpen(true);
                }}
                onDelete={(budgetId) => {
                  setBudgetToDelete(budgetId);
                  setDeleteDialogOpen(true);
                }}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Budget Form Dialog */}
      <CreateBudgetModal
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditingBudget(null);
        }}
        onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
        budget={editingBudget}
        categories={categories}
        loading={loading}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} aria-labelledby="delete-dialog-title">
        <DialogTitle id="delete-dialog-title">Delete Budget</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this budget? This action cannot be undone. You will stop receiving alerts for this budget.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} aria-label="Cancel deletion">
            Cancel
          </Button>
          <Button onClick={handleDeleteBudget} color="error" variant="contained" aria-label="Confirm delete budget">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}








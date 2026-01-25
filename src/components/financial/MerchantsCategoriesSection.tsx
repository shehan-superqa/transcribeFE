import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Chip, List, ListItem, ListItemText, Snackbar, Alert } from '@mui/material';
import { Edit, Add, Delete } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';
import { listMerchants, updateMerchant, listCategories, createCategory, updateCategory, deleteCategory } from '../../lib/api/financialApi';
import { Merchant, Category } from '../../types/financial';

interface MerchantsCategoriesSectionProps {
  onDataChange?: () => void;
}

export default function MerchantsCategoriesSection({ onDataChange }: MerchantsCategoriesSectionProps) {
  const { theme } = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editMerchantDialog, setEditMerchantDialog] = useState(false);
  const [createCategoryDialog, setCreateCategoryDialog] = useState(false);
  const [editCategoryDialog, setEditCategoryDialog] = useState(false);
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [merchantForm, setMerchantForm] = useState({ aliases: '', category: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', parent: '' });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' | 'warning' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [merchantsRes, categoriesRes] = await Promise.all([
        listMerchants(),
        listCategories(),
      ]);
      if (merchantsRes.success) setMerchants(merchantsRes.merchants);
      if (categoriesRes.success) setCategories(categoriesRes.categories);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const handleEditMerchant = (merchant: Merchant) => {
    setSelectedMerchant(merchant);
    setMerchantForm({
      aliases: (merchant.aliases && Array.isArray(merchant.aliases)) ? merchant.aliases.join(', ') : '',
      category: merchant.merchant_category || '',
    });
    setEditMerchantDialog(true);
  };

  const handleSaveMerchant = async () => {
    if (!selectedMerchant) return;
    try {
      await updateMerchant(selectedMerchant._id, {
        aliases: merchantForm.aliases.split(',').map((a) => a.trim()).filter(Boolean),
        merchant_category: merchantForm.category || undefined,
      });
      setEditMerchantDialog(false);
      setSnackbar({ open: true, message: 'Merchant updated successfully', severity: 'success' });
      loadData();
      onDataChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update merchant: ' + error.message, severity: 'error' });
    }
  };

  const handleCreateCategory = async () => {
    try {
      await createCategory({
        category_name: categoryForm.name,
        parent_category: categoryForm.parent || undefined,
      });
      setCreateCategoryDialog(false);
      setCategoryForm({ name: '', parent: '' });
      setSnackbar({ open: true, message: 'Category created successfully', severity: 'success' });
      loadData();
      onDataChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to create category: ' + error.message, severity: 'error' });
    }
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.category_name,
      parent: category.parent_category || '',
    });
    setEditCategoryDialog(true);
  };

  const handleSaveCategory = async () => {
    if (!selectedCategory) return;
    try {
      await updateCategory(selectedCategory._id, {
        category_name: categoryForm.name,
        parent_category: categoryForm.parent || null,
      });
      setEditCategoryDialog(false);
      setSelectedCategory(null);
      setCategoryForm({ name: '', parent: '' });
      setSnackbar({ open: true, message: 'Category updated successfully', severity: 'success' });
      loadData();
      onDataChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update category: ' + error.message, severity: 'error' });
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    try {
      await deleteCategory(selectedCategory._id);
      setDeleteCategoryDialog(false);
      setSelectedCategory(null);
      setSnackbar({ open: true, message: 'Category deleted successfully', severity: 'success' });
      loadData();
      onDataChange?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to delete category: ' + error.message, severity: 'error' });
    }
  };

  return (
    <Box>
      <Paper 
        elevation={0} 
        sx={{ 
          mb: '2rem', 
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={(_, v) => setTabValue(v)}
          sx={{
            '& .MuiTab-root': {
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              padding: '0.75rem 1rem',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: theme.palette.primary.main,
              height: 2,
            },
          }}
        >
          <Tab label="Merchants" />
          <Tab label="Categories" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: '1.5rem' }}>
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
              Merchants
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {merchants.map((merchant) => (
              <Card key={merchant._id} elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                        {merchant.merchant_name}
                      </Typography>
                      {merchant.aliases && Array.isArray(merchant.aliases) && merchant.aliases.length > 0 && (
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                          {merchant.aliases.map((alias, idx) => (
                            <Chip key={idx} label={alias} size="small" variant="outlined" />
                          ))}
                        </Box>
                      )}
                      {merchant.merchant_category && (
                        <Chip label={merchant.merchant_category} size="small" color="primary" />
                      )}
                    </Box>
                    <IconButton onClick={() => handleEditMerchant(merchant)} color="primary">
                      <Edit />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {tabValue === 1 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>Categories</Typography>
            <Button startIcon={<Add />} variant="contained" onClick={() => setCreateCategoryDialog(true)}>
              Create Category
            </Button>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {categories.map((category) => (
              <Card key={category._id} elevation={1} sx={{ backgroundColor: theme.palette.background.paper }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.primary }}>
                        {category.category_name}
                      </Typography>
                      {category.parent_category && (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Parent: {category.parent_category}
                        </Typography>
                      )}
                      {!category.parent_category && (
                        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                          Root category
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton onClick={() => handleEditCategory(category)} color="primary" size="small">
                        <Edit />
                      </IconButton>
                      <IconButton 
                        onClick={() => {
                          setSelectedCategory(category);
                          setDeleteCategoryDialog(true);
                        }} 
                        color="error" 
                        size="small"
                      >
                        <Delete />
                      </IconButton>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Edit Merchant Dialog */}
      <Dialog open={editMerchantDialog} onClose={() => setEditMerchantDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Merchant</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Aliases (comma-separated)"
              value={merchantForm.aliases}
              onChange={(e) => setMerchantForm({ ...merchantForm, aliases: e.target.value })}
              fullWidth
              multiline
              rows={3}
            />
            <TextField
              label="Category"
              value={merchantForm.category}
              onChange={(e) => setMerchantForm({ ...merchantForm, category: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMerchantDialog(false)}>Cancel</Button>
          <Button onClick={handleSaveMerchant} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Category Dialog */}
      <Dialog open={createCategoryDialog} onClose={() => setCreateCategoryDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              fullWidth
            />
            <TextField
              label="Parent Category ID (optional)"
              value={categoryForm.parent}
              onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateCategoryDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCategory} variant="contained">
            Create
          </Button>
          </DialogActions>
        </Dialog>

      {/* Edit Category Dialog */}
      <Dialog open={editCategoryDialog} onClose={() => {
        setEditCategoryDialog(false);
        setSelectedCategory(null);
        setCategoryForm({ name: '', parent: '' });
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Category</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Category Name"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              fullWidth
              required
            />
            <TextField
              label="Parent Category ID (optional)"
              value={categoryForm.parent}
              onChange={(e) => setCategoryForm({ ...categoryForm, parent: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setEditCategoryDialog(false);
            setSelectedCategory(null);
            setCategoryForm({ name: '', parent: '' });
          }}>Cancel</Button>
          <Button onClick={handleSaveCategory} variant="contained">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Dialog */}
      <Dialog open={deleteCategoryDialog} onClose={() => {
        setDeleteCategoryDialog(false);
        setSelectedCategory(null);
      }}>
        <DialogTitle>Delete Category</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{selectedCategory?.category_name}"? 
            This action cannot be undone. Categories that are used in transactions cannot be deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setDeleteCategoryDialog(false);
            setSelectedCategory(null);
          }}>Cancel</Button>
          <Button onClick={handleDeleteCategory} color="error" variant="contained">
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
      </Box>
    );
  }







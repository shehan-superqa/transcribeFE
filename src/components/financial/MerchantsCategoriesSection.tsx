import { useState, useEffect } from 'react';
import { Box, Paper, Typography, TextField, Button, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Tabs, Tab, Chip, List, ListItem, ListItemText } from '@mui/material';
import { Edit, Add } from '@mui/icons-material';
import { listMerchants, updateMerchant, listCategories, createCategory } from '../../lib/api/financialApi';
import { Merchant, Category } from '../../types/financial';

interface MerchantsCategoriesSectionProps {
  onDataChange?: () => void;
}

export default function MerchantsCategoriesSection({ onDataChange }: MerchantsCategoriesSectionProps) {
  const [tabValue, setTabValue] = useState(0);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editMerchantDialog, setEditMerchantDialog] = useState(false);
  const [createCategoryDialog, setCreateCategoryDialog] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
  const [merchantForm, setMerchantForm] = useState({ aliases: '', category: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', parent: '' });

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
      aliases: merchant.aliases.join(', '),
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
      loadData();
      onDataChange?.();
    } catch (error: any) {
      alert('Failed to update merchant: ' + error.message);
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
      loadData();
      onDataChange?.();
    } catch (error: any) {
      alert('Failed to create category: ' + error.message);
    }
  };

  return (
    <Box>
      <Paper elevation={1} sx={{ mb: 2, backgroundColor: '#ffffff' }}>
        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
          <Tab label="Merchants" />
          <Tab label="Categories" />
        </Tabs>
      </Paper>

      {tabValue === 0 && (
        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6" sx={{ color: '#111827' }}>Merchants</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {merchants.map((merchant) => (
              <Card key={merchant._id} elevation={1} sx={{ backgroundColor: '#ffffff' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" gutterBottom sx={{ color: '#111827' }}>
                        {merchant.merchant_name}
                      </Typography>
                      {merchant.aliases.length > 0 && (
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
            <Typography variant="h6" sx={{ color: '#111827' }}>Categories</Typography>
            <Button startIcon={<Add />} variant="contained" onClick={() => setCreateCategoryDialog(true)}>
              Create Category
            </Button>
          </Box>
          <List>
            {categories.map((category) => (
              <ListItem key={category._id}>
                <ListItemText
                  primary={category.category_name}
                  secondary={category.parent_category ? `Parent: ${category.parent_category}` : 'Root category'}
                />
              </ListItem>
            ))}
          </List>
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
    </Box>
  );
}

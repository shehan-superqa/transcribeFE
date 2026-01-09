import React, { useState, useEffect } from 'react';
import { Drawer, Box, IconButton, Typography, Divider, Chip, TextField, FormControl, InputLabel, Select, MenuItem, Button, Snackbar, Alert } from '@mui/material';
import { Close, ReceiptLong, Save, Cancel, Delete } from '@mui/icons-material';
import { Transaction, TransactionItem, Merchant, Category } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { formatCurrency, getDisplayMerchantName, getDisplayCategoryName, getTaxAmount } from '../../utils/transactionHelpers';
import { updateTransaction, updateItem, deleteItem } from '../../lib/api/financialApi';

interface ReceiptPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  merchants: Merchant[];
  categories: Category[];
  getMerchantName: (merchantId: string | null) => string;
  getCategoryName: (categoryId: string | null) => string;
  getBillItems: (transaction: Transaction) => TransactionItem[];
  onTransactionUpdated?: () => void;
}

export default function ReceiptPreviewDrawer({
  open,
  onClose,
  transaction,
  merchants,
  categories,
  getMerchantName,
  getCategoryName,
  getBillItems,
  onTransactionUpdated,
}: ReceiptPreviewDrawerProps) {
  const { theme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [editForm, setEditForm] = useState({
    merchant_id: '',
    category_id: '',
    date: '',
    subtotal: '',
    taxes: '',
    discount: '',
    amount: '',
  });

  const [editingItems, setEditingItems] = useState<Record<string, {
    name: string;
    quantity: string;
    unit_price: string;
    total_price: string;
    category: string;
  }>>({});

  useEffect(() => {
    if (transaction) {
      const subtotal = transaction.subtotal || transaction.amount;
      const taxes = transaction.taxes || 0;
      const discount = transaction.discount || 0;
      setEditForm({
        merchant_id: transaction.merchant_id || '',
        category_id: transaction.category_id || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        subtotal: subtotal.toString(),
        taxes: taxes.toString(),
        discount: discount.toString(),
        amount: transaction.amount.toString(),
      });
      setIsEditing(false);
      
      // Initialize editing items state
      const items = getBillItems(transaction);
      const itemsState: Record<string, any> = {};
      items.forEach((item) => {
        if (item._id) {
          itemsState[item._id] = {
            name: item.name || '',
            quantity: item.quantity?.toString() || '',
            unit_price: item.unit_price?.toString() || '',
            total_price: item.total_price?.toString() || '',
            category: item.category || '',
          };
        }
      });
      setEditingItems(itemsState);
    }
  }, [transaction, getBillItems]);

  if (!transaction) return null;

  const billItems = getBillItems(transaction);
  const merchantName = getDisplayMerchantName(transaction, getMerchantName(transaction.merchant_id));
  const categoryName = getDisplayCategoryName(transaction, getCategoryName(transaction.category_id), billItems);

  const handleSave = async () => {
    if (!transaction) return;

    setIsSaving(true);
    try {
      const updates: any = {};
      
      if (editForm.merchant_id !== transaction.merchant_id) {
        updates.merchant = editForm.merchant_id || undefined;
      }
      if (editForm.category_id !== transaction.category_id) {
        updates.category = editForm.category_id || undefined;
      }
      if (editForm.date && editForm.date !== transaction.date.split('T')[0]) {
        updates.date = new Date(editForm.date).toISOString();
      }
      if (editForm.amount && parseFloat(editForm.amount) !== transaction.amount) {
        updates.amount = parseFloat(editForm.amount);
      }

      await updateTransaction(transaction._id, updates);
      setSnackbar({ open: true, message: 'Transaction updated successfully', severity: 'success' });
      setIsEditing(false);
      onTransactionUpdated?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update transaction: ' + error.message, severity: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (transaction) {
      const subtotal = transaction.subtotal || transaction.amount;
      const taxes = transaction.taxes || 0;
      const discount = transaction.discount || 0;
      setEditForm({
        merchant_id: transaction.merchant_id || '',
        category_id: transaction.category_id || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : '',
        subtotal: subtotal.toString(),
        taxes: taxes.toString(),
        discount: discount.toString(),
        amount: transaction.amount.toString(),
      });
      
      // Reset editing items state
      const items = getBillItems(transaction);
      const itemsState: Record<string, any> = {};
      items.forEach((item) => {
        if (item._id) {
          itemsState[item._id] = {
            name: item.name || '',
            quantity: item.quantity?.toString() || '',
            unit_price: item.unit_price?.toString() || '',
            total_price: item.total_price?.toString() || '',
            category: item.category || '',
          };
        }
      });
      setEditingItems(itemsState);
    }
    setIsEditing(false);
  };

  const handleItemUpdate = async (itemId: string, field: string, value: string | number) => {
    if (!itemId) return;
    
    try {
      const updateData: any = { [field]: value };
      
      // If updating quantity or unit_price, auto-calculate total_price
      if (field === 'quantity' || field === 'unit_price') {
        const currentItem = editingItems[itemId];
        if (currentItem) {
          const quantity = field === 'quantity' ? parseFloat(value.toString()) : parseFloat(currentItem.quantity);
          const unitPrice = field === 'unit_price' ? parseFloat(value.toString()) : parseFloat(currentItem.unit_price);
          if (quantity && unitPrice && !isNaN(quantity) && !isNaN(unitPrice)) {
            const totalPrice = quantity * unitPrice;
            updateData.total_price = totalPrice;
          }
        }
      }
      
      await updateItem(itemId, updateData);
      
      // Update local state after successful API call
      setEditingItems(prev => {
        const updated = { ...prev[itemId] };
        updated[field] = typeof value === 'number' ? value.toString() : value;
        
        // Update total_price if it was calculated
        if (updateData.total_price !== undefined) {
          updated.total_price = updateData.total_price.toString();
        }
        
        return {
          ...prev,
          [itemId]: updated,
        };
      });
      
      onTransactionUpdated?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to update item: ' + error.message, severity: 'error' });
    }
  };

  const handleItemDelete = async (itemId: string) => {
    if (!itemId || !window.confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await deleteItem(itemId);
      setSnackbar({ open: true, message: 'Item deleted successfully', severity: 'success' });
      onTransactionUpdated?.();
    } catch (error: any) {
      setSnackbar({ open: true, message: 'Failed to delete item: ' + error.message, severity: 'error' });
    }
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(editForm.subtotal) || 0;
    const taxes = parseFloat(editForm.taxes) || 0;
    const discount = parseFloat(editForm.discount) || 0;
    return subtotal + taxes - discount;
  };

  const currentSubtotal = parseFloat(editForm.subtotal) || (transaction.subtotal || transaction.amount);
  const currentTaxes = parseFloat(editForm.taxes) || (transaction.taxes || 0);
  const currentDiscount = parseFloat(editForm.discount) || (transaction.discount || 0);
  const currentTotal = isEditing ? calculateTotal() : transaction.amount;

  return (
    <>
      {/* Overlay */}
      <Box
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          bgcolor: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 1300,
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.3s ease-in-out',
        }}
      />
      
      {/* Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: '90%', md: '80%', lg: '70%', xl: '60%' },
            maxWidth: '1200px',
            bgcolor: theme.palette.background.paper,
            boxShadow: '0 0 24px rgba(0, 0, 0, 0.15)',
          },
        }}
        sx={{
          zIndex: 1301,
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              bgcolor: theme.palette.background.paper,
              position: 'sticky',
              top: 0,
              zIndex: 10,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <ReceiptLong sx={{ color: '#6D28D9', fontSize: '24px' }} />
              <Typography
                sx={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: theme.palette.text.primary,
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                Receipt Verification
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: theme.palette.text.secondary,
                '&:hover': {
                  bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                },
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
            {/* Receipt Image Section */}
            <Box
              sx={{
                width: '50%',
                bgcolor: theme.palette.mode === 'dark' ? '#0A0A0A' : '#F9FAFB',
                p: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                  height: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                  borderRadius: '10px',
                },
              }}
            >
              {transaction.bill_image_url ? (
                <Box
                  sx={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <img
                    src={transaction.bill_image_url}
                    alt="Receipt"
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div style="padding: 2rem; text-align: center; color: ${theme.palette.text.secondary};">
                            <p>Receipt image not available</p>
                          </div>
                        `;
                      }
                    }}
                  />
                </Box>
              ) : (
                <Box
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    color: theme.palette.text.secondary,
                  }}
                >
                  <ReceiptLong sx={{ fontSize: '48px', mb: 2, opacity: 0.5 }} />
                  <Typography sx={{ fontFamily: "'Inter', sans-serif" }}>
                    No receipt image available
                  </Typography>
                </Box>
              )}
            </Box>

            {/* Extracted Details Section */}
            <Box
              sx={{
                width: '50%',
                p: 4,
                overflowY: 'auto',
                borderLeft: `1px solid ${theme.palette.divider}`,
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                  borderRadius: '10px',
                },
              }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {/* Extracted Details */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      mb: 3,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Extracted Details
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                    {/* Merchant Name */}
                    <Box>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                          mb: 0.75,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Merchant Name
                      </Typography>
                      {isEditing ? (
                        <FormControl fullWidth size="small">
                          <Select
                            value={editForm.merchant_id}
                            onChange={(e) => setEditForm({ ...editForm, merchant_id: e.target.value })}
                            sx={{
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {merchants.map((merchant) => (
                              <MenuItem key={merchant._id} value={merchant._id}>
                                {merchant.merchant_name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {merchantName}
                        </Typography>
                      )}
                    </Box>

                    {/* Date and Category */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme.palette.text.secondary,
                            mb: 0.75,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Date
                        </Typography>
                        {isEditing ? (
                          <TextField
                            type="date"
                            size="small"
                            value={editForm.date}
                            onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: '14px',
                                fontFamily: "'Inter', sans-serif",
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            {new Date(transaction.date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </Typography>
                        )}
                      </Box>
                      <Box>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme.palette.text.secondary,
                            mb: 0.75,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Category
                        </Typography>
                        {isEditing ? (
                          <FormControl fullWidth size="small">
                            <Select
                              value={editForm.category_id}
                              onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                              sx={{
                                fontSize: '14px',
                                fontFamily: "'Inter', sans-serif",
                              }}
                            >
                              {categories.map((category) => (
                                <MenuItem key={category._id} value={category._id}>
                                  {category.category_name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Chip
                            label={categoryName}
                            size="small"
                            sx={{
                              fontSize: '12px',
                              fontWeight: 600,
                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)',
                              color: theme.palette.mode === 'dark' ? '#60A5FA' : '#2563EB',
                              fontFamily: "'Inter', sans-serif",
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                  </Box>
                </Box>

                <Divider />

                {/* Amount Breakdown */}
                <Box>
                  <Typography
                    sx={{
                      fontSize: '10px',
                      fontWeight: 700,
                      color: theme.palette.text.secondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      mb: 2,
                      fontFamily: "'Inter', sans-serif",
                    }}
                  >
                    Amount Breakdown
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {/* Subtotal */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Subtotal
                      </Typography>
                      {isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editForm.subtotal}
                          onChange={(e) => {
                            const newSubtotal = e.target.value;
                            // Auto-calculate total
                            const subtotal = parseFloat(newSubtotal) || 0;
                            const taxes = parseFloat(editForm.taxes) || 0;
                            const discount = parseFloat(editForm.discount) || 0;
                            setEditForm(prev => ({ ...prev, subtotal: newSubtotal, amount: (subtotal + taxes - discount).toString() }));
                          }}
                          InputProps={{
                            startAdornment: <span style={{ marginRight: '0.5rem', fontSize: '14px' }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                          }}
                          sx={{
                            width: '120px',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {formatCurrency(currentSubtotal, transaction.currency)}
                        </Typography>
                      )}
                    </Box>

                    {/* Tax */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        sx={{
                          fontSize: '12px',
                          fontWeight: 600,
                          color: theme.palette.text.secondary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Tax
                      </Typography>
                      {isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editForm.taxes}
                          onChange={(e) => {
                            const newTaxes = e.target.value;
                            // Auto-calculate total
                            const subtotal = parseFloat(editForm.subtotal) || 0;
                            const taxes = parseFloat(newTaxes) || 0;
                            const discount = parseFloat(editForm.discount) || 0;
                            setEditForm(prev => ({ ...prev, taxes: newTaxes, amount: (subtotal + taxes - discount).toString() }));
                          }}
                          InputProps={{
                            startAdornment: <span style={{ marginRight: '0.5rem', fontSize: '14px' }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                          }}
                          sx={{
                            width: '120px',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '14px',
                              fontFamily: "'Inter', sans-serif",
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '14px',
                            fontWeight: 500,
                            color: theme.palette.text.primary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {formatCurrency(currentTaxes, transaction.currency)}
                        </Typography>
                      )}
                    </Box>

                    {/* Discount */}
                    {(currentDiscount > 0 || isEditing) && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography
                          sx={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: theme.palette.text.secondary,
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          Discount
                        </Typography>
                        {isEditing ? (
                          <TextField
                            type="number"
                            size="small"
                            value={editForm.discount}
                          onChange={(e) => {
                            const newDiscount = e.target.value;
                            // Auto-calculate total
                            const subtotal = parseFloat(editForm.subtotal) || 0;
                            const taxes = parseFloat(editForm.taxes) || 0;
                            const discount = parseFloat(newDiscount) || 0;
                            setEditForm(prev => ({ ...prev, discount: newDiscount, amount: (subtotal + taxes - discount).toString() }));
                          }}
                            InputProps={{
                              startAdornment: <span style={{ marginRight: '0.5rem', fontSize: '14px' }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                            }}
                            sx={{
                              width: '120px',
                              '& .MuiOutlinedInput-root': {
                                fontSize: '14px',
                                fontFamily: "'Inter', sans-serif",
                              },
                            }}
                          />
                        ) : (
                          <Typography
                            sx={{
                              fontSize: '14px',
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              fontFamily: "'Inter', sans-serif",
                            }}
                          >
                            -{formatCurrency(currentDiscount, transaction.currency)}
                          </Typography>
                        )}
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    {/* Total */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography
                        sx={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: theme.palette.text.primary,
                          fontFamily: "'Inter', sans-serif",
                        }}
                      >
                        Total
                      </Typography>
                      {isEditing ? (
                        <TextField
                          type="number"
                          size="small"
                          value={editForm.amount}
                          onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                          InputProps={{
                            startAdornment: <span style={{ marginRight: '0.5rem', fontSize: '16px', fontWeight: 700 }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                          }}
                          sx={{
                            width: '140px',
                            '& .MuiOutlinedInput-root': {
                              fontSize: '16px',
                              fontWeight: 700,
                              color: '#EF4444',
                              fontFamily: "'Inter', sans-serif",
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: '18px',
                            fontWeight: 700,
                            color: '#EF4444',
                            fontFamily: "'Inter', sans-serif",
                          }}
                        >
                          {formatCurrency(currentTotal, transaction.currency)}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                </Box>

                <Divider />

                {/* Line Items */}
                {billItems.length > 0 && (
                  <Box>
                    <Typography
                      sx={{
                        fontSize: '10px',
                        fontWeight: 700,
                        color: theme.palette.text.secondary,
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em',
                        mb: 2,
                        fontFamily: "'Inter', sans-serif",
                      }}
                    >
                      Line Items
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      {billItems.map((item, index) => {
                        const itemId = item._id || `temp-${index}`;
                        const itemData = editingItems[itemId] || {
                          name: item.name || '',
                          quantity: item.quantity?.toString() || '',
                          unit_price: item.unit_price?.toString() || '',
                          total_price: item.total_price?.toString() || '',
                          category: item.category || '',
                        };
                        
                        return (
                          <Box
                            key={itemId}
                            sx={{
                              p: 1.5,
                              borderRadius: '12px',
                              border: `1px dashed ${theme.palette.divider}`,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 1,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, flex: 1 }}>
                                {isEditing && item._id ? (
                                  <>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={itemData.quantity}
                                      onChange={(e) => {
                                        const newQuantity = e.target.value;
                                        setEditingItems(prev => ({
                                          ...prev,
                                          [itemId]: { ...prev[itemId], quantity: newQuantity },
                                        }));
                                        if (newQuantity && itemData.unit_price) {
                                          const total = parseFloat(newQuantity) * parseFloat(itemData.unit_price);
                                          setEditingItems(prev => ({
                                            ...prev,
                                            [itemId]: { ...prev[itemId], total_price: total.toString() },
                                          }));
                                        }
                                      }}
                                      onBlur={() => {
                                        if (itemData.quantity) {
                                          handleItemUpdate(item._id!, 'quantity', parseFloat(itemData.quantity));
                                        }
                                      }}
                                      sx={{
                                        width: '60px',
                                        '& .MuiOutlinedInput-root': {
                                          fontSize: '12px',
                                          fontFamily: "'Inter', sans-serif",
                                        },
                                      }}
                                      InputProps={{
                                        endAdornment: <span style={{ fontSize: '10px' }}>x</span>,
                                      }}
                                    />
                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                      <TextField
                                        size="small"
                                        value={itemData.name}
                                        onChange={(e) => {
                                          setEditingItems(prev => ({
                                            ...prev,
                                            [itemId]: { ...prev[itemId], name: e.target.value },
                                          }));
                                        }}
                                        onBlur={() => {
                                          if (itemData.name) {
                                            handleItemUpdate(item._id!, 'name', itemData.name);
                                          }
                                        }}
                                        placeholder="Item name"
                                        sx={{
                                          '& .MuiOutlinedInput-root': {
                                            fontSize: '14px',
                                            fontFamily: "'Inter', sans-serif",
                                          },
                                        }}
                                      />
                                      <FormControl size="small" fullWidth>
                                        <Select
                                          value={itemData.category}
                                          onChange={(e) => {
                                            setEditingItems(prev => ({
                                              ...prev,
                                              [itemId]: { ...prev[itemId], category: e.target.value },
                                            }));
                                            handleItemUpdate(item._id!, 'category', e.target.value);
                                          }}
                                          displayEmpty
                                          sx={{
                                            fontSize: '10px',
                                            fontFamily: "'Inter', sans-serif",
                                          }}
                                        >
                                          <MenuItem value="">No Category</MenuItem>
                                          {categories.map((cat) => (
                                            <MenuItem key={cat._id} value={cat.category_name}>
                                              {cat.category_name}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    </Box>
                                  </>
                                ) : (
                                  <>
                                    <Box
                                      sx={{
                                        width: 32,
                                        height: 32,
                                        borderRadius: '8px',
                                        bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: theme.palette.text.primary,
                                        fontFamily: "'Inter', sans-serif",
                                      }}
                                    >
                                      {item.quantity}x
                                    </Box>
                                    <Box>
                                      <Typography
                                        sx={{
                                          fontSize: '14px',
                                          fontWeight: 600,
                                          color: theme.palette.text.primary,
                                          fontFamily: "'Inter', sans-serif",
                                        }}
                                      >
                                        {item.name || 'N/A'}
                                      </Typography>
                                      {item.category && (
                                        <Typography
                                          sx={{
                                            fontSize: '10px',
                                            color: theme.palette.text.secondary,
                                            fontFamily: "'Inter', sans-serif",
                                          }}
                                        >
                                          {item.category}
                                        </Typography>
                                      )}
                                    </Box>
                                  </>
                                )}
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isEditing && item._id ? (
                                  <>
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={itemData.unit_price}
                                      onChange={(e) => {
                                        const newUnitPrice = e.target.value;
                                        setEditingItems(prev => ({
                                          ...prev,
                                          [itemId]: { ...prev[itemId], unit_price: newUnitPrice },
                                        }));
                                        if (newUnitPrice && itemData.quantity) {
                                          const total = parseFloat(newUnitPrice) * parseFloat(itemData.quantity);
                                          setEditingItems(prev => ({
                                            ...prev,
                                            [itemId]: { ...prev[itemId], total_price: total.toString() },
                                          }));
                                        }
                                      }}
                                      onBlur={() => {
                                        if (itemData.unit_price) {
                                          handleItemUpdate(item._id!, 'unit_price', parseFloat(itemData.unit_price));
                                        }
                                      }}
                                      InputProps={{
                                        startAdornment: <span style={{ marginRight: '0.25rem', fontSize: '12px' }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                                      }}
                                      sx={{
                                        width: '100px',
                                        '& .MuiOutlinedInput-root': {
                                          fontSize: '12px',
                                          fontFamily: "'Inter', sans-serif",
                                        },
                                      }}
                                      placeholder="Unit"
                                    />
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={itemData.total_price}
                                      onChange={(e) => {
                                        setEditingItems(prev => ({
                                          ...prev,
                                          [itemId]: { ...prev[itemId], total_price: e.target.value },
                                        }));
                                      }}
                                      onBlur={() => {
                                        if (itemData.total_price) {
                                          handleItemUpdate(item._id!, 'total_price', parseFloat(itemData.total_price));
                                        }
                                      }}
                                      InputProps={{
                                        startAdornment: <span style={{ marginRight: '0.25rem', fontSize: '14px', fontWeight: 700 }}>{transaction.currency === 'USD' ? '$' : transaction.currency === 'LKR' ? 'Rs.' : transaction.currency}</span>,
                                      }}
                                      sx={{
                                        width: '110px',
                                        '& .MuiOutlinedInput-root': {
                                          fontSize: '14px',
                                          fontWeight: 700,
                                          fontFamily: "'Inter', sans-serif",
                                        },
                                      }}
                                      placeholder="Total"
                                    />
                                    <IconButton
                                      size="small"
                                      onClick={() => handleItemDelete(item._id!)}
                                      sx={{
                                        color: '#EF4444',
                                        '&:hover': {
                                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
                                        },
                                      }}
                                    >
                                      <Delete sx={{ fontSize: '16px' }} />
                                    </IconButton>
                                  </>
                                ) : (
                                  <Typography
                                    sx={{
                                      fontSize: '14px',
                                      fontWeight: 700,
                                      color: theme.palette.text.primary,
                                      fontFamily: "'Inter', sans-serif",
                                    }}
                                  >
                                    {formatCurrency(item.total_price || item.unit_price || 0, transaction.currency)}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                            {isEditing && item._id && (
                              <Box sx={{ display: 'flex', gap: 0.5, fontSize: '10px', color: theme.palette.text.secondary }}>
                                <span>Unit: {formatCurrency(parseFloat(itemData.unit_price) || 0, transaction.currency)}</span>
                                {itemData.quantity && itemData.unit_price && (
                                  <span>• Total: {formatCurrency(parseFloat(itemData.total_price) || 0, transaction.currency)}</span>
                                )}
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Action Buttons */}
              <Box sx={{ pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                {isEditing ? (
                  <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <Button
                      variant="contained"
                      startIcon={<Save />}
                      onClick={handleSave}
                      disabled={isSaving}
                      sx={{
                        flex: 1,
                        bgcolor: '#6D28D9',
                        color: '#ffffff',
                        fontWeight: 600,
                        py: 1.25,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontFamily: "'Inter', sans-serif",
                        '&:hover': {
                          bgcolor: '#5b21b6',
                        },
                      }}
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<Cancel />}
                      onClick={handleCancel}
                      disabled={isSaving}
                      sx={{
                        flex: 1,
                        borderColor: theme.palette.divider,
                        color: theme.palette.text.primary,
                        fontWeight: 600,
                        py: 1.25,
                        borderRadius: '12px',
                        textTransform: 'none',
                        fontFamily: "'Inter', sans-serif",
                        '&:hover': {
                          borderColor: theme.palette.mode === 'dark' ? '#475569' : '#D1D5DB',
                          bgcolor: theme.palette.mode === 'dark' ? '#1E293B' : '#F9FAFB',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={() => setIsEditing(true)}
                    sx={{
                      width: '100%',
                      bgcolor: '#6D28D9',
                      color: '#ffffff',
                      fontWeight: 600,
                      py: 1.25,
                      borderRadius: '12px',
                      textTransform: 'none',
                      fontFamily: "'Inter', sans-serif",
                      '&:hover': {
                        bgcolor: '#5b21b6',
                      },
                    }}
                  >
                    Edit Details
                  </Button>
                )}
              </Box>
            </Box>
          </Box>
        </Box>
      </Drawer>

      {/* Snackbar */}
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
    </>
  );
}


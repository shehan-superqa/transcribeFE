import React, { useState } from 'react';
import { Box, Paper, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent, Chip, IconButton, Collapse, CircularProgress, Divider, Avatar, Tooltip } from '@mui/material';
import { CloudUpload, Edit, Delete, MergeType, ExpandLess, ExpandMore, ShoppingCart, AttachMoney, CalendarToday, Store, Storefront, Category as CategoryIcon, Warning, TrendingDown, TrendingUp, Receipt, Visibility, ChevronRight, ZoomIn } from '@mui/icons-material';
import { Transaction, Merchant, Category, TransactionItem, FlattenedItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { getDisplayCategoryName, formatCurrency, getDisplayMerchantName, formatPaymentMethod, checkMissingPriceFields, getMissingFieldStyle, getMissingFieldRowStyle, transactionHasMissingFields, getExpenseAmount, getEarningAmount, getTaxAmount, getTransactionType } from '../../utils/transactionHelpers';
import EditableItemCell from './EditableItemCell';
import TransactionCard from './TransactionCard';
import BillItemsModal from './BillItemsModal';
import ReceiptPreviewDrawer from './ReceiptPreviewDrawer';

interface TransactionsListProps {
  layout: 'card' | 'table' | 'items';
  transactions: Transaction[];
  merchants: Merchant[];
  categories: Category[];
  expandedTransactions: Set<string>;
  transactionItems: Record<string, TransactionItem[]>;
  loadingItems: Record<string, boolean>;
  paginatedTransactions: Transaction[];
  paginatedItems: FlattenedItem[];
  itemsPerPage: number;
  page: number;
  onToggleItemsExpansion: (transactionId: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (transaction: Transaction) => void;
  onMergeTransaction: (transaction: Transaction) => void;
  onEditItem: (item: TransactionItem) => void;
  onDeleteItem: (item: TransactionItem) => void;
  onItemFieldUpdate?: (itemId: string, field: string, value: number) => void;
  getMerchantName: (merchantId: string | null) => string;
  getCategoryName: (categoryId: string | null) => string;
  getBillItems: (transaction: Transaction) => TransactionItem[];
  onTransactionsChange?: () => void;
}

export default function TransactionsList({
  layout,
  transactions,
  merchants,
  categories,
  expandedTransactions,
  transactionItems,
  loadingItems,
  paginatedTransactions,
  paginatedItems,
  itemsPerPage,
  page,
  onToggleItemsExpansion,
  onEditTransaction,
  onDeleteTransaction,
  onMergeTransaction,
  onEditItem,
  onDeleteItem,
  onItemFieldUpdate,
  getMerchantName,
  getCategoryName,
  getBillItems,
  onTransactionsChange,
}: TransactionsListProps) {
  const handleItemFieldUpdate = (itemId: string, field: string, value: number) => {
    onItemFieldUpdate?.(itemId, field, value);
  };

  const handleItemUpdateError = (error: string) => {
    console.error('Failed to update item:', error);
  };
  const { theme } = useTheme();
  
  const [viewItemsModalOpen, setViewItemsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [receiptDrawerOpen, setReceiptDrawerOpen] = useState(false);
  const [selectedReceiptTransaction, setSelectedReceiptTransaction] = useState<Transaction | null>(null);

  const handleOpenViewItemsModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setViewItemsModalOpen(true);
  };

  const handleCloseViewItemsModal = () => {
    setViewItemsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleOpenReceiptDrawer = (transaction: Transaction) => {
    setSelectedReceiptTransaction(transaction);
    setReceiptDrawerOpen(true);
  };

  const handleCloseReceiptDrawer = () => {
    setReceiptDrawerOpen(false);
    setSelectedReceiptTransaction(null);
  };

  const renderItemsView = () => (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
        maxHeight: 'calc(100vh - 400px)',
        overflow: 'auto',
      }}
    >
      <Table stickyHeader size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '150px' }}>Item Name</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '200px' }}>Transaction ID</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '120px' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '150px' }}>Merchant</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '150px' }}>Category</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '80px' }}>Qty</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '100px' }}>Unit Price</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', minWidth: '100px' }}>Total Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedItems.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                  No items found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            paginatedItems.map((item, index) => (
              <TableRow
                key={item.id}
                hover
                sx={{
                  backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                  '&:hover': {
                    backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                  },
                }}
              >
                <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.itemName}
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      color: theme.palette.primary.main,
                      fontFamily: 'monospace',
                      wordBreak: 'break-all',
                    }}
                  >
                    {item.transactionId}
                  </Typography>
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.transactionDate.toLocaleDateString()}
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.merchantName}
                </TableCell>
                <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.categoryName}
                </TableCell>
                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.quantity}
                </TableCell>
                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  Rs. {item.unitPrice.toFixed(2)}
                </TableCell>
                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  Rs. {item.totalPrice.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderTableView = () => {
    return (
      <Box
        sx={{
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#E2E8F0'}`,
          borderRadius: '16px',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            overflowX: 'auto',
            overflowY: 'auto',
            maxHeight: 'calc(100vh - 400px)',
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
            '&::-webkit-scrollbar-thumb:hover': {
              background: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
            },
          }}
        >
          <TableContainer
            component="div"
            sx={{
              backgroundColor: 'transparent',
            }}
          >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ 
                width: '40px', 
                px: 2, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}></TableCell>
              <TableCell sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Date</TableCell>
              <TableCell sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Receipt</TableCell>
              <TableCell sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Merchant</TableCell>
              <TableCell sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Category</TableCell>
              <TableCell align="right" sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Amount</TableCell>
              <TableCell sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Status</TableCell>
              <TableCell align="right" sx={{ 
                px: 3, 
                py: 2,
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.5)',
                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                textTransform: 'uppercase',
                fontSize: '10px',
                fontWeight: 700,
                letterSpacing: '0.05em',
                fontFamily: "'Inter', sans-serif"
              }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map((transaction, index) => {
              const billItems = getBillItems(transaction);
              const isExpanded = expandedTransactions.has(transaction._id);
              const isLoading = Boolean(loadingItems?.[transaction._id]);
              const hasLoadedItems = Object.prototype.hasOwnProperty.call(transactionItems, transaction._id);
              
              // Check if transaction has items with missing fields
              const hasMissingFields = transactionHasMissingFields(transaction, billItems);
              
              return (
                <React.Fragment key={transaction._id}>
                  <TableRow
                    className="group"
                    hover
                    sx={{
                      backgroundColor: isExpanded ? (theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.4)') : 'transparent',
                      ...getMissingFieldRowStyle(hasMissingFields, theme),
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.3)' : 'rgba(248, 250, 252, 0.3)',
                      },
                      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9'}`,
                    }}
                  >
                    <TableCell sx={{ px: 2, py: 2, textAlign: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={() => onToggleItemsExpansion(transaction._id)}
                        disabled={isLoading}
                        sx={{ 
                          padding: 0,
                          color: isExpanded ? '#6D28D9' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                          '&:hover': {
                            bgcolor: 'transparent',
                          }
                        }}
                      >
                        {isExpanded ? <ExpandMore sx={{ fontSize: '18px' }} /> : <ChevronRight sx={{ fontSize: '18px' }} />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ px: 3, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography sx={{ fontSize: '14px', fontWeight: 500, color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif" }}>
                          {new Date(transaction.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </Typography>
                        {hasMissingFields && (
                          <Tooltip title="This transaction has items with missing price fields">
                            <Warning sx={{ fontSize: '16px', color: '#F59E0B' }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 3, py: 2 }}>
                      {transaction.bill_image_url ? (
                        <Tooltip title="View Receipt">
                          <Box
                            component="button"
                            onClick={() => handleOpenReceiptDrawer(transaction)}
                            sx={{
                              position: 'relative',
                              width: 40,
                              height: 40,
                              border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                              borderRadius: '8px',
                              overflow: 'hidden',
                              cursor: 'pointer',
                              p: 0,
                              bgcolor: 'transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: '#6D28D9',
                                boxShadow: '0 0 0 2px rgba(109, 40, 217, 0.2)',
                              },
                            }}
                          >
                            <Box
                              component="img"
                              src={transaction.bill_image_url}
                              alt="Receipt"
                              sx={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                                opacity: 0.8,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  opacity: 1,
                                },
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = '';
                                  parent.appendChild(document.createTextNode('📄'));
                                  parent.style.display = 'flex';
                                  parent.style.alignItems = 'center';
                                  parent.style.justifyContent = 'center';
                                  parent.style.color = theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280';
                                }
                              }}
                            />
                            <Box
                              sx={{
                                position: 'absolute',
                                inset: 0,
                                bgcolor: 'rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  opacity: 1,
                                },
                              }}
                            >
                              <ZoomIn sx={{ fontSize: '18px', color: 'white' }} />
                            </Box>
                          </Box>
                        </Tooltip>
                      ) : (
                        <Tooltip title="View Receipt Details">
                          <Box
                            component="button"
                            onClick={() => handleOpenReceiptDrawer(transaction)}
                            sx={{
                              width: 40,
                              height: 40,
                              border: `1px dashed ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: theme.palette.text.disabled,
                              cursor: 'pointer',
                              p: 0,
                              bgcolor: 'transparent',
                              transition: 'all 0.2s',
                              '&:hover': {
                                borderColor: '#6D28D9',
                                borderStyle: 'solid',
                                color: '#6D28D9',
                                boxShadow: '0 0 0 2px rgba(109, 40, 217, 0.2)',
                              },
                            }}
                          >
                            <Receipt sx={{ fontSize: '18px' }} />
                          </Box>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ px: 3, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            bgcolor: isExpanded ? 'rgba(109, 40, 217, 0.1)' : (theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Storefront sx={{ fontSize: '14px', color: isExpanded ? '#6D28D9' : (theme.palette.mode === 'dark' ? '#6B7280' : '#6B7280') }} />
                        </Box>
                        <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif" }}>
                          {getDisplayMerchantName(transaction, getMerchantName(transaction.merchant_id))}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ px: 3, py: 2 }}>
                      <Chip
                        label={getDisplayCategoryName(transaction, getCategoryName(transaction.category_id), billItems).toUpperCase()}
                        size="small"
                        sx={{
                          px: 1.25,
                          py: 0.5,
                          height: 'auto',
                          borderRadius: '9999px',
                          fontSize: '10px',
                          fontWeight: 700,
                          bgcolor: theme.palette.mode === 'dark' ? 'rgba(59, 130, 246, 0.2)' : 'rgba(219, 234, 254, 1)',
                          color: theme.palette.mode === 'dark' ? '#60A5FA' : '#2563EB',
                          fontFamily: "'Inter', sans-serif",
                          border: 'none',
                        }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ px: 3, py: 2 }}>
                      <Typography sx={{ fontSize: '14px', fontWeight: 700, color: '#EF4444', fontFamily: "'Inter', sans-serif" }}>
                        {formatCurrency(transaction.amount, transaction.currency)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ px: 3, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            bgcolor: transaction.status === 'confirmed' ? '#10B981' : (transaction.status === 'pending' ? (theme.palette.mode === 'dark' ? '#6B7280' : '#D1D5DB') : '#EF4444'),
                          }}
                        />
                        <Typography sx={{ fontSize: '12px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', fontFamily: "'Inter', sans-serif", textTransform: 'capitalize' }}>
                          {transaction.status}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right" sx={{ px: 3, py: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5, opacity: 0, transition: 'opacity 0.2s', '.group:hover &': { opacity: 1 } }}>
                        {billItems.length > 0 && (
                          <Tooltip title="View Items">
                            <IconButton
                              size="small"
                              onClick={() => handleOpenViewItemsModal(transaction)}
                              sx={{ 
                                p: 1.5,
                                color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                '&:hover': { color: '#6D28D9' }
                              }}
                            >
                              <Visibility sx={{ fontSize: '14px' }} />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => onEditTransaction(transaction)}
                          sx={{ 
                            p: 1.5,
                            color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                            '&:hover': { color: '#2563EB' }
                          }}
                        >
                          <Edit sx={{ fontSize: '14px' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteTransaction(transaction)}
                          sx={{ 
                            p: 1.5,
                            color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                            '&:hover': { color: '#EF4444' }
                          }}
                        >
                          <Delete sx={{ fontSize: '14px' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={8} sx={{ px: 4, pb: 2, pt: 0, border: 0, bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.2)' : 'rgba(248, 250, 252, 0.5)' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ ml: 3, position: 'relative' }}>
                          {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : billItems.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontFamily: "'Inter', sans-serif" }}>
                              No items found for this transaction.
                            </Typography>
                          ) : (
                            <Box sx={{ 
                              border: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#E2E8F0'}`,
                              borderRadius: '12px',
                              overflow: 'hidden',
                              bgcolor: theme.palette.background.paper,
                              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
                            }}>
                              <TableContainer>
                                <Table>
                                  <TableHead>
                                    <TableRow sx={{ bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(248, 250, 252, 0.8)', borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#334155' : '#F1F5F9'}` }}>
                                      <TableCell sx={{ 
                                        px: 2, 
                                        py: 1.25,
                                        color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                        textTransform: 'uppercase',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.025em',
                                        fontFamily: "'Inter', sans-serif"
                                      }}>Item Name</TableCell>
                                      <TableCell align="right" sx={{ 
                                        px: 2, 
                                        py: 1.25,
                                        color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                        textTransform: 'uppercase',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.025em',
                                        fontFamily: "'Inter', sans-serif"
                                      }}>Quantity</TableCell>
                                      <TableCell align="right" sx={{ 
                                        px: 2, 
                                        py: 1.25,
                                        color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                        textTransform: 'uppercase',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.025em',
                                        fontFamily: "'Inter', sans-serif"
                                      }}>Unit Price</TableCell>
                                      <TableCell align="right" sx={{ 
                                        px: 2, 
                                        py: 1.25,
                                        color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                        textTransform: 'uppercase',
                                        fontSize: '10px',
                                        fontWeight: 700,
                                        letterSpacing: '0.025em',
                                        fontFamily: "'Inter', sans-serif"
                                      }}>Total Price</TableCell>
                                      {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                                        <TableCell sx={{ 
                                          px: 2, 
                                          py: 1.25,
                                          color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                          textTransform: 'uppercase',
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          letterSpacing: '0.025em',
                                          fontFamily: "'Inter', sans-serif"
                                        }}>Category</TableCell>
                                      )}
                                      {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                                        <TableCell align="right" sx={{ 
                                          px: 2, 
                                          py: 1.25,
                                          color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280',
                                          textTransform: 'uppercase',
                                          fontSize: '10px',
                                          fontWeight: 700,
                                          letterSpacing: '0.025em',
                                          fontFamily: "'Inter', sans-serif"
                                        }}>Actions</TableCell>
                                      )}
                                    </TableRow>
                                  </TableHead>
                                  <TableBody sx={{ '& .MuiTableRow-root': { borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1E293B' : '#F1F5F9'}` } }}>
                                    {billItems.map((item: any, itemIndex: number) => {
                                      const itemId = (item as TransactionItem)._id;
                                      const apiItem = itemId && transactionItems[transaction._id]
                                        ? transactionItems[transaction._id].find((apiItem) => apiItem._id === itemId)
                                        : null;
                                      const displayItem = apiItem || item;
                                      
                                      // Check for missing price fields
                                      const missingFields = checkMissingPriceFields(displayItem);
                                      const transactionType = getTransactionType(transaction);

                                      return (
                                        <TableRow 
                                          key={itemId || itemIndex} 
                                          hover
                                          sx={{
                                            ...getMissingFieldRowStyle(missingFields.hasMissingFields, theme),
                                            '&:hover': {
                                              bgcolor: theme.palette.mode === 'dark' ? 'rgba(30, 41, 59, 0.4)' : 'rgba(248, 250, 252, 0.8)',
                                            }
                                          }}
                                        >
                                          <TableCell sx={{ px: 2, py: 1.25 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                              <TrendingDown sx={{ fontSize: '14px', color: '#EF4444' }} />
                                              <Typography sx={{ fontSize: '12px', fontWeight: 500, color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif" }}>
                                                {displayItem.name || 'N/A'}
                                              </Typography>
                                            </Box>
                                          </TableCell>
                                        <EditableItemCell
                                          value={displayItem.quantity}
                                          field="quantity"
                                          itemId={itemId}
                                          transactionId={transaction._id}
                                          isMissing={missingFields.quantity}
                                          onUpdate={handleItemFieldUpdate}
                                          onError={handleItemUpdateError}
                                          sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
                                        />
                                        <EditableItemCell
                                          value={displayItem.unit_price}
                                          field="unit_price"
                                          itemId={itemId}
                                          transactionId={transaction._id}
                                          isMissing={missingFields.unitPrice}
                                          formatValue={(val) => `Rs. ${Number(val).toFixed(2)}`}
                                          parseValue={(val) => {
                                            const num = parseFloat(val.replace(/[^\d.-]/g, ''));
                                            return isNaN(num) ? null : num;
                                          }}
                                          onUpdate={handleItemFieldUpdate}
                                          onError={handleItemUpdateError}
                                          sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
                                        />
                                        <EditableItemCell
                                          value={displayItem.total_price}
                                          field="total_price"
                                          itemId={itemId}
                                          transactionId={transaction._id}
                                          isMissing={missingFields.totalPrice}
                                          formatValue={(val) => `Rs. ${Number(val).toFixed(2)}`}
                                          parseValue={(val) => {
                                            const num = parseFloat(val.replace(/[^\d.-]/g, ''));
                                            return isNaN(num) ? null : num;
                                          }}
                                          onUpdate={handleItemFieldUpdate}
                                          onError={handleItemUpdateError}
                                          sx={{ fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}
                                        />
                                        {billItems.some((i: any) => i.category || (i as TransactionItem).category) && (
                                          <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                                            {displayItem.category ? (
                                              <Chip label={displayItem.category} size="small" variant="outlined" />
                                            ) : (
                                              '-'
                                            )}
                                          </TableCell>
                                        )}
                                        {apiItem && (
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <IconButton
                                                size="small"
                                                onClick={() => onEditItem(apiItem)}
                                                color="primary"
                                                sx={{ padding: '0.25rem' }}
                                              >
                                                <Edit fontSize="small" />
                                              </IconButton>
                                              <IconButton
                                                size="small"
                                                onClick={() => onDeleteItem(apiItem)}
                                                color="error"
                                                sx={{ padding: '0.25rem' }}
                                              >
                                                <Delete fontSize="small" />
                                              </IconButton>
                                            </Box>
                                          </TableCell>
                                        )}
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                              </TableContainer>
                              {/* Top scroll indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  height: '20px',
                                  background: `linear-gradient(to bottom, ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'} 0%, transparent 100%)`,
                                  pointerEvents: 'none',
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  zIndex: 1,
                                }}
                              />
                              {/* Bottom scroll indicator */}
                              <Box
                                sx={{
                                  position: 'absolute',
                                  bottom: 0,
                                  left: 0,
                                  right: 0,
                                  height: '20px',
                                  background: `linear-gradient(to top, ${theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'} 0%, transparent 100%)`,
                                  pointerEvents: 'none',
                                  opacity: 0,
                                  transition: 'opacity 0.2s',
                                  zIndex: 1,
                                }}
                              />
                            </Box>
                          )}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
          </TableContainer>
        </Box>
      </Box>
    );
  };

  const renderCardView = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {paginatedTransactions.map((transaction) => (
        <TransactionCard
          key={transaction._id}
          transaction={transaction}
          getMerchantName={getMerchantName}
          getCategoryName={getCategoryName}
          getBillItems={getBillItems}
          transactionItems={transactionItems}
          loadingItems={loadingItems}
          expandedTransactions={expandedTransactions}
          onToggleExpansion={onToggleItemsExpansion}
          onEdit={onEditTransaction}
          onDelete={onDeleteTransaction}
          onMerge={onMergeTransaction}
          onItemEdit={onEditItem}
          onItemDelete={onDeleteItem}
          onItemFieldUpdate={onItemFieldUpdate}
        />
      ))}
    </Box>
  );

  const renderEmptyState = () => (
    <Paper
      elevation={0}
      sx={{
        p: '3rem',
        textAlign: 'center',
        backgroundColor: theme.palette.background.paper,
        border: `1px dashed ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
      role="status"
      aria-live="polite"
    >
      {transactions.length === 0 ? (
        <>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.2,
              mb: '1rem',
            }}
          >
            No Transactions Yet
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: theme.palette.text.secondary,
              mb: '1.5rem',
            }}
          >
            Get started by uploading your first bill or receipt. We'll automatically extract the details and track your spending.
          </Typography>
          <Button
            variant="contained"
            size="large"
            startIcon={<CloudUpload />}
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              window.dispatchEvent(new CustomEvent('financial:openUpload'));
            }}
            aria-label="Upload your first bill"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              textTransform: 'none',
            }}
          >
            Upload Your First Bill
          </Button>
        </>
      ) : (
        <>
          <Typography
            variant="h6"
            gutterBottom
            sx={{
              fontFamily: "'Inter', sans-serif",
              color: theme.palette.text.primary,
              fontWeight: 600,
              fontSize: '1rem',
              lineHeight: 1.2,
              mb: '1rem',
            }}
          >
            No Transactions Match Your Filters
          </Typography>
          <Typography
            variant="body1"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 400,
              lineHeight: 1.5,
              color: theme.palette.text.secondary,
              mb: '1rem',
            }}
          >
            Try adjusting your filters to see more transactions.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              // Clear filters logic would be handled by parent
            }}
            aria-label="Clear all filters"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.625rem 1rem',
              borderRadius: '8px',
              textTransform: 'none',
            }}
          >
            Clear Filters
          </Button>
        </>
      )}
    </Paper>
  );

  if (paginatedTransactions.length === 0) {
    return (
      <>
        {renderEmptyState()}
        <BillItemsModal
          open={viewItemsModalOpen}
          onClose={handleCloseViewItemsModal}
          transaction={selectedTransaction}
          billItems={selectedTransaction ? getBillItems(selectedTransaction) : []}
          transactionItems={transactionItems}
          onItemEdit={onEditItem}
          onItemDelete={onDeleteItem}
          onItemFieldUpdate={onItemFieldUpdate}
        />
      </>
    );
  }

  return (
    <>
      {layout === 'items' && renderItemsView()}
      {layout === 'table' && renderTableView()}
      {(layout === 'card' || !layout) && renderCardView()}
      <BillItemsModal
        open={viewItemsModalOpen}
        onClose={handleCloseViewItemsModal}
        transaction={selectedTransaction}
        billItems={selectedTransaction ? getBillItems(selectedTransaction) : []}
        transactionItems={transactionItems}
        onItemEdit={onEditItem}
        onItemDelete={onDeleteItem}
        onItemFieldUpdate={onItemFieldUpdate}
      />
      <ReceiptPreviewDrawer
        open={receiptDrawerOpen}
        onClose={handleCloseReceiptDrawer}
        transaction={selectedReceiptTransaction}
        merchants={merchants}
        categories={categories}
        getMerchantName={getMerchantName}
        getCategoryName={getCategoryName}
        getBillItems={getBillItems}
        onTransactionUpdated={() => {
          onTransactionsChange?.();
        }}
      />
    </>
  );
}

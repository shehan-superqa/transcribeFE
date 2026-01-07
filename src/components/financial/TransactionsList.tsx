import React from 'react';
import { Box, Paper, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent, Chip, IconButton, Collapse, CircularProgress, Divider, Avatar, Tooltip } from '@mui/material';
import { CloudUpload, Edit, Delete, MergeType, ExpandLess, ExpandMore, ShoppingCart, AttachMoney, CalendarToday, Store, Category as CategoryIcon, Warning } from '@mui/icons-material';
import { Transaction, Merchant, Category, TransactionItem, FlattenedItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { getDisplayCategoryName, formatCurrency, getDisplayMerchantName, formatPaymentMethod, checkMissingPriceFields, getMissingFieldStyle, getMissingFieldRowStyle, transactionHasMissingFields } from '../../utils/transactionHelpers';
import EditableItemCell from './EditableItemCell';
import TransactionCard from './TransactionCard';

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
}: TransactionsListProps) {
  const handleItemFieldUpdate = (itemId: string, field: string, value: number) => {
    onItemFieldUpdate?.(itemId, field, value);
  };

  const handleItemUpdateError = (error: string) => {
    console.error('Failed to update item:', error);
  };
  const { theme } = useTheme();

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
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', width: '40px' }}></TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Merchant</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Category</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Payment Method</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Actions</TableCell>
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
                    hover
                    sx={{
                      backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                      ...getMissingFieldRowStyle(hasMissingFields, theme),
                      '&:hover': {
                        backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                      },
                    }}
                  >
                    <TableCell>
                      <IconButton
                        size="small"
                        onClick={() => onToggleItemsExpansion(transaction._id)}
                        disabled={isLoading}
                        sx={{ padding: '0.25rem' }}
                        color="primary"
                      >
                        {isExpanded ? <ExpandLess /> : <ExpandMore />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {new Date(transaction.date).toLocaleDateString()}
                        {hasMissingFields && (
                          <Tooltip title="This transaction has items with missing price fields">
                            <Warning sx={{ fontSize: '1rem', color: theme.palette.warning.main }} />
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {getDisplayMerchantName(transaction, getMerchantName(transaction.merchant_id))}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {getDisplayCategoryName(transaction, getCategoryName(transaction.category_id), billItems)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {formatCurrency(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                      {formatPaymentMethod(transaction.payment_method)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={transaction.status}
                        size="small"
                        color={
                          transaction.status === 'confirmed'
                            ? 'success'
                            : transaction.status === 'pending'
                            ? 'warning'
                            : 'error'
                        }
                        sx={{ fontFamily: "'Inter', sans-serif", fontSize: '0.75rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => onEditTransaction(transaction)}
                          color="primary"
                          sx={{ padding: '0.25rem' }}
                        >
                          <Edit sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onDeleteTransaction(transaction)}
                          color="error"
                          sx={{ padding: '0.25rem' }}
                        >
                          <Delete sx={{ fontSize: '1rem' }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => onMergeTransaction(transaction)}
                          color="secondary"
                          sx={{ padding: '0.25rem' }}
                        >
                          <MergeType sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ p: 2, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                            <ShoppingCart sx={{ fontSize: '1.25rem', color: theme.palette.primary.main }} />
                            <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600, fontFamily: "'Inter', sans-serif" }}>
                              Bill Items {billItems.length > 0 && `(${billItems.length})`}
                            </Typography>
                          </Box>
                          <Divider sx={{ my: 1 }} />
                          {isLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                              <CircularProgress size={20} />
                            </Box>
                          ) : billItems.length === 0 ? (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1, fontFamily: "'Inter', sans-serif" }}>
                              No items found for this transaction.
                            </Typography>
                          ) : (
                            <TableContainer>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Item Name</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Quantity</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Unit Price</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Total Price</TableCell>
                                    {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Category</TableCell>
                                    )}
                                    {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Actions</TableCell>
                                    )}
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {billItems.map((item: any, itemIndex: number) => {
                                    const itemId = (item as TransactionItem)._id;
                                    const apiItem = itemId && transactionItems[transaction._id]
                                      ? transactionItems[transaction._id].find((apiItem) => apiItem._id === itemId)
                                      : null;
                                    const displayItem = apiItem || item;
                                    
                                    // Check for missing price fields
                                    const missingFields = checkMissingPriceFields(displayItem);

                                    return (
                                      <TableRow 
                                        key={itemId || itemIndex} 
                                        hover
                                        sx={getMissingFieldRowStyle(missingFields.hasMissingFields, theme)}
                                      >
                                        <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                                          {displayItem.name || 'N/A'}
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
    return renderEmptyState();
  }

  switch (layout) {
    case 'items':
      return renderItemsView();
    case 'table':
      return renderTableView();
    case 'card':
    default:
      return renderCardView();
  }
}

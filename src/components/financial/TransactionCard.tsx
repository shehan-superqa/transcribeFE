import { Card, CardContent, Typography, Box, Chip, IconButton, Collapse, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Pagination, CircularProgress, Tooltip } from '@mui/material';
import { Edit, Delete, MergeType, ExpandMore, ExpandLess, ShoppingCart, AttachMoney, CalendarToday, Store, Category, CheckCircle, Close, Warning, TrendingDown, TrendingUp, Visibility } from '@mui/icons-material';
import { Transaction, TransactionItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { useState, useEffect, useRef } from 'react';
import { getTransactionMetadata, getDisplayCategoryName, formatCurrency, checkMissingPriceFields, getMissingFieldStyle, getMissingFieldRowStyle, getTransactionType } from '../../utils/transactionHelpers';
import EditableItemCell from './EditableItemCell';
import { updateItem } from '../../lib/api/financialApi';

interface TransactionCardProps {
  transaction: Transaction;
  getMerchantName: (id: string | null) => string;
  getCategoryName: (id: string | null) => string;
  getBillItems: (transaction: Transaction) => TransactionItem[];
  transactionItems: Record<string, TransactionItem[]>;
  loadingItems: Record<string, boolean>;
  expandedTransactions: Set<string>;
  onToggleExpansion: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onMerge: (transaction: Transaction) => void;
  onItemEdit: (item: TransactionItem) => void;
  onItemDelete: (item: TransactionItem) => void;
  onItemFieldUpdate?: (itemId: string, field: string, value: number) => void;
}

export default function TransactionCard({
  transaction,
  getMerchantName,
  getCategoryName,
  getBillItems,
  transactionItems,
  loadingItems,
  expandedTransactions,
  onToggleExpansion,
  onEdit,
  onDelete,
  onMerge,
  onItemEdit,
  onItemDelete,
  onItemFieldUpdate,
}: TransactionCardProps) {
  const { theme } = useTheme();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 10;

  const handleModalOpen = () => {
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setModalPage(1);
  };

  const handlePageChange = (_event: unknown, value: number) => {
    setModalPage(value);
  };

  const billItems = getBillItems(transaction);
  const isExpanded = expandedTransactions.has(transaction._id);
  const isLoading = Boolean(loadingItems?.[transaction._id]);
  const hasLoadedItems = Object.prototype.hasOwnProperty.call(transactionItems, transaction._id);
  const showViewMore = billItems.length > 5;
  const displayedItems = showViewMore ? billItems.slice(0, 5) : billItems;
  const modalItems = billItems.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topIndicatorRef = useRef<HTMLDivElement>(null);
  const bottomIndicatorRef = useRef<HTMLDivElement>(null);
  
  const updateScrollIndicators = () => {
    if (scrollContainerRef.current && topIndicatorRef.current && bottomIndicatorRef.current) {
      const container = scrollContainerRef.current;
      const isScrollable = container.scrollHeight > container.clientHeight;
      const isAtTop = container.scrollTop === 0;
      const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 1;
      
      topIndicatorRef.current.style.opacity = isScrollable && !isAtTop ? '1' : '0';
      bottomIndicatorRef.current.style.opacity = isScrollable && !isAtBottom ? '1' : '0';
    }
  };
  
  useEffect(() => {
    if (isExpanded && scrollContainerRef.current) {
      // Initial check
      updateScrollIndicators();
      // Check again after a short delay to ensure content is rendered
      const timeout1 = setTimeout(updateScrollIndicators, 100);
      const timeout2 = setTimeout(updateScrollIndicators, 300);
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [isExpanded, billItems.length]);

  const confidenceText = Number.isFinite(transaction.confidence_category)
    ? `${(transaction.confidence_category * 100).toFixed(1)}%`
    : 'N/A';

  const handleItemFieldUpdate = (itemId: string, field: string, value: number) => {
    onItemFieldUpdate?.(itemId, field, value);
  };

  const handleItemUpdateError = (error: string) => {
    console.error('Failed to update item:', error);
  };

  // Get transaction metadata using helper functions
  const metadata = getTransactionMetadata(
    transaction,
    billItems
  );
  
  const merchantName = getMerchantName(transaction.merchant_id);
  const categoryName = getCategoryName(transaction.category_id);
  
  // Override with helper results
  const transactionName = metadata.name;
  const displayCategory = getDisplayCategoryName(transaction, categoryName, billItems);
  const displayMerchant = metadata.merchantName;

  return (
    <Card
      elevation={0}
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <CardContent sx={{ p: '1.5rem' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <Box sx={{ flex: 1 }}>
            {/* Transaction Name/Caption */}
            {transactionName && (
              <Typography
                variant="subtitle1"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.primary,
                  fontSize: '0.9375rem',
                  fontWeight: 600,
                  lineHeight: 1.3,
                  mb: '0.75rem',
                }}
              >
                {transactionName}
              </Typography>
            )}
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: '0.5rem' }}>
              <AttachMoney sx={{ fontSize: '1.25rem', color: theme.palette.primary.main }} />
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  color: theme.palette.text.primary,
                  fontSize: '1rem',
                  fontWeight: 600,
                  lineHeight: 1.2,
                  mb: '0.5rem',
                }}
              >
                {metadata.formattedAmount}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: '0.5rem' }}>
              <CalendarToday sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
              <Typography
                variant="body2"
                sx={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '0.875rem',
                  fontWeight: 400,
                  lineHeight: 1.5,
                  color: theme.palette.text.secondary,
                  mb: '0.5rem',
                }}
              >
                {new Date(transaction.date).toLocaleDateString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<Store sx={{ fontSize: '0.875rem' }} />}
                label={displayMerchant}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<Category sx={{ fontSize: '0.875rem' }} />}
                label={displayCategory}
                size="small"
                variant="outlined"
                color={displayCategory === 'Uncategorized' ? 'default' : 'primary'}
              />
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
              />
              {metadata.anomaly.hasAnomaly && (
                <Tooltip title={metadata.anomaly.reason || 'Anomaly detected'}>
                  <Chip 
                    icon={<Warning sx={{ fontSize: '0.875rem' }} />}
                    label={metadata.anomaly.reason ? `Anomaly: ${metadata.anomaly.reason}` : 'Anomaly'} 
                    size="small" 
                    color="error"
                  />
                </Tooltip>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <CheckCircle sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Confidence: {confidenceText}
              </Typography>
              {metadata.currency && metadata.currency !== 'USD' && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Currency: {metadata.currency}
                </Typography>
              )}
              {transaction.invoice_number && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  Invoice: {transaction.invoice_number}
                </Typography>
              )}
            </Box>

            {/* Bill Items Toggle */}
            {(() => {
              // Only show expand button if transaction has items
              // If items have been loaded and are empty, don't show button
              if (hasLoadedItems && billItems.length === 0) {
                return null; // Items loaded but empty - no items exist
              }
              // If items haven't been loaded, check for embedded items
              if (!hasLoadedItems) {
                const hasEmbeddedItems = 
                  (transaction.items && transaction.items.length > 0) ||
                  (transaction.normalized_output?.items && transaction.normalized_output.items.length > 0) ||
                  (transaction.parsing_output?.items && transaction.parsing_output.items.length > 0);
                if (!hasEmbeddedItems) {
                  return null; // No embedded items found
                }
              }
              // Show button if we have items (either loaded or embedded)
              return (
                <Button
                  size="small"
                  onClick={() => onToggleExpansion(transaction._id)}
                  startIcon={isExpanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{ mt: 1, textTransform: 'none' }}
                  disabled={isLoading}
                >
                  {isExpanded
                    ? 'Hide Items'
                    : hasLoadedItems
                    ? `Show Items (${billItems.length})`
                    : 'Load Items'}
                </Button>
              );
            })()}
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {billItems.length > 0 && (
              <Tooltip title="View Items">
                <IconButton
                  size="small"
                  onClick={handleModalOpen}
                  color="info"
                >
                  <Visibility />
                </IconButton>
              </Tooltip>
            )}
            <IconButton
              size="small"
              onClick={() => onEdit(transaction)}
              color="primary"
            >
              <Edit />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onDelete(transaction)}
              color="error"
            >
              <Delete />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => onMerge(transaction)}
              color="secondary"
            >
              <MergeType />
            </IconButton>
          </Box>
        </Box>

        {/* Bill Items List */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}`, position: 'relative' }}>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : billItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No items found for this transaction.
              </Typography>
            ) : (
              <Box sx={{ position: 'relative' }}>
                {/* Top scroll indicator */}
                <Box
                  ref={topIndicatorRef}
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '30px',
                    background: `linear-gradient(to bottom, ${theme.palette.mode === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(249, 250, 251, 0.95)'} 0%, transparent 100%)`,
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                    zIndex: 2,
                  }}
                />
                <TableContainer 
                  component="div"
                  ref={scrollContainerRef}
                  onScroll={updateScrollIndicators}
                  sx={{ 
                    width: '100%',
                    maxHeight: '400px',
                    overflow: 'auto',
                    '&::-webkit-scrollbar': {
                      display: 'none',
                      width: 0,
                      height: 0,
                    },
                    '&::-webkit-scrollbar-track': {
                      display: 'none',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      display: 'none',
                    },
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '40px', minWidth: '40px' }}></TableCell>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', minWidth: '150px' }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '80px', minWidth: '80px' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '120px', minWidth: '120px' }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '120px', minWidth: '120px' }}>Total Price</TableCell>
                        {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', minWidth: '120px' }}>Category</TableCell>
                        )}
                        {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '100px', minWidth: '100px' }}>Actions</TableCell>
                        )}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayedItems.map((item: any, index: number) => {
                        // Check if this is an API item (has _id) or embedded item
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
                            key={itemId || index} 
                            hover
                            sx={getMissingFieldRowStyle(missingFields.hasMissingFields, theme)}
                          >
                            <TableCell sx={{ color: theme.palette.text.primary, width: '40px', minWidth: '40px' }}>
                              {transactionType === 'expense' ? (
                                <TrendingDown sx={{ fontSize: '1rem', color: theme.palette.error.main }} />
                              ) : (
                                <TrendingUp sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
                              )}
                            </TableCell>
                            <TableCell sx={{ color: theme.palette.text.primary, minWidth: '150px' }}>{displayItem.name || 'N/A'}</TableCell>
                            <EditableItemCell
                              value={displayItem.quantity}
                              field="quantity"
                              itemId={itemId}
                              transactionId={transaction._id}
                              isMissing={missingFields.quantity}
                              onUpdate={handleItemFieldUpdate}
                              onError={handleItemUpdateError}
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
                              sx={{ fontWeight: 500 }}
                            />
                            {billItems.some((i: any) => i.category || (i as TransactionItem).category) && (
                              <TableCell sx={{ color: theme.palette.text.primary }}>
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
                                    onClick={() => onItemEdit(apiItem)}
                                    color="primary"
                                    sx={{ padding: '0.25rem' }}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    onClick={() => onItemDelete(apiItem)}
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
                {/* Bottom scroll indicator */}
                <Box
                  ref={bottomIndicatorRef}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '30px',
                    background: `linear-gradient(to top, ${theme.palette.mode === 'dark' ? 'rgba(26, 26, 26, 0.95)' : 'rgba(249, 250, 251, 0.95)'} 0%, transparent 100%)`,
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 0.3s ease-in-out',
                    zIndex: 2,
                  }}
                />
                {showViewMore && (
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleModalOpen}
                      sx={{ textTransform: 'none' }}
                      aria-label={`View all ${billItems.length} items`}
                    >
                      View More ({billItems.length - 5} more)
                    </Button>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </Collapse>

        {/* Modal for displaying all items */}
        <Dialog
          open={modalOpen}
          onClose={handleModalClose}
          fullWidth
          maxWidth="md"
          aria-labelledby="transaction-items-modal-title"
          aria-describedby="transaction-items-modal-description"
        >
          <DialogTitle id="transaction-items-modal-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ShoppingCart sx={{ fontSize: '1.25rem', color: theme.palette.primary.main }} />
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                All Bill Items
              </Typography>
            </Box>
            <IconButton
              aria-label="close"
              onClick={handleModalClose}
              sx={{ color: theme.palette.text.primary }}
            >
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ position: 'relative' }}>
            <Box sx={{ position: 'relative' }}>
              {/* Top scroll indicator */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '20px',
                  background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  zIndex: 2,
                }}
                ref={(el) => {
                  if (el && modalPage === 1) {
                    const container = el.nextElementSibling as HTMLElement;
                    if (container) {
                      const isScrollable = container.scrollHeight > container.clientHeight;
                      el.style.opacity = isScrollable ? '0' : '0';
                    }
                  }
                }}
              />
              <TableContainer 
                component="div"
                onScroll={(e) => {
                  const target = e.target as HTMLElement;
                  const topIndicator = target.previousElementSibling as HTMLElement;
                  const bottomIndicator = target.nextElementSibling as HTMLElement;
                  if (topIndicator) {
                    topIndicator.style.opacity = target.scrollTop > 0 ? '1' : '0';
                  }
                  if (bottomIndicator) {
                    const isScrollable = target.scrollHeight > target.clientHeight;
                    const isAtBottom = target.scrollTop + target.clientHeight >= target.scrollHeight - 1;
                    bottomIndicator.style.opacity = isScrollable && !isAtBottom ? '1' : '0';
                  }
                }}
                sx={{ 
                  width: '100%',
                  maxHeight: '500px',
                  overflow: 'auto',
                  '&::-webkit-scrollbar': {
                    display: 'none',
                  },
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none',
                }}
              >
              <Table size="small" sx={{ width: '100%', tableLayout: 'fixed' }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '40px', minWidth: '40px' }}></TableCell>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', minWidth: '150px' }}>Item Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '80px', minWidth: '80px' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '120px', minWidth: '120px' }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '120px', minWidth: '120px' }}>Total Price</TableCell>
                    {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', minWidth: '120px' }}>Category</TableCell>
                    )}
                    {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', width: '100px', minWidth: '100px' }}>Actions</TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {modalItems.map((item: any, index: number) => {
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
                        key={itemId || index} 
                        hover
                        sx={getMissingFieldRowStyle(missingFields.hasMissingFields, theme)}
                      >
                        <TableCell sx={{ color: theme.palette.text.primary, width: '40px', minWidth: '40px' }}>
                          {transactionType === 'expense' ? (
                            <TrendingDown sx={{ fontSize: '1rem', color: theme.palette.error.main }} />
                          ) : (
                            <TrendingUp sx={{ fontSize: '1rem', color: theme.palette.success.main }} />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: theme.palette.text.primary, minWidth: '150px' }}>{displayItem.name || 'N/A'}</TableCell>
                        <EditableItemCell
                          value={displayItem.quantity}
                          field="quantity"
                          itemId={itemId}
                          transactionId={transaction._id}
                          isMissing={missingFields.quantity}
                          onUpdate={handleItemFieldUpdate}
                          onError={handleItemUpdateError}
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
                          sx={{ fontWeight: 500 }}
                        />
                        {billItems.some((i: any) => i.category || (i as TransactionItem).category) && (
                          <TableCell sx={{ color: theme.palette.text.primary }}>
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
                                onClick={() => onItemEdit(apiItem)}
                                color="primary"
                                sx={{ padding: '0.25rem' }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                onClick={() => onItemDelete(apiItem)}
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
                  background: `linear-gradient(to bottom, ${theme.palette.background.paper} 0%, transparent 100%)`,
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
                  background: `linear-gradient(to top, ${theme.palette.background.paper} 0%, transparent 100%)`,
                  pointerEvents: 'none',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                  zIndex: 1,
                }}
              />
            </Box>
            {billItems.length > itemsPerPage && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Pagination
                  count={Math.ceil(billItems.length / itemsPerPage)}
                  page={modalPage}
                  onChange={handlePageChange}
                  color="primary"
                  size="small"
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleModalClose} color="primary" sx={{ textTransform: 'none' }}>
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
}

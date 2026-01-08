import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Typography,
  Pagination,
  Chip,
} from '@mui/material';
import { Close, ShoppingCart, TrendingDown, TrendingUp, Edit, Delete } from '@mui/icons-material';
import { Transaction, TransactionItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { getTransactionType, checkMissingPriceFields, getMissingFieldRowStyle } from '../../utils/transactionHelpers';
import EditableItemCell from './EditableItemCell';

interface BillItemsModalProps {
  open: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  billItems: TransactionItem[];
  transactionItems: Record<string, TransactionItem[]>;
  onItemEdit?: (item: TransactionItem) => void;
  onItemDelete?: (item: TransactionItem) => void;
  onItemFieldUpdate?: (itemId: string, field: string, value: number) => void;
}

export default function BillItemsModal({
  open,
  onClose,
  transaction,
  billItems,
  transactionItems,
  onItemEdit,
  onItemDelete,
  onItemFieldUpdate,
}: BillItemsModalProps) {
  const { theme } = useTheme();
  const [modalPage, setModalPage] = useState(1);
  const itemsPerPage = 20;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const topIndicatorRef = useRef<HTMLDivElement>(null);
  const bottomIndicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setModalPage(1);
    }
  }, [open]);

  const handlePageChange = (_event: unknown, value: number) => {
    setModalPage(value);
  };

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
    if (open && scrollContainerRef.current) {
      updateScrollIndicators();
      const timeout1 = setTimeout(updateScrollIndicators, 100);
      const timeout2 = setTimeout(updateScrollIndicators, 300);
      return () => {
        clearTimeout(timeout1);
        clearTimeout(timeout2);
      };
    }
  }, [open, billItems.length, modalPage]);

  if (!transaction) return null;

  const transactionType = getTransactionType(transaction);
  const modalItems = billItems.slice((modalPage - 1) * itemsPerPage, modalPage * itemsPerPage);

  const handleItemFieldUpdate = (itemId: string, field: string, value: number) => {
    onItemFieldUpdate?.(itemId, field, value);
  };

  const handleItemUpdateError = (error: string) => {
    console.error('Failed to update item:', error);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      aria-labelledby="bill-items-modal-title"
      aria-describedby="bill-items-modal-description"
    >
      <DialogTitle id="bill-items-modal-title" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ShoppingCart sx={{ fontSize: '1.25rem', color: theme.palette.primary.main }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Bill Items
            </Typography>
            {transaction.merchant_name && (
              <Typography variant="caption" color="text.secondary">
                {transaction.merchant_name} • {new Date(transaction.date).toLocaleDateString()}
              </Typography>
            )}
          </Box>
        </Box>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{ color: theme.palette.text.primary }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers sx={{ position: 'relative', p: 0 }}>
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
              maxHeight: '500px',
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
                {modalItems.map((item: any, index: number) => {
                  const itemId = (item as TransactionItem)._id;
                  const apiItem = itemId && transactionItems[transaction._id]
                    ? transactionItems[transaction._id].find((apiItem) => apiItem._id === itemId)
                    : null;
                  const displayItem = apiItem || item;

                  // Check for missing price fields
                  const missingFields = checkMissingPriceFields(displayItem);

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
                      {apiItem && onItemEdit && onItemDelete && (
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
        </Box>
        {billItems.length > itemsPerPage && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
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
        <Button onClick={onClose} color="primary" sx={{ textTransform: 'none' }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}


import { Card, CardContent, Typography, Box, Chip, IconButton, Collapse, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Pagination, CircularProgress } from '@mui/material';
import { Edit, Delete, MergeType, ExpandMore, ExpandLess, ShoppingCart, AttachMoney, CalendarToday, Store, Category, CheckCircle, Close } from '@mui/icons-material';
import { Transaction, TransactionItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';
import { useState } from 'react';

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

  const confidenceText = Number.isFinite(transaction.confidence_category)
    ? `${(transaction.confidence_category * 100).toFixed(1)}%`
    : 'N/A';

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
                Rs. {transaction.amount.toFixed(2)}
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
                label={getMerchantName(transaction.merchant_id)}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<Category sx={{ fontSize: '0.875rem' }} />}
                label={getCategoryName(transaction.category_id)}
                size="small"
                variant="outlined"
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
              {transaction.anomaly_flag && (
                <Chip label="Anomaly" size="small" color="error" />
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <CheckCircle sx={{ fontSize: '1rem', color: theme.palette.text.secondary }} />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                Confidence: {confidenceText}
              </Typography>
            </Box>

            {/* Bill Items Toggle */}
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
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
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
          <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <ShoppingCart sx={{ fontSize: '1.25rem', color: theme.palette.primary.main }} />
              <Typography variant="subtitle2" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                Bill Items
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />

            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={20} />
              </Box>
            ) : billItems.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                No items found for this transaction.
              </Typography>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Item Name</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Quantity</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Unit Price</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Total Price</TableCell>
                        {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Category</TableCell>
                        )}
                        {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                          <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Actions</TableCell>
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

                        return (
                          <TableRow key={itemId || index} hover>
                            <TableCell sx={{ color: theme.palette.text.primary }}>{displayItem.name || 'N/A'}</TableCell>
                            <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{displayItem.quantity || 1}</TableCell>
                            <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                              {displayItem.unit_price ? `Rs. ${displayItem.unit_price.toFixed(2)}` : 'N/A'}
                            </TableCell>
                            <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                              {displayItem.total_price ? `Rs. ${displayItem.total_price.toFixed(2)}` : 'N/A'}
                            </TableCell>
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
              </>
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
          <DialogContent dividers>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Item Name</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Unit Price</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Total Price</TableCell>
                    {billItems.some((item: any) => item.category || (item as TransactionItem).category) && (
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Category</TableCell>
                    )}
                    {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                      <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Actions</TableCell>
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

                    return (
                      <TableRow key={itemId || index} hover>
                        <TableCell sx={{ color: theme.palette.text.primary }}>{displayItem.name || 'N/A'}</TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary }}>{displayItem.quantity || 1}</TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary }}>
                          {displayItem.unit_price ? `Rs. ${displayItem.unit_price.toFixed(2)}` : 'N/A'}
                        </TableCell>
                        <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500 }}>
                          {displayItem.total_price ? `Rs. ${displayItem.total_price.toFixed(2)}` : 'N/A'}
                        </TableCell>
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

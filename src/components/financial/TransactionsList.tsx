import { Box, Paper, Typography, Button, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Card, CardContent, Chip, IconButton, Collapse, CircularProgress } from '@mui/material';
import { CloudUpload, Edit, Delete, MergeType, ExpandLess, ExpandMore } from '@mui/icons-material';
import { Transaction, Merchant, Category, TransactionItem, FlattenedItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';

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
  getMerchantName,
  getCategoryName,
  getBillItems,
}: TransactionsListProps) {
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

  const renderTableView = () => (
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
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Date</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Merchant</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Category</TableCell>
            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Amount</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb', fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedTransactions.map((transaction, index) => (
            <TableRow
              key={transaction._id}
              hover
              sx={{
                backgroundColor: index % 2 === 0 ? theme.palette.background.paper : (theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb'),
                '&:hover': {
                  backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
                },
              }}
            >
              <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                {new Date(transaction.date).toLocaleDateString()}
              </TableCell>
              <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                {getMerchantName(transaction.merchant_id)}
              </TableCell>
              <TableCell sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                {getCategoryName(transaction.category_id)}
              </TableCell>
              <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                Rs. {transaction.amount.toFixed(2)}
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
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderCardView = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {paginatedTransactions.map((transaction) => (
        <Card
          key={transaction._id}
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
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  <Chip
                    label={getMerchantName(transaction.merchant_id)}
                    size="small"
                    variant="outlined"
                  />
                  <Chip
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
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Confidence: {(transaction.confidence_category * 100).toFixed(1)}%
                </Typography>

                {/* Bill Items Toggle */}
                {getBillItems(transaction).length > 0 && (
                  <Button
                    size="small"
                    onClick={() => onToggleItemsExpansion(transaction._id)}
                    startIcon={expandedTransactions.has(transaction._id) ? <ExpandLess /> : <ExpandMore />}
                    sx={{ mt: 1, textTransform: 'none' }}
                  >
                    {expandedTransactions.has(transaction._id) ? 'Hide Items' : `Show Items (${getBillItems(transaction).length})`}
                  </Button>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  size="small"
                  onClick={() => onEditTransaction(transaction)}
                  color="primary"
                >
                  <Edit />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onDeleteTransaction(transaction)}
                  color="error"
                >
                  <Delete />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => onMergeTransaction(transaction)}
                  color="secondary"
                >
                  <MergeType />
                </IconButton>
              </Box>
            </Box>

            {/* Bill Items List */}
            {getBillItems(transaction).length > 0 && (
              <Collapse in={expandedTransactions.has(transaction._id)} timeout="auto" unmountOnExit>
                <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
                  <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 600 }}>
                    Bill Items
                  </Typography>
                  {loadingItems[transaction._id] ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Item Name</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Quantity</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Unit Price</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Total Price</TableCell>
                            {getBillItems(transaction).some((item: any) => item.category || (item as TransactionItem).category) && (
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Category</TableCell>
                            )}
                            {transactionItems[transaction._id] && transactionItems[transaction._id].length > 0 && (
                              <TableCell sx={{ fontWeight: 600, color: theme.palette.text.primary, backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb' }}>Actions</TableCell>
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {getBillItems(transaction).map((item: any, index: number) => {
                            const itemId = (item as TransactionItem)._id;
                            const apiItem = itemId && transactionItems[transaction._id]
                              ? transactionItems[transaction._id].find(apiItem => apiItem._id === itemId)
                              : null;
                            const displayItem = apiItem || item;
                            const isApiItem = !!apiItem;

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
                                {getBillItems(transaction).some((i: any) => i.category || (i as TransactionItem).category) && (
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
            )}
          </CardContent>
        </Card>
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
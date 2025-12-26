import { Card, CardContent, Typography, Box, Chip, IconButton, Collapse, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Button } from '@mui/material';
import { Edit, Delete, MergeType, ExpandMore, ExpandLess } from '@mui/icons-material';
import { Transaction, TransactionItem } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionCardProps {
  transaction: Transaction;
  getMerchantName: (id: string | null) => string;
  getCategoryName: (id: string | null) => string;
  getBillItems: (transaction: Transaction) => TransactionItem[];
  transactionItems: Record<string, TransactionItem[]>;
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
  expandedTransactions,
  onToggleExpansion,
  onEdit,
  onDelete,
  onMerge,
  onItemEdit,
  onItemDelete,
}: TransactionCardProps) {
  const { theme } = useTheme();

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
                onClick={() => onToggleExpansion(transaction._id)}
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
        {getBillItems(transaction).length > 0 && (
          <Collapse in={expandedTransactions.has(transaction._id)} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
              <Typography variant="subtitle2" sx={{ mb: 1, color: theme.palette.text.primary, fontWeight: 600 }}>
                Bill Items
              </Typography>
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
                      // Check if this is an API item (has _id) or embedded item
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
            </Box>
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
}
import { Dialog, DialogTitle, DialogContent, Box, IconButton, TextField, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, Paper, Typography } from '@mui/material';
import { Close, Sort } from '@mui/icons-material';
import { Transaction } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';

interface FullScreenTransactionsProps {
  open: boolean;
  transactions: Transaction[];
  searchQuery: string;
  sortBy: 'date' | 'amount' | 'merchant' | 'category';
  sortOrder: 'asc' | 'desc';
  getMerchantName: (id: string | null) => string;
  getCategoryName: (id: string | null) => string;
  onClose: () => void;
  onSearchChange: (query: string) => void;
  onSort: (field: 'date' | 'amount' | 'merchant' | 'category') => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onMerge: (transaction: Transaction) => void;
}

export default function FullScreenTransactions({
  open,
  transactions,
  searchQuery,
  sortBy,
  sortOrder,
  getMerchantName,
  getCategoryName,
  onClose,
  onSearchChange,
  onSort,
  onEdit,
  onDelete,
  onMerge,
}: FullScreenTransactionsProps) {
  const { theme } = useTheme();

  // Filter and sort transactions
  const filteredTransactions = transactions.filter((transaction) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const merchantName = getMerchantName(transaction.merchant_id).toLowerCase();
    const categoryName = getCategoryName(transaction.category_id).toLowerCase();
    const amount = transaction.amount.toString();
    const date = new Date(transaction.date).toLocaleDateString().toLowerCase();

    return (
      merchantName.includes(query) ||
      categoryName.includes(query) ||
      amount.includes(query) ||
      date.includes(query)
    );
  });

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'merchant':
        comparison = getMerchantName(a.merchant_id).localeCompare(getMerchantName(b.merchant_id));
        break;
      case 'category':
        comparison = getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id));
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      fullWidth
      PaperProps={{
        sx: {
          width: '95vw',
          height: '95vh',
          maxWidth: 'none',
          maxHeight: 'none',
          m: 0,
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.palette.divider}`,
          pb: '1rem',
          fontFamily: "'Inter', sans-serif",
          fontSize: '1.25rem',
          fontWeight: 600,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography sx={{ fontFamily: "'Inter', sans-serif", fontSize: '1.25rem', fontWeight: 600 }}>
            All Transactions ({sortedTransactions.length})
          </Typography>
        </Box>
        <IconButton
          onClick={onClose}
          sx={{
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.mode === 'dark' ? '#2a2a2a' : '#f3f4f6',
            },
          }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          p: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          overflow: 'hidden',
        }}
      >
        {/* Search and Sort Controls */}
        <Box sx={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            InputProps={{
              startAdornment: <span style={{ marginRight: '8px', color: theme.palette.text.secondary }}>🔍</span>,
            }}
            sx={{
              flex: '1 1 300px',
              minWidth: '200px',
              '& .MuiOutlinedInput-root': {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
              },
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              color: theme.palette.text.secondary,
              whiteSpace: 'nowrap',
            }}
          >
            {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Transactions Table */}
        <TableContainer
          sx={{
            flex: 1,
            overflow: 'auto',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: '8px',
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '120px',
                  }}
                  onClick={() => onSort('date')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Date
                    <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'date' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '150px',
                  }}
                  onClick={() => onSort('merchant')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Merchant
                    <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'merchant' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '150px',
                  }}
                  onClick={() => onSort('category')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    Category
                    <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'category' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    cursor: 'pointer',
                    userSelect: 'none',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '120px',
                  }}
                  onClick={() => onSort('amount')}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                    Amount
                    <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'amount' ? 1 : 0.3 }} />
                  </Box>
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '100px',
                  }}
                >
                  Status
                </TableCell>
                <TableCell
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.875rem',
                    minWidth: '120px',
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                      No transactions found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                sortedTransactions.map((transaction, index) => (
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
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        backgroundColor: transaction.status === 'confirmed' ? '#4caf50' : transaction.status === 'pending' ? '#ff9800' : '#f44336',
                        color: 'white'
                      }}>
                        {transaction.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            onEdit(transaction);
                            onClose();
                          }}
                          color="primary"
                          sx={{ padding: '0.25rem' }}
                        >
                          <span style={{ fontSize: '1rem' }}>✏️</span>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            onDelete(transaction);
                            onClose();
                          }}
                          color="error"
                          sx={{ padding: '0.25rem' }}
                        >
                          <span style={{ fontSize: '1rem' }}>🗑️</span>
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            onMerge(transaction);
                            onClose();
                          }}
                          color="secondary"
                          sx={{ padding: '0.25rem' }}
                        >
                          <span style={{ fontSize: '1rem' }}>🔗</span>
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
    </Dialog>
  );
}
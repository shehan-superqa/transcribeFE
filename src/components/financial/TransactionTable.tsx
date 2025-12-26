import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, IconButton, Chip } from '@mui/material';
import { Edit, Delete, MergeType, Sort } from '@mui/icons-material';
import { Transaction } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionTableProps {
  transactions: Transaction[];
  sortBy: 'date' | 'amount' | 'merchant' | 'category';
  sortOrder: 'asc' | 'desc';
  getMerchantName: (id: string | null) => string;
  getCategoryName: (id: string | null) => string;
  onSort: (field: 'date' | 'amount' | 'merchant' | 'category') => void;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  onMerge: (transaction: Transaction) => void;
}

export default function TransactionTable({
  transactions,
  sortBy,
  sortOrder,
  getMerchantName,
  getCategoryName,
  onSort,
  onEdit,
  onDelete,
  onMerge,
}: TransactionTableProps) {
  const { theme } = useTheme();

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
            <TableCell
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f9fafb',
                cursor: 'pointer',
                userSelect: 'none',
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
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
              }}
            >
              Actions
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions.map((transaction, index) => (
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
                    onClick={() => onEdit(transaction)}
                    color="primary"
                    sx={{ padding: '0.25rem' }}
                  >
                    <Edit sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onDelete(transaction)}
                    color="error"
                    sx={{ padding: '0.25rem' }}
                  >
                    <Delete sx={{ fontSize: '1rem' }} />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => onMerge(transaction)}
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
}
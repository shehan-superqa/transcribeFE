import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography } from '@mui/material';
import { Sort } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionItem {
  id: string;
  transactionId: string;
  transactionDate: Date;
  transactionAmount: number;
  transactionStatus: string;
  merchantName: string;
  categoryName: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  itemCategory?: string;
}

interface ItemsTableProps {
  items: TransactionItem[];
  sortBy: 'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate';
  sortOrder: 'asc' | 'desc';
  onSort: (field: 'itemName' | 'transactionId' | 'merchant' | 'category' | 'quantity' | 'unitPrice' | 'totalPrice' | 'transactionDate') => void;
}

export default function ItemsTable({
  items,
  sortBy,
  sortOrder,
  onSort,
}: ItemsTableProps) {
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
                minWidth: '150px',
              }}
              onClick={() => onSort('itemName')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Item Name
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'itemName' ? 1 : 0.3 }} />
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
                minWidth: '200px',
              }}
              onClick={() => onSort('transactionId')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Transaction ID
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'transactionId' ? 1 : 0.3 }} />
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
                minWidth: '120px',
              }}
              onClick={() => onSort('transactionDate')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                Date
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'transactionDate' ? 1 : 0.3 }} />
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
                minWidth: '80px',
              }}
              onClick={() => onSort('quantity')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                Qty
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'quantity' ? 1 : 0.3 }} />
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
                minWidth: '100px',
              }}
              onClick={() => onSort('unitPrice')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                Unit Price
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'unitPrice' ? 1 : 0.3 }} />
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
                minWidth: '100px',
              }}
              onClick={() => onSort('totalPrice')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 0.5 }}>
                Total Price
                <Sort sx={{ fontSize: '1rem', opacity: sortBy === 'totalPrice' ? 1 : 0.3 }} />
              </Box>
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: "'Inter', sans-serif" }}>
                  No items found
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => (
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
                  {item.quantity && item.quantity > 0 ? item.quantity : 'N/A'}
                </TableCell>
                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.unitPrice && item.unitPrice > 0 ? `Rs. ${item.unitPrice.toFixed(2)}` : 'N/A'}
                </TableCell>
                <TableCell align="right" sx={{ color: theme.palette.text.primary, fontWeight: 500, fontFamily: "'Inter', sans-serif", fontSize: '0.875rem' }}>
                  {item.totalPrice && item.totalPrice > 0 ? `Rs. ${item.totalPrice.toFixed(2)}` : 'N/A'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
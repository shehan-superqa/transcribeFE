import { Box, Pagination } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionPaginationProps {
  count: number;
  page: number;
  onPageChange: (page: number) => void;
}

export default function TransactionPagination({
  count,
  page,
  onPageChange,
}: TransactionPaginationProps) {
  const { theme } = useTheme();

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 3 }}>
      <Pagination
        count={count}
        page={page}
        onChange={(_, value) => onPageChange(value)}
        color="primary"
        showFirstButton
        showLastButton
        sx={{
          '& .MuiPaginationItem-root': {
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
          },
        }}
      />
    </Box>
  );
}
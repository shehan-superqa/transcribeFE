import { Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { FilterList } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TransactionFilters, Merchant, Category } from '../../types/financial';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionFiltersSectionProps {
  filters: TransactionFilters;
  categories: Category[];
  merchants: Merchant[];
  onFilterChange: (key: keyof TransactionFilters, value: any) => void;
  onClearFilters: () => void;
  hasFilters: boolean;
}

export default function TransactionFiltersSection({
  filters,
  categories,
  merchants,
  onFilterChange,
  onClearFilters,
  hasFilters,
}: TransactionFiltersSectionProps) {
  const { theme } = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: '1.5rem',
        mb: '2rem',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.5rem', mb: '1.5rem' }}>
        <FilterList sx={{ color: theme.palette.text.secondary, fontSize: '1.25rem' }} />
        <Typography
          variant="h6"
          sx={{
            fontFamily: "'Inter', sans-serif",
            color: theme.palette.text.primary,
            fontSize: '1rem',
            fontWeight: 600,
            lineHeight: 1.2,
          }}
        >
          Filters
        </Typography>
        {hasFilters && (
          <Button
            size="small"
            onClick={onClearFilters}
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              padding: '0.5rem 0.75rem',
              borderRadius: '8px',
              textTransform: 'none',
            }}
          >
            Clear
          </Button>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Date From"
            value={filters.dateFrom}
            onChange={(date) => onFilterChange('dateFrom', date)}
            slotProps={{ textField: { size: 'small' } }}
          />
          <DatePicker
            label="Date To"
            value={filters.dateTo}
            onChange={(date) => onFilterChange('dateTo', date)}
            slotProps={{ textField: { size: 'small' } }}
          />
        </LocalizationProvider>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Category</InputLabel>
          <Select
            value={filters.category || ''}
            onChange={(e) => onFilterChange('category', e.target.value || undefined)}
            label="Category"
          >
            <MenuItem value="">All</MenuItem>
            {categories.map((cat) => (
              <MenuItem key={cat._id} value={cat._id}>
                {cat.category_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Merchant</InputLabel>
          <Select
            value={filters.merchant || ''}
            onChange={(e) => onFilterChange('merchant', e.target.value || undefined)}
            label="Merchant"
          >
            <MenuItem value="">All</MenuItem>
            {merchants.map((merchant) => (
              <MenuItem key={merchant._id} value={merchant._id}>
                {merchant.merchant_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
  );
}
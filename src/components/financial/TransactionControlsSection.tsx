import { Box, Paper, Typography, Button, TextField, ToggleButtonGroup, ToggleButton, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { Search, ViewModule, ViewList, OpenInFull } from '@mui/icons-material';
import { useTheme } from '../../contexts/ThemeContext';

interface TransactionControlsSectionProps {
  layout: 'card' | 'table' | 'items';
  searchQuery: string;
  itemsPerPage: number;
  paginatedCount: number;
  totalCount: number;
  currentPage: number;
  onLayoutChange: (newLayout: 'card' | 'table' | 'items') => void;
  onSearchChange: (query: string) => void;
  onItemsPerPageChange: (value: number) => void;
  onOpenFullScreen: () => void;
}

export default function TransactionControlsSection({
  layout,
  searchQuery,
  itemsPerPage,
  paginatedCount,
  totalCount,
  currentPage,
  onLayoutChange,
  onSearchChange,
  onItemsPerPageChange,
  onOpenFullScreen,
}: TransactionControlsSectionProps) {
  const { theme } = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        p: '1rem',
        mb: '1.5rem',
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
      }}
    >
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <TextField
          size="small"
          placeholder={layout === 'items' ? "Search items..." : "Search transactions..."}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: theme.palette.text.secondary }} />,
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

        {/* Layout Toggle */}
        <ToggleButtonGroup
          value={layout}
          exclusive
          onChange={(_, newLayout) => newLayout && onLayoutChange(newLayout)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
              fontWeight: 500,
              textTransform: 'none',
              padding: '0.5rem 0.75rem',
            },
          }}
        >
          <ToggleButton value="card">
            <ViewModule sx={{ mr: 0.5, fontSize: '1rem' }} />
            Cards
          </ToggleButton>
          <ToggleButton value="table">
            <ViewList sx={{ mr: 0.5, fontSize: '1rem' }} />
            Table
          </ToggleButton>
          <ToggleButton value="items">
            <ViewList sx={{ mr: 0.5, fontSize: '1rem' }} />
            Items
          </ToggleButton>
        </ToggleButtonGroup>

        {/* Items Per Page */}
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per Page</InputLabel>
          <Select
            value={itemsPerPage}
            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
            label="Per Page"
            sx={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.875rem',
            }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={25}>25</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={100}>100</MenuItem>
          </Select>
        </FormControl>

        {/* Results Count */}
        <Typography
          variant="body2"
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
            color: theme.palette.text.secondary,
            whiteSpace: 'nowrap',
          }}
        >
          Showing {paginatedCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} - {Math.min(currentPage * itemsPerPage, totalCount)} of {totalCount}
        </Typography>

        {/* Open Full Screen Button */}
        <Button
          variant="outlined"
          startIcon={<OpenInFull />}
          onClick={onOpenFullScreen}
          sx={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.875rem',
            fontWeight: 500,
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            textTransform: 'none',
            borderColor: theme.palette.primary.main,
            color: theme.palette.primary.main,
            '&:hover': {
              borderColor: theme.palette.primary.dark,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(107, 33, 168, 0.1)' : 'rgba(107, 33, 168, 0.05)',
            },
          }}
        >
          View All
        </Button>
      </Box>
    </Paper>
  );
}
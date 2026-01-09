import { Box, Button, TextField, Typography } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

interface DashboardHeaderProps {
  askBarValue: string;
  onAskBarChange: (value: string) => void;
  onAskSubmit: () => void;
  onViewAnalytics: () => void;
}

export default function DashboardHeader({
  askBarValue,
  onAskBarChange,
  onAskSubmit,
  onViewAnalytics,
}: DashboardHeaderProps) {
  const { theme } = useTheme();

  return (
    <Box
      sx={{
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
      }}
    >
      <Box sx={{ maxWidth: '1600px', mx: 'auto', px: 6, py: 1, display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'rgba(109, 40, 217, 0.1)',
              color: '#6D28D9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Fiscally Dashboard
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', lineHeight: 1.2 }}>
              Overview of your personal finances
            </Typography>
          </Box>
        </Box>
        <Box sx={{ position: 'relative', flex: 1, maxWidth: { md: '528px' }, mx: { md: 'auto' } }}>
          <SearchIcon sx={{ position: 'absolute', left: 3, top: '50%', transform: 'translateY(-50%)', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#9CA3AF', fontSize: 16 }} />
          <TextField
            fullWidth
            size="small"
            placeholder="Ask me anything or search transactions..."
            value={askBarValue}
            onChange={(e) => onAskBarChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onAskSubmit();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                pl: 8,
                pr: 3,
                py: 1,
                bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                borderRadius: '8px',
                fontSize: '13px',
                '& fieldset': {
                  border: 'none',
                },
                '&:hover': {
                  borderColor: '#6D28D9',
                  '& fieldset': {
                    border: 'none',
                  },
                },
                '&.Mui-focused': {
                  borderColor: '#6D28D9',
                  boxShadow: '0 0 0 2px rgba(109, 40, 217, 0.1)',
                  '& fieldset': {
                    border: 'none',
                  },
                },
              },
            }}
          />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<CalendarMonthIcon sx={{ fontSize: 12 }} />}
            sx={{
              textTransform: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              px: 3,
              py: 1,
              borderColor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
              bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
              color: theme.palette.text.primary,
              '&:hover': {
                borderColor: theme.palette.mode === 'dark' ? '#4B5563' : '#D1D5DB',
                bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
              },
            }}
            onClick={onViewAnalytics}
          >
            Monthly
          </Button>
        </Box>
      </Box>
    </Box>
  );
}


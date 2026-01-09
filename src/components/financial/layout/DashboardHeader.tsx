import { Button, TextField, Typography } from '@mui/material';
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
    <div
      style={{
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'}`,
        backgroundColor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
      }}
    >
      <div
        style={{
          maxWidth: '1600px',
          margin: '0 auto',
          paddingTop: '8px',
          paddingBottom: '8px',
          paddingLeft: '32px',
          paddingRight: '32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          gap: '16px',
        }}
        className="dashboard-header-container"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              backgroundColor: 'rgba(109, 40, 217, 0.1)',
              color: '#6D28D9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <AccountBalanceIcon sx={{ fontSize: 18 }} />
          </div>
          <div>
            <Typography sx={{ fontSize: '16px', fontWeight: 700, color: theme.palette.text.primary, lineHeight: 1.2 }}>
              Fiscally Dashboard
            </Typography>
            <Typography sx={{ fontSize: '12px', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280', lineHeight: 1.2 }}>
              Overview of your personal finances
            </Typography>
          </div>
        </div>
        <div
          style={{
            position: 'relative',
            flex: 1,
            width: '100%',
            maxWidth: '100%',
          }}
          className="search-container"
        >
          <SearchIcon sx={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#9CA3AF', fontSize: 16, zIndex: 1 }} />
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
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
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
        </div>
      </div>
      <style>{`
        @media (min-width: 900px) {
          .dashboard-header-container {
            flex-direction: row !important;
            align-items: center !important;
          }
          .search-container {
            max-width: 528px !important;
            margin: 0 auto !important;
          }
        }
      `}</style>
    </div>
  );
}


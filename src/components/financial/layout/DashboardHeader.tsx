import { Button, Typography } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { useNavigate } from 'react-router-dom';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import CategoryIcon from '@mui/icons-material/Category';
import StoreIcon from '@mui/icons-material/Store';

interface DashboardHeaderProps {
  onViewAnalytics: () => void;
}

export default function DashboardHeader({
  onViewAnalytics,
}: DashboardHeaderProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const quickLinks = [
    {
      label: 'Transactions',
      icon: SwapHorizIcon,
      onClick: () => navigate('/financialtool/app/transactions'),
    },
    {
      label: 'Upload Bills',
      icon: CloudUploadIcon,
      onClick: () => navigate('/financialtool/app/upload'),
    },
    {
      label: 'Analytics',
      icon: AnalyticsIcon,
      onClick: onViewAnalytics,
    },
    {
      label: 'Categories',
      icon: CategoryIcon,
      onClick: () => navigate('/financialtool/app/categories'),
    },
    {
      label: 'Merchants',
      icon: StoreIcon,
      onClick: () => navigate('/financialtool/app/merchants'),
    },
  ];

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
        {/* Quick Links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
            flex: 1,
            justifyContent: 'flex-end',
          }}
          className="quick-links-container"
        >
          {quickLinks.map((link) => {
            const IconComponent = link.icon;
            return (
              <Button
                key={link.label}
                size="small"
                startIcon={<IconComponent sx={{ fontSize: 16 }} />}
                onClick={link.onClick}
                sx={{
                  textTransform: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  px: 2,
                  py: 0.75,
                  border: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`,
                  bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F9FAFB',
                  color: theme.palette.text.primary,
                  '&:hover': {
                    borderColor: '#6D28D9',
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                    color: '#6D28D9',
                  },
                }}
              >
                {link.label}
              </Button>
            );
          })}
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
          .quick-links-container {
            justify-content: flex-end !important;
            flex-wrap: nowrap !important;
          }
        }
      `}</style>
    </div>
  );
}


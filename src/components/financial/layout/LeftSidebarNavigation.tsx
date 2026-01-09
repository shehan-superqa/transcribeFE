import { Box, IconButton, Typography } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import PendingIcon from '@mui/icons-material/Pending';
import RepeatIcon from '@mui/icons-material/Repeat';
import ScheduleIcon from '@mui/icons-material/Schedule';
import InventoryIcon from '@mui/icons-material/Inventory';
import StoreIcon from '@mui/icons-material/Store';
import CategoryIcon from '@mui/icons-material/Category';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import BarChartIcon from '@mui/icons-material/BarChart';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined';
import SavingsIcon from '@mui/icons-material/Savings';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ChatIcon from '@mui/icons-material/Chat';
import MemoryIcon from '@mui/icons-material/Memory';

interface LeftSidebarNavigationProps {
  value: number;
  setValue: (value: number) => void;
}

export default function LeftSidebarNavigation({ value, setValue }: LeftSidebarNavigationProps) {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const navItems = [
    { index: 0, path: '/financialtool/app/dashboard', icon: DashboardIcon, label: 'Dashboard' },
    { index: 1, path: '/financialtool/app/upload', icon: CloudUploadIcon, label: 'Upload Bills' },
    { index: 2, path: '/financialtool/app/transactions', icon: SwapHorizIcon, label: 'Transactions' },
    { index: 3, path: '/financialtool/app/pending', icon: PendingIcon, label: 'Pending' },
    { index: 4, path: '/financialtool/app/recurring', icon: RepeatIcon, label: 'Recurring' },
    { index: 5, path: '/financialtool/app/upcoming', icon: ScheduleIcon, label: 'Upcoming' },
    { index: 6, path: '/financialtool/app/items', icon: InventoryIcon, label: 'Items' },
    { index: 7, path: '/financialtool/app/merchants', icon: StoreIcon, label: 'Merchants' },
    { index: 8, path: '/financialtool/app/categories', icon: CategoryIcon, label: 'Categories' },
    { index: 9, path: '/financialtool/app/analytics', icon: AnalyticsIcon, label: 'Analytics' },
    { index: 10, path: '/financialtool/app/advanced-analytics', icon: BarChartIcon, label: 'Advanced Analytics' },
    { index: 11, path: '/financialtool/app/family', icon: FamilyRestroomIcon, label: 'Family' },
    { index: 12, path: '/financialtool/app/budgets', icon: AccountBalanceWalletOutlinedIcon, label: 'Budgets' },
    { index: 13, path: '/financialtool/app/savings', icon: SavingsIcon, label: 'Savings' },
    { index: 14, path: '/financialtool/app/loans', icon: CreditCardIcon, label: 'Loans' },
    { index: 15, path: '/financialtool/app/shopping-lists', icon: ShoppingCartIcon, label: 'Shopping Lists' },
    { index: 16, path: '/financialtool/app/user-profile', icon: PersonIcon, label: 'User Profile' },
    { index: 17, path: '/financialtool/app/users', icon: PeopleIcon, label: 'Users' },
    { index: 18, path: '/financialtool/app/alerts', icon: NotificationsIcon, label: 'Alerts' },
    { index: 19, path: '/financialtool/app/ai-chat', icon: ChatIcon, label: 'AI Chat' },
    { index: 20, path: '/financialtool/app/model-status', icon: MemoryIcon, label: 'Model Status' },
  ];

  const handleNavClick = (index: number, path: string) => {
    setValue(index);
    navigate(path);
  };

  return (
    <Box
      sx={{
        display: { xs: 'flex', lg: 'flex' },
        flexDirection: { xs: 'row', lg: 'column' },
        gap: 0.5,
        overflowX: { xs: 'auto', lg: 'hidden' },
        overflowY: { xs: 'visible', lg: 'auto' },
        pb: { xs: 1, lg: 0 },
        maxHeight: { lg: 'calc(100vh - 200px)' },
        width: { lg: '64px' },
        minWidth: { lg: '64px' },
        maxWidth: { lg: '64px' },
        scrollbarWidth: 'thin',
        scrollbarColor: `${theme.palette.mode === 'dark' ? '#374151' : '#D1D5DB'} transparent`,
        '&::-webkit-scrollbar': {
          width: '4px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: theme.palette.mode === 'dark' ? '#374151' : '#D1D5DB',
          borderRadius: '2px',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: theme.palette.mode === 'dark' ? '#4B5563' : '#9CA3AF',
        },
      }}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.index;
        
        if (item.index === 0 || item.index === 1) {
          // Use Link for dashboard and upload
          return (
            <Box
              key={item.index}
              component={Link}
              to={item.path}
              onClick={() => setValue(item.index)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                p: 1.5,
                borderRadius: '12px',
                width: { lg: '56px' },
                minWidth: { lg: '56px' },
                height: { lg: '56px' },
                bgcolor: isActive ? '#6D28D9' : 'transparent',
                color: isActive ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                textDecoration: 'none',
                '&:hover': {
                  bgcolor: isActive ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
                },
              }}
            >
              <Icon sx={{ fontSize: { lg: '20px' } }} />
              <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>{item.label}</Typography>
            </Box>
          );
        }
        
        // Use IconButton for others
        return (
          <IconButton
            key={item.index}
            onClick={() => handleNavClick(item.index, item.path)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              p: 1.5,
              borderRadius: '12px',
              width: { lg: '56px' },
              minWidth: { lg: '56px' },
              height: { lg: '56px' },
              bgcolor: isActive ? '#6D28D9' : 'transparent',
              color: isActive ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
              '&:hover': {
                bgcolor: isActive ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
              },
            }}
          >
            <Icon sx={{ fontSize: { lg: '20px' } }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, lineHeight: 1.2, textAlign: 'center' }}>{item.label}</Typography>
          </IconButton>
        );
      })}
    </Box>
  );
}


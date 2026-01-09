import { IconButton, Typography } from '@mui/material';
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

  const scrollbarColor = theme.palette.mode === 'dark' ? '#374151' : '#D1D5DB';
  const scrollbarHoverColor = theme.palette.mode === 'dark' ? '#4B5563' : '#9CA3AF';

  return (
    <>
      <style>{`
        .left-sidebar-nav {
          display: flex;
          flex-direction: column;
          height: 100%;
          gap: 4px;
          overflow-x: hidden;
          overflow-y: auto;
          padding-bottom: 8px;
          padding-left: 4px;
          padding-right: 0px;
          padding-top: 8px;
          width: 84px;
          min-width: 84px;
          max-width: 84px;
          box-sizing: border-box;
          scrollbar-width: thin;
          scrollbar-color: ${scrollbarColor} transparent;
        }
        .left-sidebar-nav::-webkit-scrollbar {
          width: 1px;
        }
        .left-sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        .left-sidebar-nav::-webkit-scrollbar-thumb {
          background: ${scrollbarColor};
          border-radius: 2px;
        }
        .left-sidebar-nav::-webkit-scrollbar-thumb:hover {
          background: ${scrollbarHoverColor};
        }
        .sidebar-nav-item {
          transition: background-color 0.2s ease;
          cursor: pointer;
          flex-shrink: 0;
        }
        .sidebar-nav-item:hover:not(.active) {
          background-color: ${theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'} !important;
        }
        .sidebar-nav-item.active:hover {
          background-color: #7C3AED !important;
        }
        
        /* Mobile: Horizontal layout only when container is full width */
        @media (max-width: 767px) {
          .left-sidebar-nav {
            flex-direction: row;
            overflow-x: auto;
            overflow-y: hidden;
            width: 100%;
            min-width: 100%;
            max-width: 100%;
            height: auto;
            padding-bottom: 8px;
            padding-top: 8px;
            padding-left: 8px;
            padding-right: 8px;
          }
        }
      `}</style>
      <div className="left-sidebar-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = value === item.index;
        
        if (item.index === 0 || item.index === 1) {
          // Use Link for dashboard and upload
          return (
            <Link
              key={item.index}
              to={item.path}
              onClick={() => setValue(item.index)}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                paddingLeft: '0px',
                paddingRight: '0px',
                paddingTop: '12px',
                paddingBottom: '4px',
                borderRadius: '12px',
                width: '56px',
                minWidth: '56px',
                maxWidth: '56px',
                height: 'auto',
                minHeight: '56px',
                backgroundColor: isActive ? '#6D28D9' : 'transparent',
                color: isActive ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <Icon sx={{ fontSize: { lg: '20px' } }} />
              <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, mb: 0, px: 0.5, lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{item.label}</Typography>
            </Link>
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
              paddingLeft: '0px',
              paddingRight: '0px',
              paddingTop: '12px',
              paddingBottom: '4px',
              borderRadius: '12px',
              width: '56px',
              minWidth: '56px',
              maxWidth: '56px',
              height: 'auto',
              minHeight: '56px',
              flexShrink: 0,
              bgcolor: isActive ? '#6D28D9' : 'transparent',
              color: isActive ? '#FFFFFF' : (theme.palette.mode === 'dark' ? '#9CA3AF' : '#6B7280'),
              '&:hover': {
                bgcolor: isActive ? '#7C3AED' : (theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6'),
              },
            }}
          >
            <Icon sx={{ fontSize: { lg: '20px' } }} />
            <Typography sx={{ fontSize: '10px', fontWeight: 500, mt: 0.5, mb: 0, px: 0.5, lineHeight: 1.2, textAlign: 'center', wordBreak: 'break-word' }}>{item.label}</Typography>
          </IconButton>
        );
      })}
    </div>
    </>
  );
}


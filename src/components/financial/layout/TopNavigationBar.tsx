import { IconButton, Avatar, Typography, TextField, Badge, Button, Menu, MenuItem, Divider } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useAuth } from '../../../lib/auth';
import { useTheme } from '../../../contexts/ThemeContext';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import { useState } from 'react';
import EnergyPointsBalance from '../../common/EnergyPointsBalance';

interface TopNavigationBarProps {
  // No props needed as it uses hooks internally
}

export default function TopNavigationBar({}: TopNavigationBarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const { toggleTheme } = useTheme();
  const displayUser = user || authUser;
  const userName = displayUser?.name || displayUser?.email || 'Alexander Hunt';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const [searchValue, setSearchValue] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);
  const isVerified = displayUser?.isEmailVerified || true; // Default to true for demo

  // Format name: "Alexander Hunt" or use first part of email
  const displayName = displayUser?.name || (displayUser?.email ? displayUser.email.split('@')[0].split('.').map((n: string) => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') : 'Alexander Hunt');

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleSignOut = async () => {
    handleMenuClose();
    await signOut();
    navigate('/auth/login');
  };

  const handleSignIn = () => {
    handleMenuClose();
    navigate('/auth/login');
  };

  return (
    <nav
      style={{
        backgroundColor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: 'none',
      }}
    >
      <div style={{ 
        maxWidth: '1600px', 
        margin: '0 auto', 
        paddingLeft: '24px',
        paddingRight: '24px',
        height: '72px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: '16px',
      }}>
        {/* Logo and Brand Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 'fit-content' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#6D28D9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountBalanceWalletIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
          </div>
          <Typography sx={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            letterSpacing: '-0.02em', 
            color: '#000000',
            fontFamily: "'Inter', sans-serif",
          }}>
            Fiscally
          </Typography>
        </div>

        {/* Search Bar */}
        <div style={{ 
          flex: 1, 
          maxWidth: '600px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <div style={{
            position: 'relative',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
          }}>
            <SearchIcon sx={{ 
              position: 'absolute', 
              left: 16, 
              color: '#9CA3AF',
              fontSize: 20,
              zIndex: 1,
            }} />
            <TextField
              fullWidth
              placeholder="Search transactions or features..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: '#F3F4F6',
                  borderRadius: '8px',
                  height: '44px',
                  pl: 6,
                  pr: 10,
                  '& fieldset': {
                    border: 'none',
                  },
                  '&:hover': {
                    bgcolor: '#E5E7EB',
                  },
                  '&.Mui-focused': {
                    bgcolor: '#FFFFFF',
                    boxShadow: '0 0 0 2px rgba(109, 40, 217, 0.1)',
                  },
                },
                '& .MuiInputBase-input': {
                  fontSize: '14px',
                  color: '#111827',
                  fontFamily: "'Inter', sans-serif",
                  '&::placeholder': {
                    color: '#9CA3AF',
                    opacity: 1,
                  },
                },
              }}
            />
            <Button
              sx={{
                position: 'absolute',
                right: 6,
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                bgcolor: '#E5E7EB',
                borderRadius: '6px',
                fontSize: '12px',
                color: '#6B7280',
                fontFamily: "'Inter', sans-serif",
                fontWeight: 500,
                textTransform: 'none',
                height: '28px',
                '&:hover': {
                  bgcolor: '#D1D5DB',
                },
              }}
            >
              ⌘ K
            </Button>
          </div>
        </div>

        {/* Action Icons and User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 'fit-content' }}>
          {/* Energy Points */}
          <EnergyPointsBalance showLabel={false} />
          
          {/* Notification Bell */}
          <IconButton
            sx={{
              p: 1,
              '&:hover': { bgcolor: '#F3F4F6' },
              borderRadius: '50%',
            }}
          >
            <Badge 
              badgeContent={1} 
              color="error"
              sx={{
                '& .MuiBadge-badge': {
                  width: 8,
                  height: 8,
                  minWidth: 8,
                  padding: 0,
                },
              }}
            >
              <NotificationsIcon sx={{ color: '#4B5563', fontSize: 22 }} />
            </Badge>
          </IconButton>

          {/* Dark Mode Toggle */}
          <IconButton
            onClick={toggleTheme}
            sx={{
              p: 1,
              '&:hover': { bgcolor: '#F3F4F6' },
              borderRadius: '50%',
            }}
          >
            <DarkModeIcon sx={{ color: '#4B5563', fontSize: 22 }} />
          </IconButton>

          {/* Help Icon */}
          <IconButton
            sx={{
              p: 1,
              '&:hover': { bgcolor: '#F3F4F6' },
              borderRadius: '50%',
            }}
          >
            <HelpOutlineIcon sx={{ color: '#4B5563', fontSize: 22 }} />
          </IconButton>

          {/* Divider */}
          <div style={{ 
            width: '1px', 
            height: '32px', 
            backgroundColor: '#E5E7EB',
            marginLeft: '4px',
            marginRight: '4px',
          }} />

          {/* User Profile Section */}
          {displayUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Typography sx={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#000000',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {displayName}
                  </Typography>
                  {isVerified && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CheckIcon sx={{ 
                        color: '#FFFFFF', 
                        fontSize: 10,
                      }} />
                    </div>
                  )}
                </div>
                {isVerified && (
                  <Typography sx={{ 
                    fontSize: '10px', 
                    color: '#9CA3AF', 
                    fontWeight: 500, 
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    VERIFIED ACCOUNT
                  </Typography>
                )}
              </div>
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: '#E5E7EB',
                  color: '#6B7280',
                  fontWeight: 600,
                  fontSize: '14px',
                  fontFamily: "'Inter', sans-serif",
                }}
              >
                {userInitials}
              </Avatar>
              <IconButton
                onClick={handleMenuClick}
                sx={{
                  p: 0.5,
                  '&:hover': { bgcolor: 'transparent' },
                }}
                aria-controls={isMenuOpen ? 'user-menu' : undefined}
                aria-haspopup="true"
                aria-expanded={isMenuOpen ? 'true' : undefined}
              >
                <KeyboardArrowDownIcon sx={{ color: '#6B7280', fontSize: 20 }} />
              </IconButton>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Button
                onClick={() => navigate('/auth/signup')}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4B5563',
                  '&:hover': {
                    color: '#6D28D9',
                    bgcolor: '#F3F4F6',
                  },
                }}
              >
                Sign up
              </Button>
              <Button
                onClick={handleSignIn}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#4B5563',
                  '&:hover': {
                    color: '#6D28D9',
                    bgcolor: '#F3F4F6',
                  },
                }}
              >
                Sign in
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* User Menu Dropdown */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 8,
          sx: {
            mt: 1.5,
            minWidth: 200,
            borderRadius: '8px',
            border: '1px solid #E5E7EB',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            '& .MuiMenuItem-root': {
              fontSize: '14px',
              fontFamily: "'Inter', sans-serif",
              px: 2,
              py: 1.5,
              '&:hover': {
                bgcolor: '#F3F4F6',
              },
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={handleMenuClose} disabled>
          <PersonIcon sx={{ mr: 1.5, fontSize: 18, color: '#6B7280' }} />
          <Typography sx={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
            {displayName}
          </Typography>
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={handleSignOut}>
          <LogoutIcon sx={{ mr: 1.5, fontSize: 18, color: '#6B7280' }} />
          <Typography sx={{ fontSize: '14px', color: '#DC2626' }}>
            Sign Out
          </Typography>
        </MenuItem>
      </Menu>
    </nav>
  );
}


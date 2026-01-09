import { Box, IconButton, Avatar, Typography, TextField, Badge, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useAuth } from '../../../lib/auth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import NotificationsIcon from '@mui/icons-material/Notifications';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SearchIcon from '@mui/icons-material/Search';
import CheckIcon from '@mui/icons-material/Check';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useState } from 'react';

interface TopNavigationBarProps {
  // No props needed as it uses hooks internally
}

export default function TopNavigationBar({}: TopNavigationBarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const displayUser = user || authUser;
  const userName = displayUser?.name || displayUser?.email || 'Alexander Hunt';
  const userInitials = userName.slice(0, 2).toUpperCase();
  const [searchValue, setSearchValue] = useState('');
  const isVerified = displayUser?.isEmailVerified || true; // Default to true for demo

  // Format name: "Alexander Hunt" or use first part of email
  const displayName = displayUser?.name || (displayUser?.email ? displayUser.email.split('@')[0].split('.').map((n: string) => n.charAt(0).toUpperCase() + n.slice(1)).join(' ') : 'Alexander Hunt');

  return (
    <Box
      component="nav"
      sx={{
        bgcolor: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        borderBottom: 'none',
      }}
    >
      <Box sx={{ 
        maxWidth: '1600px', 
        mx: 'auto', 
        px: 3, 
        height: 72, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        gap: 2,
      }}>
        {/* Logo and Brand Name */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 'fit-content' }}>
          <Box
            sx={{
              width: 40,
              height: 40,
              bgcolor: '#6D28D9',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AccountBalanceWalletIcon sx={{ color: '#FFFFFF', fontSize: 24 }} />
          </Box>
          <Typography sx={{ 
            fontSize: '20px', 
            fontWeight: 700, 
            letterSpacing: '-0.02em', 
            color: '#000000',
            fontFamily: "'Inter', sans-serif",
          }}>
            Fiscally
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ 
          flex: 1, 
          maxWidth: '600px',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
        }}>
          <Box sx={{
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
          </Box>
        </Box>

        {/* Action Icons and User Profile */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 'fit-content' }}>
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
            onClick={() => {
              const html = document.documentElement;
              html.classList.toggle('dark');
            }}
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
          <Box sx={{ 
            width: '1px', 
            height: '32px', 
            bgcolor: '#E5E7EB',
            mx: 0.5,
          }} />

          {/* User Profile Section */}
          {displayUser ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Typography sx={{ 
                    fontSize: '14px', 
                    fontWeight: 700, 
                    color: '#000000',
                    fontFamily: "'Inter', sans-serif",
                  }}>
                    {displayName}
                  </Typography>
                  {isVerified && (
                    <Box sx={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: '#3B82F6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <CheckIcon sx={{ 
                        color: '#FFFFFF', 
                        fontSize: 10,
                      }} />
                    </Box>
                  )}
                </Box>
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
              </Box>
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
                onClick={() => {
                  // Handle dropdown menu
                  signOut();
                  navigate('/auth/login');
                }}
                sx={{
                  p: 0.5,
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                <KeyboardArrowDownIcon sx={{ color: '#6B7280', fontSize: 20 }} />
              </IconButton>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
                onClick={() => navigate('/auth/login')}
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
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}


import { Box, Button, IconButton, Avatar, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import { useAuth } from '../../../lib/auth';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import EnergyPointsBalance from '../../common/EnergyPointsBalance';

interface TopNavigationBarProps {
  // No props needed as it uses hooks internally
}

export default function TopNavigationBar({}: TopNavigationBarProps) {
  const { user } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  const navigate = useNavigate();
  const { user: authUser, signOut } = useAuth();
  const displayUser = user || authUser;
  const userName = displayUser?.name || displayUser?.email || 'User';
  const userInitials = userName.slice(0, 2).toUpperCase();

  return (
    <Box
      component="nav"
      sx={{
        borderBottom: `1px solid ${theme.palette.mode === 'dark' ? '#1F2937' : '#E5E7EB'}`,
        bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <Box sx={{ maxWidth: '1600px', mx: 'auto', px: 3, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#6D28D9',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AccountBalanceWalletIcon sx={{ color: '#FFFFFF', fontSize: 20 }} />
            </Box>
            <Typography sx={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: theme.palette.text.primary }}>
              VoiceCrypt.ai
            </Typography>
          </Box>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 6 }}>
            <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
              Products
            </Button>
            <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
              Tools
            </Button>
            <Button sx={{ textTransform: 'none', fontSize: '14px', fontWeight: 500, color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563', '&:hover': { color: '#6D28D9' } }}>
              Pricing
            </Button>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', lg: 'flex' }, alignItems: 'center', bgcolor: theme.palette.mode === 'dark' ? '#1F2937' : '#F3F4F6', px: 1.5, py: 0.75, borderRadius: '9999px' }}>
            <EnergyPointsBalance showLabel={false} />
          </Box>
          <IconButton
            onClick={() => {
              const html = document.documentElement;
              html.classList.toggle('dark');
            }}
            sx={{
              p: 1,
              '&:hover': { bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6' },
              borderRadius: '50%',
            }}
          >
            <DarkModeIcon sx={{ color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563' }} />
          </IconButton>
          {displayUser ? (
            <>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: `1px solid ${theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB'}`, ml: 1, pl: 3 }}>
                <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                  <Typography sx={{ fontSize: '14px', fontWeight: 600, color: theme.palette.text.primary }}>
                    {userName.split('@')[0]}
                  </Typography>
                  {displayUser.isEmailVerified && (
                    <Typography sx={{ fontSize: '10px', color: '#10B981', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Verified
                    </Typography>
                  )}
                </Box>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#E5E7EB',
                    color: '#6D28D9',
                    fontWeight: 700,
                  }}
                >
                  {userInitials}
                </Avatar>
              </Box>
              <Button
                onClick={() => {
                  signOut();
                  navigate('/auth/login');
                }}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                  '&:hover': {
                    color: '#6D28D9',
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                  },
                }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => navigate('/auth/signup')}
                sx={{
                  textTransform: 'none',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                  '&:hover': {
                    color: '#6D28D9',
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
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
                  color: theme.palette.mode === 'dark' ? '#9CA3AF' : '#4B5563',
                  '&:hover': {
                    color: '#6D28D9',
                    bgcolor: theme.palette.mode === 'dark' ? '#374151' : '#F3F4F6',
                  },
                }}
              >
                Sign in
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}


import { useState, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useTheme } from '../../../contexts/ThemeContext';
import { AccountBalanceWallet, Lock, AttachMoney, ReceiptLong, TrendingUp, Lightbulb } from '@mui/icons-material';
import '../../../css/components/SkeletonLoading.css';

const financialTips = [
  '"An investment in knowledge pays the best interest." — Benjamin Franklin',
  '"Do not save what is left after spending, but spend what is left after saving." — Warren Buffett',
  '"Beware of little expenses; a small leak will sink a great ship." — Benjamin Franklin',
  '"The goal isn\'t more money. The goal is living life on your terms." — Chris Brogan',
  '"Rich people have small TVs and big libraries, and poor people have small libraries and big TVs."',
];

export default function InitialLoadingScreen() {
  const { theme } = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [progress, setProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);

  useEffect(() => {
    // Progress bar simulation
    const updateProgress = () => {
      setProgress((prev) => {
        if (prev < 100) {
          const newProgress = prev + Math.random() * 8;
          const finalProgress = newProgress > 100 ? 100 : newProgress;
          if (finalProgress < 100) {
            setTimeout(updateProgress, 600 + Math.random() * 400);
          }
          return finalProgress;
        }
        return prev;
      });
    };

    const timer = setTimeout(updateProgress, 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Rotate tips every 5 seconds
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % financialTips.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: isDark ? '#0f172a' : '#f9fafb',
        fontFamily: "'Inter', sans-serif",
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* Logo */}
      <Box
        sx={{
          position: 'fixed',
          top: 48,
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          opacity: 0.9,
        }}
      >
        <Box
          sx={{
            bgcolor: '#6366f1',
            p: 1,
            borderRadius: '12px',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AccountBalanceWallet sx={{ fontSize: '24px' }} />
        </Box>
        <Typography
          sx={{
            fontSize: '24px',
            fontWeight: 600,
            letterSpacing: '-0.025em',
            color: isDark ? '#ffffff' : '#0f172a',
          }}
        >
          Fiscally
        </Typography>
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          maxWidth: '448px',
          px: 3,
        }}
      >
        {/* Lock Icon with Animation */}
        <Box
          sx={{
            position: 'relative',
            width: '128px',
            height: '128px',
            mb: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.1)',
              borderRadius: '50%',
              filter: 'blur(48px)',
              animation: 'pulse-soft 2s ease-in-out infinite',
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 10,
              bgcolor: isDark ? '#1e293b' : '#ffffff',
              p: 3,
              borderRadius: '24px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
            }}
          >
            <Lock sx={{ fontSize: '48px', color: '#6366f1' }} />
          </Box>

          {/* Floating Icons */}
          <Box
            sx={{
              position: 'absolute',
              top: -32,
              display: 'flex',
              gap: 2,
            }}
          >
            <Box
              sx={{
                animation: 'flow-in 2s ease-in-out infinite',
                animationDelay: '0s',
              }}
            >
              <AttachMoney
                sx={{
                  fontSize: '18px',
                  color: isDark ? 'rgba(99, 102, 241, 0.8)' : 'rgba(99, 102, 241, 0.6)',
                }}
              />
            </Box>
            <Box
              sx={{
                animation: 'flow-in 2s ease-in-out infinite',
                animationDelay: '0.4s',
              }}
            >
              <ReceiptLong
                sx={{
                  fontSize: '18px',
                  color: isDark ? 'rgba(99, 102, 241, 0.6)' : 'rgba(99, 102, 241, 0.4)',
                }}
              />
            </Box>
            <Box
              sx={{
                animation: 'flow-in 2s ease-in-out infinite',
                animationDelay: '0.8s',
              }}
            >
              <TrendingUp
                sx={{
                  fontSize: '18px',
                  color: isDark ? 'rgba(99, 102, 241, 0.7)' : 'rgba(99, 102, 241, 0.5)',
                }}
              />
            </Box>
          </Box>
        </Box>

        {/* Progress Bar */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              mb: 0.5,
            }}
          >
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: isDark ? '#64748b' : '#94a3b8',
              }}
            >
              Securing your data
            </Typography>
            <Typography
              sx={{
                fontSize: '12px',
                fontWeight: 600,
                color: '#6366f1',
              }}
            >
              {Math.floor(progress)}%
            </Typography>
          </Box>
          <Box
            sx={{
              width: '100%',
              height: '6px',
              bgcolor: isDark ? '#1e293b' : '#e2e8f0',
              borderRadius: '9999px',
              overflow: 'hidden',
            }}
          >
            <Box
              className="shimmer-bg progress-glow"
              sx={{
                height: '100%',
                bgcolor: '#6366f1',
                borderRadius: '9999px',
                transition: 'width 0.5s ease-out',
                width: `${progress}%`,
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Financial Wisdom */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 64,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          px: 4,
        }}
      >
        <Box
          sx={{
            maxWidth: '384px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            animation: 'fade-in-up 0.5s ease-out forwards',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1.5 }}>
            <Lightbulb
              sx={{
                fontSize: '20px',
                color: isDark ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.6)',
              }}
            />
          </Box>
          <Typography
            sx={{
              fontSize: '12px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.2em',
              color: isDark ? '#64748b' : '#94a3b8',
            }}
          >
            Financial Wisdom
          </Typography>
          <Typography
            key={currentTip}
            sx={{
              fontSize: '14px',
              fontWeight: 300,
              lineHeight: 1.75,
              color: isDark ? '#94a3b8' : '#475569',
              transition: 'opacity 0.5s',
            }}
          >
            {financialTips[currentTip]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}


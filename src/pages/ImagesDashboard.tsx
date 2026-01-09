import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, useMediaQuery, Button, ButtonGroup, Box, IconButton } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import ImageGenerationPage from './tools/ImageGenerationPage';
import ImageTrainingPage from './tools/ImageTrainingPage';
import ImageCaptioningPage from './tools/ImageCaptioningPage';
import ImageEditingPage from './tools/ImageEditingPage';
import { ImageHistory } from '../components/image/ImageHistory';
import { CaptioningHistory } from '../components/image/CaptioningHistory';
import { EditHistory } from '../components/image/EditHistory';
import { TrainingHistory } from '../components/image/TrainingHistory';
import '../css/pages/Dashboard.css';

export default function ImagesDashboard() {
  const { theme } = useTheme();
  const location = useLocation();
  const [activeMobileTab, setActiveMobileTab] = useState<'tool' | 'history'>('tool');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Detect if we're on a small screen - using custom breakpoint to include 981.60px viewport
  // Toggle buttons show when viewport width is <= 982px
  const isSmallScreen = useMediaQuery('(max-width: 982px)');
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Only show toggle buttons on small screens, and only when on image tool routes
  const showToggleButtons = isSmallScreen && (
    location.pathname.startsWith('/images/generate') ||
    location.pathname.startsWith('/images/caption') ||
    location.pathname.startsWith('/images/edit') ||
    location.pathname.startsWith('/images/train') ||
    location.pathname === '/images' ||
    location.pathname === '/images/'
  );
  
  // Reset active tab when screen expands to large size (both sections visible)
  useEffect(() => {
    if (!isSmallScreen) {
      setActiveMobileTab('tool');
    }
  }, [isSmallScreen]);
  
  const isImageGenerationRoute = location.pathname.includes('generate') || location.pathname === '/images' || location.pathname === '/images/';
  const isCaptioningRoute = location.pathname.includes('caption');
  const isEditingRoute = location.pathname.includes('edit');
  const isTrainingRoute = location.pathname.includes('train');
  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper">
        {/* Mobile Hamburger Menu Button */}
        {isMobile && (
          <IconButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            sx={{
              position: 'fixed',
              top: 16,
              left: 16,
              zIndex: 1301,
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: `1px solid ${theme.palette.divider}`,
              boxShadow: theme.shadows[2],
              '&:hover': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 1)' : 'rgba(255, 255, 255, 1)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        )}
        
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="dashboard-main-layout">
          {/* Mobile Toggle Buttons - Only visible on small screens and when on image tool routes */}
          {showToggleButtons && (
            <Box
              sx={{
                display: isSmallScreen ? 'flex' : 'none',
                justifyContent: 'center',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                width: '100%',
                position: 'sticky',
                top: 0,
                zIndex: 10,
                backgroundColor: theme.palette.mode === 'dark' ? '#000000' : '#ffffff',
                padding: '0.5rem 0',
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <ButtonGroup
                variant="outlined"
                aria-label="Tool and History toggle"
                sx={{
                  maxWidth: '300px',
                  '& .MuiButton-root': {
                    flex: 1,
                    fontSize: '0.875rem',
                    fontWeight: 500,
                    textTransform: 'none',
                    borderColor: theme.palette.divider,
                    color: theme.palette.text.primary,
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                      backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  },
                }}
              >
                <Button
                  onClick={() => setActiveMobileTab('tool')}
                  variant={activeMobileTab === 'tool' ? 'contained' : 'outlined'}
                  sx={{
                    backgroundColor: activeMobileTab === 'tool' ? theme.palette.primary.main : 'transparent',
                    color: activeMobileTab === 'tool' ? '#ffffff' : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: activeMobileTab === 'tool' ? theme.palette.primary.dark : theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  }}
                >
                  Tool
                </Button>
                <Button
                  onClick={() => setActiveMobileTab('history')}
                  variant={activeMobileTab === 'history' ? 'contained' : 'outlined'}
                  sx={{
                    backgroundColor: activeMobileTab === 'history' ? theme.palette.primary.main : 'transparent',
                    color: activeMobileTab === 'history' ? '#ffffff' : theme.palette.text.primary,
                    '&:hover': {
                      backgroundColor: activeMobileTab === 'history' ? theme.palette.primary.dark : theme.palette.mode === 'dark' ? '#1a1a1a' : '#f3f4f6',
                    },
                  }}
                >
                  History
                </Button>
              </ButtonGroup>
            </Box>
          )}

          <div 
            className="tool-wrapper"
            style={{
              display: showToggleButtons && activeMobileTab !== 'tool' ? 'none' : 'flex',
            }}
          >
            <div className="tool-container">
              <ThemeProvider theme={theme}>
                <CssBaseline />
                <Routes>
                  <Route path="/" element={<Navigate to="/images/generate" replace />} />
                  {/* Image Tools */}
                  <Route path="generate" element={<ImageGenerationPage />} />
                  <Route path="train" element={<ImageTrainingPage />} />
                  <Route path="caption" element={<ImageCaptioningPage />} />
                  <Route path="edit" element={<ImageEditingPage />} />
                  <Route path="*" element={<Navigate to="/images/generate" replace />} />
                </Routes>
              </ThemeProvider>
            </div>
          </div>
          
          {/* Image History Section - Right Side (only for image generation route) */}
          {isImageGenerationRoute && (
            <div
              style={{
                display: showToggleButtons && activeMobileTab !== 'history' ? 'none' : 'block',
              }}
            >
              <ImageHistory />
            </div>
          )}
          
          {/* Captioning History Section - Right Side (only for captioning route) */}
          {isCaptioningRoute && (
            <div
              style={{
                display: showToggleButtons && activeMobileTab !== 'history' ? 'none' : 'block',
              }}
            >
              <CaptioningHistory />
            </div>
          )}
          
          {/* Edit History Section - Right Side (only for editing route) */}
          {isEditingRoute && (
            <div
              style={{
                display: showToggleButtons && activeMobileTab !== 'history' ? 'none' : 'block',
              }}
            >
              <EditHistory />
            </div>
          )}
          
          {/* Training History Section - Right Side (only for training route) */}
          {isTrainingRoute && (
            <div
              style={{
                display: showToggleButtons && activeMobileTab !== 'history' ? 'none' : 'block',
              }}
            >
              <TrainingHistory />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


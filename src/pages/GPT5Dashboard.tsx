import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { useMediaQuery, IconButton } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import MenuIcon from '@mui/icons-material/Menu';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import GPT5Page from './tools/GPT5Page';
import '../pages/Dashboard.css';

export default function GPT5Dashboard() {
  const { theme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper full-width">
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
        <div className="tools-main-content">
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <Routes>
              <Route path="/" element={<GPT5Page />} />
              <Route path="*" element={<Navigate to="/gpt5" replace />} />
            </Routes>
          </ThemeProvider>
        </div>
      </div>
    </div>
  );
}

















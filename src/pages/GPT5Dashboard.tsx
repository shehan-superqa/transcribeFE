import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import GPT5Page from './tools/GPT5Page';
import './ToolsDashboard.css';

export default function GPT5Dashboard() {
  const { theme } = useTheme();
  
  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar />
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









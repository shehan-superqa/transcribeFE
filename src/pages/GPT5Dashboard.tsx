import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import GPT5Page from './tools/GPT5Page';
import '../pages/Dashboard.css';

export default function GPT5Dashboard() {
  const { theme } = useTheme();
  
  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper full-width">
        {/* Sidebar Navigation - Uses Header's drawer icon state */}
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









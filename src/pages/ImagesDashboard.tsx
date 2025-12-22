import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
import Sidebar from '../components/Sidebar';
import ImageGenerationPage from './tools/ImageGenerationPage';
import ImageTrainingPage from './tools/ImageTrainingPage';
import ImageCaptioningPage from './tools/ImageCaptioningPage';
import ImageEditingPage from './tools/ImageEditingPage';
import './ToolsDashboard.css';

export default function ImagesDashboard() {
  const { theme } = useTheme();
  
  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar />
        <div className="tools-main-content">
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
    </div>
  );
}


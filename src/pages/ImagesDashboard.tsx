import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from '../components/Sidebar';
import ImageGenerationPage from './tools/ImageGenerationPage';
import ImageTrainingPage from './tools/ImageTrainingPage';
import ImageCaptioningPage from './tools/ImageCaptioningPage';
import ImageEditingPage from './tools/ImageEditingPage';
import './ToolsDashboard.css';

// Create Material-UI dark theme matching Dashboard colors
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00c6ff',
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#a0a0a0',
    },
    divider: '#333333',
  },
});

export default function ImagesDashboard() {
  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar />
        <div className="tools-main-content">
          <ThemeProvider theme={darkTheme}>
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


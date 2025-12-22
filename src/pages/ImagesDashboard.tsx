import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from '../components/Sidebar';
import ImageGenerationPage from './tools/ImageGenerationPage';
import ImageTrainingPage from './tools/ImageTrainingPage';
import ImageCaptioningPage from './tools/ImageCaptioningPage';
import ImageEditingPage from './tools/ImageEditingPage';
import { ImageHistory } from '../components/image/ImageHistory';
import { CaptioningHistory } from '../components/image/CaptioningHistory';
import { EditHistory } from '../components/image/EditHistory';
import { TrainingHistory } from '../components/image/TrainingHistory';
import '../pages/Dashboard.css';

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
  const location = useLocation();
  const isImageGenerationRoute = location.pathname.includes('generate') || location.pathname === '/images' || location.pathname === '/images/';
  const isCaptioningRoute = location.pathname.includes('caption');
  const isEditingRoute = location.pathname.includes('edit');
  const isTrainingRoute = location.pathname.includes('train');

  return (
    <div className="dashboard-container">
      <div className="dashboard-content-wrapper">
        <Sidebar />
        <div className="dashboard-main-layout">
          <div className="tool-wrapper">
            <div className="tool-container">
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
          
          {/* Image History Section - Right Side (only for image generation route) */}
          {isImageGenerationRoute && <ImageHistory />}
          
          {/* Captioning History Section - Right Side (only for captioning route) */}
          {isCaptioningRoute && <CaptioningHistory />}
          
          {/* Edit History Section - Right Side (only for editing route) */}
          {isEditingRoute && <EditHistory />}
          
          {/* Training History Section - Right Side (only for training route) */}
          {isTrainingRoute && <TrainingHistory />}
        </div>
      </div>
    </div>
  );
}


import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Sidebar from '../components/Sidebar';
import VideoToTextPage from './tools/VideoToTextPage';
import VideoGenerationPage from './tools/VideoGenerationPage';
import VideoDubberPage from './tools/VideoDubberPage';
import VideoTranslatorPage from './tools/VideoTranslatorPage';
import SubtitleGeneratorPage from './tools/SubtitleGeneratorPage';
import VideoAdsPage from './tools/VideoAdsPage';
import FreeToolsPage from './tools/FreeToolsPage';
import LiveTranscribePage from './tools/LiveTranscribePage';
import WebCaptionerPage from './tools/WebCaptionerPage';
import RealTimeTranslatorPage from './tools/RealTimeTranslatorPage';
import LiveVoiceTranslatorPage from './tools/LiveVoiceTranslatorPage';
import TextToVideoTab, { VideoHistory } from '../components/video/TextToVideoTab';
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

export default function ToolsDashboard() {
  const location = useLocation();
  const isTextToVideoRoute = location.pathname.includes('text-to-video') || location.pathname === '/video' || location.pathname === '/video/';

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
                  <Route path="/" element={<Navigate to="/video/text-to-video" replace />} />
                  {/* Video Tools */}
                  <Route path="text-to-video" element={<TextToVideoTab />} />
                  <Route path="ads" element={<VideoAdsPage />} />
                  <Route path="to-text" element={<VideoToTextPage />} />
                  <Route path="dubber" element={<VideoDubberPage />} />
                  <Route path="translator" element={<VideoTranslatorPage />} />
                  <Route path="subtitle-generator" element={<SubtitleGeneratorPage />} />
                  {/* Legacy routes - redirect to new paths */}
                  <Route path="video-generation" element={<Navigate to="/video/text-to-video" replace />} />
                  <Route path="video-dubber" element={<Navigate to="/video/dubber" replace />} />
                  <Route path="video-translator" element={<Navigate to="/video/translator" replace />} />
                  <Route path="*" element={<Navigate to="/video/text-to-video" replace />} />
                </Routes>
              </ThemeProvider>
            </div>
          </div>
          
          {/* Video History Section - Right Side (only for text-to-video route) */}
          {isTextToVideoRoute && <VideoHistory />}
        </div>
      </div>
    </div>
  );
}


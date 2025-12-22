import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from '../contexts/ThemeContext';
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
import TextToVideoTab from '../components/video/TextToVideoTab';
import './ToolsDashboard.css';

export default function ToolsDashboard() {
  const { theme } = useTheme();
  
  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar />
        <div className="tools-main-content">
          <ThemeProvider theme={theme}>
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
    </div>
  );
}


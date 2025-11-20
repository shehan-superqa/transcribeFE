import { useState, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import RealTimeTools from '../components/RealTimeTools';
import AudioToTextPage from './tools/AudioToTextPage';
import VideoToTextPage from './tools/VideoToTextPage';
import VideoDubberPage from './tools/VideoDubberPage';
import VideoTranslatorPage from './tools/VideoTranslatorPage';
import AudioTranslatorPage from './tools/AudioTranslatorPage';
import SubtitleGeneratorPage from './tools/SubtitleGeneratorPage';
import FreeToolsPage from './tools/FreeToolsPage';
import LiveTranscribePage from './tools/LiveTranscribePage';
import WebCaptionerPage from './tools/WebCaptionerPage';
import RealTimeTranslatorPage from './tools/RealTimeTranslatorPage';
import LiveVoiceTranslatorPage from './tools/LiveVoiceTranslatorPage';
import './ToolsDashboard.css';

export default function ToolsDashboard() {
  const [showRealTimeTools, setShowRealTimeTools] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Hide Real-Time tools when on a sub-page
    const isRealTimeSubPage = location.pathname.includes('/tools/live-transcribe') || 
                              location.pathname.includes('/tools/web-captioner') || 
                              location.pathname.includes('/tools/real-time-translator') || 
                              location.pathname.includes('/tools/live-voice-translator');
    
    // Show Real-Time tools if on /tools or /tools/real-time
    if (location.pathname === '/tools' || location.pathname === '/tools/') {
      setShowRealTimeTools(true);
    } else if (isRealTimeSubPage) {
      setShowRealTimeTools(false);
    } else {
      // Hide when other pages are selected
      setShowRealTimeTools(false);
    }
  }, [location.pathname]);

  const handleRealTimeExpand = (expanded: boolean) => {
    setShowRealTimeTools(expanded);
    if (!expanded) {
      // Navigate away from real-time routes if collapsing
      const path = window.location.pathname;
      if (path.includes('/tools/live-transcribe') || 
          path.includes('/tools/web-captioner') || 
          path.includes('/tools/real-time-translator') || 
          path.includes('/tools/live-voice-translator')) {
        navigate('/tools');
      }
    }
  };

  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar onRealTimeExpand={handleRealTimeExpand} />
        <div className="tools-main-content">
          {showRealTimeTools && (
            <RealTimeTools />
          )}
          <Routes>
            <Route path="audio-to-text" element={<AudioToTextPage />} />
            <Route path="video-to-text" element={<VideoToTextPage />} />
            <Route path="video-dubber" element={<VideoDubberPage />} />
            <Route path="video-translator" element={<VideoTranslatorPage />} />
            <Route path="audio-translator" element={<AudioTranslatorPage />} />
            <Route path="subtitle-generator" element={<SubtitleGeneratorPage />} />
            <Route path="free-tools" element={<FreeToolsPage />} />
            <Route path="live-transcribe" element={<LiveTranscribePage />} />
            <Route path="web-captioner" element={<WebCaptionerPage />} />
            <Route path="real-time-translator" element={<RealTimeTranslatorPage />} />
            <Route path="live-voice-translator" element={<LiveVoiceTranslatorPage />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}


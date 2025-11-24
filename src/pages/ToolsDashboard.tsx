import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import AudioToTextPage from './tools/AudioToTextPage';
import VideoToTextPage from './tools/VideoToTextPage';
import VideoGenerationPage from './tools/VideoGenerationPage';
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
  return (
    <div className="tools-dashboard">
      <div className="tools-dashboard-container">
        <Sidebar />
        <div className="tools-main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="audio-to-text" element={<AudioToTextPage />} />
            <Route path="video-to-text" element={<VideoToTextPage />} />
            <Route path="video-generation" element={<VideoGenerationPage />} />
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


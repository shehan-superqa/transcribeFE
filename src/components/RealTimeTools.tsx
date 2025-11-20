import { useNavigate } from 'react-router-dom';
import './RealTimeTools.css';

export default function RealTimeTools() {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'live-transcribe',
      title: 'Live Transcribe',
      description: 'Real-time speech-to-text transcription as you speak',
      path: '/tools/live-transcribe',
    },
    {
      id: 'web-captioner',
      title: 'Web Captioner',
      description: 'Generate live captions for web content and videos',
      path: '/tools/web-captioner',
    },
    {
      id: 'real-time-translator',
      title: 'Real Time Translator',
      description: 'Translate speech in real-time across multiple languages',
      path: '/tools/real-time-translator',
    },
    {
      id: 'live-voice-translator',
      title: 'Live Voice Translator',
      description: 'Translate voice conversations instantly',
      path: '/tools/live-voice-translator',
    },
  ];

  return (
    <div className="realtime-tools">
      <div className="realtime-tools-header">
        <h1 className="realtime-tools-title">Real-Time</h1>
        <p className="realtime-tools-subtitle">Various tools that work in real-time.</p>
      </div>
      <div className="realtime-tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="realtime-tool-card"
            onClick={() => navigate(tool.path)}
          >
            <h3 className="realtime-tool-card-title">{tool.title}</h3>
            <p className="realtime-tool-card-description">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}


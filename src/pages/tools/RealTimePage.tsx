import { useNavigate } from 'react-router-dom';
import '../../css/pages/tools/ToolsPage.css';

export default function RealTimePage() {
  const navigate = useNavigate();

  const tools = [
    {
      id: 'live-transcribe',
      title: 'Live Transcribe',
      description: 'Real-time speech-to-text transcription as you speak',
      path: '/voice/live-transcribe',
    },
    {
      id: 'web-captioner',
      title: 'Web Captioner',
      description: 'Generate live captions for web content and videos',
      path: '/voice/live-captioner',
    },
    {
      id: 'real-time-translator',
      title: 'Real Time Translator',
      description: 'Translate speech in real-time across multiple languages',
      path: '/voice/live-translator',
    },
    {
      id: 'live-voice-translator',
      title: 'Live Voice Translator',
      description: 'Translate voice conversations instantly',
      path: '/voice/live-voice-translator',
    },
  ];

  return (
    <div className="tools-page">
      <div className="tools-header">
        <h1 className="tools-title">Real-Time</h1>
        <p className="tools-subtitle">Various tools that work in real-time.</p>
      </div>
      <div className="tools-grid">
        {tools.map((tool) => (
          <button
            key={tool.id}
            className="tool-card"
            onClick={() => navigate(tool.path)}
          >
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-description">{tool.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}


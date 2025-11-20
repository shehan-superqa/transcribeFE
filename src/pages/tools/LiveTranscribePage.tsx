import LiveMicTab from '../../components/transcription/LiveMicTab';
import './FeaturePage.css';

export default function LiveTranscribePage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1 className="feature-title">Live Transcribe</h1>
        <p className="feature-subtitle">Real-time speech-to-text transcription as you speak</p>
      </div>
      <div className="feature-content">
        <LiveMicTab />
      </div>
    </div>
  );
}


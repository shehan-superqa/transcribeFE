import TranscribeTab from '../../components/transcription/TranscribeTab';
import './FeaturePage.css';

export default function VideoToTextPage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1 className="feature-title">Video to Text</h1>
        <p className="feature-subtitle">Extract and transcribe audio from video files</p>
      </div>
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </div>
  );
}


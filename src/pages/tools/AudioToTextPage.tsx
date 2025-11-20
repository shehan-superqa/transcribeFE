import TranscribeTab from '../../components/transcription/TranscribeTab';
import './FeaturePage.css';

export default function AudioToTextPage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1 className="feature-title">Audio to Text</h1>
        <p className="feature-subtitle">Convert audio files to accurate text transcriptions</p>
      </div>
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </div>
  );
}


/**
 * Video to Text page
 * Uses the same transcription API as audio-to-text (submitTranscriptionJob)
 * Video files are processed by extracting audio and transcribing it
 */
import TranscribeTab from '../../components/transcription/TranscribeTab';
import './FeaturePage.css';

export default function VideoToTextPage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1 className="feature-title">Video to Text</h1>
        <p className="feature-subtitle">Extract and transcribe audio from video files using the same transcription engine as audio-to-text</p>
      </div>
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </div>
  );
}


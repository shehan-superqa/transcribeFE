import TranscribeTab from '../../components/transcription/TranscribeTab';
import HowToUse from '../../components/common/HowToUse';
import '../../css/pages/tools/FeaturePage.css';

export default function AudioToTextPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Audio to Text"
        subtitle="Convert audio files to accurate text transcriptions"
        instructions="Upload audio files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link or record audio directly. Select your preferred engine and model, then click 'Transcribe' to start. The transcription will appear in your history once completed."
      />
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </div>
  );
}


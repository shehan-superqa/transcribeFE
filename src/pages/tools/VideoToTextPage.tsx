/**
 * Video to Text page
 * Uses the same transcription API as audio-to-text (submitTranscriptionJob)
 * Video files are processed by extracting audio and transcribing it
 */
import TranscribeTab from '../../components/transcription/TranscribeTab';
import HowToUse from '../../components/common/HowToUse';
import '../../css/components/common/HowToUse.css';
import '../../css/pages/tools/FeaturePage.css';

export default function VideoToTextPage() {
  return (
    <div className="feature-page">
      <div className="tool-sticky-title">
        <h1>
          <span>Video to Text</span>
          <span className="title-subtitle"> - Extract and transcribe audio from video files</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link. The system will automatically extract audio from the video and transcribe it. Select your preferred engine and model, then click 'Transcribe' to start."
      />
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </div>
  );
}


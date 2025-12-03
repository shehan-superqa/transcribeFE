import LiveMicTab from '../../components/transcription/LiveMicTab';
import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function LiveTranscribePage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Live Transcribe"
        subtitle="Real-time speech-to-text transcription as you speak"
        instructions="Click 'Start Recording' to begin. Grant microphone permissions when prompted. Speak clearly into your microphone. The transcription will appear in real-time as you speak. Click 'Stop Recording' when finished. You can copy the transcription or save it to your history."
      />
      <div className="feature-content">
        <LiveMicTab />
      </div>
    </div>
  );
}


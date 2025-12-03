import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function LiveVoiceTranslatorPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Live Voice Translator"
        subtitle="Translate voice conversations instantly"
        instructions="Select the languages for both speakers in the conversation. Click 'Start Conversation' and grant microphone permissions. Each speaker speaks in their native language, and the system will translate and display the conversation in both languages in real-time. Perfect for multilingual meetings and conversations. Click 'End Conversation' when finished."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Live voice translation feature coming soon!</p>
          <p>This tool will translate voice conversations in real-time.</p>
        </div>
      </div>
    </div>
  );
}


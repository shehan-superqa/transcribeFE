import HowToUse from '../../components/common/HowToUse';
import '../../css/pages/tools/FeaturePage.css';

export default function RealTimeTranslatorPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Real Time Translator"
        subtitle="Translate speech in real-time across multiple languages"
        instructions="Select the source language and target language. Click 'Start Translation' and grant microphone permissions. Speak in the source language, and the translation will appear in real-time in the target language. The system transcribes your speech and translates it instantly. Click 'Stop' when finished."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Real-time translation feature coming soon!</p>
          <p>This tool will translate speech in real-time as you speak.</p>
        </div>
      </div>
    </div>
  );
}


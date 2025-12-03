import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function AudioTranslatorPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Audio Translator"
        subtitle="Translate audio content into different languages"
        instructions="Upload audio files using drag & drop, paste from clipboard, or click to browse. Select the source language and target language for translation. The system will transcribe the audio and translate it to your chosen language. Click 'Translate' to start the process."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Audio translation feature coming soon!</p>
          <p>This tool will translate audio files and provide transcriptions in multiple languages.</p>
        </div>
      </div>
    </div>
  );
}


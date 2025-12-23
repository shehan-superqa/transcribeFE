import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function AudioTranslatorPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Audio Translator</span>
          <span className="title-subtitle"> - Translate audio content into different languages</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload audio files using drag & drop, paste from clipboard, or click to browse. Select the source language and target language for translation. The system will transcribe the audio and translate it to your chosen language. Click 'Translate' to start the process."
      />
      <div className="tool-wrapper">
        <div className="tool-container">
          <div className="dashboard-empty-state">
            <p className="empty-state-text">Audio translation feature coming soon!</p>
            <p className="empty-state-subtext">
              This tool will translate audio files and provide transcriptions in multiple languages.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


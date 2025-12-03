import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function VideoTranslatorPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Video Translator"
        subtitle="Translate video content into multiple languages"
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link. Select the source language and target language for translation. The system will extract audio, transcribe it, and translate both the audio and subtitles to your chosen language. Click 'Translate' to start."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Video translation feature coming soon!</p>
          <p>This tool will translate video audio and subtitles into your preferred language.</p>
        </div>
      </div>
    </div>
  );
}


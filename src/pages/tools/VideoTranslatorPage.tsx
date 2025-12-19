import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function VideoTranslatorPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>Video Translator</h1>
      </div>
      <HowToUse
        title=""
        subtitle="Translate video content into multiple languages"
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link. Select the source language and target language for translation. The system will extract audio, transcribe it, and translate both the audio and subtitles to your chosen language. Click 'Translate' to start."
      />
      <div style={{ padding: '2rem' }}>
        <div style={{
          padding: '2rem',
          borderRadius: '1.25rem',
          background: 'linear-gradient(145deg, #0f172a, #1e293b)',
          color: '#f8fafc',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Video translation feature coming soon!</p>
          <p style={{ color: '#cbd5e1' }}>This tool will translate video audio and subtitles into your preferred language.</p>
        </div>
      </div>
    </>
  );
}


import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function SubtitleGeneratorPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Subtitle Generator"
        subtitle="Generate accurate subtitles for your videos"
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link. Select the video language. The system will automatically transcribe the audio and generate synchronized subtitles. You can download subtitles in SRT, VTT, or other formats. Click 'Generate Subtitles' to start."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Subtitle generation feature coming soon!</p>
          <p>This tool will automatically generate and sync subtitles for your video content.</p>
        </div>
      </div>
    </div>
  );
}


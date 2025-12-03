import HowToUse from '../../components/common/HowToUse';
import './FeaturePage.css';

export default function VideoDubberPage() {
  return (
    <div className="feature-page">
      <HowToUse
        title="Video Dubber"
        subtitle="Add voiceovers and dubbing to your videos"
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. Select the target language for dubbing. Optionally upload or record new voiceover audio. The system will sync the new audio with the video and replace the original audio track. Click 'Dub Video' to start the process."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Video dubbing feature coming soon!</p>
          <p>This tool will allow you to add professional voiceovers and translations to your videos.</p>
        </div>
      </div>
    </div>
  );
}


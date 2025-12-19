import TranscribeTab from '../../components/transcription/TranscribeTab';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import '../../pages/Dashboard.css';

export default function SubtitleGeneratorPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>Subtitle Generator</h1>
      </div>
      <HowToUse
        title=""
        subtitle="Generate accurate subtitles for your videos"
        instructions="Upload video files using drag & drop, paste from clipboard, or click to browse. You can also paste a YouTube link. Select the video language. The system will automatically transcribe the audio and generate synchronized subtitles. You can download subtitles in SRT, VTT, or other formats. Click 'Transcribe' to start."
      />
      <div className="feature-content">
        <TranscribeTab />
      </div>
    </>
  );
}


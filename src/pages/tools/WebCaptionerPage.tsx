import HowToUse from '../../components/common/HowToUse';
import '../../css/components/common/HowToUse.css';
import '../../css/pages/tools/FeaturePage.css';

export default function WebCaptionerPage() {
  return (
    <div className="feature-page">
      <div className="tool-sticky-title">
        <h1>
          <span>Web Captioner</span>
          <span className="title-subtitle"> - Generate live captions for web content and videos</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Upload a video file or paste a YouTube link. The system will automatically generate synchronized captions in real-time. Select your preferred language and caption style. Captions will appear overlaid on your video. You can download the captions in SRT or VTT format. Click 'Generate Captions' to start."
      />
      <div className="feature-content">
        <div className="coming-soon">
          <p>Web Captioner feature coming soon!</p>
          <p>This tool will generate real-time captions for web videos and live streams.</p>
        </div>
      </div>
    </div>
  );
}


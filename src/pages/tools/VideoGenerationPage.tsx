import VideoGenerationTool from '../../components/VideoGenerationTool/VideoGenerationTool';
import './FeaturePage.css';

export default function VideoGenerationPage() {
  return (
    <div className="feature-page">
      <div className="feature-header">
        <h1 className="feature-title">Video Generation</h1>
        <p className="feature-subtitle">Generate videos using AI with text prompts and reference images</p>
      </div>
      <div className="feature-content">
        <VideoGenerationTool />
      </div>
    </div>
  );
}


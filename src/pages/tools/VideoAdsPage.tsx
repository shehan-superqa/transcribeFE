import VideoAdsWizard from '../../components/VideoAdsAgent/VideoAdsWizard';
import '../../components/common/HowToUse.css';
import './FeaturePage.css';

export default function VideoAdsPage() {
  return (
    <div className="feature-page">
      <div className="tool-sticky-title">
        <h1>Video Ads Generator</h1>
      </div>
      <div className="feature-content">
        <VideoAdsWizard />
      </div>
    </div>
  );
}




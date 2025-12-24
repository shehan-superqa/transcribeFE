import VideoAdsWizard from '../../components/VideoAdsAgent/VideoAdsWizard';
import HowToUse from '../../components/common/HowToUse';
import '../../components/common/HowToUse.css';
import './FeaturePage.css';

export default function VideoAdsPage() {
  return (
    <div className="feature-page">
      <div className="tool-sticky-title">
        <h1>
          <span>Video Ads Generator</span>
          <span className="title-subtitle"> - Create high-converting video ads with AI</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Follow the step-by-step wizard to create your video ad. First, select what you're promoting (product, service, brand, event, or custom). Choose your target platform (Facebook, Instagram, YouTube, TikTok, etc.) and select the appropriate dimensions. Select your target languages. Upload reference images to guide the video generation. Provide additional instructions about how the ad should be generated, including logo placement and camera angles. Select the ad style/tone (Cartoon style, Happy mood, Sad mood, etc.). Click 'Generate Ad' to create your video ad. The system will process your request and generate a professional video ad tailored to your specifications."
      />
      <div className="feature-content">
        <VideoAdsWizard />
      </div>
    </div>
  );
}









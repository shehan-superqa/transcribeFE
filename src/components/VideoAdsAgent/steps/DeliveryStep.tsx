import { useState } from 'react';
import type { AdResult } from '../../../types/videoAds';
import '../../../css/components/VideoAdsAgent/steps/Steps.css';

interface DeliveryStepProps {
  result: AdResult;
  onGenerateVariation: () => void;
  onDuplicate: () => void;
}

export default function DeliveryStep({ result, onGenerateVariation, onDuplicate }: DeliveryStepProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (type: 'video' | 'script' | 'subtitles') => {
    setDownloading(type);
    try {
      if (type === 'video' && result.videoUrl) {
        const link = document.createElement('a');
        link.href = result.videoUrl;
        link.download = `ad-${result.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (type === 'script') {
        const scriptText = JSON.stringify(result.script, null, 2);
        const blob = new Blob([scriptText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ad-script-${result.id}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (type === 'subtitles' && result.subtitlesUrl) {
        const link = document.createElement('a');
        link.href = result.subtitlesUrl;
        link.download = `ad-subtitles-${result.id}.srt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="delivery-step">
      <div className="delivery-container">
        <div className="success-header">
          <div className="success-icon">🎉</div>
          <h2>Your ad is ready!</h2>
          <p>Your high-converting video ad has been generated successfully.</p>
        </div>

        <div className="video-preview-section">
          {result.videoUrl && (
            <div className="video-player-container">
              <video src={result.videoUrl} controls className="final-video-player">
                Your browser does not support the video tag.
              </video>
            </div>
          )}
        </div>

        <div className="download-section">
          <h3>Downloads</h3>
          <div className="download-buttons">
            <button
              className="download-button"
              onClick={() => handleDownload('video')}
              disabled={downloading === 'video'}
            >
              {downloading === 'video' ? 'Downloading...' : '📥 Download Video'}
            </button>
            <button
              className="download-button"
              onClick={() => handleDownload('script')}
              disabled={downloading === 'script'}
            >
              {downloading === 'script' ? 'Downloading...' : '📄 Download Script'}
            </button>
            {result.subtitlesUrl && (
              <button
                className="download-button"
                onClick={() => handleDownload('subtitles')}
                disabled={downloading === 'subtitles'}
              >
                {downloading === 'subtitles' ? 'Downloading...' : '📝 Download Subtitles'}
              </button>
            )}
          </div>
        </div>

        <div className="action-buttons">
          <button className="action-button primary" onClick={onGenerateVariation}>
            Generate Variation
          </button>
          <button className="action-button secondary" onClick={onDuplicate}>
            Duplicate & Edit
          </button>
        </div>

        <div className="ad-details">
          <h3>Ad Details</h3>
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">Duration:</span>
              <span className="detail-value">{result.script.totalDuration}s</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Scenes:</span>
              <span className="detail-value">{result.script.scenes.length}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Platform:</span>
              <span className="detail-value">{result.configuration.onboarding.platform}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Created:</span>
              <span className="detail-value">
                {new Date(result.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


















import type { ScriptScene, AdStrategy } from '../../types/videoAds';
import './VideoAdsAgent.css';

interface SceneCardProps {
  scene: ScriptScene;
  index: number;
  strategy: AdStrategy;
  totalScenes: number;
}

export default function SceneCard({ scene, index, strategy }: SceneCardProps) {
  return (
    <div className="scene-card">
      <div className="scene-card-header">
        <span className="scene-number">Scene {index + 1}</span>
        <span className="scene-timing">{scene.startTime}s - {scene.endTime}s</span>
      </div>
      
      <div className="scene-card-content">
        <div className="scene-visual-preview">
          <div className="visual-placeholder">
            <span className="visual-icon">🎬</span>
            <p className="visual-description">{scene.visualDescription}</p>
          </div>
        </div>

        <div className="scene-text">
          <p className="scene-spoken-text">"{scene.text}"</p>
          {scene.caption && (
            <p className="scene-caption">{scene.caption}</p>
          )}
        </div>

        <div className="scene-meta">
          <span className="voice-style">Voice: {scene.voiceStyle || 'natural'}</span>
        </div>
      </div>
    </div>
  );
}



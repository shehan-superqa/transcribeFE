import { useEffect, useState } from 'react';
import { useAdScript } from '../../../hooks/useAdScript';
import type { OnboardingData, AdStrategy, AdScript } from '../../../types/videoAds';
import '../../../css/components/VideoAdsAgent/steps/Steps.css';

interface ScriptStepProps {
  onboarding: OnboardingData;
  strategy: AdStrategy;
  onScriptGenerated: (script: AdScript) => void;
  onError: (error: string) => void;
  onNext: () => void;
}

export default function ScriptStep({
  onboarding,
  strategy,
  onScriptGenerated,
  onError,
  onNext,
}: ScriptStepProps) {
  const { script, loading, error, generateScript } = useAdScript();
  const [editingScript, setEditingScript] = useState<AdScript | null>(null);

  useEffect(() => {
    if (!script && !loading && !error) {
      generateScript(onboarding, strategy);
    }
  }, [onboarding, strategy, script, loading, error, generateScript]);

  useEffect(() => {
    if (script) {
      setEditingScript(script);
    }
  }, [script]);

  useEffect(() => {
    if (error) {
      onError(error);
    }
  }, [error]);

  const handleScriptEdit = (sceneId: string, field: string, value: string) => {
    if (!editingScript) return;

    const updatedScenes = editingScript.scenes.map((scene) =>
      scene.id === sceneId ? { ...scene, [field]: value } : scene
    );

    setEditingScript({
      ...editingScript,
      scenes: updatedScenes,
    });
  };

  const handleApprove = () => {
    if (editingScript) {
      onScriptGenerated(editingScript);
      onNext();
    }
  };

  if (loading) {
    return (
      <div className="script-step">
        <div className="loading-container">
          <div className="spinner" />
          <h3>Generating your ad script...</h3>
          <p>Creating compelling copy optimized for {strategy.adLength}s...</p>
        </div>
      </div>
    );
  }

  if (!editingScript) {
    return (
      <div className="script-step">
        <div className="error-container">
          <p>No script available. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="script-step">
      <div className="script-editor-container">
        <h2>Your Ad Script</h2>
        <p className="subtitle">Review and edit your script before proceeding</p>

        <div className="script-scenes">
          {editingScript.scenes.map((scene, index) => (
            <div key={scene.id} className="scene-editor-card">
              <div className="scene-header">
                <h3>Scene {index + 1}</h3>
                <span className="scene-timing">
                  {scene.startTime}s - {scene.endTime}s ({scene.duration}s)
                </span>
              </div>

              <div className="scene-fields">
                <div className="field-group">
                  <label>Spoken Text</label>
                  <textarea
                    value={scene.text}
                    onChange={(e) => handleScriptEdit(scene.id, 'text', e.target.value)}
                    className="script-textarea"
                    rows={2}
                  />
                </div>

                <div className="field-group">
                  <label>Visual Description</label>
                  <textarea
                    value={scene.visualDescription}
                    onChange={(e) => handleScriptEdit(scene.id, 'visualDescription', e.target.value)}
                    className="script-textarea"
                    rows={2}
                  />
                </div>

                <div className="field-group">
                  <label>Caption</label>
                  <input
                    type="text"
                    value={scene.caption || ''}
                    onChange={(e) => handleScriptEdit(scene.id, 'caption', e.target.value)}
                    className="script-input"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="script-actions">
          <button className="approve-button" onClick={handleApprove}>
            Looks Good! Continue →
          </button>
        </div>
      </div>
    </div>
  );
}


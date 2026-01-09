import { useState } from 'react';
import HowToUse from '../../components/common/HowToUse';
import '../../css/components/common/HowToUse.css';
import '../../css/pages/Dashboard.css';

export default function VideoTranslatorPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Video Translator</span>
          <span className="title-subtitle"> - Translate video content to different languages</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Video translator functionality is coming soon. This tool will allow you to translate video content to different languages while preserving the original audio quality."
      />
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>This feature is currently under development.</p>
      </div>
    </>
  );
}



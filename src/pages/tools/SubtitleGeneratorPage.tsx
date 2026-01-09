import { useState } from 'react';
import HowToUse from '../../components/common/HowToUse';
import '../../css/components/common/HowToUse.css';
import '../../css/pages/Dashboard.css';

export default function SubtitleGeneratorPage() {
  return (
    <>
      <div className="tool-sticky-title">
        <h1>
          <span>Subtitle Generator</span>
          <span className="title-subtitle"> - Generate subtitles for your videos automatically</span>
        </h1>
      </div>
      <HowToUse
        title=""
        subtitle=""
        instructions="Subtitle generator functionality is coming soon. This tool will automatically generate subtitles for your videos in multiple languages."
      />
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <p>This feature is currently under development.</p>
      </div>
    </>
  );
}



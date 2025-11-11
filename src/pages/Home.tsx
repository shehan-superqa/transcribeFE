import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TranscriptionTool from '../components/TranscriptionTool';
import { useAuth } from '../lib/auth';

import './HomeHero.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  // Track mouse for hero gradient
  useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    const title = document.querySelector('.hero-title') as HTMLElement | null;
    if (!title) return;

    const rect = title.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    title.style.setProperty('--cursor-x', `${x}px`);
    title.style.setProperty('--cursor-y', `${y}px`);
  };

  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);


  const handleTranscriptionStart = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      if (user) navigate('/dashboard');
    }, 2000);
  };

  return (
    <div>
      {/* HERO SECTION */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">AI Driven Voice to Text Instantly</h1>
          <p className="hero-subtitle">
            Powerful voice-to-text transcription with support for file uploads, YouTube videos, and live recording. 
            <span className="highlight"> Get started with 100 free energy points.</span>
          </p>
        </div>
      </section>

      <section className="tool-section">
  <div className="transcription-wrapper">
    <TranscriptionTool onTranscriptionStart={handleTranscriptionStart} />
    {showSuccess && (
      <div className="success-message">
        Transcription started successfully! Redirecting to dashboard...
      </div>
    )}
  </div>
</section>

      {/* FEATURES SECTION */}
      <section className="features-section">
        <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>Why Choose VoiceScribe?</h2>
        <div className="features-grid">
          {/* Feature cards */}
          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3>Multiple Input Methods</h3>
            <p>Upload audio files, paste YouTube links, or record directly in your browser</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3>Fast & Accurate</h3>
            <p>Industry-leading transcription accuracy with lightning-fast processing</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3>Flexible Pricing</h3>
            <p>Start free with 100 points, upgrade as you grow with affordable plans</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3>History & Export</h3>
            <p>Access all your transcriptions anytime and export in multiple formats</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Sign up now and get 100 free energy points to try our transcription service</p>
        <a href="/login">Get Started Free</a>
      </section>
    </div>
  );
}

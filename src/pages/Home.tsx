import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import TranscriptionTool from '../components/TranscriptionTool';
import { useAuth } from '../lib/auth';
import ImageDescription from "../components/ImageDescription"
import uploadScreenshot from "../assets/upload.png"
import youtubeScreenshot from "../assets/youtubelink.png"
import recordaudioScreenshot from "../assets/recordaudio.png"
import './HomeHero.css';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  // Enhanced mouse tracking for cinematic interactive effects
  useEffect(() => {
    let lastUpdate = 0;
    const throttleMs = 16; // ~60fps

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < throttleMs) return;
      lastUpdate = now;

      const heroSection = document.querySelector('.hero-section') as HTMLElement | null;
      if (!heroSection) return;

      const rect = heroSection.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Normalized coordinates (0-1 range)
      const normalizedX = x / rect.width;
      const normalizedY = y / rect.height;
      
      // Percentage coordinates for CSS
      const percentX = (x / rect.width) * 100;
      const percentY = (y / rect.height) * 100;

      // Set CSS custom properties on hero section
      heroSection.style.setProperty('--mouse-x', `${x}px`);
      heroSection.style.setProperty('--mouse-y', `${y}px`);
      heroSection.style.setProperty('--mouse-x-percent', `${percentX}%`);
      heroSection.style.setProperty('--mouse-y-percent', `${percentY}%`);
      heroSection.style.setProperty('--mouse-x-norm', `${normalizedX}`);
      heroSection.style.setProperty('--mouse-y-norm', `${normalizedY}`);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
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
        <div className="hero-bg-layer hero-bg-layer-1"></div>
        <div className="hero-bg-layer hero-bg-layer-2"></div>
        <div className="hero-bg-layer hero-bg-layer-3"></div>
        <div className="hero-content">
          <h1 className="hero-title">AI Driven Voice to Text & Text to Video</h1>
          <p className="hero-subtitle">
            Powerful voice-to-text transcription with support for audio/video file uploads, YouTube videos, and live recording. 
            Plus, generate stunning videos from text prompts using advanced AI. 
            <span className="highlight"> Get started with 100 free energy points.</span>
          </p>
          <Link to="/auth/login" className="get-started-button">
            <span>Get Started Free</span>
          </Link>
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
{/* IMAGE + DESCRIPTION SECTION */}
<section className="upload-section">
  <ImageDescription
    imageSrc={uploadScreenshot}
    altText="Upload illustration"
    title="Upload & Transcribe"
    description="Upload your audio or video files and get accurate transcriptions in seconds. Supports multiple audio and video formats with fast processing."
  />
</section>
<section className="upload-section">
  <ImageDescription
    imageSrc={youtubeScreenshot}
    altText="YouTube transcription illustration"
    title="Transcribe YouTube Videos Instantly"
    description="Simply paste a YouTube link and let our system automatically fetch, process, and transcribe the video's audio into accurate, readable text. Perfect for content creators, researchers, and accessibility needs."
    reverse // 👈 puts image on the right
  />
</section>
{/* Voice Transcription Section */}
<section className="upload-section">
  <ImageDescription
    imageSrc={recordaudioScreenshot}
    altText="Voice recording illustration"
    title="Voice Transcription"
    description="Record your voice directly and get instant, high-accuracy text transcriptions. Perfect for capturing meetings, lectures, ideas, or quick notes with a single click."
    reverse
  />
</section>

{/* Video Generation Section */}
<section className="upload-section">
  <ImageDescription
    imageSrc={uploadScreenshot}
    altText="Video generation illustration"
    title="AI Video Generation"
    description="Transform your text prompts into stunning videos using Google Veo 3.1. Create professional videos with custom aspect ratios, durations, and reference images. Perfect for content creators, marketers, and creative professionals."
  />
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
            <p>Upload audio or video files, paste YouTube links, or record directly in your browser</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>AI Video Generation</h3>
            <p>Create stunning videos from text prompts using Google Veo 3.1 with custom aspect ratios and durations</p>
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
            <p>Access all your transcriptions and videos anytime and export in multiple formats</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3>Reference Images</h3>
            <p>Use reference images to guide video generation and create consistent visual styles</p>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Sign up now and get 100 free energy points to try our transcription and video generation services</p>
        <Link to="/auth/login" className="get-started-button">Get Started Free</Link>
      </section>
    </div>
  );
}

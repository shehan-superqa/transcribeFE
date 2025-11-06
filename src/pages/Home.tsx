import { useState } from 'react';
import TranscriptionTool from '../components/TranscriptionTool';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTranscriptionStart = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      if (user) {
        navigate('/dashboard');
      }
    }, 2000);
  };

  return (
    <div style={styles.container}>
      <section style={styles.hero}>
        <h1 style={styles.title}>Transform Voice to Text Instantly</h1>
        <p style={styles.subtitle}>
          Powerful voice-to-text transcription with support for file uploads, YouTube videos, and live recording.
          Get started with 100 free energy points.
        </p>
      </section>

      <section style={styles.toolSection}>
        <TranscriptionTool onTranscriptionStart={handleTranscriptionStart} />
        {showSuccess && (
          <div style={styles.successMessage}>
            Transcription started successfully! Redirecting to dashboard...
          </div>
        )}
      </section>

      <section style={styles.features}>
        <h2 style={styles.featuresTitle}>Why Choose VoiceScribe?</h2>
        <div style={styles.featureGrid}>
          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Multiple Input Methods</h3>
            <p style={styles.featureDescription}>
              Upload audio files, paste YouTube links, or record directly in your browser
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Fast & Accurate</h3>
            <p style={styles.featureDescription}>
              Industry-leading transcription accuracy with lightning-fast processing
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Flexible Pricing</h3>
            <p style={styles.featureDescription}>
              Start free with 100 points, upgrade as you grow with affordable plans
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>History & Export</h3>
            <p style={styles.featureDescription}>
              Access all your transcriptions anytime and export in multiple formats
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>Secure & Private</h3>
            <p style={styles.featureDescription}>
              Your data is encrypted and secure. We respect your privacy
            </p>
          </div>

          <div style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <svg width="40" height="40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 style={styles.featureTitle}>No Hidden Fees</h3>
            <p style={styles.featureDescription}>
              Transparent pricing with no surprise charges. Pay only for what you use
            </p>
          </div>
        </div>
      </section>

      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>Ready to Get Started?</h2>
        <p style={styles.ctaText}>
          Sign up now and get 100 free energy points to try our transcription service
        </p>
        <a href="/login" style={styles.ctaButton}>
          Get Started Free
        </a>
      </section>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
  },
  hero: {
    textAlign: 'center' as const,
    padding: '4rem 1.5rem 2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  title: {
    fontSize: '3rem',
    fontWeight: 700,
    marginBottom: '1rem',
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    lineHeight: 1.2,
  },
  subtitle: {
    fontSize: '1.25rem',
    color: 'var(--color-gray-600)',
    lineHeight: 1.7,
  },
  toolSection: {
    padding: '2rem 1.5rem 4rem',
  },
  successMessage: {
    maxWidth: '600px',
    margin: '1.5rem auto 0',
    padding: '1rem',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    borderRadius: 'var(--border-radius-md)',
    textAlign: 'center' as const,
    fontWeight: 600,
  },
  features: {
    padding: '4rem 1.5rem',
    backgroundColor: 'white',
  },
  featuresTitle: {
    fontSize: '2.5rem',
    textAlign: 'center' as const,
    marginBottom: '3rem',
    color: 'var(--color-gray-900)',
  },
  featureGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  featureCard: {
    padding: '2rem',
    borderRadius: 'var(--border-radius-lg)',
    backgroundColor: 'var(--color-gray-50)',
    border: '1px solid var(--color-gray-200)',
    transition: 'all var(--transition-normal)',
  },
  featureIcon: {
    width: '64px',
    height: '64px',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-lg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1.5rem',
  },
  featureTitle: {
    fontSize: '1.25rem',
    fontWeight: 600,
    marginBottom: '0.75rem',
    color: 'var(--color-gray-900)',
  },
  featureDescription: {
    color: 'var(--color-gray-600)',
    lineHeight: 1.7,
  },
  cta: {
    textAlign: 'center' as const,
    padding: '4rem 1.5rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
  },
  ctaTitle: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  ctaText: {
    fontSize: '1.25rem',
    marginBottom: '2rem',
    opacity: 0.9,
  },
  ctaButton: {
    display: 'inline-block',
    padding: '1rem 2.5rem',
    backgroundColor: 'white',
    color: 'var(--color-primary)',
    borderRadius: 'var(--border-radius-lg)',
    fontWeight: 700,
    fontSize: '1.125rem',
    transition: 'all var(--transition-fast)',
    boxShadow: 'var(--shadow-lg)',
  },
};

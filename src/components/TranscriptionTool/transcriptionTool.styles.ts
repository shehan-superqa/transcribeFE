export const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
    padding: '2rem',
    borderRadius: '1.25rem',
    background: 'linear-gradient(145deg, #0f172a, #1e293b)',
    color: '#f8fafc',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
    maxWidth: '700px',
    margin: '2rem auto',
    fontFamily: 'Inter, system-ui, sans-serif',
  },

  energyBadge: {
    alignSelf: 'center',
    background: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
    borderRadius: '9999px',
    padding: '0.4rem 1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontWeight: 600,
    color: '#0f172a',
    boxShadow: '0 0 10px rgba(59, 130, 246, 0.4)',
  },

  energyIcon: {
    fontSize: '1.2rem',
  },

  energyText: {
    fontSize: '0.95rem',
  },

  modeSelector: {
    display: 'flex',
    justifyContent: 'space-around',
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    padding: '0.5rem',
  },

  modeButton: {
    flex: 1,
    background: 'transparent',
    color: '#f8fafc',
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.6rem 0.75rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.25s ease',
  },

  modeButtonActive: {
    background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
    boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
  },

  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.25rem',
  },

  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
  },

  label: {
    fontWeight: 600,
    fontSize: '0.95rem',
  },

  fileInput: {
    display: 'none',
  },

  fileUploadBox: {
    background: 'rgba(255, 255, 255, 0.05)',
    border: '2px dashed rgba(255, 255, 255, 0.2)',
    borderRadius: '1rem',
    padding: '2rem',
    textAlign: 'center' as const,
    cursor: 'pointer',
    transition: 'border 0.25s ease, background 0.25s ease',
  },

  uploadIcon: {
    color: '#60a5fa',
    marginBottom: '0.5rem',
  },

  uploadText: {
    fontWeight: 500,
    fontSize: '1rem',
  },

  uploadSubtext: {
    fontSize: '0.8rem',
    color: '#cbd5e1',
  },

  input: {
    padding: '0.75rem 1rem',
    borderRadius: '0.75rem',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#f8fafc',
    outline: 'none',
  },

  conversionProgress: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.5rem',
    marginTop: '0.75rem',
  },

  progressBarContainer: {
    background: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '1rem',
    height: '0.5rem',
    overflow: 'hidden',
  },

  progressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #22d3ee, #3b82f6)',
    transition: 'width 0.3s ease',
  },

  progressText: {
    fontSize: '0.85rem',
    color: '#cbd5e1',
  },

  progressPercent: {
    color: '#60a5fa',
  },

  recordingSection: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
    background: 'rgba(255, 255, 255, 0.03)',
    padding: '1rem',
    borderRadius: '1rem',
  },

  recordingDisplay: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },

  recordingIndicator: {
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    backgroundColor: '#475569',
    transition: 'background 0.3s ease',
  },

  recordingIndicatorActive: {
    backgroundColor: '#ef4444',
    boxShadow: '0 0 10px #ef4444',
  },

  recordingTime: {
    fontSize: '1rem',
    fontWeight: 500,
  },

  waveformContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.25rem',
  },

  waveformLabel: {
    fontSize: '0.9rem',
    color: '#94a3b8',
  },

  totalWaveformCanvas: {
    width: '100%',
    height: '60px',
    backgroundColor: '#0a0a0a',
    borderRadius: '0.75rem',
  },

  waveformCanvas: {
    width: '100%',
    borderRadius: '1rem',
    background: 'rgba(0,0,0,0.3)',
  },

  recordingButtons: {
    display: 'flex',
    gap: '0.75rem',
  },

  recordButton: {
    flex: 1,
    background: 'linear-gradient(90deg, #6366f1, #3b82f6)', // Start Recording - Indigo to Blue
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 10px rgba(99, 102, 241, 0.4)',
  },
  
  recordButtonActive: {
    background: 'linear-gradient(90deg, #8b5cf6, #6366f1)', // Stop Recording - Purple to Indigo
    boxShadow: '0 4px 10px rgba(139, 92, 246, 0.4)',
  },
  
  pauseButton: {
    flex: 1,
    background: 'linear-gradient(90deg, #22d3ee, #3b82f6)', // Pause - Cyan to Blue
    border: 'none',
    borderRadius: '0.75rem',
    padding: '0.75rem 1rem',
    fontWeight: 600,
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.25s ease',
    boxShadow: '0 4px 10px rgba(34, 211, 238, 0.4)',
  },
  
  pauseButtonResume: {
    background: 'linear-gradient(90deg, #818cf8, #6366f1)', // Resume - Light Indigo to Indigo
    boxShadow: '0 4px 10px rgba(129, 140, 248, 0.4)',
  },
  

  recordingsContainer: {
    marginTop: '1rem',
  },

  recordingsTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    marginBottom: '0.5rem',
  },

  recordingsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1rem',
  },

  recordingItem: {
    background: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '1rem',
    padding: '0.75rem',
  },

  recordingControls: {
    display: 'flex',
    gap: '0.75rem',
    justifyContent: 'space-between',
  },

  playButton: {
    background: 'linear-gradient(90deg, #3b82f6, #2563eb)',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },

  transcribeButton: {
    background: 'linear-gradient(90deg, #a855f7, #7e22ce)',
    border: 'none',
    borderRadius: '0.5rem',
    padding: '0.5rem 1rem',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
  },

  downloadLink: {
    color: '#60a5fa',
    textDecoration: 'none',
    fontSize: '0.9rem',
  },

  error: {
    color: '#f87171',
    fontWeight: 500,
    textAlign: 'center' as const,
  },

  submitButton: {
    background: 'linear-gradient(90deg, #6366f1, #3b82f6)',
    color: '#fff',
    padding: '0.9rem 1.25rem',
    border: 'none',
    borderRadius: '0.75rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.25s ease, transform 0.2s ease',
  },

  submitButtonDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },

  signInPrompt: {
    textAlign: 'center' as const,
    fontSize: '0.9rem',
    color: '#94a3b8',
  },

  link: {
    color: '#60a5fa',
    textDecoration: 'underline',
  },
};

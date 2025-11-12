import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaSpinner } from 'react-icons/fa';

// Define a dark color palette for a modern, tech-focused look
const DARK_PALETTE = {
  BACKGROUND: '#121212', // Very dark background
  CARD_BG: '#1e1e1e', // Slightly lighter dark for card
  PRIMARY_ACCENT: '#00c6ff', // Bright blue/cyan for primary action
  SECONDARY_ACCENT: '#9b5de5', // Bright purple for secondary accents
  TEXT_LIGHT: '#e0e0e0', // Light text
  TEXT_MUTED: '#a0a0a0', // Muted text
  BORDER_DARK: '#333333', // Dark border
  ERROR: '#cf6679', // Error color (Dark mode friendly red)
  SHADOW_DARK: '0 8px 30px rgba(0, 0, 0, 0.6)',
  TRANSITION: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
};

// --- Component Definition ---

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      navigate('/dashboard');
    }
  }, [authLoading, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password, name || undefined);
        if (error) throw error;
      } else {
        const { error } = await signIn(email, password);
        if (error) throw error;
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>{isSignUp ? 'Create VoiceCrypt Account' : 'Welcome to VoiceCrypt'}</h1>
          <p style={styles.subtitle}>
            {isSignUp
              ? 'Sign up now and encrypt your audio! Get 100 free energy points'
              : 'Sign in to access your secure transcriptions and recordings'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>
                <FaUser style={styles.icon} /> Name (Optional)
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cryptographer Alpha"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaEnvelope style={styles.icon} /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="secure@voicecrypt.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>
              <FaLock style={styles.icon} /> Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              required
              minLength={6}
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {}),
            }}
          >
            {loading ? (
              <div style={styles.loadingContent}>
                <FaSpinner className="spin" style={styles.spinner} />
                Please wait...
              </div>
            ) : isSignUp ? (
              <>
                <FaUserPlus style={{ marginRight: '0.5rem' }} /> Sign Up
              </>
            ) : (
              <>
                <FaSignInAlt style={{ marginRight: '0.5rem' }} /> Sign In
              </>
            )}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "New User? Deploy an account."}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={styles.toggleButton}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <div style={styles.backLink}>
          <Link to="/" style={styles.link}>
            ← Back to Main Console
          </Link>
        </div>
      </div>
    </div>
  );
}

// --- Stylesheet for the Modern Dark Theme ---

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
    backgroundColor: DARK_PALETTE.BACKGROUND,
    fontFamily: '"Poppins", sans-serif', // Use a modern, clean font
  },
  card: {
    backgroundColor: DARK_PALETTE.CARD_BG,
    borderRadius: '1.5rem',
    padding: '2.5rem',
    boxShadow: DARK_PALETTE.SHADOW_DARK,
    maxWidth: '450px',
    width: '100%',
    border: `1px solid ${DARK_PALETTE.BORDER_DARK}`,
    zIndex: 10,
    position: 'relative',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 800,
    marginBottom: '0.5rem',
    color: DARK_PALETTE.TEXT_LIGHT,
  },
  subtitle: {
    color: DARK_PALETTE.TEXT_MUTED,
    fontSize: '0.95rem',
    fontWeight: 300,
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1.5rem',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: 600,
    color: DARK_PALETTE.TEXT_LIGHT,
    display: 'flex',
    alignItems: 'center',
    marginBottom: '0.1rem',
  },
  icon: {
    marginRight: '0.5rem',
    color: DARK_PALETTE.PRIMARY_ACCENT,
  },
  input: {
    padding: '0.8rem 1rem',
    backgroundColor: DARK_PALETTE.BACKGROUND, // Input background darker than card
    border: `1px solid ${DARK_PALETTE.BORDER_DARK}`,
    borderRadius: '0.75rem',
    fontSize: '1rem',
    color: DARK_PALETTE.TEXT_LIGHT,
    transition: DARK_PALETTE.TRANSITION,
    boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.3)',
    '&:focus': {
      borderColor: DARK_PALETTE.PRIMARY_ACCENT,
      boxShadow: `0 0 0 2px ${DARK_PALETTE.PRIMARY_ACCENT}30`,
      outline: 'none',
    },
  },
  error: {
    padding: '0.75rem 1rem',
    backgroundColor: `${DARK_PALETTE.ERROR}20`,
    color: DARK_PALETTE.ERROR,
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    border: `1px solid ${DARK_PALETTE.ERROR}50`,
    textAlign: 'center' as const,
  },
  submitButton: {
    padding: '1rem 1.5rem',
    // Modern gradient background
    background: `linear-gradient(90deg, ${DARK_PALETTE.PRIMARY_ACCENT} 0%, ${DARK_PALETTE.SECONDARY_ACCENT} 100%)`,
    color: 'white',
    borderRadius: '0.75rem',
    fontWeight: 700,
    fontSize: '1.05rem',
    transition: DARK_PALETTE.TRANSITION,
    marginTop: '0.5rem',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 15px ${DARK_PALETTE.SECONDARY_ACCENT}40`,
    '&:hover': {
      boxShadow: `0 6px 20px ${DARK_PALETTE.SECONDARY_ACCENT}60`,
      opacity: 0.9,
    },
  },
  submitButtonDisabled: {
    background: DARK_PALETTE.BORDER_DARK,
    color: DARK_PALETTE.TEXT_MUTED,
    cursor: 'not-allowed',
    boxShadow: 'none',
    opacity: 0.7,
  },
  loadingContent: {
    display: 'flex',
    alignItems: 'center',
  },
  spinner: {
    animation: 'spin 1s linear infinite',
    marginRight: '0.5rem',
  },
  footer: {
    marginTop: '2rem',
    paddingTop: '1.5rem',
    borderTop: `1px solid ${DARK_PALETTE.BORDER_DARK}`,
  },
  toggleText: {
    textAlign: 'center' as const,
    color: DARK_PALETTE.TEXT_MUTED,
    fontSize: '0.9rem',
  },
  toggleButton: {
    marginLeft: '0.5rem',
    background: 'none',
    // Match the primary accent color
    color: DARK_PALETTE.PRIMARY_ACCENT,
    fontWeight: 600,
    fontSize: '0.9rem',
    cursor: 'pointer',
    border: 'none',
    padding: '0',
    transition: DARK_PALETTE.TRANSITION,
    '&:hover': {
      textDecoration: 'underline',
      color: DARK_PALETTE.SECONDARY_ACCENT,
    }
  },
  backLink: {
    marginTop: '1.5rem',
    textAlign: 'center' as const,
  },
  link: {
    color: DARK_PALETTE.TEXT_MUTED,
    fontSize: '0.85rem',
    fontWeight: 500,
    textDecoration: 'none',
    transition: DARK_PALETTE.TRANSITION,
    '&:hover': {
      color: DARK_PALETTE.PRIMARY_ACCENT,
    },
  },
};
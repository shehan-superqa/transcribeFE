import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

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
          <h1 style={styles.title}>{isSignUp ? 'Create Account' : 'Welcome Back'}</h1>
          <p style={styles.subtitle}>
            {isSignUp
              ? 'Sign up to get 100 free energy points'
              : 'Sign in to continue transcribing'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {isSignUp && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Name (Optional)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
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
            {loading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.toggleText}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
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
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: 'calc(100vh - 80px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2rem 1.5rem',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 'var(--border-radius-xl)',
    padding: '2.5rem',
    boxShadow: 'var(--shadow-xl)',
    maxWidth: '450px',
    width: '100%',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '2rem',
  },
  title: {
    fontSize: '2rem',
    fontWeight: 700,
    marginBottom: '0.5rem',
    color: 'var(--color-gray-900)',
  },
  subtitle: {
    color: 'var(--color-gray-600)',
    fontSize: '0.875rem',
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
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-gray-700)',
  },
  input: {
    padding: '0.75rem 1rem',
    border: '2px solid var(--color-gray-200)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '1rem',
    transition: 'border-color var(--transition-fast)',
  },
  error: {
    padding: '0.75rem 1rem',
    backgroundColor: '#fef2f2',
    color: 'var(--color-error)',
    borderRadius: 'var(--border-radius-md)',
    fontSize: '0.875rem',
    border: '1px solid #fee2e2',
  },
  submitButton: {
    padding: '0.875rem 1.5rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    fontSize: '1rem',
    transition: 'all var(--transition-fast)',
    marginTop: '0.5rem',
  },
  submitButtonDisabled: {
    backgroundColor: 'var(--color-gray-300)',
    cursor: 'not-allowed',
  },
  footer: {
    marginTop: '1.5rem',
    paddingTop: '1.5rem',
    borderTop: '1px solid var(--color-gray-200)',
  },
  toggleText: {
    textAlign: 'center' as const,
    color: 'var(--color-gray-600)',
    fontSize: '0.875rem',
  },
  toggleButton: {
    marginLeft: '0.5rem',
    background: 'none',
    color: 'var(--color-primary)',
    fontWeight: 600,
    fontSize: '0.875rem',
  },
  backLink: {
    marginTop: '1rem',
    textAlign: 'center' as const,
  },
  link: {
    color: 'var(--color-gray-600)',
    fontSize: '0.875rem',
    fontWeight: 500,
  },
};

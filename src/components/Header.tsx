import { Link } from 'react-router-dom';
import { useAuth } from '../lib/auth';

export default function Header() {
  const { user, signOut } = useAuth();

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        <Link to="/" style={styles.logo}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ marginRight: '0.5rem' }}>
            <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
            <path d="M16 8L10 14H13V20H19V14H22L16 8Z" fill="white" />
            <path d="M9 22H23V24H9V22Z" fill="white" />
          </svg>
          <span style={styles.logoText}>VoiceScribe</span>
        </Link>

        <nav style={styles.nav}>
          {user ? (
            <>
              <Link to="/dashboard" style={styles.navLink}>Dashboard</Link>
              <Link to="/pricing" style={styles.navLink}>Pricing</Link>
              <button onClick={signOut} style={styles.signOutButton}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/pricing" style={styles.navLink}>Pricing</Link>
              <Link to="/login" style={styles.loginButton}>
                Sign In
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const styles = {
  header: {
    backgroundColor: 'white',
    borderBottom: '1px solid var(--color-gray-200)',
    position: 'sticky' as const,
    top: 0,
    zIndex: 50,
    boxShadow: 'var(--shadow-sm)',
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '1.5rem',
    fontWeight: 700,
    color: 'var(--color-gray-900)',
    textDecoration: 'none',
  },
  logoText: {
    background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  navLink: {
    color: 'var(--color-gray-700)',
    fontWeight: 500,
    padding: '0.5rem 0',
    transition: 'color var(--transition-fast)',
  },
  loginButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: 'var(--color-primary)',
    color: 'white',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
    display: 'inline-block',
  },
  signOutButton: {
    padding: '0.625rem 1.25rem',
    backgroundColor: 'var(--color-gray-100)',
    color: 'var(--color-gray-700)',
    borderRadius: 'var(--border-radius-md)',
    fontWeight: 600,
    transition: 'all var(--transition-fast)',
  },
};

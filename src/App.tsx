import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <Header />
          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/pricing" element={<Pricing />} />
            </Routes>
          </main>
          <footer style={styles.footer}>
            <div style={styles.footerContent}>
              <p style={styles.footerText}>
                &copy; 2024 VoiceScribe. Transform voice to text instantly.
              </p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

const styles = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  main: {
    flex: 1,
  },
  footer: {
    backgroundColor: 'var(--color-gray-900)',
    color: 'white',
    padding: '2rem 1.5rem',
    marginTop: 'auto',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    textAlign: 'center' as const,
  },
  footerText: {
    opacity: 0.8,
  },
};

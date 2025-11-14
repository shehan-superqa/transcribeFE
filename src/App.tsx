import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider } from "./lib/auth";
import { store } from "./store";
import { checkAuth } from "./store/authSlice";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pricing from "./pages/Pricing";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  useEffect(() => {
    // Check authentication on app start
    store.dispatch(checkAuth());
  }, []);

  return (
    <AuthProvider>
      <Router>
        <div style={styles.app}>
          <Header />
          <main style={styles.main}>
            <Routes>
              <Route path="/" element={<Home />} />

              {/* Login/Signup handled in the same page */}
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/signup" element={<Login />} />

              <Route path="/pricing" element={<Pricing />} />

              {/* Protected Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
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

// Wrap the app with Redux Provider
export default function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}

const styles = {
  app: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column" as const,
  },
  main: {
    flex: 1,
  },
  footer: {
    backgroundColor: "#1a1a1a",
    color: "white",
    padding: "2rem 1.5rem",
    marginTop: "auto",
  },
  footerContent: {
    maxWidth: "1200px",
    margin: "0 auto",
    textAlign: "center" as const,
  },
  footerText: {
    opacity: 0.8,
  },
};

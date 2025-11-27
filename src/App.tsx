import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider } from "./lib/auth";
import { NotificationProvider } from "./contexts/NotificationContext";
import { store } from "./store";
import { checkAuth } from "./store/authSlice";
import "./App.css";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ToolsDashboard from "./pages/ToolsDashboard";
import Pricing from "./pages/Pricing";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ValidateToken from "./pages/ValidateToken";
import ProtectedRoute from "./components/ProtectedRoute";

function AppContent() {
  useEffect(() => {
    // Check authentication on app start
    store.dispatch(checkAuth());
  }, []);

  return (
    <NotificationProvider>
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
              
              {/* Email verification and password reset */}
              <Route path="/auth/verify-email" element={<VerifyEmail />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/reset-password" element={<ResetPassword />} />
              
              {/* Token validation endpoint for other services */}
              <Route path="/api/auth/validate-token" element={<ValidateToken />} />
              <Route path="/auth/validate-token" element={<ValidateToken />} />

              <Route path="/pricing" element={<Pricing />} />

              {/* Protected Routes - Voice (Audio) Tools */}
              <Route
                path="/voice/*"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Protected Routes - Video Tools */}
              <Route
                path="/video/*"
                element={
                  <ProtectedRoute>
                    <ToolsDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Legacy dashboard route - redirect to voice */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Navigate to="/voice/transcribe" replace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <Navigate to="/voice/transcribe" replace />
                  </ProtectedRoute>
                }
              />

              {/* Legacy tools route - redirect to video */}
              <Route
                path="/tools/*"
                element={
                  <ProtectedRoute>
                    <Navigate to="/video/text-to-video" replace />
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
    </NotificationProvider>
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
    wordWrap: "break-word" as const,
    overflowWrap: "break-word" as const,
  },
};

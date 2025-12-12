import { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import { AuthProvider } from "./lib/auth";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthModalProvider } from "./contexts/AuthModalContext";
import { store } from "./store";
import { checkAuth } from "./store/authSlice";
import "./App.css";

import Header from "./components/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ToolsDashboard from "./pages/ToolsDashboard";
import ImagesDashboard from "./pages/ImagesDashboard";
import GPT5Dashboard from "./pages/GPT5Dashboard";
import Pricing from "./pages/Pricing";
import VerifyEmail from "./pages/VerifyEmail";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ValidateToken from "./pages/ValidateToken";
import PaymentPurchase from "./pages/PaymentPurchase";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancel from "./pages/PaymentCancel";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthModal from "./components/AuthModal/AuthModal";
import { useAuthModal } from "./contexts/AuthModalContext";

// Wrapper component for AuthModal to use hooks
function AuthModalWrapper() {
  const { isOpen, closeModal, mode, onSuccessCallback } = useAuthModal();
  
  return (
    <AuthModal
      isOpen={isOpen}
      onClose={closeModal}
      onSuccess={onSuccessCallback || undefined}
      initialMode={mode}
    />
  );
}

function AppContent() {
  useEffect(() => {
    // Check authentication on app start
    store.dispatch(checkAuth());
  }, []);

  return (
    <NotificationProvider>
    <AuthProvider>
      <AuthModalProvider>
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

                {/* Payment Routes - Protected */}
                <Route
                  path="/payment/purchase"
                  element={
                    <ProtectedRoute>
                      <PaymentPurchase />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/success"
                  element={
                    <ProtectedRoute>
                      <PaymentSuccess />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/payment/cancel"
                  element={
                    <ProtectedRoute>
                      <PaymentCancel />
                    </ProtectedRoute>
                  }
                />

                {/* Tool Routes - Accessible without auth, auth required at submission */}
                <Route path="/voice/*" element={<Dashboard />} />
                <Route path="/video/*" element={<ToolsDashboard />} />
                <Route path="/images/*" element={<ImagesDashboard />} />
                <Route path="/gpt5/*" element={<GPT5Dashboard />} />

                {/* Legacy dashboard route - redirect to voice */}
                <Route path="/dashboard" element={<Navigate to="/voice/transcribe" replace />} />
                <Route path="/dashboard/*" element={<Navigate to="/voice/transcribe" replace />} />

                {/* Legacy tools route - redirect to video */}
                <Route path="/tools/*" element={<Navigate to="/video/text-to-video" replace />} />

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
            <AuthModalWrapper />
          </div>
        </Router>
      </AuthModalProvider>
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

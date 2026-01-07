import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, signupUser, clearError } from "../store/authSlice";
import type { RootState, AppDispatch } from "../store";
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaSpinner, FaEye, FaEyeSlash, FaExclamationTriangle } from "react-icons/fa";
import "./Login.css";

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading: authLoading, error: authError, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const hasNavigated = useRef(false);

  const isSignUpMode = location.pathname.includes("signup");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showEmailVerificationPrompt, setShowEmailVerificationPrompt] = useState(false);

  useEffect(() => {
    // Only redirect if user is authenticated AND there's a redirect parameter
    // This means they were redirected here from a protected route
    // Don't redirect if they explicitly navigated to login/signup pages
    const searchParams = new URLSearchParams(location.search);
    const redirectPath = searchParams.get('redirect');
    
    if (isAuthenticated && user && !hasNavigated.current && !authLoading && redirectPath) {
      hasNavigated.current = true;
      // Check if email is verified
      if (user.isEmailVerified) {
        navigate(redirectPath, { replace: true });
      } else {
        setShowEmailVerificationPrompt(true);
      }
    }
  }, [isAuthenticated, user, navigate, authLoading, location.search]);

  useEffect(() => {
    // Clear errors when switching between login/signup
    dispatch(clearError());
    hasNavigated.current = false;
    setShowEmailVerificationPrompt(false);
  }, [isSignUpMode, dispatch]);

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
    return errors;
  };

  const handlePasswordChange = (password: string) => {
    setPassword(password);
    if (isSignUpMode) {
      const errors = validatePassword(password);
      setPasswordErrors(errors);
    }
  };

  const getErrorMessage = (error: string | null): string => {
    if (!error) return "";
    
    // Handle specific error codes/messages
    if (error.includes("423") || error.toLowerCase().includes("locked")) {
      return "Account is locked due to too many failed login attempts. Please try again in 30 minutes.";
    }
    if (error.includes("429") || error.toLowerCase().includes("rate limit")) {
      return "Too many attempts. Please wait a moment before trying again.";
    }
    if (error.includes("401") || error.toLowerCase().includes("invalid credentials")) {
      return "Invalid email or password. Please check your credentials.";
    }
    if (error.includes("409") || error.toLowerCase().includes("already exists")) {
      return "An account with this email already exists.";
    }
    
    return error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setLoading(true);
    setShowEmailVerificationPrompt(false);

    if (isSignUpMode && passwordErrors.length > 0) {
      setLoading(false);
      return;
    }

    try {
      // Get redirect path from URL
      const searchParams = new URLSearchParams(location.search);
      const redirectPath = searchParams.get('redirect');
      
      if (isSignUpMode) {
        const result = await dispatch(signupUser({ email, password, name: name || undefined })).unwrap();
        if (result) {
          // Check if email is verified
          if (result.isEmailVerified) {
            navigate(redirectPath || "/dashboard", { replace: true });
          } else {
            setShowEmailVerificationPrompt(true);
          }
        }
      } else {
        const result = await dispatch(loginUser({ email, password })).unwrap();
        if (result) {
          // Check if email is verified
          if (result.isEmailVerified) {
            navigate(redirectPath || "/dashboard", { replace: true });
          } else {
            setShowEmailVerificationPrompt(true);
          }
        }
      }
    } catch (err: any) {
      // Error is handled by Redux
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">{isSignUpMode ? "Create VoiceCrypt Account" : "Welcome to VoiceCrypt"}</h1>
          <p className="login-subtitle">
            {isSignUpMode
              ? "Sign up now and transcribe your audio and videos! Get 100 free energy points"
              : "Sign in to access your secure transcriptions and recordings"}
          </p>
        </div>

        {showEmailVerificationPrompt && user && !user.isEmailVerified && (
          <div style={{ 
            padding: "1rem", 
            backgroundColor: "#fff3cd", 
            color: "#856404", 
            borderRadius: "4px", 
            marginBottom: "1rem",
            border: "1px solid #ffc107"
          }}>
            <FaExclamationTriangle style={{ marginRight: "0.5rem" }} />
            <strong>Email Verification Required</strong>
            <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
              Please verify your email address to continue. Check your inbox for the verification link.
            </p>
            <Link 
              to="/auth/verify-email" 
              style={{ 
                display: "inline-block", 
                marginTop: "0.5rem", 
                color: "#856404", 
                textDecoration: "underline",
                fontSize: "0.875rem"
              }}
            >
              Go to verification page
            </Link>
          </div>
        )}

        {authError && (
          <div className="error-message">
            {getErrorMessage(authError)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {isSignUpMode && (
            <div className="input-group">
              <label className="input-label">
                <FaUser className="input-icon" /> Name 
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Cryptographer Alpha"
                className="input-field"
                required
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">
              <FaEnvelope className="input-icon" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="secure@voicecrypt.com"
              className="input-field"
              required
            />
          </div>

          <div className="input-group">
            <label className="input-label">
              <FaLock className="input-icon" /> Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="input-field"
                required
                style={{ paddingRight: "2.5rem" }}
                minLength={isSignUpMode ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "0.75rem",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-secondary)",
                }}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {isSignUpMode && passwordErrors.length > 0 && (
              <div style={{ 
                marginTop: "0.5rem", 
                fontSize: "0.875rem", 
                color: "#f44336" 
              }}>
                <ul style={{ margin: 0, paddingLeft: "1.25rem" }}>
                  {passwordErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {isSignUpMode && passwordErrors.length === 0 && password && (
              <div style={{ 
                marginTop: "0.5rem", 
                fontSize: "0.875rem", 
                color: "#4caf50" 
              }}>
                Password meets all requirements
              </div>
            )}
          </div>

          {!isSignUpMode && (
            <div style={{ textAlign: "right", marginTop: "-0.5rem" }}>
              <Link 
                to="/auth/forgot-password" 
                style={{ 
                  color: "var(--primary-color)", 
                  fontSize: "0.8rem", 
                  textDecoration: "none" 
                }}
              >
                Forgot password?
              </Link>
            </div>
          )}

          <button 
            type="submit" 
            className={`submit-button ${loading || authLoading || (isSignUpMode && passwordErrors.length > 0) ? "disabled" : ""}`} 
            disabled={loading || authLoading || (isSignUpMode && passwordErrors.length > 0)}
          >
            {loading || authLoading ? (
              <div className="loading-content">
                <FaSpinner className="spinner" />
                Please wait...
              </div>
            ) : isSignUpMode ? (
              <>
                <FaUserPlus style={{ marginRight: "0.5rem" }} /> Sign Up
              </>
            ) : (
              <>
                <FaSignInAlt style={{ marginRight: "0.5rem" }} /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p className="toggle-text">
            {isSignUpMode ? "Already have an account?" : "New User? Deploy an account."}
            <Link 
              to={isSignUpMode 
                ? `/auth/login${location.search}` 
                : `/auth/signup${location.search}`} 
              className="toggle-button"
            >
              {isSignUpMode ? "Sign In" : "Sign Up"}
            </Link>
          </p>
        </div>

        <div className="back-link">
          <Link to="/" className="link">
            ← Back to Main Console
          </Link>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, signupUser, clearError } from "../../store/authSlice";
import type { RootState, AppDispatch } from "../../store";
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaSpinner, FaEye, FaEyeSlash, FaExclamationTriangle, FaTimes } from "react-icons/fa";
import "./AuthModal.css";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialMode?: "login" | "signup";
}

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = "login" }: AuthModalProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading: authLoading, error: authError, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [showEmailVerificationPrompt, setShowEmailVerificationPrompt] = useState(false);

  // Reset form when modal opens/closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setIsSignUpMode(initialMode === "signup");
      setEmail("");
      setPassword("");
      setName("");
      setShowPassword(false);
      setLoading(false);
      setPasswordErrors([]);
      setShowEmailVerificationPrompt(false);
      dispatch(clearError());
    }
  }, [isOpen, initialMode, dispatch]);

  // Handle successful authentication
  useEffect(() => {
    if (isAuthenticated && user && isOpen) {
      // Check if email is verified
      if (user.isEmailVerified) {
        // Close modal and call success callback if it's a function
        if (typeof onSuccess === 'function') {
          onSuccess();
        }
        onClose();
      } else {
        setShowEmailVerificationPrompt(true);
      }
    }
  }, [isAuthenticated, user, isOpen, onSuccess, onClose]);

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
      if (isSignUpMode) {
        const result = await dispatch(signupUser({ email, password, name: name || undefined })).unwrap();
        if (result && result.isEmailVerified) {
          // Success handled by useEffect
        }
      } else {
        const result = await dispatch(loginUser({ email, password })).unwrap();
        if (result && result.isEmailVerified) {
          // Success handled by useEffect
        }
      }
    } catch (err: any) {
      console.error("Authentication error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Debug logging
  useEffect(() => {
    console.log('[AuthModal] isOpen changed:', isOpen, 'Component mounted');
  }, [isOpen]);

  // Always render the overlay, but control visibility with CSS
  return (
    <div 
      className="auth-modal-overlay" 
      onClick={onClose}
      style={{ 
        display: isOpen ? 'flex' : 'none',
        zIndex: 10000
      }}
    >
      <div className="auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose} aria-label="Close">
          <FaTimes />
        </button>

        <div className="auth-modal-header">
          <h2 className="auth-modal-title">
            {isSignUpMode ? "Create Account" : "Sign In"}
          </h2>
          <p className="auth-modal-subtitle">
            {isSignUpMode
              ? "Sign up to continue with your request"
              : "Sign in to continue with your request"}
          </p>
        </div>

        {showEmailVerificationPrompt && user && !user.isEmailVerified && (
          <div className="auth-modal-verification-prompt">
            <FaExclamationTriangle />
            <div>
              <strong>Email Verification Required</strong>
              <p>Please verify your email address to continue. Check your inbox for the verification link.</p>
            </div>
          </div>
        )}

        {authError && (
          <div className="auth-modal-error">
            {getErrorMessage(authError)}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-modal-form">
          {isSignUpMode && (
            <div className="auth-modal-input-group">
              <label className="auth-modal-label">
                <FaUser className="auth-modal-icon" /> Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="auth-modal-input"
                required
              />
            </div>
          )}

          <div className="auth-modal-input-group">
            <label className="auth-modal-label">
              <FaEnvelope className="auth-modal-icon" /> Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="auth-modal-input"
              required
            />
          </div>

          <div className="auth-modal-input-group">
            <label className="auth-modal-label">
              <FaLock className="auth-modal-icon" /> Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="••••••••"
                className="auth-modal-input"
                required
                style={{ paddingRight: "2.5rem" }}
                minLength={isSignUpMode ? 8 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="auth-modal-password-toggle"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {isSignUpMode && passwordErrors.length > 0 && (
              <div className="auth-modal-password-errors">
                <ul>
                  {passwordErrors.map((err, idx) => (
                    <li key={idx}>{err}</li>
                  ))}
                </ul>
              </div>
            )}
            {isSignUpMode && passwordErrors.length === 0 && password && (
              <div className="auth-modal-password-success">
                Password meets all requirements
              </div>
            )}
          </div>

          <button
            type="submit"
            className={`auth-modal-submit ${loading || authLoading || (isSignUpMode && passwordErrors.length > 0) ? "disabled" : ""}`}
            disabled={loading || authLoading || (isSignUpMode && passwordErrors.length > 0)}
          >
            {loading || authLoading ? (
              <div className="auth-modal-loading">
                <FaSpinner className="auth-modal-spinner" />
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

        <div className="auth-modal-footer">
          <p className="auth-modal-toggle-text">
            {isSignUpMode ? "Already have an account?" : "New User?"}
            <button
              type="button"
              onClick={() => {
                setIsSignUpMode(!isSignUpMode);
                dispatch(clearError());
                setPasswordErrors([]);
              }}
              className="auth-modal-toggle-button"
            >
              {isSignUpMode ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


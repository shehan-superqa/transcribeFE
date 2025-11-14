import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, signupUser, clearError } from "../store/authSlice";
import type { RootState, AppDispatch } from "../store";
import { FaUser, FaLock, FaEnvelope, FaSignInAlt, FaUserPlus, FaSpinner } from "react-icons/fa";
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user && !hasNavigated.current && !authLoading) {
      hasNavigated.current = true;
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate, authLoading]);

  useEffect(() => {
    // Clear errors when switching between login/signup
    dispatch(clearError());
    hasNavigated.current = false;
  }, [isSignUpMode, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());
    setLoading(true);

    try {
      if (isSignUpMode) {
        const result = await dispatch(signupUser({ email, password, name: name || undefined })).unwrap();
        if (result) {
          navigate("/dashboard");
        }
      } else {
        const result = await dispatch(loginUser({ email, password })).unwrap();
        if (result) {
          navigate("/dashboard");
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
              ? "Sign up now and encrypt your audio! Get 100 free energy points"
              : "Sign in to access your secure transcriptions and recordings"}
          </p>
        </div>

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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="input-field"
              required
              minLength={6}
            />
          </div>

          {authError && <div className="error-message">{authError}</div>}

          <button type="submit" className={`submit-button ${loading || authLoading ? "disabled" : ""}`} disabled={loading || authLoading}>
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
            <Link to={isSignUpMode ? "/auth/login" : "/auth/signup"} className="toggle-button">
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

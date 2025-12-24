import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../lib/api";
import { FaLock, FaCheckCircle, FaSpinner, FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import "./Login.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (tokenParam) {
      setToken(tokenParam);
    }
  }, [searchParams]);

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
    setNewPassword(password);
    const errors = validatePassword(password);
    setPasswordErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError("Reset token is required. Please use the link from your email.");
      return;
    }

    const errors = validatePassword(newPassword);
    if (errors.length > 0) {
      setError("Please fix password requirements");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword(token, newPassword);
      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Password reset failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Reset Password</h1>
          <p className="login-subtitle">
            Enter your new password below
          </p>
        </div>

        {success ? (
          <div style={{ 
            padding: "1.5rem", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            borderRadius: "4px", 
            marginBottom: "1rem",
            textAlign: "center"
          }}>
            <FaCheckCircle style={{ fontSize: "2rem", marginBottom: "1rem" }} />
            <p style={{ margin: 0 }}>
              Password reset successfully! Redirecting to login...
            </p>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
              {!token && (
                <div className="input-group">
                  <label className="input-label">
                    Reset Token
                  </label>
                  <input
                    type="text"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Enter token from email"
                    className="input-field"
                    required
                  />
                </div>
              )}

              <div className="input-group">
                <label className="input-label">
                  <FaLock className="input-icon" /> New Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    className="input-field"
                    required
                    style={{ paddingRight: "2.5rem" }}
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
                {passwordErrors.length > 0 && (
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
                {passwordErrors.length === 0 && newPassword && (
                  <div style={{ 
                    marginTop: "0.5rem", 
                    fontSize: "0.875rem", 
                    color: "#4caf50" 
                  }}>
                    Password meets all requirements
                  </div>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">
                  <FaLock className="input-icon" /> Confirm Password
                </label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="input-field"
                    required
                    style={{ paddingRight: "2.5rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <div style={{ 
                    marginTop: "0.5rem", 
                    fontSize: "0.875rem", 
                    color: "#f44336" 
                  }}>
                    Passwords do not match
                  </div>
                )}
              </div>

              <button 
                type="submit" 
                className={`submit-button ${loading ? "disabled" : ""}`} 
                disabled={loading || passwordErrors.length > 0 || newPassword !== confirmPassword}
              >
                {loading ? (
                  <div className="loading-content">
                    <FaSpinner className="spinner" />
                    Resetting...
                  </div>
                ) : (
                  <>
                    <FaLock style={{ marginRight: "0.5rem" }} />
                    Reset Password
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="back-link">
          <Link to="/auth/login" className="link">
            <FaArrowLeft style={{ marginRight: "0.5rem" }} />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}


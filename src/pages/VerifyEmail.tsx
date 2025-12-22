import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { verifyEmail, resendVerificationEmail } from "../lib/api";
import { FaEnvelope, FaCheckCircle, FaSpinner, FaArrowLeft } from "react-icons/fa";
import "./Login.css";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const response = await verifyEmail(token);
      if (response.success) {
        setSuccess("Email verified successfully! You can now log in.");
        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please check your token and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setResendLoading(true);

    try {
      const response = await resendVerificationEmail(email);
      if (response.success) {
        setSuccess("Verification email sent! Please check your inbox.");
        setShowResend(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to resend verification email. Please try again.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Verify Your Email</h1>
          <p className="login-subtitle">
            Enter the verification token sent to your email address
          </p>
        </div>

        {success && (
          <div style={{ 
            padding: "1rem", 
            backgroundColor: "#d4edda", 
            color: "#155724", 
            borderRadius: "4px", 
            marginBottom: "1rem" 
          }}>
            <FaCheckCircle style={{ marginRight: "0.5rem" }} />
            {success}
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {!showResend ? (
          <form onSubmit={handleVerify} className="login-form">
            <div className="input-group">
              <label className="input-label">
                <FaEnvelope className="input-icon" /> Verification Token
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

            <button 
              type="submit" 
              className={`submit-button ${loading ? "disabled" : ""}`} 
              disabled={loading}
            >
              {loading ? (
                <div className="loading-content">
                  <FaSpinner className="spinner" />
                  Verifying...
                </div>
              ) : (
                <>
                  <FaCheckCircle style={{ marginRight: "0.5rem" }} />
                  Verify Email
                </>
              )}
            </button>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setShowResend(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-color)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Didn't receive the email? Resend verification
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResend} className="login-form">
            <div className="input-group">
              <label className="input-label">
                <FaEnvelope className="input-icon" /> Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="input-field"
                required
              />
            </div>

            <button 
              type="submit" 
              className={`submit-button ${resendLoading ? "disabled" : ""}`} 
              disabled={resendLoading}
            >
              {resendLoading ? (
                <div className="loading-content">
                  <FaSpinner className="spinner" />
                  Sending...
                </div>
              ) : (
                <>
                  <FaEnvelope style={{ marginRight: "0.5rem" }} />
                  Resend Verification Email
                </>
              )}
            </button>

            <div style={{ marginTop: "1rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={() => setShowResend(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-color)",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                Back to verification
              </button>
            </div>
          </form>
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


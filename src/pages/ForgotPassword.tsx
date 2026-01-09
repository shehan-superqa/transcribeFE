import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../lib/api";
import { FaEnvelope, FaCheckCircle, FaSpinner, FaArrowLeft } from "react-icons/fa";
import "../css/pages/Login.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await forgotPassword(email);
      if (response.success) {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err.message || "Failed to send password reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1 className="login-title">Forgot Password</h1>
          <p className="login-subtitle">
            Enter your email address and we'll send you a link to reset your password
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
              If the email exists, a password reset link has been sent to your email address.
              Please check your inbox and follow the instructions.
            </p>
          </div>
        ) : (
          <>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit} className="login-form">
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
                className={`submit-button ${loading ? "disabled" : ""}`} 
                disabled={loading}
              >
                {loading ? (
                  <div className="loading-content">
                    <FaSpinner className="spinner" />
                    Sending...
                  </div>
                ) : (
                  <>
                    <FaEnvelope style={{ marginRight: "0.5rem" }} />
                    Send Reset Link
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


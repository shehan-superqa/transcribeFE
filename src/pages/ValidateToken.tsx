import { useState } from "react";
import { validateToken, TokenValidationResponse } from "../lib/api";
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaKey } from "react-icons/fa";
import "./Login.css";

export default function ValidateToken() {
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TokenValidationResponse | null>(null);

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) {
      setResult({
        success: false,
        message: "Please enter a token",
        data: { valid: false },
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const validationResult = await validateToken(token.trim());
      setResult(validationResult);
    } catch (error: any) {
      setResult({
        success: false,
        message: error.message || "Token validation failed",
        data: { valid: false },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: "600px" }}>
        <div className="login-header">
          <h1 className="login-title">Token Validation</h1>
          <p className="login-subtitle">
            Validate an access token to check if it's valid and get user information
          </p>
        </div>

        <form onSubmit={handleValidate} className="login-form">
          <div className="input-group">
            <label className="input-label">
              <FaKey className="input-icon" /> Access Token
            </label>
            <textarea
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Enter the access token to validate"
              className="input-field"
              required
              rows={4}
              style={{
                resize: "vertical",
                fontFamily: "monospace",
                fontSize: "0.85rem",
              }}
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
                Validating...
              </div>
            ) : (
              <>
                <FaKey style={{ marginRight: "0.5rem" }} />
                Validate Token
              </>
            )}
          </button>
        </form>

        {result && (
          <div style={{ marginTop: "1.5rem" }}>
            {result.data?.valid ? (
              <div style={{
                padding: "1.5rem",
                backgroundColor: "#d4edda",
                color: "#155724",
                borderRadius: "8px",
                border: "1px solid #c3e6cb",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "1rem",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}>
                  <FaCheckCircle />
                  Token is Valid
                </div>
                {result.data.user && (
                  <div style={{
                    backgroundColor: "#ffffff",
                    padding: "1rem",
                    borderRadius: "6px",
                    marginTop: "1rem",
                  }}>
                    <h3 style={{
                      margin: "0 0 0.75rem 0",
                      fontSize: "0.95rem",
                      fontWeight: 600,
                      color: "#155724",
                    }}>
                      User Information:
                    </h3>
                    <div style={{
                      display: "grid",
                      gap: "0.5rem",
                      fontSize: "0.875rem",
                      color: "#155724",
                    }}>
                      <div>
                        <strong>ID:</strong> {result.data.user.id}
                      </div>
                      <div>
                        <strong>Email:</strong> {result.data.user.email}
                      </div>
                      <div>
                        <strong>Name:</strong> {result.data.user.name}
                      </div>
                      <div>
                        <strong>Email Verified:</strong>{" "}
                        {result.data.user.isEmailVerified ? (
                          <span style={{ color: "#28a745" }}>Yes</span>
                        ) : (
                          <span style={{ color: "#dc3545" }}>No</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: "1.5rem",
                backgroundColor: "#f8d7da",
                color: "#721c24",
                borderRadius: "8px",
                border: "1px solid #f5c6cb",
              }}>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  marginBottom: "0.5rem",
                  fontSize: "1.1rem",
                  fontWeight: 600,
                }}>
                  <FaTimesCircle />
                  Token is Invalid
                </div>
                {result.message && (
                  <p style={{ margin: "0.5rem 0 0 0", fontSize: "0.875rem" }}>
                    {result.message}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div style={{
          marginTop: "2rem",
          padding: "1rem",
          backgroundColor: "#1a1a1a",
          borderRadius: "8px",
          fontSize: "0.875rem",
          color: "#a0a0a0",
        }}>
          <h3 style={{
            margin: "0 0 0.75rem 0",
            fontSize: "0.95rem",
            fontWeight: 600,
            color: "#e0e0e0",
          }}>
            API Usage for Other Services:
          </h3>
          <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.85rem" }}>
            <strong>Note:</strong> Other services should call the backend API directly, not this frontend page.
          </p>
          <p style={{ margin: "0 0 0.5rem 0", fontSize: "0.85rem" }}>
            To validate a token, make a request to:
          </p>
          <code style={{
            display: "block",
            padding: "0.75rem",
            backgroundColor: "#121212",
            borderRadius: "4px",
            fontSize: "0.8rem",
            color: "#00c6ff",
            overflowX: "auto",
            marginTop: "0.5rem",
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}>
            GET {import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001'}/api/auth/me{'\n'}
            Headers:{'\n'}
              Authorization: Bearer &lt;your-access-token&gt;
          </code>
          <p style={{ margin: "0.75rem 0 0.5rem 0", fontSize: "0.85rem" }}>
            <strong>Response (200 OK):</strong>
          </p>
          <code style={{
            display: "block",
            padding: "0.75rem",
            backgroundColor: "#121212",
            borderRadius: "4px",
            fontSize: "0.8rem",
            color: "#00c6ff",
            overflowX: "auto",
            marginTop: "0.5rem",
            whiteSpace: "pre-wrap",
          }}>
            {"{"}{'\n'}
              "success": true,{'\n'}
              "data": {"{"}{'\n'}
                "id": "user-id",{'\n'}
                "email": "user@example.com",{'\n'}
                "name": "User Name",{'\n'}
                "isEmailVerified": true{'\n'}
              {"}"}{'\n'}
            {"}"}
          </code>
          <p style={{ margin: "0.75rem 0 0.5rem 0", fontSize: "0.85rem" }}>
            <strong>Response (401 Unauthorized):</strong> Token is invalid or expired
          </p>
          <code style={{
            display: "block",
            padding: "0.75rem",
            backgroundColor: "#121212",
            borderRadius: "4px",
            fontSize: "0.8rem",
            color: "#00c6ff",
            overflowX: "auto",
            marginTop: "0.5rem",
            whiteSpace: "pre-wrap",
          }}>
            {"{"}{'\n'}
              "success": false,{'\n'}
              "message": "Invalid or expired token"{'\n'}
            {"}"}
          </code>
        </div>
      </div>
    </div>
  );
}


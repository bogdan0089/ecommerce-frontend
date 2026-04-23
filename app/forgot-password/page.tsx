"use client";

import { useState } from "react";
import { forgotPassword } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = {
    width: "100%",
    backgroundColor: "#0d0d0d",
    border: "1px solid #1f1f1f",
    color: "#fff",
    padding: "14px 16px",
    fontSize: "14px",
    borderRadius: "2px",
    outline: "none",
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`input::placeholder { color: #333; }`}</style>

      <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>

      <div style={{ width: "100%", maxWidth: "400px" }}>
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#16a34a20", border: "1px solid #16a34a40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <span style={{ color: "#16a34a", fontSize: "28px" }}>✓</span>
            </div>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>CHECK YOUR EMAIL</p>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Link sent!</h1>
            <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>
              We sent a reset link to <strong style={{ color: "#fff" }}>{email}</strong>
            </p>
            <a href="/login" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>← BACK TO LOGIN</a>
          </div>
        ) : (
          <>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>PASSWORD RESET</p>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "8px" }}>Forgot password?</h1>
            <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>Enter your email and we'll send you a reset link.</p>

            {error && (
              <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "20px", fontSize: "13px" }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>EMAIL</p>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ backgroundColor: loading ? "#111" : "#fff", color: loading ? "#333" : "#000", border: loading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", marginTop: "8px" }}
              >
                {loading ? "SENDING..." : "SEND RESET LINK"}
              </button>
            </form>

            <p style={{ textAlign: "center", marginTop: "32px", color: "#333", fontSize: "13px" }}>
              Remember your password?{" "}
              <a href="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: "600" }}>Log in</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

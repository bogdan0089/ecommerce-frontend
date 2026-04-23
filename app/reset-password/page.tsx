"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await resetPassword(token, password);
      setDone(true);
      setTimeout(() => router.push("/login"), 2000);
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

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#16a34a20", border: "1px solid #16a34a40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
          <span style={{ color: "#16a34a", fontSize: "28px" }}>✓</span>
        </div>
        <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>SUCCESS</p>
        <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Password updated!</h1>
        <p style={{ color: "#555", fontSize: "14px" }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>ACCOUNT</p>
      <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "8px" }}>New password</h1>
      <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>Choose a strong password for your account.</p>

      {error && (
        <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "20px", fontSize: "13px" }}>
          {error}
        </div>
      )}

      {!token && (
        <div style={{ backgroundColor: "#d9770610", border: "1px solid #d9770640", color: "#d97706", padding: "12px 16px", borderRadius: "2px", marginBottom: "20px", fontSize: "13px" }}>
          No reset token found. Please use the link from your email.
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>NEW PASSWORD</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Min. 6 characters"
            style={inputStyle}
          />
        </div>
        <div>
          <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>CONFIRM PASSWORD</p>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            placeholder="Repeat password"
            style={inputStyle}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !token}
          style={{ backgroundColor: (loading || !token) ? "#111" : "#fff", color: (loading || !token) ? "#333" : "#000", border: (loading || !token) ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: (loading || !token) ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", marginTop: "8px" }}
        >
          {loading ? "SAVING..." : "SET NEW PASSWORD"}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`input::placeholder { color: #333; }`}</style>
      <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        <Suspense fallback={<p style={{ color: "#444" }}>Loading...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}

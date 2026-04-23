"use client";

import { useState } from "react";
import { registerClient } from "@/lib/api";

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerClient({
        name: form.name,
        email: form.email,
        password: form.password,
        age: parseInt(form.age),
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
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

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>
        <div style={{ textAlign: "center", maxWidth: "400px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#16a34a20", border: "1px solid #16a34a40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
            <span style={{ color: "#16a34a", fontSize: "28px" }}>✓</span>
          </div>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>CHECK YOUR EMAIL</p>
          <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Almost there!</h1>
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>
            We sent a confirmation link to <strong style={{ color: "#fff" }}>{form.email}</strong>. Click it to activate your account.
          </p>
          <a href="/login" style={{ backgroundColor: "#fff", color: "#000", padding: "14px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>
            GO TO LOGIN
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`input::placeholder { color: #333; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }`}</style>

      <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>

      <div style={{ width: "100%", maxWidth: "380px" }}>
        <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>GET STARTED</p>
        <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "40px" }}>Create account</h1>

        {error && (
          <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>FULL NAME</p>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="John Doe"
              style={inputStyle}
            />
          </div>
          <div>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>EMAIL</p>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>
          <div>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>PASSWORD</p>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="Min. 6 characters"
              style={inputStyle}
            />
          </div>
          <div>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>AGE</p>
            <input
              type="number"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              required
              min="1"
              max="120"
              placeholder="25"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#111" : "#fff", color: loading ? "#333" : "#000", border: loading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", marginTop: "8px", transition: "all 0.2s" }}
          >
            {loading ? "CREATING..." : "CREATE ACCOUNT"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "32px", color: "#333", fontSize: "13px" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#fff", textDecoration: "none", fontWeight: "600" }}>Log in</a>
        </p>
      </div>
    </div>
  );
}

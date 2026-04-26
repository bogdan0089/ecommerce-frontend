"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginClient, saveTokens } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: { preventDefault(): void }) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const tokens = await loginClient({ username: form.email, password: form.password });
      saveTokens(tokens.access_token, tokens.refresh_token);
      router.push("/products");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #9ca3af; } input:focus { border-color: #111 !important; outline: none; }`}</style>

      <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none", marginBottom: "48px" }}>SHOP</a>

      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "40px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>Welcome back</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Log in to your account</p>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="your@email.com"
              style={{ width: "100%", backgroundColor: "#fff", border: "1px solid #e5e7eb", color: "#111", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", transition: "border-color 0.2s" }}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
              <label style={{ color: "#374151", fontSize: "13px", fontWeight: "500" }}>Password</label>
              <a href="/forgot-password" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>Forgot password?</a>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              style={{ width: "100%", backgroundColor: "#fff", border: "1px solid #e5e7eb", color: "#111", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", transition: "border-color 0.2s" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#6b7280" : "#111", color: "#fff", border: "none", padding: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px", marginTop: "8px", transition: "background 0.2s" }}
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#6b7280", fontSize: "14px" }}>
          No account?{" "}
          <a href="/register" style={{ color: "#111", textDecoration: "none", fontWeight: "600" }}>Sign up</a>
        </p>
      </div>
    </div>
  );
}

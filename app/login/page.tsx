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
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`input::placeholder { color: #333; }`}</style>

      <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>

      <div style={{ width: "100%", maxWidth: "380px" }}>
        <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>WELCOME BACK</p>
        <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "40px" }}>Log in</h1>

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
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              placeholder="your@email.com"
              style={inputStyle}
            />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px" }}>PASSWORD</p>
              <a href="/forgot-password" style={{ color: "#444", fontSize: "10px", letterSpacing: "1px", textDecoration: "none" }}>FORGOT?</a>
            </div>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#111" : "#fff", color: loading ? "#333" : "#000", border: loading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", marginTop: "8px", transition: "all 0.2s" }}
          >
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "32px", color: "#333", fontSize: "13px" }}>
          No account?{" "}
          <a href="/register" style={{ color: "#fff", textDecoration: "none", fontWeight: "600" }}>Create one</a>
        </p>
      </div>
    </div>
  );
}

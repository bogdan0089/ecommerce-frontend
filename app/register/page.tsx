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

  if (success) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
        <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none", marginBottom: "48px" }}>SHOP</a>
        <div style={{ textAlign: "center", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "48px 40px" }}>
          <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
            <span style={{ color: "#16a34a", fontSize: "24px" }}>✓</span>
          </div>
          <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111", marginBottom: "8px" }}>Check your email</h1>
          <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>
            We sent a confirmation link to <strong style={{ color: "#111" }}>{form.email}</strong>. Click it to activate your account.
          </p>
          <a href="/login" style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "12px 32px", fontSize: "14px", fontWeight: "600", textDecoration: "none", borderRadius: "8px" }}>
            Go to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #9ca3af; } input:focus { border-color: #111 !important; outline: none; } input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; }`}</style>

      <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none", marginBottom: "48px" }}>SHOP</a>

      <div style={{ width: "100%", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "40px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111", marginBottom: "4px" }}>Create account</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Join us today</p>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { label: "Full name", key: "name", type: "text", placeholder: "John Doe" },
            { label: "Email", key: "email", type: "email", placeholder: "your@email.com" },
            { label: "Password", key: "password", type: "password", placeholder: "Min. 8 characters" },
            { label: "Age", key: "age", type: "number", placeholder: "25" },
          ].map((field) => (
            <div key={field.key}>
              <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{field.label}</label>
              <input
                type={field.type}
                value={form[field.key as keyof typeof form]}
                onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                required
                min={field.key === "age" ? "1" : undefined}
                max={field.key === "age" ? "120" : undefined}
                placeholder={field.placeholder}
                style={{ width: "100%", backgroundColor: "#fff", border: "1px solid #e5e7eb", color: "#111", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", transition: "border-color 0.2s" }}
              />
            </div>
          ))}

          <button
            type="submit"
            disabled={loading}
            style={{ backgroundColor: loading ? "#6b7280" : "#111", color: "#fff", border: "none", padding: "12px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px", marginTop: "8px", transition: "background 0.2s" }}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "24px", color: "#6b7280", fontSize: "14px" }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: "#111", textDecoration: "none", fontWeight: "600" }}>Log in</a>
        </p>
      </div>
    </div>
  );
}

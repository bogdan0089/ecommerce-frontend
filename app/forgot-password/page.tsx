"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { AuthShell } from "@/components/nav";
import { Alert, Button, Eyebrow, PageTitle, StatusMark, TextField } from "@/components/ui";
import { useFieldErrors } from "@/lib/formErrors";
import { color } from "@/lib/theme";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { errors, onSubmit, clear } = useFieldErrors();

  async function handleSubmit() {
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

  if (sent) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center" }}>
          <StatusMark tone="success" glyph="✓" />
          <Eyebrow style={{ marginBottom: "12px" }}>Check your email</Eyebrow>
          <PageTitle style={{ fontSize: "28px", marginBottom: "12px" }}>Link sent</PageTitle>
          <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "40px" }}>
            We sent a reset link to <strong style={{ color: color.text }}>{email}</strong>
          </p>
          <Link href="/login" style={{ color: color.textMuted, fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>
            ← BACK TO LOGIN
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Eyebrow style={{ marginBottom: "8px" }}>Password reset</Eyebrow>
      <PageTitle style={{ marginBottom: "8px" }}>Forgot password?</PageTitle>
      <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "40px" }}>
        Enter your email and we&apos;ll send you a reset link.
      </p>

      {error && <Alert style={{ marginBottom: "20px" }}>{error}</Alert>}

      <form noValidate onSubmit={onSubmit(handleSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <TextField
          label="Email"
          name="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clear("email");
          }}
          required
          placeholder="Enter your email address"
          error={errors.email}
        />

        <Button type="submit" size="lg" full disabled={loading} style={{ marginTop: "8px" }}>
          {loading ? "Sending..." : "Send reset link"}
        </Button>
      </form>

      <p style={{ textAlign: "center", marginTop: "32px", color: color.textFaint, fontSize: "13px" }}>
        Remember your password?{" "}
        <Link href="/login" style={{ color: color.text, textDecoration: "none", fontWeight: "600" }}>
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

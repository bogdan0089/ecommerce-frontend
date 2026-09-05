"use client";

import { useState } from "react";
import Link from "next/link";
import { registerClient, resendVerification } from "@/lib/api";
import { AuthShell } from "@/components/nav";
import { Alert, Button, Eyebrow, LinkButton, PageTitle, StatusMark, TextField } from "@/components/ui";
import { useFieldErrors } from "@/lib/formErrors";
import { color } from "@/lib/theme";

const FIELDS = [
  { label: "Full name", key: "name", type: "text", placeholder: "Enter your full name", minLength: 2 },
  { label: "Email", key: "email", type: "email", placeholder: "Enter your email address" },
  { label: "Password", key: "password", type: "password", placeholder: "Choose a password, min. 8 characters", minLength: 8 },
  { label: "Age", key: "age", type: "number", placeholder: "Enter your age" },
] as const;

export default function RegisterPage() {
  const [form, setForm] = useState({ name: "", email: "", password: "", age: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent" | "failed">("idle");
  const [resendMessage, setResendMessage] = useState("");
  const { errors, onSubmit, clear } = useFieldErrors();

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      await registerClient({
        name: form.name,
        email: form.email,
        password: form.password,
        age: parseInt(form.age, 10),
      });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendState("sending");
    setResendMessage("");
    try {
      const result = await resendVerification(form.email);
      setResendMessage(result.message);
      setResendState("sent");
    } catch (err: unknown) {
      setResendMessage(err instanceof Error ? err.message : "Could not send the email");
      setResendState("failed");
    }
  }

  if (success) {
    return (
      <AuthShell>
        <div style={{ textAlign: "center" }}>
          <StatusMark tone="success" glyph="✓" />
          <Eyebrow style={{ marginBottom: "12px" }}>Check your email</Eyebrow>
          <PageTitle style={{ fontSize: "28px", marginBottom: "12px" }}>Almost there</PageTitle>
          <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "28px" }}>
            We sent a confirmation link to <strong style={{ color: color.text }}>{form.email}</strong>. Click it to
            activate your account.
          </p>

          {resendMessage && (
            <Alert tone={resendState === "failed" ? "error" : "success"} style={{ marginBottom: "24px", textAlign: "left" }}>
              {resendMessage}
            </Alert>
          )}

          <LinkButton href="/login" size="lg" full>
            Go to login
          </LinkButton>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleResend}
            disabled={resendState === "sending"}
            style={{ marginTop: "16px" }}
          >
            {resendState === "sending" ? "Sending..." : "Did not get it? Send again"}
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <Eyebrow style={{ marginBottom: "8px" }}>Account</Eyebrow>
      <PageTitle style={{ marginBottom: "8px" }}>Create account</PageTitle>
      <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "40px" }}>Join us today.</p>

      {error && <Alert style={{ marginBottom: "20px" }}>{error}</Alert>}

      <form noValidate onSubmit={onSubmit(handleSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {FIELDS.map((field) => (
          <TextField
            key={field.key}
            label={field.label}
            name={field.key}
            type={field.type}
            value={form[field.key]}
            onChange={(e) => {
              setForm({ ...form, [field.key]: e.target.value });
              clear(field.key);
            }}
            required
            minLength={"minLength" in field ? field.minLength : undefined}
            min={field.key === "age" ? 1 : undefined}
            max={field.key === "age" ? 120 : undefined}
            placeholder={field.placeholder}
            error={errors[field.key]}
          />
        ))}

        <Button type="submit" size="lg" full disabled={loading} style={{ marginTop: "8px" }}>
          {loading ? "Creating account..." : "Create account"}
        </Button>
      </form>

      <p style={{ textAlign: "center", marginTop: "32px", color: color.textFaint, fontSize: "13px" }}>
        Already have an account?{" "}
        <Link href="/login" style={{ color: color.text, textDecoration: "none", fontWeight: "600" }}>
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

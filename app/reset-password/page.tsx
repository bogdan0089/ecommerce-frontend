"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPassword } from "@/lib/api";
import { AuthShell } from "@/components/nav";
import { Alert, Button, Eyebrow, PageTitle, StatusMark, TextField } from "@/components/ui";
import { useFieldErrors } from "@/lib/formErrors";
import { color } from "@/lib/theme";

function ResetPasswordForm() {
  const router = useRouter();
  const token = useSearchParams().get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const { errors, setErrors, onSubmit, clear } = useFieldErrors();

  async function handleSubmit() {
    if (password !== confirm) {
      setErrors({ confirm: "Passwords do not match" });
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
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div style={{ textAlign: "center" }}>
        <StatusMark tone="success" glyph="✓" />
        <Eyebrow style={{ marginBottom: "12px" }}>Success</Eyebrow>
        <PageTitle style={{ fontSize: "28px", marginBottom: "12px" }}>Password updated</PageTitle>
        <p style={{ color: color.textMuted, fontSize: "14px" }}>Redirecting to login...</p>
      </div>
    );
  }

  return (
    <>
      <Eyebrow style={{ marginBottom: "8px" }}>Account</Eyebrow>
      <PageTitle style={{ marginBottom: "8px" }}>New password</PageTitle>
      <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "40px" }}>
        Choose a strong password for your account.
      </p>

      {error && <Alert style={{ marginBottom: "20px" }}>{error}</Alert>}

      {!token && (
        <Alert tone="warning" style={{ marginBottom: "20px" }}>
          No reset token found. Please use the link from your email.
        </Alert>
      )}

      <form noValidate onSubmit={onSubmit(handleSubmit)} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <TextField
          label="New password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            clear("password");
          }}
          required
          minLength={8}
          placeholder="Choose a new password, min. 8 characters"
          error={errors.password}
        />
        <TextField
          label="Confirm password"
          name="confirm"
          type="password"
          value={confirm}
          onChange={(e) => {
            setConfirm(e.target.value);
            clear("confirm");
          }}
          required
          placeholder="Repeat the new password"
          error={errors.confirm}
        />

        <Button type="submit" size="lg" full disabled={loading || !token} style={{ marginTop: "8px" }}>
          {loading ? "Saving..." : "Set new password"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell>
      <Suspense fallback={<p style={{ color: color.textDim, fontSize: "13px" }}>Loading...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}

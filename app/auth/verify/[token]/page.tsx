"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";
import { AuthShell } from "@/components/nav";
import { Alert, Eyebrow, LinkButton, PageTitle, Spinner, StatusMark } from "@/components/ui";
import { color } from "@/lib/theme";

type Status = "loading" | "success" | "error";

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : "Verification failed");
        setStatus("error");
      });
  }, [token]);

  return (
    <AuthShell>
      <div style={{ textAlign: "center" }}>
        {status === "loading" && (
          <>
            <Spinner size={40} style={{ margin: "0 auto 32px" }} />
            <Eyebrow>Verifying email</Eyebrow>
          </>
        )}

        {status === "success" && (
          <>
            <StatusMark tone="success" glyph="✓" />
            <Eyebrow style={{ marginBottom: "12px" }}>Email verified</Eyebrow>
            <PageTitle style={{ marginBottom: "12px" }}>You&apos;re in</PageTitle>
            <p style={{ color: color.textMuted, fontSize: "14px", marginBottom: "40px" }}>
              Your email has been confirmed. You can now log in.
            </p>
            <LinkButton href="/login" size="lg">
              Go to login
            </LinkButton>
          </>
        )}

        {status === "error" && (
          <>
            <StatusMark tone="error" glyph="✗" />
            <Eyebrow style={{ marginBottom: "12px" }}>Verification failed</Eyebrow>
            <PageTitle style={{ fontSize: "28px", marginBottom: "12px" }}>Link expired</PageTitle>
            <Alert style={{ marginBottom: "40px" }}>{error}</Alert>
            <LinkButton href="/register" variant="secondary" size="lg">
              Register again
            </LinkButton>
          </>
        )}
      </div>
    </AuthShell>
  );
}

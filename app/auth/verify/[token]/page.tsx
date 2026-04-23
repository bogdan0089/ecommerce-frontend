"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { verifyEmail } from "@/lib/api";

export default function VerifyEmailPage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) return;
    verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Verification failed");
        setStatus("error");
      });
  }, [token]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 20px" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none", marginBottom: "56px" }}>SHOP</a>

      <div style={{ textAlign: "center", maxWidth: "400px" }}>
        {status === "loading" && (
          <>
            <div style={{ width: "40px", height: "40px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 32px" }} />
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "4px" }}>VERIFYING EMAIL</p>
          </>
        )}

        {status === "success" && (
          <>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#16a34a20", border: "1px solid #16a34a40", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <span style={{ color: "#16a34a", fontSize: "28px" }}>✓</span>
            </div>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>EMAIL VERIFIED</p>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>You're in!</h1>
            <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>Your email has been confirmed. You can now log in.</p>
            <a href="/login" style={{ backgroundColor: "#fff", color: "#000", padding: "14px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>
              GO TO LOGIN
            </a>
          </>
        )}

        {status === "error" && (
          <>
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#dc262620", border: "1px solid #dc262640", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px" }}>
              <span style={{ color: "#dc2626", fontSize: "28px" }}>✗</span>
            </div>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>VERIFICATION FAILED</p>
            <h1 style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Link expired</h1>
            <p style={{ color: "#dc2626", fontSize: "13px", backgroundColor: "#dc262610", padding: "12px 16px", borderRadius: "2px", marginBottom: "40px" }}>
              {error}
            </p>
            <a href="/register" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", border: "1px solid #222", padding: "12px 32px" }}>
              REGISTER AGAIN
            </a>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api";

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!getAccessToken());
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        .fade-1 { animation: fadeUp 0.7s ease forwards; }
        .fade-2 { animation: fadeUp 0.7s ease 0.12s forwards; opacity: 0; }
        .fade-3 { animation: fadeUp 0.7s ease 0.24s forwards; opacity: 0; }
        .fade-4 { animation: fadeUp 0.7s ease 0.36s forwards; opacity: 0; }
        .fade-5 { animation: fadeUp 0.7s ease 0.48s forwards; opacity: 0; }
        .btn-primary { transition: background 0.2s, transform 0.15s; }
        .btn-primary:hover { background: #e5e5e5 !important; transform: translateY(-1px); }
        .btn-secondary { transition: all 0.2s; }
        .btn-secondary:hover { border-color: #555 !important; color: #ccc !important; }
        .feature-card { transition: all 0.25s; }
        .feature-card:hover { border-color: #1e1e1e !important; background: #0d0d0d !important; transform: translateY(-2px); }
        .stat-item { transition: all 0.2s; }
        .tech-tag { transition: all 0.2s; }
        .tech-tag:hover { border-color: #333 !important; color: #fff !important; }
        a { transition: color 0.15s; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.92)", backdropFilter: "blur(20px)", borderBottom: "1px solid #111", padding: "0 48px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "14px", fontWeight: "800", letterSpacing: "6px" }}>SHOP</span>
        <div style={{ display: "flex", gap: "32px", alignItems: "center" }}>
          <a href="/products" style={{ color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PRODUCTS</a>
          {isLoggedIn ? (
            <>
              <a href="/profile" style={{ color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PROFILE</a>
              <a href="/cart" style={{ backgroundColor: "#fff", color: "#000", padding: "8px 22px", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>CART</a>
            </>
          ) : (
            <>
              <a href="/login" style={{ color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>LOGIN</a>
              <a href="/register" style={{ backgroundColor: "#fff", color: "#000", padding: "8px 22px", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>SIGN UP</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "130px 48px 80px", display: "grid", gridTemplateColumns: "1fr 380px", gap: "80px", alignItems: "center" }}>
        <div>
          <div className="fade-1">
            <span style={{ display: "inline-block", backgroundColor: "#111", border: "1px solid #1e1e1e", color: "#555", fontSize: "10px", letterSpacing: "3px", padding: "6px 14px", borderRadius: "2px", marginBottom: "32px" }}>
              NEW COLLECTION 2025
            </span>
          </div>
          <div className="fade-2">
            <h1 style={{ fontSize: "clamp(52px, 7vw, 88px)", fontWeight: "800", letterSpacing: "-3px", lineHeight: "0.95", marginBottom: "28px" }}>
              Style<br />
              <span style={{ color: "#2a2a2a" }}>that</span><br />
              speaks.
            </h1>
          </div>
          <div className="fade-3">
            <p style={{ color: "#444", fontSize: "15px", lineHeight: "1.8", maxWidth: "380px", marginBottom: "44px" }}>
              Premium products curated for those who demand quality. No noise — just the best.
            </p>
          </div>
          <div className="fade-4" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <a href="/products" className="btn-primary" style={{ backgroundColor: "#fff", color: "#000", padding: "15px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>
              SHOP NOW
            </a>
            {!isLoggedIn && (
              <a href="/register" className="btn-secondary" style={{ background: "none", color: "#444", border: "1px solid #1a1a1a", padding: "15px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "600", borderRadius: "2px" }}>
                CREATE ACCOUNT
              </a>
            )}
          </div>
        </div>

        {/* Stats panel */}
        <div className="fade-5" style={{ backgroundColor: "#0c0c0c", border: "1px solid #141414", borderRadius: "4px", padding: "36px 32px", display: "flex", flexDirection: "column", gap: "0" }}>
          {[
            { value: "24h", label: "Order processing" },
            { value: "100%", label: "Secure payments" },
            { value: "REST API", label: "Full-stack project" },
            { value: "Live", label: "Deployed on AWS" },
          ].map((s, i, arr) => (
            <div key={s.label} style={{ padding: "22px 0", borderBottom: i < arr.length - 1 ? "1px solid #111" : "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#333", fontSize: "12px", letterSpacing: "1px" }}>{s.label}</span>
              <span style={{ fontSize: "22px", fontWeight: "800", letterSpacing: "-1px" }}>{s.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #0f0f0f", maxWidth: "1100px", margin: "0 auto" }} />

      {/* Features */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 48px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
          <p style={{ color: "#222", fontSize: "11px", letterSpacing: "5px" }}>WHY SHOP WITH US</p>
          <a href="/products" style={{ color: "#333", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>VIEW ALL →</a>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#111" }}>
          {[
            { icon: "◈", title: "Premium Quality", desc: "Every product is handpicked and approved by our team before listing." },
            { icon: "⟳", title: "Easy Returns", desc: "Not satisfied? Cancel your order and get a full refund instantly." },
            { icon: "⚡", title: "Fast Checkout", desc: "One-click checkout with your stored balance. No extra steps." },
            { icon: "◎", title: "Secure Account", desc: "JWT auth, email verification, and encrypted passwords." },
          ].map((f) => (
            <div key={f.title} className="feature-card" style={{ backgroundColor: "#0a0a0a", padding: "40px 28px", transition: "all 0.25s" }}>
              <p style={{ color: "#222", fontSize: "28px", marginBottom: "24px" }}>{f.icon}</p>
              <p style={{ fontWeight: "700", fontSize: "12px", letterSpacing: "2px", marginBottom: "12px", textTransform: "uppercase" }}>{f.title}</p>
              <p style={{ color: "#333", fontSize: "13px", lineHeight: "1.7" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section style={{ borderTop: "1px solid #0f0f0f" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "48px 48px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <p style={{ color: "#222", fontSize: "10px", letterSpacing: "3px", flexShrink: 0 }}>BUILT WITH</p>
          <div style={{ width: "1px", height: "14px", backgroundColor: "#1a1a1a" }} />
          {["FastAPI", "PostgreSQL", "Redis", "Next.js 16", "Stripe", "Celery", "Docker", "AWS EC2"].map((tech) => (
            <span key={tech} className="tech-tag" style={{ color: "#2a2a2a", fontSize: "11px", letterSpacing: "1px", border: "1px solid #141414", padding: "5px 12px", borderRadius: "2px", cursor: "default" }}>{tech}</span>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid #0f0f0f", borderBottom: "1px solid #0f0f0f" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "100px 48px", display: "grid", gridTemplateColumns: "1fr auto", gap: "40px", alignItems: "center" }}>
          <div>
            <p style={{ color: "#222", fontSize: "11px", letterSpacing: "4px", marginBottom: "16px" }}>READY TO START?</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: "800", letterSpacing: "-2px", lineHeight: "1.1" }}>Browse the collection.</h2>
          </div>
          <a href="/products" className="btn-primary" style={{ backgroundColor: "#fff", color: "#000", padding: "18px 52px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px", flexShrink: 0, display: "block" }}>
            VIEW ALL PRODUCTS
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "5px" }}>SHOP</span>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="/products" style={{ color: "#222", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PRODUCTS</a>
          <a href="/login" style={{ color: "#222", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>LOGIN</a>
          <a href="/register" style={{ color: "#222", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>REGISTER</a>
        </div>
        <p style={{ color: "#1a1a1a", fontSize: "11px" }}>© 2025 SHOP. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

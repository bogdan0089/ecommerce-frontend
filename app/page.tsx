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
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .fade-1 { animation: fadeUp 0.6s ease forwards; }
        .fade-2 { animation: fadeUp 0.6s ease 0.15s forwards; opacity: 0; }
        .fade-3 { animation: fadeUp 0.6s ease 0.3s forwards; opacity: 0; }
        .fade-4 { animation: fadeUp 0.6s ease 0.45s forwards; opacity: 0; }
        .btn-primary:hover { background: #e5e5e5 !important; }
        .btn-secondary:hover { border-color: #444 !important; color: #aaa !important; }
        .feature-card:hover { border-color: #222 !important; background: #0d0d0d !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px" }}>SHOP</span>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="/products" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PRODUCTS</a>
          {isLoggedIn ? (
            <>
              <a href="/profile" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PROFILE</a>
              <a href="/cart" style={{ backgroundColor: "#fff", color: "#000", padding: "8px 20px", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>CART</a>
            </>
          ) : (
            <>
              <a href="/login" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>LOGIN</a>
              <a href="/register" style={{ backgroundColor: "#fff", color: "#000", padding: "8px 20px", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", fontWeight: "800", borderRadius: "2px" }}>SIGN UP</a>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "120px 40px 100px" }}>
        <div className="fade-1">
          <p style={{ color: "#333", fontSize: "11px", letterSpacing: "5px", marginBottom: "24px" }}>NEW COLLECTION 2025</p>
        </div>
        <div className="fade-2">
          <h1 style={{ fontSize: "clamp(48px, 8vw, 96px)", fontWeight: "800", letterSpacing: "-3px", lineHeight: "1", marginBottom: "32px", maxWidth: "700px" }}>
            Style that<br />
            <span style={{ color: "#333" }}>speaks for</span><br />
            itself.
          </h1>
        </div>
        <div className="fade-3">
          <p style={{ color: "#555", fontSize: "16px", lineHeight: "1.7", maxWidth: "420px", marginBottom: "48px" }}>
            Premium products curated for those who demand quality. No noise — just the best.
          </p>
        </div>
        <div className="fade-4" style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <a href="/products" className="btn-primary" style={{ backgroundColor: "#fff", color: "#000", padding: "16px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px", transition: "background 0.2s" }}>
            SHOP NOW
          </a>
          {!isLoggedIn && (
            <a href="/register" className="btn-secondary" style={{ background: "none", color: "#555", border: "1px solid #222", padding: "16px 40px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "600", borderRadius: "2px", transition: "all 0.2s" }}>
              CREATE ACCOUNT
            </a>
          )}
        </div>
      </section>

      {/* Divider */}
      <div style={{ borderTop: "1px solid #111", maxWidth: "1100px", margin: "0 auto" }} />

      {/* Features */}
      <section style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 40px" }}>
        <p style={{ color: "#333", fontSize: "11px", letterSpacing: "5px", marginBottom: "48px" }}>WHY SHOP WITH US</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1px", backgroundColor: "#111" }}>
          {[
            { icon: "◈", title: "Premium Quality", desc: "Every product is handpicked and approved by our team before listing." },
            { icon: "⟳", title: "Easy Returns", desc: "Not satisfied? Cancel your order and get a full refund instantly." },
            { icon: "⚡", title: "Fast Checkout", desc: "One-click checkout with your stored balance. No extra steps." },
            { icon: "◎", title: "Secure Account", desc: "JWT auth, email verification, and encrypted passwords." },
          ].map((f) => (
            <div key={f.title} className="feature-card" style={{ backgroundColor: "#0a0a0a", padding: "36px 28px", border: "none", transition: "all 0.2s", cursor: "default" }}>
              <p style={{ color: "#444", fontSize: "22px", marginBottom: "20px" }}>{f.icon}</p>
              <p style={{ fontWeight: "700", fontSize: "13px", letterSpacing: "1px", marginBottom: "10px" }}>{f.title}</p>
              <p style={{ color: "#444", fontSize: "13px", lineHeight: "1.6" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ borderTop: "1px solid #111", borderBottom: "1px solid #111" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "80px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "40px", flexWrap: "wrap" }}>
          <div>
            <p style={{ color: "#333", fontSize: "11px", letterSpacing: "4px", marginBottom: "12px" }}>READY TO START?</p>
            <h2 style={{ fontSize: "36px", fontWeight: "800", letterSpacing: "-1px" }}>Browse the collection.</h2>
          </div>
          <a href="/products" style={{ backgroundColor: "#fff", color: "#000", padding: "16px 48px", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", fontWeight: "800", borderRadius: "2px", flexShrink: 0 }}>
            VIEW ALL PRODUCTS
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ maxWidth: "1100px", margin: "0 auto", padding: "40px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
        <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "4px" }}>SHOP</span>
        <div style={{ display: "flex", gap: "32px" }}>
          <a href="/products" style={{ color: "#333", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PRODUCTS</a>
          <a href="/login" style={{ color: "#333", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>LOGIN</a>
          <a href="/register" style={{ color: "#333", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>REGISTER</a>
        </div>
        <p style={{ color: "#2a2a2a", fontSize: "11px" }}>© 2025 SHOP. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

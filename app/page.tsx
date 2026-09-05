"use client";

import Link from "next/link";
import { useIsLoggedIn } from "@/lib/useAuth";
import { Nav, NavLink } from "@/components/nav";
import { LinkButton } from "@/components/ui";
import { color, layout, radius } from "@/lib/theme";

const STATS = [
  { value: "24h", label: "Order processing" },
  { value: "100%", label: "Secure payments" },
  { value: "FastAPI + Next.js", label: "Full-stack project" },
  { value: "Live", label: "Deployed on AWS" },
];

const FEATURES = [
  { icon: "◈", title: "Premium Quality", desc: "Every product is handpicked and approved by our team before listing." },
  { icon: "⟳", title: "Easy Returns", desc: "Not satisfied? Cancel your order and get a full refund instantly." },
  { icon: "⚡", title: "Fast Checkout", desc: "One-click checkout with your stored balance. No extra steps." },
  { icon: "◎", title: "Secure Account", desc: "JWT auth, email verification, and encrypted passwords." },
];

const TECH = ["FastAPI", "PostgreSQL", "Redis", "Next.js 16", "Stripe", "Celery", "Docker", "AWS EC2"];

const SECTION: React.CSSProperties = { maxWidth: layout.page, margin: "0 auto", padding: "80px 48px" };

export default function Home() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: color.bg, color: color.text }}>
      <Nav>
        <NavLink href="/products">Products</NavLink>
        {isLoggedIn ? (
          <>
            <NavLink href="/profile">Profile</NavLink>
            <LinkButton href="/cart" size="sm">
              Cart
            </LinkButton>
          </>
        ) : (
          <>
            <NavLink href="/login">Login</NavLink>
            <LinkButton href="/register" size="sm">
              Sign up
            </LinkButton>
          </>
        )}
      </Nav>

      <section
        style={{
          ...SECTION,
          padding: "130px 48px 80px",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 380px)",
          gap: "80px",
          alignItems: "center",
        }}
      >
        <div>
          <div className="fade-1">
            <span
              style={{
                display: "inline-block",
                backgroundColor: color.borderSoft,
                border: `1px solid ${color.border}`,
                color: color.textMuted,
                fontSize: "10px",
                letterSpacing: "3px",
                padding: "6px 14px",
                borderRadius: radius.sm,
                marginBottom: "32px",
              }}
            >
              NEW COLLECTION 2025
            </span>
          </div>
          <div className="fade-2">
            <h1 style={{ fontSize: "clamp(52px, 7vw, 88px)", fontWeight: "800", letterSpacing: "-3px", lineHeight: "0.95", marginBottom: "28px" }}>
              Style
              <br />
              <span style={{ color: color.textFaint }}>that</span>
              <br />
              speaks.
            </h1>
          </div>
          <div className="fade-3">
            <p style={{ color: color.textDim, fontSize: "15px", lineHeight: "1.8", maxWidth: "380px", marginBottom: "44px" }}>
              Premium products curated for those who demand quality. No noise — just the best.
            </p>
          </div>
          <div className="fade-4" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <LinkButton href="/products" size="lg">
              Shop now
            </LinkButton>
            {!isLoggedIn && (
              <LinkButton href="/register" variant="secondary" size="lg">
                Create account
              </LinkButton>
            )}
          </div>
        </div>

        <div className="surface fade-5" style={{ borderRadius: radius.md, padding: "36px 32px" }}>
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              style={{
                padding: "22px 0",
                borderBottom: i < STATS.length - 1 ? `1px solid ${color.borderSoft}` : "none",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <span style={{ color: color.textFaint, fontSize: "12px", letterSpacing: "1px" }}>{stat.label}</span>
              <span style={{ fontSize: "20px", fontWeight: "800", letterSpacing: "-1px", textAlign: "right" }}>{stat.value}</span>
            </div>
          ))}
        </div>
      </section>

      <div style={{ borderTop: `1px solid ${color.borderSoft}`, maxWidth: layout.page, margin: "0 auto" }} />

      <section style={SECTION}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px", gap: "16px" }}>
          <p style={{ color: color.textFaint, fontSize: "11px", letterSpacing: "5px" }}>WHY SHOP WITH US</p>
          <Link href="/products" style={{ color: color.textFaint, fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>
            VIEW ALL →
          </Link>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1px", backgroundColor: color.borderSoft }}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className="hover-lift" style={{ backgroundColor: color.surface, padding: "40px 28px" }}>
              <p style={{ color: color.textFaint, fontSize: "28px", marginBottom: "24px" }}>{feature.icon}</p>
              <p style={{ fontWeight: "700", fontSize: "12px", letterSpacing: "2px", marginBottom: "12px", textTransform: "uppercase" }}>
                {feature.title}
              </p>
              <p style={{ color: color.textFaint, fontSize: "13px", lineHeight: "1.7" }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ borderTop: `1px solid ${color.borderSoft}` }}>
        <div style={{ ...SECTION, padding: "48px", display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
          <p style={{ color: color.textFaint, fontSize: "10px", letterSpacing: "3px", flexShrink: 0 }}>BUILT WITH</p>
          <div style={{ width: "1px", height: "14px", backgroundColor: color.border }} />
          {TECH.map((tech) => (
            <span
              key={tech}
              style={{
                color: color.textFaint,
                fontSize: "11px",
                letterSpacing: "1px",
                border: `1px solid ${color.border}`,
                padding: "5px 12px",
                borderRadius: radius.sm,
              }}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <section style={{ borderTop: `1px solid ${color.borderSoft}`, borderBottom: `1px solid ${color.borderSoft}` }}>
        <div
          style={{
            ...SECTION,
            padding: "100px 48px",
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr) auto",
            gap: "40px",
            alignItems: "center",
          }}
        >
          <div>
            <p style={{ color: color.textFaint, fontSize: "11px", letterSpacing: "4px", marginBottom: "16px" }}>READY TO START?</p>
            <h2 style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: "800", letterSpacing: "-2px", lineHeight: "1.1" }}>
              Browse the collection.
            </h2>
          </div>
          <LinkButton href="/products" size="lg" style={{ padding: "18px 52px", flexShrink: 0 }}>
            View all products
          </LinkButton>
        </div>
      </section>

      <footer
        style={{
          maxWidth: layout.page,
          margin: "0 auto",
          padding: "40px 48px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: "800", letterSpacing: "5px" }}>SHOP</span>
        <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
          <NavLink href="/products">Products</NavLink>
          <NavLink href="/login">Login</NavLink>
          <NavLink href="/register">Register</NavLink>
        </div>
        <p style={{ color: color.textFaint, fontSize: "11px" }}>© 2025 SHOP. ALL RIGHTS RESERVED.</p>
      </footer>
    </div>
  );
}

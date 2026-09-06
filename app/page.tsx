"use client";

import { useIsLoggedIn } from "@/lib/useAuth";
import { Nav, NavLink } from "@/components/nav";
import { LinkButton } from "@/components/ui";
import { color } from "@/lib/theme";

const TECH = [
  "FastAPI",
  "PostgreSQL",
  "Redis",
  "RabbitMQ",
  "Celery",
  "Next.js 16",
  "React 19",
  "TypeScript",
  "Stripe",
  "Docker",
];

export default function Home() {
  const isLoggedIn = useIsLoggedIn();

  return (
    <div style={{ minHeight: "100vh", backgroundColor: color.bg, color: color.text, display: "flex", flexDirection: "column" }}>
      <Nav>
        <NavLink href="/products">Products</NavLink>
        {isLoggedIn ? (
          <>
            <NavLink href="/profile">Profile</NavLink>
            <LinkButton href="/cart" size="sm">Cart</LinkButton>
          </>
        ) : (
          <>
            <NavLink href="/login">Login</NavLink>
            <LinkButton href="/register" size="sm">Sign up</LinkButton>
          </>
        )}
      </Nav>

      <main className="landing">
        <p className="landing-eyebrow fade-1">Full-stack pet project</p>

        <h1 className="landing-title fade-2">
          Style that <span className="landing-title-accent">speaks.</span>
        </h1>

        <p className="landing-lede fade-3">
          A small store built end to end — catalogue, cart, checkout from balance, refunds,
          an admin panel and an AI assistant.
        </p>

        <div className="landing-actions fade-4">
          <LinkButton href="/products" size="lg">Shop now</LinkButton>
          {!isLoggedIn && (
            <LinkButton href="/register" variant="secondary" size="lg">Create account</LinkButton>
          )}
        </div>

        <div className="tech-cloud fade-5" aria-label="Built with">
          {TECH.map((tech, i) => (
            <span
              key={tech}
              className="tech-chip"
              style={{ animationDelay: `${(i % 5) * 0.6}s`, animationDuration: `${5 + (i % 3)}s` }}
            >
              {tech}
            </span>
          ))}
        </div>
      </main>

      <footer className="landing-footer">
        <span style={{ fontSize: "12px", fontWeight: "800", letterSpacing: "5px" }}>SHOP</span>
        <p style={{ color: color.textFaint, fontSize: "11px" }}>© 2025</p>
      </footer>
    </div>
  );
}

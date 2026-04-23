"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getMyTransactions, Transaction } from "@/lib/api";

const TYPE_COLOR: Record<string, string> = {
  deposit: "#16a34a",
  purchase: "#dc2626",
  refund: "#2563eb",
  withdraw: "#d97706",
};

const TYPE_LABEL: Record<string, string> = {
  deposit: "DEPOSIT",
  purchase: "PURCHASE",
  refund: "REFUND",
  withdraw: "WITHDRAW",
};

const TYPE_SIGN: Record<string, string> = {
  deposit: "+",
  refund: "+",
  purchase: "-",
  withdraw: "-",
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 15;

  useEffect(() => {
    load(0);
  }, []);

  async function load(offset: number) {
    setLoading(true);
    try {
      const data = await getMyTransactions(limit, offset);
      if (offset === 0) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === limit);
    } catch {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  function loadMore() {
    const next = page + 1;
    setPage(next);
    load(next * limit);
  }

  const total = transactions.reduce((sum, t) => {
    if (t.type === "deposit" || t.type === "refund") return sum + t.amount;
    return sum - t.amount;
  }, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`* { box-sizing: border-box; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="/profile" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>← PROFILE</a>
          <a href="/products" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>PRODUCTS</a>
        </div>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 40px" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>ACCOUNT</p>
          <h1 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px" }}>Transactions</h1>
        </div>

        {/* Summary bar */}
        {transactions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#141414", border: "1px solid #141414", marginBottom: "40px" }}>
            {(["deposit", "purchase", "refund", "withdraw"] as const).map((type) => {
              const items = transactions.filter((t) => t.type === type);
              const sum = items.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={type} style={{ backgroundColor: "#0a0a0a", padding: "20px 24px" }}>
                  <p style={{ color: "#333", fontSize: "10px", letterSpacing: "3px", marginBottom: "8px" }}>{TYPE_LABEL[type]}</p>
                  <p style={{ color: TYPE_COLOR[type], fontSize: "20px", fontWeight: "800" }}>${sum.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* List */}
        {loading && transactions.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: "32px", height: "32px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#2a2a2a", fontSize: "13px", letterSpacing: "4px", marginBottom: "24px" }}>NO TRANSACTIONS YET</p>
            <a href="/products" style={{ color: "#555", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", border: "1px solid #222", padding: "12px 32px" }}>START SHOPPING</a>
          </div>
        ) : (
          <div style={{ border: "1px solid #141414" }}>
            {/* Header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px", padding: "12px 20px", borderBottom: "1px solid #141414" }}>
              {["DESCRIPTION", "TYPE", "AMOUNT", "NET"].map((h) => (
                <p key={h} style={{ color: "#333", fontSize: "10px", letterSpacing: "2px" }}>{h}</p>
              ))}
            </div>

            {transactions.map((t, i) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 100px", padding: "16px 20px", borderBottom: i < transactions.length - 1 ? "1px solid #0f0f0f" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "13px", fontWeight: "600", marginBottom: "2px" }}>
                    {t.description || TYPE_LABEL[t.type]}
                  </p>
                  <p style={{ color: "#333", fontSize: "11px" }}>#{t.id}</p>
                </div>
                <span style={{ color: TYPE_COLOR[t.type], fontSize: "10px", letterSpacing: "1px", fontWeight: "700" }}>
                  {TYPE_LABEL[t.type]}
                </span>
                <span style={{ fontSize: "14px", fontWeight: "700" }}>${t.amount.toFixed(2)}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: (t.type === "deposit" || t.type === "refund") ? "#16a34a" : "#dc2626" }}>
                  {TYPE_SIGN[t.type]}${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={loadMore} style={{ background: "none", color: "#555", border: "1px solid #222", padding: "12px 32px", cursor: "pointer", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}>
              LOAD MORE
            </button>
          </div>
        )}

        {loading && transactions.length > 0 && (
          <div style={{ textAlign: "center", padding: "24px" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        )}
      </main>
    </div>
  );
}

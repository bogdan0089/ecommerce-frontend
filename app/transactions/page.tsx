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

const TYPE_BG: Record<string, string> = {
  deposit: "#f0fdf4",
  purchase: "#fef2f2",
  refund: "#eff6ff",
  withdraw: "#fffbeb",
};

const TYPE_LABEL: Record<string, string> = {
  deposit: "Deposit",
  purchase: "Purchase",
  refund: "Refund",
  withdraw: "Withdraw",
};

const TYPE_SIGN: Record<string, string> = {
  deposit: "+", refund: "+", purchase: "-", withdraw: "-",
};

export default function TransactionsPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 15;

  useEffect(() => { load(0); }, []);

  async function load(offset: number) {
    setLoading(true);
    try {
      const data = await getMyTransactions(limit, offset);
      if (offset === 0) setTransactions(data);
      else setTransactions((prev) => [...prev, ...data]);
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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111" }}>
      <style>{`* { box-sizing: border-box; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", gap: "24px", alignItems: "center" }}>
          <a href="/profile" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>← Profile</a>
          <a href="/products" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>Products</a>
        </div>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "32px" }}>Transactions</h1>

        {transactions.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "32px" }}>
            {(["deposit", "purchase", "refund", "withdraw"] as const).map((type) => {
              const items = transactions.filter((t) => t.type === type);
              const sum = items.reduce((s, t) => s + t.amount, 0);
              return (
                <div key={type} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 20px" }}>
                  <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "6px" }}>{TYPE_LABEL[type]}</p>
                  <p style={{ color: TYPE_COLOR[type], fontSize: "20px", fontWeight: "700" }}>${sum.toFixed(2)}</p>
                </div>
              );
            })}
          </div>
        )}

        {loading && transactions.length === 0 ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
            <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
          </div>
        ) : transactions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: "16px", marginBottom: "24px" }}>No transactions yet</p>
            <a href="/products" style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "12px 32px", fontSize: "14px", fontWeight: "600", textDecoration: "none", borderRadius: "8px" }}>Start shopping</a>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 110px", padding: "12px 20px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
              {["Description", "Type", "Amount", "Net"].map((h) => (
                <p key={h} style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>{h}</p>
              ))}
            </div>
            {transactions.map((t, i) => (
              <div key={t.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 110px 110px", padding: "16px 20px", borderBottom: i < transactions.length - 1 ? "1px solid #f3f4f6" : "none", alignItems: "center" }}>
                <div>
                  <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "2px" }}>{t.description || TYPE_LABEL[t.type]}</p>
                  <p style={{ color: "#9ca3af", fontSize: "12px" }}>#{t.id}</p>
                </div>
                <span style={{ display: "inline-block", backgroundColor: TYPE_BG[t.type], color: TYPE_COLOR[t.type], fontSize: "11px", fontWeight: "600", padding: "3px 10px", borderRadius: "20px", width: "fit-content" }}>
                  {TYPE_LABEL[t.type]}
                </span>
                <span style={{ fontSize: "14px", fontWeight: "600" }}>${t.amount.toFixed(2)}</span>
                <span style={{ fontSize: "14px", fontWeight: "700", color: (t.type === "deposit" || t.type === "refund") ? "#16a34a" : "#dc2626" }}>
                  {TYPE_SIGN[t.type]}${t.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}

        {hasMore && !loading && (
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <button onClick={loadMore} style={{ background: "none", color: "#6b7280", border: "1px solid #e5e7eb", padding: "10px 32px", cursor: "pointer", fontSize: "14px", borderRadius: "8px" }}>
              Load more
            </button>
          </div>
        )}

        {loading && transactions.length > 0 && (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <div style={{ width: "24px", height: "24px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto" }} />
          </div>
        )}
      </main>
    </div>
  );
}

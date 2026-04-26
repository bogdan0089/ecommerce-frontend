"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { authFetch, logout, getMyStats, changePassword, createPaymentIntent, ClientStats } from "@/lib/api";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY!);

function PaymentForm({ clientSecret, amount, onSuccess }: { clientSecret: string; amount: number; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setLoading(true);
    setError("");
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: elements.getElement(CardElement)! },
    });
    if (result.error) {
      setError(result.error.message || "Payment failed");
      setLoading(false);
    } else {
      onSuccess();
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div>
        <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "8px" }}>Card details</label>
        <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", padding: "14px 16px", borderRadius: "8px" }}>
          <CardElement options={{ style: { base: { color: "#111", fontSize: "14px", "::placeholder": { color: "#9ca3af" } }, invalid: { color: "#dc2626" } } }} />
        </div>
      </div>
      {error && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>{error}</div>}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{ backgroundColor: (loading || !stripe) ? "#e5e7eb" : "#111", color: (loading || !stripe) ? "#9ca3af" : "#fff", border: "none", padding: "13px", cursor: (loading || !stripe) ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}
      >
        {loading ? "Processing..." : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

interface Client { id: number; name: string; email: string; age: number; balance: number; role: string; }
interface Order { id: number; title: string; status: string; client_id: number; }

const STATUS_COLOR: Record<string, string> = {
  create: "#d97706", completed: "#16a34a", cancelled: "#dc2626",
};
const STATUS_BG: Record<string, string> = {
  create: "#fffbeb", completed: "#f0fdf4", cancelled: "#fef2f2",
};

export default function ProfilePage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "deposit" | "security">("overview");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  useEffect(() => {
    Promise.all([authFetch("/client/me"), authFetch("/client/me/orders"), getMyStats()])
      .then(([me, myOrders, myStats]) => { setClient(me); setOrders(myOrders); setStats(myStats); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e: { preventDefault(): void }) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) { setPwError("Passwords do not match"); return; }
    setPwLoading(true); setPwError(""); setPwSuccess(false);
    try {
      await changePassword(pwForm.old_password, pwForm.new_password);
      setPwForm({ old_password: "", new_password: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Error");
    } finally { setPwLoading(false); }
  }

  async function handleDeposit(e: { preventDefault(): void }) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) { setDepositError("Enter a valid amount"); return; }
    setDepositLoading(true); setDepositError("");
    try {
      const data = await createPaymentIntent(amount);
      setClientSecret(data.client_secret);
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : "Error");
    } finally { setDepositLoading(false); }
  }

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!client) return null;

  const inputStyle = { width: "100%", backgroundColor: "#fff", border: "1px solid #e5e7eb", color: "#111", padding: "10px 14px", fontSize: "14px", borderRadius: "8px", outline: "none" };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #9ca3af; } input:focus { border-color: #111 !important; outline: none; }`}</style>

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="/products" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>Products</a>
          <a href="/transactions" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>Transactions</a>
          <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", cursor: "pointer", fontSize: "13px", padding: "7px 16px", borderRadius: "6px" }}>Logout</button>
        </div>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "36px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "32px", fontWeight: "700" }}>{client.name}</h1>
            <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>{client.email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>Balance</p>
            <p style={{ fontSize: "32px", fontWeight: "800" }}>${client.balance.toFixed(2)}</p>
            <button onClick={() => setActiveTab("deposit")} style={{ background: "none", border: "none", color: "#16a34a", fontSize: "13px", fontWeight: "600", cursor: "pointer", marginTop: "2px" }}>+ Add funds</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "36px" }}>
          {[
            { label: "Orders", value: stats?.total_orders ?? orders.length },
            { label: "Total spent", value: `$${(stats?.total_spent ?? 0).toFixed(2)}` },
            { label: "Role", value: client.role },
            { label: "Age", value: client.age },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px" }}>
              <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "6px" }}>{s.label}</p>
              <p style={{ fontSize: "20px", fontWeight: "700", textTransform: "capitalize" }}>{s.value}</p>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "28px" }}>
          {(["overview", "orders", "deposit", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ background: "none", border: "none", color: activeTab === tab ? "#111" : "#6b7280", cursor: "pointer", fontSize: "14px", padding: "10px 20px", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent", fontWeight: activeTab === tab ? "600" : "400", textTransform: "capitalize" }}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Account info</h3>
              {[
                { label: "Name", value: client.name },
                { label: "Email", value: client.email },
                { label: "Age", value: `${client.age} y.o.` },
                { label: "Role", value: client.role },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>{item.label}</span>
                  <span style={{ fontSize: "14px", fontWeight: "500", textTransform: "capitalize" }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Quick actions</h3>
              {[
                { label: "Browse Products", href: "/products" },
                { label: "View Cart", href: "/cart" },
                { label: "Transaction History", href: "/transactions" },
              ].map((item) => (
                <a key={item.label} href={item.href} style={{ color: "#374151", fontSize: "14px", textDecoration: "none", padding: "10px 0", borderBottom: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  {item.label} <span style={{ color: "#9ca3af" }}>→</span>
                </a>
              ))}
              <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#374151", fontSize: "14px", textAlign: "left", cursor: "pointer", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
                My orders ({orders.length}) <span style={{ color: "#9ca3af" }}>→</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0" }}>
                <p style={{ color: "#9ca3af", fontSize: "16px", marginBottom: "20px" }}>No orders yet</p>
                <a href="/products" style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "11px 28px", fontSize: "14px", fontWeight: "600", textDecoration: "none", borderRadius: "8px" }}>Start shopping</a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}>{order.title}</p>
                      <p style={{ color: "#9ca3af", fontSize: "13px" }}>Order #{order.id}</p>
                    </div>
                    <span style={{ backgroundColor: STATUS_BG[order.status] || "#f3f4f6", color: STATUS_COLOR[order.status] || "#6b7280", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" }}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "deposit" && (
          <div style={{ maxWidth: "400px" }}>
            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "14px" }}>Current balance</span>
              <span style={{ fontWeight: "700", fontSize: "16px" }}>${client.balance.toFixed(2)}</span>
            </div>

            {depositSuccess && <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>Payment successful! Refresh to see updated balance.</div>}
            {depositError && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{depositError}</div>}

            {!clientSecret ? (
              <form onSubmit={handleDeposit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div>
                  <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>Amount ($)</label>
                  <input type="number" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} min="1" step="0.01" placeholder="0.00" required style={inputStyle} />
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[10, 25, 50, 100].map((amt) => (
                    <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))} style={{ background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151", padding: "7px 16px", cursor: "pointer", fontSize: "13px", borderRadius: "6px", fontWeight: "500" }}>${amt}</button>
                  ))}
                </div>
                <button type="submit" disabled={depositLoading} style={{ backgroundColor: depositLoading ? "#e5e7eb" : "#111", color: depositLoading ? "#9ca3af" : "#fff", border: "none", padding: "13px", cursor: depositLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}>
                  {depositLoading ? "Processing..." : "Continue to payment"}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>Amount: <strong style={{ color: "#111" }}>${parseFloat(depositAmount).toFixed(2)}</strong></span>
                  <button onClick={() => setClientSecret(null)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px" }}>← Back</button>
                </div>
                <Elements stripe={stripePromise}>
                  <PaymentForm clientSecret={clientSecret} amount={parseFloat(depositAmount)} onSuccess={() => { setDepositSuccess(true); setClientSecret(null); setDepositAmount(""); }} />
                </Elements>
              </div>
            )}
          </div>
        )}

        {activeTab === "security" && (
          <div style={{ maxWidth: "400px" }}>
            {pwSuccess && <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>Password updated successfully!</div>}
            {pwError && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{pwError}</div>}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Current password", key: "old_password", placeholder: "Current password" },
                { label: "New password", key: "new_password", placeholder: "Min. 8 characters" },
                { label: "Confirm new password", key: "confirm", placeholder: "Repeat new password" },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{field.label}</label>
                  <input type="password" value={pwForm[field.key as keyof typeof pwForm]} onChange={(e) => setPwForm({ ...pwForm, [field.key]: e.target.value })} required placeholder={field.placeholder} style={inputStyle} />
                </div>
              ))}
              <button type="submit" disabled={pwLoading} style={{ backgroundColor: pwLoading ? "#e5e7eb" : "#111", color: pwLoading ? "#9ca3af" : "#fff", border: "none", padding: "13px", cursor: pwLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px", marginTop: "4px" }}>
                {pwLoading ? "Saving..." : "Update password"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

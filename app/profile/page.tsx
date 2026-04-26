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
        <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>CARD DETAILS</p>
        <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f", padding: "14px 16px", borderRadius: "2px" }}>
          <CardElement options={{ style: { base: { color: "#fff", fontSize: "14px", "::placeholder": { color: "#333" } }, invalid: { color: "#dc2626" } } }} />
        </div>
      </div>
      {error && (
        <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", fontSize: "13px" }}>
          {error}
        </div>
      )}
      <button
        type="submit"
        disabled={loading || !stripe}
        style={{ backgroundColor: loading ? "#111" : "#fff", color: loading ? "#333" : "#000", border: loading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: loading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
      >
        {loading ? "PROCESSING..." : `PAY $${amount.toFixed(2)}`}
      </button>
    </form>
  );
}

interface Client {
  id: number;
  name: string;
  email: string;
  age: number;
  balance: number;
  role: string;
}

interface Order {
  id: number;
  title: string;
  status: string;
  client_id: number;
}

const STATUS_COLOR: Record<string, string> = {
  create: "#d97706",
  completed: "#16a34a",
  cancelled: "#dc2626",
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
    Promise.all([
      authFetch("/client/me"),
      authFetch("/client/me/orders"),
      getMyStats(),
    ])
      .then(([me, myOrders, myStats]) => {
        setClient(me);
        setOrders(myOrders);
        setStats(myStats);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  async function handleChangePassword(e: { preventDefault(): void }) {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm) {
      setPwError("Passwords do not match");
      return;
    }
    setPwLoading(true);
    setPwError("");
    setPwSuccess(false);
    try {
      await changePassword(pwForm.old_password, pwForm.new_password);
      setPwForm({ old_password: "", new_password: "", confirm: "" });
      setPwSuccess(true);
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : "Error");
    } finally {
      setPwLoading(false);
    }
  }

  async function handleDeposit(e: { preventDefault(): void }) {
    e.preventDefault();
    const amount = parseFloat(depositAmount);
    if (!amount || amount <= 0) {
      setDepositError("Enter a valid amount");
      return;
    }
    setDepositLoading(true);
    setDepositError("");
    try {
      const data = await createPaymentIntent(amount);
      setClientSecret(data.client_secret);
    } catch (err: unknown) {
      setDepositError(err instanceof Error ? err.message : "Error");
    } finally {
      setDepositLoading(false);
    }
  }

  function handlePaymentSuccess() {
    setDepositSuccess(true);
    setClientSecret(null);
    setDepositAmount("");
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "32px", height: "32px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "4px" }}>LOADING</p>
        </div>
      </div>
    );
  }

  if (!client) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`* { box-sizing: border-box; } .tab-btn { transition: all 0.2s; } input::placeholder { color: #333; }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <a href="/products" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px" }}>PRODUCTS</a>
          <a href="/transactions" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px" }}>TRANSACTIONS</a>
          <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "11px", letterSpacing: "2px" }}>LOGOUT</button>
        </div>
      </nav>

      <main style={{ maxWidth: "900px", margin: "0 auto", padding: "64px 40px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "48px", flexWrap: "wrap", gap: "20px" }}>
          <div>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>PROFILE</p>
            <h1 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px" }}>{client.name}</h1>
            <p style={{ color: "#555", fontSize: "14px", marginTop: "4px" }}>{client.email}</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "8px" }}>BALANCE</p>
            <p style={{ fontSize: "36px", fontWeight: "800" }}>${client.balance.toFixed(2)}</p>
            <button onClick={() => setActiveTab("deposit")} style={{ background: "none", border: "none", color: "#16a34a", fontSize: "11px", letterSpacing: "2px", cursor: "pointer", marginTop: "4px" }}>+ DEPOSIT</button>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "48px" }}>
          {[
            { label: "ORDERS", value: stats?.total_orders ?? orders.length },
            { label: "TOTAL SPENT", value: `$${(stats?.total_spent ?? 0).toFixed(2)}` },
            { label: "ROLE", value: client.role.toUpperCase() },
            { label: "AGE", value: client.age },
          ].map((s) => (
            <div key={s.label} style={{ backgroundColor: "#111", padding: "24px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "8px" }}>{s.label}</p>
              <p style={{ fontSize: "22px", fontWeight: "700" }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: "32px" }}>
          {(["overview", "orders", "deposit", "security"] as const).map((tab) => (
            <button
              key={tab}
              className="tab-btn"
              onClick={() => setActiveTab(tab)}
              style={{ background: "none", border: "none", color: activeTab === tab ? "#fff" : "#444", cursor: "pointer", fontSize: "11px", letterSpacing: "3px", padding: "12px 24px", borderBottom: activeTab === tab ? "2px solid #fff" : "2px solid transparent", fontWeight: activeTab === tab ? "700" : "400" }}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === "overview" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px" }}>
            <div style={{ backgroundColor: "#111", padding: "24px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>ACCOUNT INFO</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { label: "Name", value: client.name },
                  { label: "Email", value: client.email },
                  { label: "Age", value: `${client.age} y.o.` },
                  { label: "Role", value: client.role },
                ].map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1a1a1a", paddingBottom: "14px" }}>
                    <span style={{ color: "#444", fontSize: "13px" }}>{item.label}</span>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ backgroundColor: "#111", padding: "24px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>QUICK ACTIONS</p>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {[
                  { label: "Browse Products", href: "/products" },
                  { label: "View Cart", href: "/cart" },
                  { label: "Transaction History", href: "/transactions" },
                ].map((item) => (
                  <a key={item.label} href={item.href} style={{ color: "#888", fontSize: "13px", textDecoration: "none", padding: "14px 0", borderBottom: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {item.label} <span style={{ color: "#333" }}>→</span>
                  </a>
                ))}
                <button onClick={() => setActiveTab("orders")} style={{ background: "none", border: "none", color: "#888", fontSize: "13px", textAlign: "left", cursor: "pointer", padding: "14px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  My Orders ({orders.length}) <span style={{ color: "#333" }}>→</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div>
            {orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "80px 0" }}>
                <p style={{ color: "#2a2a2a", fontSize: "13px", letterSpacing: "4px", marginBottom: "24px" }}>NO ORDERS YET</p>
                <a href="/products" style={{ color: "#888", fontSize: "12px", letterSpacing: "2px", textDecoration: "none", border: "1px solid #222", padding: "10px 24px" }}>
                  START SHOPPING
                </a>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {orders.map((order) => (
                  <div key={order.id} style={{ backgroundColor: "#111", padding: "20px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <p style={{ fontWeight: "600", marginBottom: "4px" }}>{order.title}</p>
                      <p style={{ color: "#444", fontSize: "12px", letterSpacing: "1px" }}>Order #{order.id}</p>
                    </div>
                    <span style={{ backgroundColor: (STATUS_COLOR[order.status] || "#888") + "20", color: STATUS_COLOR[order.status] || "#888", padding: "4px 12px", borderRadius: "2px", fontSize: "11px", fontWeight: "700", letterSpacing: "2px" }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Deposit */}
        {activeTab === "deposit" && (
          <div style={{ maxWidth: "400px" }}>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "24px" }}>ADD FUNDS</p>

            <div style={{ backgroundColor: "#111", padding: "20px 24px", marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#444", fontSize: "13px" }}>Current balance</span>
              <span style={{ fontWeight: "700", fontSize: "13px" }}>${client.balance.toFixed(2)}</span>
            </div>

            {depositSuccess && (
              <div style={{ backgroundColor: "#16a34a15", border: "1px solid #16a34a30", color: "#16a34a", padding: "12px 16px", borderRadius: "2px", marginBottom: "16px", fontSize: "13px" }}>
                Payment successful! Refresh the page to see your updated balance.
              </div>
            )}

            {depositError && (
              <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "16px", fontSize: "13px" }}>
                {depositError}
              </div>
            )}

            {!clientSecret ? (
              <form onSubmit={handleDeposit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div>
                  <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>AMOUNT ($)</p>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    required
                    style={{ width: "100%", backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f", color: "#fff", padding: "14px 16px", fontSize: "14px", borderRadius: "2px", outline: "none" }}
                  />
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {[10, 25, 50, 100].map((amt) => (
                    <button key={amt} type="button" onClick={() => setDepositAmount(String(amt))}
                      style={{ background: "none", border: "1px solid #222", color: "#555", padding: "8px 16px", cursor: "pointer", fontSize: "12px", borderRadius: "2px" }}>
                      ${amt}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={depositLoading}
                  style={{ backgroundColor: depositLoading ? "#111" : "#fff", color: depositLoading ? "#333" : "#000", border: depositLoading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: depositLoading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
                >
                  {depositLoading ? "PROCESSING..." : "CONTINUE TO PAYMENT"}
                </button>
              </form>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <span style={{ color: "#444", fontSize: "13px" }}>Amount: <strong style={{ color: "#fff" }}>${parseFloat(depositAmount).toFixed(2)}</strong></span>
                  <button onClick={() => setClientSecret(null)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }}>← Back</button>
                </div>
                <Elements stripe={stripePromise}>
                  <PaymentForm clientSecret={clientSecret} amount={parseFloat(depositAmount)} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            )}
          </div>
        )}

        {/* Security */}
        {activeTab === "security" && (
          <div style={{ maxWidth: "400px" }}>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "24px" }}>CHANGE PASSWORD</p>

            {pwSuccess && (
              <div style={{ backgroundColor: "#16a34a15", border: "1px solid #16a34a30", color: "#16a34a", padding: "12px 16px", borderRadius: "2px", marginBottom: "16px", fontSize: "13px" }}>
                Password updated successfully!
              </div>
            )}
            {pwError && (
              <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "16px", fontSize: "13px" }}>
                {pwError}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {[
                { label: "CURRENT PASSWORD", key: "old_password", placeholder: "Current password" },
                { label: "NEW PASSWORD", key: "new_password", placeholder: "Min. 6 characters" },
                { label: "CONFIRM NEW PASSWORD", key: "confirm", placeholder: "Repeat new password" },
              ].map((field) => (
                <div key={field.key}>
                  <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>{field.label}</p>
                  <input
                    type="password"
                    value={pwForm[field.key as keyof typeof pwForm]}
                    onChange={(e) => setPwForm({ ...pwForm, [field.key]: e.target.value })}
                    required
                    placeholder={field.placeholder}
                    style={{ width: "100%", backgroundColor: "#0d0d0d", border: "1px solid #1f1f1f", color: "#fff", padding: "14px 16px", fontSize: "14px", borderRadius: "2px", outline: "none" }}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={pwLoading}
                style={{ backgroundColor: pwLoading ? "#111" : "#fff", color: pwLoading ? "#333" : "#000", border: pwLoading ? "1px solid #1f1f1f" : "none", padding: "14px", cursor: pwLoading ? "not-allowed" : "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", marginTop: "8px" }}
              >
                {pwLoading ? "SAVING..." : "UPDATE PASSWORD"}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

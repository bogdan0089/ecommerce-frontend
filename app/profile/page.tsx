"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import {
  authFetch, logout, getMyStats, changePassword, createPaymentIntent,
  updateClient, deleteClient, getOrderWithProducts, deleteProductFromOrder,
  ClientStats, OrderWithProducts,
} from "@/lib/api";

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

const STATUS_COLOR: Record<string, string> = { create: "#d97706", completed: "#16a34a", cancelled: "#dc2626" };
const STATUS_BG: Record<string, string> = { create: "#fffbeb", completed: "#f0fdf4", cancelled: "#fef2f2" };

export default function ProfilePage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<ClientStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "orders" | "edit" | "deposit" | "security">("overview");

  // Deposit
  const [depositAmount, setDepositAmount] = useState("");
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositError, setDepositError] = useState("");
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // Password
  const [pwForm, setPwForm] = useState({ old_password: "", new_password: "", confirm: "" });
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);

  // Edit profile
  const [editForm, setEditForm] = useState({ name: "", age: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState(false);

  // Delete account
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Order details
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);
  const [orderDetails, setOrderDetails] = useState<Record<number, OrderWithProducts>>({});
  const [orderDetailsLoading, setOrderDetailsLoading] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([authFetch("/client/me"), authFetch("/client/me/orders"), getMyStats()])
      .then(([me, myOrders, myStats]) => {
        setClient(me);
        setOrders(myOrders);
        setStats(myStats);
        setEditForm({ name: me.name, age: String(me.age), address: "" });
      })
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

  async function handleEditProfile(e: { preventDefault(): void }) {
    e.preventDefault();
    if (!client) return;
    setEditLoading(true); setEditError(""); setEditSuccess(false);
    try {
      const updated = await updateClient(client.id, {
        name: editForm.name,
        age: parseInt(editForm.age),
        address: editForm.address || undefined,
      });
      setClient((prev) => prev ? { ...prev, name: updated.name, age: updated.age } : prev);
      setEditSuccess(true);
      setTimeout(() => setEditSuccess(false), 3000);
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "Error");
    } finally { setEditLoading(false); }
  }

  async function handleDeleteAccount() {
    if (!client) return;
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    setDeleteLoading(true);
    try {
      await deleteClient(client.id);
      logout();
      router.push("/login");
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error deleting account");
      setDeleteLoading(false);
    }
  }

  async function toggleOrderDetails(orderId: number) {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    setExpandedOrder(orderId);
    if (orderDetails[orderId]) return;
    setOrderDetailsLoading(orderId);
    try {
      const data = await getOrderWithProducts(orderId);
      setOrderDetails((prev) => ({ ...prev, [orderId]: data }));
    } catch {
    } finally { setOrderDetailsLoading(null); }
  }

  async function handleRemoveProduct(orderId: number, productId: number) {
    if (!confirm("Remove this product from the order?")) return;
    try {
      await deleteProductFromOrder(orderId, productId);
      setOrderDetails((prev) => ({
        ...prev,
        [orderId]: { ...prev[orderId], products: prev[orderId].products.filter((p) => p.id !== productId) },
      }));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error");
    }
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
          {(["overview", "orders", "edit", "deposit", "security"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{ background: "none", border: "none", color: activeTab === tab ? "#111" : "#6b7280", cursor: "pointer", fontSize: "14px", padding: "10px 20px", borderBottom: activeTab === tab ? "2px solid #111" : "2px solid transparent", fontWeight: activeTab === tab ? "600" : "400", textTransform: "capitalize" }}
            >
              {tab === "edit" ? "Edit profile" : tab}
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
                  <div key={order.id} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}>{order.title}</p>
                        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Order #{order.id}</p>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ backgroundColor: STATUS_BG[order.status] || "#f3f4f6", color: STATUS_COLOR[order.status] || "#6b7280", padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize" }}>
                          {order.status}
                        </span>
                        <button
                          onClick={() => toggleOrderDetails(order.id)}
                          style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", cursor: "pointer", fontSize: "12px", padding: "5px 14px", borderRadius: "6px", fontWeight: "500" }}
                        >
                          {expandedOrder === order.id ? "Hide" : "Details"}
                        </button>
                      </div>
                    </div>

                    {expandedOrder === order.id && (
                      <div style={{ borderTop: "1px solid #f3f4f6", padding: "16px 20px", backgroundColor: "#fafafa" }}>
                        {orderDetailsLoading === order.id ? (
                          <div style={{ display: "flex", justifyContent: "center", padding: "16px" }}>
                            <div style={{ width: "20px", height: "20px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                          </div>
                        ) : orderDetails[order.id]?.products?.length === 0 ? (
                          <p style={{ color: "#9ca3af", fontSize: "13px" }}>No products in this order</p>
                        ) : (
                          <div>
                            <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600", marginBottom: "10px" }}>PRODUCTS</p>
                            {orderDetails[order.id]?.products?.map((product) => (
                              <div key={product.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: product.color, border: "1px solid #e5e7eb", flexShrink: 0 }} />
                                  <div>
                                    <p style={{ fontSize: "13px", fontWeight: "600" }}>{product.name}</p>
                                    <p style={{ color: "#9ca3af", fontSize: "12px" }}>Qty: {product.quantity}</p>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                  <span style={{ fontSize: "13px", fontWeight: "700" }}>${(product.price * product.quantity).toFixed(2)}</span>
                                  {order.status === "create" && (
                                    <button
                                      onClick={() => handleRemoveProduct(order.id, product.id)}
                                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", cursor: "pointer", fontSize: "11px", padding: "4px 10px", borderRadius: "6px", fontWeight: "600" }}
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "edit" && (
          <div style={{ maxWidth: "400px" }}>
            {editSuccess && <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#16a34a", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>Profile updated successfully!</div>}
            {editError && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontSize: "13px" }}>{editError}</div>}

            <form onSubmit={handleEditProfile} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {[
                { label: "Full name", key: "name", type: "text", placeholder: "Your name" },
                { label: "Age", key: "age", type: "number", placeholder: "25" },
                { label: "Address (optional)", key: "address", type: "text", placeholder: "Your address" },
              ].map((field) => (
                <div key={field.key}>
                  <label style={{ display: "block", color: "#374151", fontSize: "13px", fontWeight: "500", marginBottom: "6px" }}>{field.label}</label>
                  <input
                    type={field.type}
                    value={editForm[field.key as keyof typeof editForm]}
                    onChange={(e) => setEditForm({ ...editForm, [field.key]: e.target.value })}
                    placeholder={field.placeholder}
                    required={field.key !== "address"}
                    min={field.key === "age" ? "1" : undefined}
                    max={field.key === "age" ? "120" : undefined}
                    style={inputStyle}
                  />
                </div>
              ))}
              <button
                type="submit"
                disabled={editLoading}
                style={{ backgroundColor: editLoading ? "#e5e7eb" : "#111", color: editLoading ? "#9ca3af" : "#fff", border: "none", padding: "13px", cursor: editLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px", marginTop: "4px" }}
              >
                {editLoading ? "Saving..." : "Save changes"}
              </button>
            </form>
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

            <div style={{ marginTop: "40px", paddingTop: "28px", borderTop: "1px solid #f3f4f6" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "8px" }}>Danger zone</h3>
              <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "16px" }}>Once deleted, your account cannot be recovered.</p>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading}
                style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "11px 24px", cursor: deleteLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px", borderRadius: "8px" }}
              >
                {deleteLoading ? "Deleting..." : "Delete account"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

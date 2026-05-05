"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authFetch, createProduct, deleteProduct, moderateProduct,
  getAdminOrders, getAdminClients, updateOrderStatus, logout,
  getCategories, createCategory, updateProduct, generateProductDescription,
  Category,
} from "@/lib/api";
import { getAccessToken } from "@/lib/api";

interface Product { id: number; name: string; price: number; color: string; status: string; image_url?: string | null; }
interface Order { id: number; title: string; client_id: number; status: string; }
interface Client { id: number; name: string; email: string; age: number; balance: number; role?: string; }

type ProductFilter = "all" | "accept" | "pending" | "rejected";
type Tab = "products" | "orders" | "categories" | "stats";

const PRODUCT_STATUS_COLOR: Record<string, string> = { accept: "#16a34a", pending: "#d97706", rejected: "#dc2626" };
const PRODUCT_STATUS_BG: Record<string, string> = { accept: "#f0fdf4", pending: "#fffbeb", rejected: "#fef2f2" };
const ORDER_STATUS_COLOR: Record<string, string> = { create: "#d97706", completed: "#16a34a", cancelled: "#dc2626" };
const ORDER_STATUS_BG: Record<string, string> = { create: "#fffbeb", completed: "#f0fdf4", cancelled: "#fef2f2" };

interface Notification { id: number; text: string; }

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", color: "#000000", image_url: "", description: "" });
  const [error, setError] = useState("");

  // Edit product
  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", color: "#000000", image_url: "" });
  const [editLoading, setEditLoading] = useState(false);

  // Categories
  const [catName, setCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  // AI description
  const [genDescLoading, setGenDescLoading] = useState(false);

  // WebSocket notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    Promise.all([authFetch("/product/admin/all?limit=100"), getAdminOrders(), getAdminClients(), getCategories()])
      .then(([p, o, c, cats]) => { setProducts(p); setOrders(o); setClients(c); setCategories(cats); })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));

    const token = getAccessToken();
    if (token) {
      const ws = new WebSocket(`wss://bohdan-shop.duckdns.org/ws/admin?token=${token}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const notif: Notification = { id: Date.now(), text: e.data };
        setNotifications((prev) => [notif, ...prev.slice(0, 9)]);
        setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== notif.id)), 6000);
      };
    }

    return () => { wsRef.current?.close(); };
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    try {
      await createProduct({ name: form.name, price: parseFloat(form.price), color: form.color, image_url: form.image_url || null, description: form.description || null });
      setForm({ name: "", price: "", color: "#000000", image_url: "", description: "" });
      setShowForm(false);
      const data = await authFetch("/product/admin/all?limit=100");
      setProducts(data);
    } catch (err: unknown) { if (err instanceof Error) setError(err.message); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try { await deleteProduct(id); setProducts((prev) => prev.filter((p) => p.id !== id)); }
    catch (err: unknown) { if (err instanceof Error) setError(err.message); }
  }

  async function handleModerate(id: number, status: "accept" | "rejected") {
    try { const updated = await moderateProduct(id, status); setProducts((prev) => prev.map((p) => p.id === id ? { ...p, ...updated } : p)); }
    catch (err: unknown) { if (err instanceof Error) setError(err.message); }
  }

  async function handleOrderStatus(id: number, status: string) {
    try { const updated = await updateOrderStatus(id, status); setOrders((prev) => prev.map((o) => o.id === id ? { ...o, ...updated } : o)); }
    catch (err: unknown) { if (err instanceof Error) setError(err.message); }
  }

  function startEdit(product: Product) {
    setEditProductId(product.id);
    setEditForm({ name: product.name, price: String(product.price), color: product.color, image_url: product.image_url || "" });
  }

  async function handleEditSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editProductId) return;
    setEditLoading(true);
    try {
      const updated = await updateProduct(editProductId, {
        name: editForm.name,
        price: parseFloat(editForm.price),
        color: editForm.color,
        image_url: editForm.image_url || null,
      });
      setProducts((prev) => prev.map((p) => p.id === editProductId ? { ...p, ...updated } : p));
      setEditProductId(null);
    } catch (err: unknown) { if (err instanceof Error) setError(err.message); }
    finally { setEditLoading(false); }
  }

  async function handleCreateCategory(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setCatError("");
    setCatLoading(true);
    try {
      const cat = await createCategory(catName);
      setCategories((prev) => [...prev, cat]);
      setCatName("");
    } catch (err: unknown) { if (err instanceof Error) setCatError(err.message); }
    finally { setCatLoading(false); }
  }

  const productCounts = {
    all: products.length,
    accept: products.filter((p) => p.status === "accept").length,
    pending: products.filter((p) => p.status === "pending").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };
  const orderCounts = {
    create: orders.filter((o) => o.status === "create").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };
  const visibleProducts = filter === "all" ? products : products.filter((p) => p.status === filter);

  const inputStyle = { backgroundColor: "#fff", border: "1px solid #e5e7eb", color: "#111", padding: "9px 12px", fontSize: "13px", borderRadius: "6px", outline: "none", width: "100%" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #9ca3af; } @keyframes slideIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }`}</style>

      {/* WS Notifications */}
      {notifications.length > 0 && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((n) => (
            <div key={n.id} style={{ backgroundColor: "#111", color: "#fff", padding: "12px 18px", borderRadius: "10px", fontSize: "13px", fontWeight: "500", maxWidth: "320px", boxShadow: "0 4px 16px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease", display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16a34a", flexShrink: 0 }} />
              {n.text}
              <button onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", marginLeft: "auto", fontSize: "16px", lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <span style={{ color: "#9ca3af", fontSize: "13px", fontWeight: "500" }}>Admin Panel</span>
        <button onClick={() => { logout(); router.push("/login"); }} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "7px 16px", cursor: "pointer", fontSize: "13px", borderRadius: "6px" }}>Logout</button>
      </nav>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px" }}>
        <div style={{ marginBottom: "32px" }}>
          <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "4px" }}>DASHBOARD</p>
          <h1 style={{ fontSize: "28px", fontWeight: "700" }}>Admin Panel</h1>
        </div>

        {error && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: "8px", marginBottom: "20px", fontSize: "13px" }}>{error}</div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "32px" }}>
          {(["products", "orders", "categories", "stats"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "none", border: "none", color: tab === t ? "#111" : "#6b7280", cursor: "pointer", fontSize: "14px", padding: "10px 24px", borderBottom: tab === t ? "2px solid #111" : "2px solid transparent", fontWeight: tab === t ? "600" : "400", display: "flex", alignItems: "center", gap: "8px", textTransform: "capitalize" }}>
              {t}
              {t === "orders" && orderCounts.create > 0 && <span style={{ backgroundColor: "#f59e0b", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{orderCounts.create}</span>}
              {t === "products" && productCounts.pending > 0 && <span style={{ backgroundColor: "#f59e0b", color: "#fff", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: "700", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{productCounts.pending}</span>}
            </button>
          ))}
        </div>

        {tab === "categories" && (
          <div style={{ maxWidth: "600px" }}>
            <form onSubmit={handleCreateCategory} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "14px" }}>New category</h3>
              {catError && <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "10px 14px", borderRadius: "8px", marginBottom: "12px", fontSize: "13px" }}>{catError}</div>}
              <div style={{ display: "flex", gap: "10px" }}>
                <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)} required placeholder="Category name" style={{ ...inputStyle, flex: 1 }} />
                <button type="submit" disabled={catLoading} style={{ backgroundColor: catLoading ? "#e5e7eb" : "#111", color: catLoading ? "#9ca3af" : "#fff", border: "none", padding: "9px 20px", cursor: catLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px", borderRadius: "6px", whiteSpace: "nowrap" }}>
                  {catLoading ? "Adding..." : "+ Add"}
                </button>
              </div>
            </form>

            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ padding: "12px 20px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                <span style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>CATEGORIES ({categories.length})</span>
              </div>
              {categories.length === 0 ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af", fontSize: "14px" }}>No categories yet</div>
              ) : (
                categories.map((cat, i) => (
                  <div key={cat.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderBottom: i < categories.length - 1 ? "1px solid #f3f4f6" : "none" }}>
                    <span style={{ fontSize: "14px", fontWeight: "500" }}>{cat.name}</span>
                    <span style={{ color: "#9ca3af", fontSize: "12px" }}>#{cat.id}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === "stats" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[
                { label: "Total products", value: products.length },
                { label: "Total orders", value: orders.length },
                { label: "Total clients", value: clients.length },
                { label: "Pending review", value: productCounts.pending, highlight: productCounts.pending > 0 },
              ].map((s) => (
                <div key={s.label} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px 24px" }}>
                  <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "8px" }}>{s.label}</p>
                  <p style={{ fontSize: "32px", fontWeight: "800", color: s.highlight ? "#d97706" : "#111" }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "24px" }}>
              {[
                { title: "Products by status", items: [{ label: "Accepted", value: productCounts.accept, color: "#16a34a" }, { label: "Pending", value: productCounts.pending, color: "#d97706" }, { label: "Rejected", value: productCounts.rejected, color: "#dc2626" }] },
                { title: "Orders by status", items: [{ label: "Active", value: orderCounts.create, color: "#d97706" }, { label: "Completed", value: orderCounts.completed, color: "#16a34a" }, { label: "Cancelled", value: orderCounts.cancelled, color: "#dc2626" }] },
                { title: "Clients by role", items: [{ label: "Client", value: clients.filter((c) => c.role === "client").length, color: "#6b7280" }, { label: "Moderator", value: clients.filter((c) => c.role === "moderator").length, color: "#2563eb" }, { label: "Superadmin", value: clients.filter((c) => c.role === "superadmin").length, color: "#7c3aed" }] },
              ].map((card) => (
                <div key={card.title} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px 24px" }}>
                  <p style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>{card.title}</p>
                  {card.items.map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                      <span style={{ color: "#6b7280", fontSize: "13px" }}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: "18px", fontWeight: "700" }}>{item.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>Recent clients</h3>
              <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 100px 100px", padding: "8px 0 12px", borderBottom: "1px solid #f3f4f6" }}>
                {["ID", "Name", "Email", "Balance", "Role"].map((h) => (
                  <span key={h} style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>{h}</span>
                ))}
              </div>
              {clients.slice(0, 10).map((c) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 100px 100px", padding: "12px 0", borderBottom: "1px solid #f9fafb", alignItems: "center" }}>
                  <span style={{ color: "#9ca3af", fontSize: "12px" }}>#{c.id}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{c.name}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>{c.email}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>${c.balance.toFixed(2)}</span>
                  <span style={{ color: "#6b7280", fontSize: "12px", textTransform: "capitalize" }}>{c.role ?? "client"}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {[{ label: "Active", key: "create", value: orderCounts.create }, { label: "Completed", key: "completed", value: orderCounts.completed }, { label: "Cancelled", key: "cancelled", value: orderCounts.cancelled }].map((s) => (
                <div key={s.key} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px 24px" }}>
                  <p style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "500", marginBottom: "8px" }}>{s.label}</p>
                  <p style={{ fontSize: "28px", fontWeight: "800", color: ORDER_STATUS_COLOR[s.key] }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 120px 200px", padding: "12px 20px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["ID", "Title", "Client", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>{h}</span>
                ))}
              </div>
              {orders.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No orders</div>}
              {orders.map((order) => (
                <div key={order.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 120px 200px", padding: "14px 20px", borderBottom: "1px solid #f3f4f6", alignItems: "center" }}>
                  <span style={{ color: "#9ca3af", fontSize: "13px" }}>#{order.id}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>{order.title}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>Client #{order.client_id}</span>
                  <span style={{ display: "inline-block", backgroundColor: ORDER_STATUS_BG[order.status] || "#f3f4f6", color: ORDER_STATUS_COLOR[order.status] || "#6b7280", padding: "3px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", textTransform: "capitalize", width: "fit-content" }}>
                    {order.status}
                  </span>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {order.status === "create" && (
                      <>
                        <button onClick={() => handleOrderStatus(order.id, "completed")} style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "5px 12px", cursor: "pointer", fontSize: "12px", borderRadius: "6px", fontWeight: "600" }}>Complete</button>
                        <button onClick={() => handleOrderStatus(order.id, "cancelled")} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "5px 12px", cursor: "pointer", fontSize: "12px", borderRadius: "6px", fontWeight: "600" }}>Cancel</button>
                      </>
                    )}
                    {order.status === "completed" && (
                      <button onClick={() => handleOrderStatus(order.id, "cancelled")} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "5px 12px", cursor: "pointer", fontSize: "12px", borderRadius: "6px", fontWeight: "600" }}>Refund</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "24px" }}>
              {(["all", "accept", "pending", "rejected"] as ProductFilter[]).map((s) => (
                <button key={s} onClick={() => setFilter(s)} style={{ backgroundColor: filter === s ? "#111" : "#fff", color: filter === s ? "#fff" : "#374151", border: "1px solid #e5e7eb", padding: "16px 20px", cursor: "pointer", textAlign: "left", borderRadius: "10px", transition: "all 0.15s" }}>
                  <p style={{ fontSize: "12px", fontWeight: "500", marginBottom: "6px", textTransform: "capitalize", opacity: 0.7 }}>{s === "all" ? "All" : s}</p>
                  <p style={{ fontSize: "28px", fontWeight: "800" }}>{productCounts[s]}</p>
                </button>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
              <button onClick={() => { setShowForm(!showForm); setEditProductId(null); }} style={{ backgroundColor: showForm ? "#f9fafb" : "#111", color: showForm ? "#6b7280" : "#fff", border: showForm ? "1px solid #e5e7eb" : "none", padding: "9px 20px", cursor: "pointer", fontWeight: "600", fontSize: "13px", borderRadius: "8px" }}>
                {showForm ? "Cancel" : "+ Add product"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px", marginBottom: "20px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "16px" }}>New product</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr", gap: "12px", alignItems: "end" }}>
                  <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Name</label><input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Product name" style={inputStyle} /></div>
                  <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Image URL</label><input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={inputStyle} /></div>
                  <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Price ($)</label><input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" placeholder="0.00" style={inputStyle} /></div>
                  <div>
                    <label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Color</label>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: "36px", height: "34px", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
                      <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="#000000" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Product description..."
                    rows={3}
                    style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
                  />
                </div>
                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                  <button
                    type="button"
                    disabled={genDescLoading || !form.name}
                    onClick={async () => {
                      if (!form.name) return;
                      setGenDescLoading(true);
                      try {
                        const res = await generateProductDescription(form.name);
                        setForm((prev) => ({ ...prev, description: res }));
                      }
                      catch { setForm((prev) => ({ ...prev, description: "Failed to generate description." })); }
                      finally { setGenDescLoading(false); }
                    }}
                    style={{ backgroundColor: genDescLoading || !form.name ? "#e5e7eb" : "#f9fafb", color: genDescLoading || !form.name ? "#9ca3af" : "#374151", border: "1px solid #e5e7eb", padding: "9px 18px", cursor: genDescLoading || !form.name ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "12px", borderRadius: "8px" }}
                  >
                    {genDescLoading ? "Generating..." : "Generate description with AI"}
                  </button>
                  <button type="submit" style={{ backgroundColor: "#111", color: "#fff", border: "none", padding: "9px 24px", cursor: "pointer", fontWeight: "600", fontSize: "13px", borderRadius: "8px" }}>Create</button>
                </div>
              </form>
            )}

            <div style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "10px", overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "48px 56px 1fr 100px 72px 120px 180px", padding: "12px 16px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
                {["ID", "Img", "Name", "Price", "Color", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ color: "#9ca3af", fontSize: "12px", fontWeight: "600" }}>{h}</span>
                ))}
              </div>
              {visibleProducts.length === 0 && <div style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>No products</div>}
              {visibleProducts.map((product) => (
                <div key={product.id}>
                  <div style={{ display: "grid", gridTemplateColumns: "48px 56px 1fr 100px 72px 120px 180px", padding: "10px 16px", borderBottom: editProductId === product.id ? "none" : "1px solid #f3f4f6", alignItems: "center", backgroundColor: editProductId === product.id ? "#f9fafb" : "#fff" }}>
                    <span style={{ color: "#9ca3af", fontSize: "13px" }}>#{product.id}</span>
                    <div style={{ width: "36px", height: "36px", borderRadius: "6px", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
                      {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{product.name}</span>
                    <span style={{ fontSize: "13px" }}>${product.price}</span>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: product.color, border: "2px solid #e5e7eb" }} />
                    <span style={{ display: "inline-block", backgroundColor: PRODUCT_STATUS_BG[product.status] || "#f3f4f6", color: PRODUCT_STATUS_COLOR[product.status] || "#6b7280", padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "600", textTransform: "capitalize", width: "fit-content" }}>
                      {product.status}
                    </span>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      <button onClick={() => editProductId === product.id ? setEditProductId(null) : startEdit(product)} style={{ backgroundColor: editProductId === product.id ? "#f3f4f6" : "#eff6ff", color: editProductId === product.id ? "#6b7280" : "#2563eb", border: "1px solid " + (editProductId === product.id ? "#e5e7eb" : "#bfdbfe"), padding: "4px 10px", cursor: "pointer", fontSize: "11px", borderRadius: "6px", fontWeight: "600" }}>
                        {editProductId === product.id ? "Cancel" : "Edit"}
                      </button>
                      {product.status !== "accept" && <button onClick={() => handleModerate(product.id, "accept")} style={{ backgroundColor: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", padding: "4px 10px", cursor: "pointer", fontSize: "11px", borderRadius: "6px", fontWeight: "600" }}>✓</button>}
                      {product.status !== "rejected" && <button onClick={() => handleModerate(product.id, "rejected")} style={{ backgroundColor: "#fffbeb", color: "#d97706", border: "1px solid #fde68a", padding: "4px 10px", cursor: "pointer", fontSize: "11px", borderRadius: "6px", fontWeight: "600" }}>✗</button>}
                      <button onClick={() => handleDelete(product.id)} style={{ backgroundColor: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", padding: "4px 10px", cursor: "pointer", fontSize: "11px", borderRadius: "6px", fontWeight: "600" }}>Del</button>
                    </div>
                  </div>

                  {editProductId === product.id && (
                    <form onSubmit={handleEditSave} style={{ padding: "16px 20px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f9fafb" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr", gap: "12px", alignItems: "end" }}>
                        <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Name</label><input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required style={inputStyle} /></div>
                        <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Image URL</label><input type="url" value={editForm.image_url} onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })} placeholder="https://..." style={inputStyle} /></div>
                        <div><label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Price ($)</label><input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required min="0" step="0.01" style={inputStyle} /></div>
                        <div>
                          <label style={{ display: "block", color: "#374151", fontSize: "12px", fontWeight: "500", marginBottom: "5px" }}>Color</label>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <input type="color" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} style={{ width: "36px", height: "34px", border: "1px solid #e5e7eb", borderRadius: "6px", cursor: "pointer", padding: "2px" }} />
                            <input type="text" value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} style={{ ...inputStyle, flex: 1 }} />
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button type="button" onClick={() => setEditProductId(null)} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px 18px", cursor: "pointer", fontSize: "13px", borderRadius: "6px" }}>Cancel</button>
                        <button type="submit" disabled={editLoading} style={{ backgroundColor: editLoading ? "#e5e7eb" : "#111", color: editLoading ? "#9ca3af" : "#fff", border: "none", padding: "8px 20px", cursor: editLoading ? "not-allowed" : "pointer", fontWeight: "600", fontSize: "13px", borderRadius: "6px" }}>
                          {editLoading ? "Saving..." : "Save changes"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

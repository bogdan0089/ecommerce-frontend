"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  authFetch,
  createProduct,
  deleteProduct,
  moderateProduct,
  getAdminOrders,
  getAdminClients,
  updateOrderStatus,
  logout,
} from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  status: string;
  image_url?: string | null;
}

interface Order {
  id: number;
  title: string;
  client_id: number;
  status: string;
}

interface Client {
  id: number;
  name: string;
  email: string;
  age: number;
  balance: number;
  role?: string;
}

type ProductFilter = "all" | "accept" | "pending" | "rejected";
type Tab = "products" | "orders" | "stats";

const STATUS_COLOR: Record<string, string> = {
  accept: "#16a34a",
  pending: "#d97706",
  rejected: "#dc2626",
  create: "#d97706",
  completed: "#16a34a",
  cancelled: "#dc2626",
};

export default function AdminPage() {
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ProductFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", price: "", color: "#000000", image_url: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      authFetch("/product/admin/all?limit=100"),
      getAdminOrders(),
      getAdminClients(),
    ])
      .then(([p, o, c]) => {
        setProducts(p);
        setOrders(o);
        setClients(c);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    try {
      await createProduct({
        name: form.name,
        price: parseFloat(form.price),
        color: form.color,
        image_url: form.image_url || null,
      });
      setForm({ name: "", price: "", color: "#000000", image_url: "" });
      setShowForm(false);
      const data = await authFetch("/product/admin/all?limit=100");
      setProducts(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleModerate(id: number, status: "accept" | "rejected") {
    try {
      const updated = await moderateProduct(id, status);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
  }

  async function handleOrderStatus(id: number, status: string) {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    }
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

  const inputStyle = {
    backgroundColor: "#0d0d0d",
    border: "1px solid #222",
    color: "#fff",
    padding: "10px 14px",
    fontSize: "13px",
    borderRadius: "2px",
    outline: "none",
    width: "100%",
  };

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

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`* { box-sizing: border-box; } input::placeholder { color: #333; }`}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <span style={{ color: "#333", fontSize: "11px", letterSpacing: "3px" }}>ADMIN</span>
        <button
          onClick={() => { logout(); router.push("/login"); }}
          style={{ background: "none", border: "1px solid #222", color: "#555", padding: "7px 18px", cursor: "pointer", fontSize: "11px", letterSpacing: "2px", borderRadius: "2px" }}
        >
          LOGOUT
        </button>
      </nav>

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "48px 40px" }}>

        <div style={{ marginBottom: "40px" }}>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>DASHBOARD</p>
          <h1 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px" }}>Admin Panel</h1>
        </div>

        {error && (
          <div style={{ backgroundColor: "#dc262610", border: "1px solid #dc262640", color: "#dc2626", padding: "12px 16px", borderRadius: "2px", marginBottom: "24px", fontSize: "13px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", borderBottom: "1px solid #1a1a1a", marginBottom: "40px" }}>
          {(["products", "orders", "stats"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{ background: "none", border: "none", color: tab === t ? "#fff" : "#444", cursor: "pointer", fontSize: "11px", letterSpacing: "3px", padding: "12px 28px", borderBottom: tab === t ? "2px solid #fff" : "2px solid transparent", fontWeight: tab === t ? "700" : "400" }}
            >
              {t.toUpperCase()}
              {t === "orders" && orderCounts.create > 0 && (
                <span style={{ marginLeft: "8px", backgroundColor: "#d97706", color: "#000", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", fontWeight: "800", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {orderCounts.create}
                </span>
              )}
              {t === "products" && productCounts.pending > 0 && (
                <span style={{ marginLeft: "8px", backgroundColor: "#d97706", color: "#000", borderRadius: "50%", width: "16px", height: "16px", fontSize: "9px", fontWeight: "800", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  {productCounts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === "stats" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "2px", marginBottom: "40px" }}>
              {[
                { label: "TOTAL PRODUCTS", value: products.length, color: "#fff" },
                { label: "TOTAL ORDERS", value: orders.length, color: "#fff" },
                { label: "TOTAL CLIENTS", value: clients.length, color: "#fff" },
                { label: "PENDING REVIEW", value: productCounts.pending, color: productCounts.pending > 0 ? "#d97706" : "#fff" },
              ].map((s) => (
                <div key={s.label} style={{ backgroundColor: "#0f0f0f", border: "1px solid #141414", padding: "28px 24px" }}>
                  <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>{s.label}</p>
                  <p style={{ fontSize: "36px", fontWeight: "800", color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px", marginBottom: "40px" }}>
              <div style={{ backgroundColor: "#0f0f0f", border: "1px solid #141414", padding: "24px" }}>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>PRODUCTS BY STATUS</p>
                {(["accept", "pending", "rejected"] as ProductFilter[]).filter(s => s !== "all").map((s) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #141414" }}>
                    <span style={{ color: STATUS_COLOR[s], fontSize: "11px", letterSpacing: "2px", fontWeight: "700" }}>{s.toUpperCase()}</span>
                    <span style={{ fontSize: "20px", fontWeight: "800" }}>{productCounts[s]}</span>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "#0f0f0f", border: "1px solid #141414", padding: "24px" }}>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>ORDERS BY STATUS</p>
                {(["create", "completed", "cancelled"]).map((s) => (
                  <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #141414" }}>
                    <span style={{ color: STATUS_COLOR[s], fontSize: "11px", letterSpacing: "2px", fontWeight: "700" }}>{s.toUpperCase()}</span>
                    <span style={{ fontSize: "20px", fontWeight: "800" }}>{orderCounts[s as keyof typeof orderCounts]}</span>
                  </div>
                ))}
              </div>

              <div style={{ backgroundColor: "#0f0f0f", border: "1px solid #141414", padding: "24px" }}>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>CLIENTS BY ROLE</p>
                {(["client", "moderator", "superadmin"]).map((role) => {
                  const count = clients.filter((c) => c.role === role).length;
                  return (
                    <div key={role} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #141414" }}>
                      <span style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", fontWeight: "700" }}>{role.toUpperCase()}</span>
                      <span style={{ fontSize: "20px", fontWeight: "800" }}>{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ backgroundColor: "#0f0f0f", border: "1px solid #141414", padding: "24px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "16px" }}>RECENT CLIENTS</p>
              <div style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 100px 100px", borderBottom: "1px solid #141414", padding: "0 0 10px" }}>
                {["ID", "NAME", "EMAIL", "BALANCE", "ROLE"].map((h) => (
                  <div key={h} style={{ color: "#333", fontSize: "10px", letterSpacing: "2px" }}>{h}</div>
                ))}
              </div>
              {clients.slice(0, 10).map((c) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "48px 1fr 1fr 100px 100px", padding: "12px 0", borderBottom: "1px solid #0f0f0f", alignItems: "center" }}>
                  <span style={{ color: "#333", fontSize: "12px" }}>#{c.id}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>{c.name}</span>
                  <span style={{ color: "#555", fontSize: "12px" }}>{c.email}</span>
                  <span style={{ fontSize: "13px" }}>${c.balance.toFixed(2)}</span>
                  <span style={{ color: "#444", fontSize: "10px", letterSpacing: "1px" }}>{(c.role ?? "client").toUpperCase()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", backgroundColor: "#141414", marginBottom: "32px", border: "1px solid #141414" }}>
              {(["create", "completed", "cancelled"]).map((s) => (
                <div key={s} style={{ backgroundColor: "#0a0a0a", padding: "20px 24px" }}>
                  <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "8px" }}>{s.toUpperCase()}</p>
                  <p style={{ color: STATUS_COLOR[s], fontSize: "28px", fontWeight: "800" }}>{orderCounts[s as keyof typeof orderCounts]}</p>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid #141414" }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 110px 200px", borderBottom: "1px solid #141414", padding: "0 16px" }}>
                {["ID", "TITLE", "CLIENT", "STATUS", "ACTIONS"].map((h) => (
                  <div key={h} style={{ padding: "12px 8px", color: "#333", fontSize: "10px", letterSpacing: "2px" }}>{h}</div>
                ))}
              </div>

              {orders.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px", color: "#333", fontSize: "12px", letterSpacing: "3px" }}>NO ORDERS</div>
              )}

              {orders.map((order) => (
                <div key={order.id} style={{ display: "grid", gridTemplateColumns: "60px 1fr 100px 110px 200px", borderBottom: "1px solid #0f0f0f", padding: "0 16px", alignItems: "center" }}>
                  <div style={{ padding: "14px 8px", color: "#333", fontSize: "12px" }}>#{order.id}</div>
                  <div style={{ padding: "14px 8px", fontWeight: "600", fontSize: "13px" }}>{order.title}</div>
                  <div style={{ padding: "14px 8px", color: "#555", fontSize: "12px" }}>Client #{order.client_id}</div>
                  <div style={{ padding: "14px 8px" }}>
                    <span style={{ color: STATUS_COLOR[order.status] || "#555", fontSize: "10px", letterSpacing: "1px", fontWeight: "700" }}>
                      {order.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ padding: "14px 8px", display: "flex", gap: "6px" }}>
                    {order.status === "create" && (
                      <>
                        <button
                          onClick={() => handleOrderStatus(order.id, "completed")}
                          style={{ backgroundColor: "#16a34a15", color: "#16a34a", border: "1px solid #16a34a30", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}
                        >
                          COMPLETE
                        </button>
                        <button
                          onClick={() => handleOrderStatus(order.id, "cancelled")}
                          style={{ backgroundColor: "#dc262615", color: "#dc2626", border: "1px solid #dc262630", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}
                        >
                          CANCEL
                        </button>
                      </>
                    )}
                    {order.status === "completed" && (
                      <button
                        onClick={() => handleOrderStatus(order.id, "cancelled")}
                        style={{ backgroundColor: "#dc262615", color: "#dc2626", border: "1px solid #dc262630", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}
                      >
                        REFUND
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", backgroundColor: "#141414", marginBottom: "40px", border: "1px solid #141414" }}>
              {(["all", "accept", "pending", "rejected"] as ProductFilter[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilter(s)}
                  style={{
                    backgroundColor: filter === s ? "#111" : "#0a0a0a",
                    border: "none",
                    padding: "20px 24px",
                    cursor: "pointer",
                    textAlign: "left",
                    borderBottom: filter === s ? `2px solid ${s === "all" ? "#fff" : STATUS_COLOR[s]}` : "2px solid transparent",
                  }}
                >
                  <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "8px" }}>{s.toUpperCase()}</p>
                  <p style={{ color: s === "all" ? "#fff" : STATUS_COLOR[s], fontSize: "28px", fontWeight: "800" }}>{productCounts[s]}</p>
                </button>
              ))}
            </div>

            <div style={{ marginBottom: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowForm(!showForm)}
                style={{ backgroundColor: showForm ? "transparent" : "#fff", color: showForm ? "#555" : "#000", border: showForm ? "1px solid #222" : "none", padding: "10px 24px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
              >
                {showForm ? "CANCEL" : "+ ADD PRODUCT"}
              </button>
            </div>

            {showForm && (
              <form onSubmit={handleCreate} style={{ backgroundColor: "#0d0d0d", border: "1px solid #141414", padding: "28px", marginBottom: "32px", borderRadius: "2px" }}>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "20px" }}>NEW PRODUCT</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 1fr", gap: "16px", alignItems: "end" }}>
                  <div>
                    <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>NAME</p>
                    <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Product name" style={inputStyle} />
                  </div>
                  <div>
                    <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>IMAGE URL</p>
                    <input type="url" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." style={inputStyle} />
                  </div>
                  <div>
                    <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>PRICE ($)</p>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required min="0" step="0.01" placeholder="0.00" style={inputStyle} />
                  </div>
                  <div>
                    <p style={{ color: "#444", fontSize: "10px", letterSpacing: "2px", marginBottom: "8px" }}>COLOR</p>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ width: "40px", height: "38px", border: "1px solid #222", backgroundColor: "#0d0d0d", borderRadius: "2px", cursor: "pointer", padding: "2px" }} />
                      <input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} style={{ ...inputStyle, flex: 1 }} placeholder="#000000" />
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" style={{ backgroundColor: "#fff", color: "#000", border: "none", padding: "11px 28px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}>CREATE</button>
                </div>
              </form>
            )}

            <div style={{ border: "1px solid #141414" }}>
              <div style={{ display: "grid", gridTemplateColumns: "48px 64px 1fr 100px 80px 110px 160px", borderBottom: "1px solid #141414", padding: "0 16px" }}>
                {["ID", "IMG", "NAME", "PRICE", "COLOR", "STATUS", "ACTIONS"].map((h) => (
                  <div key={h} style={{ padding: "12px 8px", color: "#333", fontSize: "10px", letterSpacing: "2px" }}>{h}</div>
                ))}
              </div>

              {visibleProducts.length === 0 && (
                <div style={{ textAlign: "center", padding: "48px", color: "#333", fontSize: "12px", letterSpacing: "3px" }}>NO PRODUCTS</div>
              )}

              {visibleProducts.map((product) => (
                <div key={product.id} style={{ display: "grid", gridTemplateColumns: "48px 64px 1fr 100px 80px 110px 160px", borderBottom: "1px solid #0f0f0f", padding: "0 16px", alignItems: "center" }}>
                  <div style={{ padding: "14px 8px", color: "#333", fontSize: "12px" }}>#{product.id}</div>
                  <div style={{ padding: "14px 8px" }}>
                    <div style={{ width: "40px", height: "40px", borderRadius: "2px", overflow: "hidden", backgroundColor: "#141414" }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />
                      )}
                    </div>
                  </div>
                  <div style={{ padding: "14px 8px", fontWeight: "600", fontSize: "13px" }}>{product.name}</div>
                  <div style={{ padding: "14px 8px", fontSize: "13px" }}>${product.price}</div>
                  <div style={{ padding: "14px 8px" }}>
                    <div style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: product.color, border: "1px solid #222" }} />
                  </div>
                  <div style={{ padding: "14px 8px" }}>
                    <span style={{ color: STATUS_COLOR[product.status] || "#555", fontSize: "10px", letterSpacing: "1px", fontWeight: "700" }}>
                      {product.status.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ padding: "14px 8px", display: "flex", gap: "6px" }}>
                    {product.status !== "accept" && (
                      <button onClick={() => handleModerate(product.id, "accept")} style={{ backgroundColor: "#16a34a15", color: "#16a34a", border: "1px solid #16a34a30", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}>APPROVE</button>
                    )}
                    {product.status !== "rejected" && (
                      <button onClick={() => handleModerate(product.id, "rejected")} style={{ backgroundColor: "#d9770615", color: "#d97706", border: "1px solid #d9770630", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}>REJECT</button>
                    )}
                    <button onClick={() => handleDelete(product.id)} style={{ backgroundColor: "#dc262615", color: "#dc2626", border: "1px solid #dc262630", padding: "5px 10px", cursor: "pointer", fontSize: "10px", letterSpacing: "1px", borderRadius: "2px", fontWeight: "700" }}>DEL</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

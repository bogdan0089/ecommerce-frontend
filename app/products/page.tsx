"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getMe, logout, aiSearch } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  status: string;
  image_url?: string | null;
}

interface CartItem {
  id: number;
  qty: number;
}

const CATEGORIES = [
  { label: "All", value: "all" },
  { label: "Footwear", value: "footwear", keywords: ["sneakers", "slides", "jordan", "yeezy", "balance", "air", "campus", "speedex", "sneaker"] },
  { label: "Clothing", value: "clothing", keywords: ["hoodie", "tee", "jeans", "jacket", "shirt"] },
  { label: "Accessories", value: "accessories", keywords: ["cap", "beanie", "bag", "hat"] },
];

function getCategory(name: string) {
  const lower = name.toLowerCase();
  for (const cat of CATEGORIES.slice(1)) {
    if (cat.keywords?.some((k) => lower.includes(k))) return cat.value;
  }
  return "other";
}

function getImageUrl(id: number) {
  return `https://picsum.photos/seed/product${id}/400/400`;
}

export default function ProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [filtered, setFiltered] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [userName, setUserName] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [maxPrice, setMaxPrice] = useState(500);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [cart, setCart] = useState<CartItem[]>(() =>
    typeof window !== "undefined" ? JSON.parse(localStorage.getItem("cart") || "[]") : []
  );
  const [aiQuery, setAiQuery] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    getMe()
      .then((me) => {
        setIsAdmin(me.role === "superadmin" || me.role === "moderator");
        setUserName(me.name);
      })
      .catch(() => setIsAdmin(false));

    authFetch("/product/all?limit=50")
      .then((data) => {
        setProducts(data);
        setFiltered(data);
        const initQty: Record<number, number> = {};
        data.forEach((p: Product) => (initQty[p.id] = 1));
        setQuantities(initQty);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = products;
    if (search) result = result.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
    if (category !== "all") result = result.filter((p) => getCategory(p.name) === category);
    result = result.filter((p) => p.price <= maxPrice);
    setFiltered(result);
  }, [search, category, maxPrice, products]);

  function setQty(id: number, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(1, Math.min(10, (prev[id] || 1) + delta)),
    }));
  }

  function addToCart(product: Product) {
    const qty = quantities[product.id] || 1;
    const existing = cart.find((i) => i.id === product.id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map((i) => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
    } else {
      updated = [...cart, { id: product.id, qty }];
    }
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  function handleLogout() { logout(); router.push("/login"); }

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", color: "#111" }}>
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #9ca3af; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: box-shadow 0.2s, transform 0.2s; animation: fadeUp 0.3s ease forwards; opacity: 0; }
        .card:hover { box-shadow: 0 4px 24px rgba(0,0,0,0.10); transform: translateY(-2px); }
        .card img { transition: transform 0.4s ease; }
        .card:hover img { transform: scale(1.04); }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111" }}>SHOP</span>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          {userName && <span style={{ color: "#6b7280", fontSize: "13px" }}>Hi, {userName.split(" ")[0]}</span>}
          {isAdmin === true && <a href="/admin" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}>Admin</a>}
          <a href="/profile" style={{ color: "#6b7280", fontSize: "13px", textDecoration: "none", fontWeight: "500" }}>Profile</a>
          <button onClick={() => router.push("/cart")} style={{ position: "relative", background: "#111", border: "none", color: "#fff", padding: "8px 20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            Cart
            {cartCount > 0 && <span style={{ backgroundColor: "#fff", color: "#111", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
          <button onClick={handleLogout} style={{ background: "none", border: "1px solid #e5e7eb", color: "#6b7280", cursor: "pointer", fontSize: "13px", padding: "7px 16px", borderRadius: "6px" }}>Logout</button>
        </div>
      </nav>

      <div style={{ display: "flex" }}>
        <aside style={{ width: "240px", minHeight: "calc(100vh - 64px)", borderRight: "1px solid #e5e7eb", padding: "32px 24px", flexShrink: 0, position: "sticky", top: "64px", height: "calc(100vh - 64px)", overflowY: "auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Search</p>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: "100%", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", color: "#111", padding: "9px 12px", fontSize: "13px", borderRadius: "6px", outline: "none" }}
            />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>Category</p>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left", background: category === cat.value ? "#f3f4f6" : "none", border: "none", color: category === cat.value ? "#111" : "#6b7280", cursor: "pointer", fontSize: "13px", padding: "8px 10px", borderRadius: "6px", fontWeight: category === cat.value ? "600" : "400" }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "10px" }}>
              <p style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase" }}>Max Price</p>
              <span style={{ color: "#111", fontSize: "13px", fontWeight: "700" }}>${maxPrice}</span>
            </div>
            <input type="range" min="0" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#111", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>$0</span>
              <span style={{ color: "#9ca3af", fontSize: "12px" }}>$500</span>
            </div>
          </div>

          {(search || category !== "all" || maxPrice < 500) && (
            <button
              onClick={() => { setSearch(""); setCategory("all"); setMaxPrice(500); }}
              style={{ width: "100%", background: "none", border: "1px solid #e5e7eb", color: "#6b7280", padding: "8px", cursor: "pointer", fontSize: "12px", borderRadius: "6px" }}
            >
              Clear filters
            </button>
          )}

          <div style={{ marginTop: "32px" }}>
            <p style={{ color: "#9ca3af", fontSize: "11px", fontWeight: "600", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px" }}>AI Search</p>
            <input
              type="text"
              placeholder="e.g. shoes for running..."
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              style={{ width: "100%", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", color: "#111", padding: "9px 12px", fontSize: "13px", borderRadius: "6px", outline: "none", marginBottom: "8px" }}
            />
            <button
              onClick={async () => {
                if (!aiQuery.trim()) return;
                setAiLoading(true);
                setAiResult("");
                try { const res = await aiSearch(aiQuery); setAiResult(res); }
                catch { setAiResult("Something went wrong."); }
                finally { setAiLoading(false); }
              }}
              disabled={aiLoading}
              style={{ width: "100%", backgroundColor: aiLoading ? "#e5e7eb" : "#111", color: aiLoading ? "#9ca3af" : "#fff", border: "none", padding: "9px", cursor: aiLoading ? "not-allowed" : "pointer", fontSize: "12px", fontWeight: "600", borderRadius: "6px" }}
            >
              {aiLoading ? "Searching..." : "Search with AI"}
            </button>
            {aiResult && (
              <div style={{ marginTop: "10px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "6px", padding: "10px 12px", fontSize: "12px", color: "#374151", lineHeight: "1.6" }}>
                {aiResult}
              </div>
            )}
          </div>
        </aside>

        <main style={{ flex: 1, padding: "32px 32px 80px" }}>
          <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "24px" }}>{filtered.length} products</p>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <p style={{ color: "#d1d5db", fontSize: "16px" }}>No products found</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px" }}>
              {filtered.map((product, i) => {
                const inCart = cart.find((c) => c.id === product.id);
                const qty = quantities[product.id] || 1;
                return (
                  <div key={product.id} className="card" style={{ backgroundColor: "#fff", border: "1px solid #e5e7eb", borderRadius: "12px", overflow: "hidden", animationDelay: `${i * 0.04}s` }}>
                    <a href={`/products/${product.id}`} style={{ display: "block", overflow: "hidden", aspectRatio: "1", backgroundColor: "#f9fafb", textDecoration: "none" }}>
                      <img
                        src={product.image_url || getImageUrl(product.id)}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.style.backgroundColor = product.color; }}
                      />
                    </a>

                    <div style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600", color: "#111" }}>{product.name}</p>
                        <p style={{ fontSize: "15px", fontWeight: "700", color: "#111", flexShrink: 0, marginLeft: "8px" }}>${product.price}</p>
                      </div>
                      <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{getCategory(product.name)}</p>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                          <button onClick={() => setQty(product.id, -1)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "6px 10px", fontSize: "16px", lineHeight: 1 }}>−</button>
                          <span style={{ color: "#111", fontSize: "13px", fontWeight: "600", minWidth: "20px", textAlign: "center" }}>{qty}</span>
                          <button onClick={() => setQty(product.id, 1)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "6px 10px", fontSize: "16px", lineHeight: 1 }}>+</button>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          style={{ flex: 1, backgroundColor: inCart ? "#f3f4f6" : "#111", color: inCart ? "#6b7280" : "#fff", border: "none", borderRadius: "6px", padding: "8px", cursor: "pointer", fontWeight: "600", fontSize: "12px", transition: "all 0.2s" }}
                        >
                          {inCart ? `In cart (${inCart.qty})` : "Add to cart"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getMe, logout } from "@/lib/api";

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
  { label: "Footwear", value: "footwear", keywords: ["sneakers", "slides", "jordan", "yeezy", "balance", "air"] },
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
      <style>{`
        * { box-sizing: border-box; }
        input::placeholder { color: #444; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .card { transition: background 0.2s; animation: fadeUp 0.4s ease forwards; opacity: 0; }
        .card:hover { background: #161616 !important; }
        .card img { transition: transform 0.4s ease; }
        .card:hover img { transform: scale(1.04); }
        a { transition: color 0.2s; }
        a:hover { color: #fff !important; }
      `}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 200, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "40px" }}>
          <span style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px" }}>SHOP</span>
          <div style={{ display: "flex", gap: "4px" }}>
            {CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => setCategory(cat.value)} style={{ background: "none", border: "none", color: category === cat.value ? "#fff" : "#555", cursor: "pointer", fontSize: "11px", letterSpacing: "2px", fontWeight: "600", padding: "6px 12px", borderRadius: "2px", backgroundColor: category === cat.value ? "#1a1a1a" : "transparent", transition: "all 0.15s" }}>
                {cat.label.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          {userName && <span style={{ color: "#444", fontSize: "12px" }}>Hi, {userName.split(" ")[0]}</span>}
          {isAdmin === true && <a href="/admin" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px" }}>ADMIN</a>}
          <a href="/profile" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px" }}>PROFILE</a>
          <button onClick={() => router.push("/cart")} style={{ position: "relative", background: "none", border: "1px solid #1f1f1f", color: "#888", padding: "7px 18px", cursor: "pointer", fontSize: "11px", letterSpacing: "2px", borderRadius: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
            CART
            {cartCount > 0 && <span style={{ backgroundColor: "#fff", color: "#000", borderRadius: "50%", width: "17px", height: "17px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
          <button onClick={handleLogout} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "11px", letterSpacing: "2px" }}>LOGOUT</button>
        </div>
      </nav>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <aside style={{ width: "220px", minHeight: "calc(100vh - 60px)", borderRight: "1px solid #141414", padding: "32px 20px", flexShrink: 0, position: "sticky", top: "60px", height: "calc(100vh - 60px)", overflowY: "auto" }}>
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#383838", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>SEARCH</p>
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} style={{ width: "100%", backgroundColor: "#0f0f0f", border: "1px solid #1a1a1a", color: "#fff", padding: "9px 12px", fontSize: "13px", borderRadius: "2px", outline: "none" }} />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#383838", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>MAX PRICE</p>
            <input type="range" min="0" max="500" step="10" value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#fff", cursor: "pointer" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
              <span style={{ color: "#444", fontSize: "12px" }}>$0</span>
              <span style={{ color: "#fff", fontSize: "12px", fontWeight: "700" }}>${maxPrice}</span>
            </div>
          </div>

          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "#383838", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>CATEGORY</p>
            {CATEGORIES.map((cat) => (
              <button key={cat.value} onClick={() => setCategory(cat.value)} style={{ display: "flex", alignItems: "center", gap: "10px", width: "100%", textAlign: "left", background: "none", border: "none", color: category === cat.value ? "#fff" : "#444", cursor: "pointer", fontSize: "12px", padding: "8px 0", letterSpacing: "1px", transition: "color 0.2s" }}>
                <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: category === cat.value ? "#fff" : "#333" }} />
                {cat.label}
              </button>
            ))}
          </div>

          {(search || category !== "all" || maxPrice < 500) && (
            <button onClick={() => { setSearch(""); setCategory("all"); setMaxPrice(500); }} style={{ width: "100%", background: "none", border: "1px solid #1f1f1f", color: "#444", padding: "8px", cursor: "pointer", fontSize: "10px", letterSpacing: "3px", borderRadius: "2px" }}>
              CLEAR ALL
            </button>
          )}
        </aside>

        {/* Grid */}
        <main style={{ flex: 1, padding: "32px 32px 80px" }}>
          <p style={{ color: "#383838", fontSize: "11px", letterSpacing: "3px", marginBottom: "24px" }}>{filtered.length} PRODUCTS</p>

          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "100px 0" }}>
              <p style={{ color: "#2a2a2a", fontSize: "13px", letterSpacing: "4px" }}>NO PRODUCTS FOUND</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "2px" }}>
              {filtered.map((product, i) => {
                const inCart = cart.find((c) => c.id === product.id);
                const qty = quantities[product.id] || 1;
                return (
                  <div key={product.id} className="card" style={{ backgroundColor: "#0f0f0f", animationDelay: `${i * 0.05}s` }}>
                    {/* Image */}
                    <a href={`/products/${product.id}`} style={{ display: "block", overflow: "hidden", aspectRatio: "1", backgroundColor: "#141414", textDecoration: "none" }}>
                      <img
                        src={product.image_url || getImageUrl(product.id)}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; (e.target as HTMLImageElement).parentElement!.style.backgroundColor = product.color; }}
                      />
                    </a>

                    {/* Info */}
                    <div style={{ padding: "18px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600", letterSpacing: "0.2px" }}>{product.name}</p>
                        <p style={{ fontSize: "15px", fontWeight: "700", flexShrink: 0, marginLeft: "8px" }}>${product.price}</p>
                      </div>
                      <p style={{ color: "#383838", fontSize: "10px", letterSpacing: "2px", marginBottom: "16px" }}>{getCategory(product.name).toUpperCase()}</p>

                      {/* Qty + Add */}
                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #1f1f1f", borderRadius: "2px" }}>
                          <button onClick={() => setQty(product.id, -1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "7px 12px", fontSize: "14px", lineHeight: 1 }}>−</button>
                          <span style={{ color: "#fff", fontSize: "13px", fontWeight: "600", minWidth: "20px", textAlign: "center" }}>{qty}</span>
                          <button onClick={() => setQty(product.id, 1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "7px 12px", fontSize: "14px", lineHeight: 1 }}>+</button>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          style={{ flex: 1, backgroundColor: inCart ? "#141414" : "#fff", color: inCart ? "#555" : "#000", border: inCart ? "1px solid #1f1f1f" : "none", borderRadius: "2px", padding: "8px", cursor: "pointer", fontWeight: "700", fontSize: "10px", letterSpacing: "2px", transition: "all 0.2s" }}
                        >
                          {inCart ? `IN CART (${inCart.qty})` : "ADD TO CART"}
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

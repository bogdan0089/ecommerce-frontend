"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, Product } from "@/lib/api";

interface CartItem {
  id: number;
  qty: number;
}

function getImageUrl(id: number) {
  return `https://picsum.photos/seed/product${id}/800/800`;
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = parseInt(params.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    const stored: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(stored);
    const inCart = stored.find((i) => i.id === id);
    if (inCart) setQty(inCart.qty);

    getProduct(id)
      .then(setProduct)
      .catch(() => router.push("/products"))
      .finally(() => setLoading(false));
  }, [id]);

  function addToCart() {
    const existing = cart.find((i) => i.id === id);
    let updated: CartItem[];
    if (existing) {
      updated = cart.map((i) => i.id === id ? { ...i, qty } : i);
    } else {
      updated = [...cart, { id, qty }];
    }
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const inCart = cart.find((i) => i.id === id);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "32px", height: "32px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a href="/products" style={{ color: "#555", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>← ALL PRODUCTS</a>
          <button onClick={() => router.push("/cart")} style={{ position: "relative", background: "none", border: "1px solid #1f1f1f", color: "#888", padding: "7px 18px", cursor: "pointer", fontSize: "11px", letterSpacing: "2px", borderRadius: "2px", display: "flex", alignItems: "center", gap: "8px" }}>
            CART
            {cartCount > 0 && <span style={{ backgroundColor: "#fff", color: "#000", borderRadius: "50%", width: "17px", height: "17px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 40px" }}>
        {/* Breadcrumb */}
        <p style={{ color: "#333", fontSize: "11px", letterSpacing: "2px", marginBottom: "48px" }}>
          <a href="/products" style={{ color: "#333", textDecoration: "none" }}>PRODUCTS</a>
          {" / "}
          <span style={{ color: "#555" }}>{product.name.toUpperCase()}</span>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>

          {/* Image */}
          <div style={{ position: "sticky", top: "80px" }}>
            <div style={{ aspectRatio: "1", backgroundColor: "#111", overflow: "hidden", borderRadius: "2px" }}>
              <img
                src={product.image_url || getImageUrl(product.id)}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (e.target as HTMLImageElement).parentElement!.style.backgroundColor = product.color;
                }}
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <p style={{ color: "#333", fontSize: "10px", letterSpacing: "4px", marginBottom: "12px" }}>#{product.id}</p>
            <h1 style={{ fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "8px" }}>{product.name}</h1>
            <p style={{ fontSize: "28px", fontWeight: "800", marginBottom: "32px" }}>${product.price}</p>

            {/* Color */}
            <div style={{ marginBottom: "32px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>COLOR</p>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: product.color, border: "2px solid #fff" }} />
                <span style={{ color: "#555", fontSize: "13px" }}>{product.color}</span>
              </div>
            </div>

            {/* Qty */}
            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "12px" }}>QUANTITY</p>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #1f1f1f", borderRadius: "2px", width: "fit-content" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "12px 20px", fontSize: "18px", lineHeight: 1 }}>−</button>
                <span style={{ color: "#fff", fontSize: "14px", fontWeight: "700", minWidth: "40px", textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "12px 20px", fontSize: "18px", lineHeight: 1 }}>+</button>
              </div>
            </div>

            {/* Total */}
            <div style={{ backgroundColor: "#0d0d0d", border: "1px solid #141414", padding: "16px 20px", marginBottom: "24px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#444", fontSize: "13px" }}>Total</span>
              <span style={{ fontWeight: "800", fontSize: "16px" }}>${(product.price * qty).toFixed(2)}</span>
            </div>

            {/* Add to cart */}
            <button
              onClick={addToCart}
              style={{ width: "100%", backgroundColor: added ? "#16a34a" : "#fff", color: added ? "#fff" : "#000", border: "none", padding: "16px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", transition: "all 0.3s", marginBottom: "12px" }}
            >
              {added ? "✓ ADDED TO CART" : inCart ? "UPDATE CART" : "ADD TO CART"}
            </button>

            <a href="/cart" style={{ display: "block", textAlign: "center", color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none" }}>
              VIEW CART →
            </a>

            {/* Info */}
            <div style={{ marginTop: "40px", borderTop: "1px solid #141414", paddingTop: "32px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Free Shipping", value: "On all orders" },
                { label: "Easy Returns", value: "Cancel anytime" },
                { label: "Secure Payment", value: "Balance checkout" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#444", fontSize: "12px" }}>{item.label}</span>
                  <span style={{ color: "#555", fontSize: "12px" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

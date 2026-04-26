"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, Product } from "@/lib/api";

interface CartItem { id: number; qty: number; }

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
    getProduct(id).then(setProduct).catch(() => router.push("/products")).finally(() => setLoading(false));
  }, [id]);

  function addToCart() {
    const existing = cart.find((i) => i.id === id);
    const updated = existing
      ? cart.map((i) => i.id === id ? { ...i, qty } : i)
      : [...cart, { id, qty }];
    setCart(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  const inCart = cart.find((i) => i.id === id);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (!product) return null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fff", color: "#111" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <a href="/products" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>← All products</a>
          <button onClick={() => router.push("/cart")} style={{ position: "relative", background: "#111", border: "none", color: "#fff", padding: "8px 20px", cursor: "pointer", fontSize: "13px", fontWeight: "600", borderRadius: "6px", display: "flex", alignItems: "center", gap: "8px" }}>
            Cart
            {cartCount > 0 && <span style={{ backgroundColor: "#fff", color: "#111", borderRadius: "50%", width: "18px", height: "18px", fontSize: "10px", fontWeight: "800", display: "flex", alignItems: "center", justifyContent: "center" }}>{cartCount}</span>}
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 40px" }}>
        <p style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "32px" }}>
          <a href="/products" style={{ color: "#9ca3af", textDecoration: "none" }}>Products</a>
          {" / "}
          <span style={{ color: "#111" }}>{product.name}</span>
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "64px", alignItems: "start" }}>
          <div style={{ position: "sticky", top: "80px" }}>
            <div style={{ aspectRatio: "1", backgroundColor: "#f9fafb", overflow: "hidden", borderRadius: "16px", border: "1px solid #e5e7eb" }}>
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

          <div>
            <p style={{ color: "#9ca3af", fontSize: "12px", marginBottom: "8px" }}>Product #{product.id}</p>
            <h1 style={{ fontSize: "32px", fontWeight: "700", letterSpacing: "-0.5px", marginBottom: "8px" }}>{product.name}</h1>
            <p style={{ fontSize: "28px", fontWeight: "800", color: "#111", marginBottom: "32px" }}>${product.price}</p>

            <div style={{ marginBottom: "28px" }}>
              <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: "500", marginBottom: "10px" }}>Color</p>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: product.color, border: "2px solid #e5e7eb" }} />
                <span style={{ color: "#6b7280", fontSize: "13px" }}>{product.color}</span>
              </div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <p style={{ color: "#6b7280", fontSize: "13px", fontWeight: "500", marginBottom: "10px" }}>Quantity</p>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "8px", width: "fit-content" }}>
                <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "10px 18px", fontSize: "18px", lineHeight: 1 }}>−</button>
                <span style={{ color: "#111", fontSize: "15px", fontWeight: "700", minWidth: "36px", textAlign: "center" }}>{qty}</span>
                <button onClick={() => setQty(Math.min(10, qty + 1))} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "10px 18px", fontSize: "18px", lineHeight: 1 }}>+</button>
              </div>
            </div>

            <div style={{ backgroundColor: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "14px 18px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#6b7280", fontSize: "14px" }}>Total</span>
              <span style={{ fontWeight: "800", fontSize: "18px" }}>${(product.price * qty).toFixed(2)}</span>
            </div>

            <button
              onClick={addToCart}
              style={{ width: "100%", backgroundColor: added ? "#16a34a" : "#111", color: "#fff", border: "none", padding: "15px", cursor: "pointer", fontWeight: "700", fontSize: "14px", borderRadius: "10px", transition: "background 0.3s", marginBottom: "10px" }}
            >
              {added ? "✓ Added to cart" : inCart ? "Update cart" : "Add to cart"}
            </button>

            <a href="/cart" style={{ display: "block", textAlign: "center", color: "#6b7280", fontSize: "13px", textDecoration: "none" }}>
              View cart →
            </a>

            <div style={{ marginTop: "36px", borderTop: "1px solid #e5e7eb", paddingTop: "24px", display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Free Shipping", value: "On all orders" },
                { label: "Easy Returns", value: "Cancel anytime" },
                { label: "Secure Payment", value: "Balance checkout" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#374151", fontSize: "13px", fontWeight: "500" }}>{item.label}</span>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

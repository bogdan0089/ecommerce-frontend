"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch } from "@/lib/api";

interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  image_url?: string | null;
}

interface CartItem {
  id: number;
  qty: number;
}

export default function CartPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const items: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
    if (items.length === 0) { setLoading(false); return; }
    authFetch("/product/all?limit=100")
      .then((all: Product[]) => setProducts(all.filter((p) => items.some((i) => i.id === p.id))))
      .finally(() => setLoading(false));
  }, []);

  function updateQty(id: number, delta: number) {
    const updated = cartItems.map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i).filter((i) => i.qty > 0);
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    if (!updated.find((i) => i.id === id)) setProducts(products.filter((p) => p.id !== id));
  }

  function removeItem(id: number) {
    const updated = cartItems.filter((i) => i.id !== id);
    setCartItems(updated);
    setProducts(products.filter((p) => p.id !== id));
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  function clearCart() {
    setCartItems([]); setProducts([]); localStorage.setItem("cart", "[]");
  }

  const total = products.reduce((sum, p) => sum + p.price * (cartItems.find((i) => i.id === p.id)?.qty || 1), 0);
  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ width: "32px", height: "32px", border: "2px solid #e5e7eb", borderTop: "2px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <a href="/products" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>← Back to shop</a>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "48px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
          <h1 style={{ fontSize: "28px", fontWeight: "700" }}>Your cart ({totalItems})</h1>
          {products.length > 0 && (
            <button onClick={clearCart} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "13px" }}>Clear all</button>
          )}
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <p style={{ color: "#9ca3af", fontSize: "16px", marginBottom: "24px" }}>Your cart is empty</p>
            <a href="/products" style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "12px 32px", fontSize: "14px", fontWeight: "600", textDecoration: "none", borderRadius: "8px" }}>
              Continue shopping
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
            <div style={{ flex: 1 }}>
              {products.map((product) => {
                const qty = cartItems.find((i) => i.id === product.id)?.qty || 1;
                return (
                  <div key={product.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "20px", marginBottom: "12px", backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb" }}>
                    <div style={{ width: "80px", height: "80px", flexShrink: 0, overflow: "hidden", borderRadius: "8px", backgroundColor: "#f3f4f6" }}>
                      {product.image_url
                        ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}>{product.name}</p>
                      <p style={{ color: "#6b7280", fontSize: "13px", marginBottom: "12px" }}>${product.price} each</p>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #e5e7eb", borderRadius: "6px" }}>
                          <button onClick={() => updateQty(product.id, -1)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}>−</button>
                          <span style={{ fontSize: "14px", fontWeight: "600", minWidth: "24px", textAlign: "center" }}>{qty}</span>
                          <button onClick={() => updateQty(product.id, 1)} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}>+</button>
                        </div>
                        <button onClick={() => removeItem(product.id)} style={{ background: "none", border: "none", color: "#9ca3af", cursor: "pointer", fontSize: "13px" }}>Remove</button>
                      </div>
                    </div>
                    <span style={{ fontSize: "17px", fontWeight: "700" }}>${(product.price * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ width: "300px", flexShrink: 0 }}>
              <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "28px" }}>
                <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}>Order summary</h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Items ({totalItems})</span>
                    <span style={{ fontSize: "14px" }}>${total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#6b7280", fontSize: "14px" }}>Shipping</span>
                    <span style={{ fontSize: "14px", color: "#16a34a", fontWeight: "600" }}>Free</span>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "600", fontSize: "15px" }}>Total</span>
                  <span style={{ fontWeight: "800", fontSize: "22px" }}>${total.toFixed(2)}</span>
                </div>
                <button
                  onClick={() => router.push("/checkout")}
                  style={{ width: "100%", backgroundColor: "#111", color: "#fff", border: "none", padding: "14px", cursor: "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}
                >
                  Checkout
                </button>
                <a href="/products" style={{ display: "block", textAlign: "center", color: "#6b7280", fontSize: "13px", textDecoration: "none", marginTop: "14px" }}>
                  Continue shopping
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

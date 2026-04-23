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

    if (items.length === 0) {
      setLoading(false);
      return;
    }

    authFetch("/product/all?limit=100")
      .then((all: Product[]) => {
        const inCart = all.filter((p) => items.some((i) => i.id === p.id));
        setProducts(inCart);
      })
      .finally(() => setLoading(false));
  }, []);

  function updateQty(id: number, delta: number) {
    const updated = cartItems
      .map((i) => i.id === id ? { ...i, qty: i.qty + delta } : i)
      .filter((i) => i.qty > 0);
    setCartItems(updated);
    localStorage.setItem("cart", JSON.stringify(updated));
    if (!updated.find((i) => i.id === id)) {
      setProducts(products.filter((p) => p.id !== id));
    }
  }

  function removeItem(id: number) {
    const updated = cartItems.filter((i) => i.id !== id);
    setCartItems(updated);
    setProducts(products.filter((p) => p.id !== id));
    localStorage.setItem("cart", JSON.stringify(updated));
  }

  function clearCart() {
    setCartItems([]);
    setProducts([]);
    localStorage.setItem("cart", "[]");
  }

  const total = products.reduce((sum, p) => {
    const item = cartItems.find((i) => i.id === p.id);
    return sum + p.price * (item?.qty || 1);
  }, 0);

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);

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
      <style>{`* { box-sizing: border-box; } a:hover { color: #fff !important; }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <a href="/products" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px", transition: "color 0.2s" }}>← BACK TO SHOP</a>
      </nav>

      <main style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "48px" }}>
          <div>
            <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>YOUR CART</p>
            <h1 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px" }}>{totalItems} {totalItems === 1 ? "Item" : "Items"}</h1>
          </div>
          {products.length > 0 && (
            <button onClick={clearCart} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: "11px", letterSpacing: "2px" }}>CLEAR ALL</button>
          )}
        </div>

        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "100px 0" }}>
            <p style={{ color: "#2a2a2a", fontSize: "13px", letterSpacing: "4px", marginBottom: "32px" }}>YOUR CART IS EMPTY</p>
            <a href="/products" style={{ color: "#888", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", border: "1px solid #222", padding: "12px 32px" }}>
              CONTINUE SHOPPING
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", gap: "48px", alignItems: "flex-start" }}>

            {/* Items */}
            <div style={{ flex: 1 }}>
              {products.map((product) => {
                const item = cartItems.find((i) => i.id === product.id);
                const qty = item?.qty || 1;
                return (
                  <div key={product.id} style={{ display: "flex", gap: "20px", alignItems: "center", paddingBottom: "24px", marginBottom: "24px", borderBottom: "1px solid #141414" }}>
                    {/* Image */}
                    <div style={{ width: "88px", height: "88px", flexShrink: 0, overflow: "hidden", borderRadius: "2px", backgroundColor: "#141414" }}>
                      {product.image_url ? (
                        <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}>{product.name}</p>
                      <p style={{ color: "#444", fontSize: "12px", marginBottom: "12px" }}>${product.price} each</p>

                      {/* Qty controls */}
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", border: "1px solid #1f1f1f", borderRadius: "2px" }}>
                          <button onClick={() => updateQty(product.id, -1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}>−</button>
                          <span style={{ fontSize: "13px", fontWeight: "600", minWidth: "20px", textAlign: "center" }}>{qty}</span>
                          <button onClick={() => updateQty(product.id, 1)} style={{ background: "none", border: "none", color: "#555", cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}>+</button>
                        </div>
                        <button onClick={() => removeItem(product.id)} style={{ background: "none", border: "none", color: "#333", cursor: "pointer", fontSize: "12px", letterSpacing: "1px" }}>REMOVE</button>
                      </div>
                    </div>

                    <span style={{ fontSize: "18px", fontWeight: "700", flexShrink: 0 }}>${(product.price * qty).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div style={{ width: "300px", flexShrink: 0 }}>
              <div style={{ backgroundColor: "#111", padding: "32px" }}>
                <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "24px" }}>ORDER SUMMARY</p>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555", fontSize: "13px" }}>Items ({totalItems})</span>
                    <span style={{ fontSize: "13px" }}>${total.toFixed(2)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555", fontSize: "13px" }}>Shipping</span>
                    <span style={{ fontSize: "13px", color: "#16a34a" }}>FREE</span>
                  </div>
                </div>

                <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "20px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontWeight: "700", fontSize: "13px", letterSpacing: "2px" }}>TOTAL</span>
                  <span style={{ fontWeight: "800", fontSize: "24px" }}>${total.toFixed(2)}</span>
                </div>

                <button
                  onClick={() => router.push("/checkout")}
                  style={{ width: "100%", backgroundColor: "#fff", color: "#000", border: "none", padding: "14px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
                >
                  CHECKOUT
                </button>

                <a href="/products" style={{ display: "block", textAlign: "center", color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", marginTop: "16px" }}>
                  CONTINUE SHOPPING
                </a>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

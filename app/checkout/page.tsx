"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getMe, createOrder, addProductToOrder, checkoutOrder } from "@/lib/api";

interface Product { id: number; name: string; price: number; color: string; image_url?: string | null; }
interface CartItem { id: number; qty: number; }
type Step = "review" | "placing" | "success" | "error";

export default function CheckoutPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("review");
  const [errorMsg, setErrorMsg] = useState("");
  const [placingMsg, setPlacingMsg] = useState("");

  useEffect(() => {
    const items: CartItem[] = JSON.parse(localStorage.getItem("cart") || "[]");
    setCartItems(items);
    if (items.length === 0) { setLoading(false); return; }
    Promise.all([authFetch("/product/all?limit=100"), getMe()])
      .then(([allProducts, me]) => {
        setProducts(allProducts.filter((p: Product) => items.some((i) => i.id === p.id)));
        setBalance(me.balance);
        setUserName(me.name);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  const total = products.reduce((sum, p) => sum + p.price * (cartItems.find((i) => i.id === p.id)?.qty || 1), 0);
  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const canAfford = balance >= total;

  async function handlePlaceOrder() {
    setStep("placing");
    try {
      setPlacingMsg("Creating order...");
      const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const order = await createOrder(`Order — ${date}`);
      setPlacingMsg("Adding products...");
      for (const item of cartItems) await addProductToOrder(order.id, item.id, item.qty);
      setPlacingMsg("Processing payment...");
      await checkoutOrder(order.id);
      localStorage.setItem("cart", "[]");
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

  const spinnerStyle = { width: "36px", height: "36px", border: "3px solid #e5e7eb", borderTop: "3px solid #111", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 20px" };

  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={spinnerStyle} />
    </div>
  );

  if (step === "placing") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ textAlign: "center" }}>
        <div style={spinnerStyle} />
        <p style={{ color: "#111", fontSize: "16px", fontWeight: "600", marginBottom: "6px" }}>{placingMsg}</p>
        <p style={{ color: "#9ca3af", fontSize: "13px" }}>Please wait...</p>
      </div>
    </div>
  );

  if (step === "success") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "48px 40px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ color: "#16a34a", fontSize: "24px" }}>✓</span>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#111", marginBottom: "8px" }}>Order placed!</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Your order has been placed and payment processed.</p>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button onClick={() => router.push("/profile")} style={{ backgroundColor: "#111", color: "#fff", border: "none", padding: "12px 32px", cursor: "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}>View orders</button>
          <button onClick={() => router.push("/products")} style={{ background: "none", color: "#6b7280", border: "1px solid #e5e7eb", padding: "12px 32px", cursor: "pointer", fontWeight: "500", fontSize: "14px", borderRadius: "8px" }}>Continue shopping</button>
        </div>
      </div>
    </div>
  );

  if (step === "error") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" }}>
      <div style={{ textAlign: "center", maxWidth: "400px", backgroundColor: "#fff", borderRadius: "16px", border: "1px solid #e5e7eb", padding: "48px 40px" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#fef2f2", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
          <span style={{ color: "#dc2626", fontSize: "24px" }}>✗</span>
        </div>
        <h1 style={{ fontSize: "22px", fontWeight: "700", color: "#111", marginBottom: "8px" }}>Order failed</h1>
        <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "32px", backgroundColor: "#fef2f2", padding: "12px 16px", borderRadius: "8px" }}>{errorMsg}</p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
          <button onClick={() => router.push("/cart")} style={{ background: "none", color: "#6b7280", border: "1px solid #e5e7eb", padding: "11px 20px", cursor: "pointer", fontSize: "14px", borderRadius: "8px" }}>Back to cart</button>
          <button onClick={() => { setStep("review"); setErrorMsg(""); }} style={{ backgroundColor: "#111", color: "#fff", border: "none", padding: "11px 20px", cursor: "pointer", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}>Try again</button>
        </div>
      </div>
    </div>
  );

  if (cartItems.length === 0) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <p style={{ color: "#9ca3af", fontSize: "16px", marginBottom: "24px" }}>Your cart is empty</p>
        <a href="/products" style={{ display: "inline-block", backgroundColor: "#111", color: "#fff", padding: "12px 32px", fontSize: "14px", fontWeight: "600", textDecoration: "none", borderRadius: "8px" }}>Go shopping</a>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f9fafb", color: "#111" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      <nav style={{ backgroundColor: "#fff", borderBottom: "1px solid #e5e7eb", padding: "0 40px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "18px", fontWeight: "800", letterSpacing: "4px", color: "#111", textDecoration: "none" }}>SHOP</a>
        <a href="/cart" style={{ color: "#6b7280", fontSize: "14px", textDecoration: "none" }}>← Back to cart</a>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "48px 40px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: "700", marginBottom: "8px" }}>Checkout</h1>
        {userName && <p style={{ color: "#6b7280", fontSize: "14px", marginBottom: "32px" }}>Hi, {userName.split(" ")[0]}</p>}

        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: "15px", fontWeight: "600", color: "#374151", marginBottom: "16px" }}>Items ({totalItems})</h2>
            {products.map((product) => {
              const qty = cartItems.find((i) => i.id === product.id)?.qty || 1;
              return (
                <div key={product.id} style={{ display: "flex", gap: "14px", alignItems: "center", padding: "16px", marginBottom: "10px", backgroundColor: "#fff", borderRadius: "10px", border: "1px solid #e5e7eb" }}>
                  <div style={{ width: "56px", height: "56px", flexShrink: 0, borderRadius: "8px", overflow: "hidden", backgroundColor: "#f3f4f6" }}>
                    {product.image_url ? <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", fontSize: "14px", marginBottom: "2px" }}>{product.name}</p>
                    <p style={{ color: "#6b7280", fontSize: "13px" }}>Qty: {qty} × ${product.price}</p>
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "15px" }}>${(product.price * qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          <div style={{ width: "280px", flexShrink: 0 }}>
            <div style={{ backgroundColor: "#fff", borderRadius: "12px", border: "1px solid #e5e7eb", padding: "24px" }}>
              <h2 style={{ fontSize: "16px", fontWeight: "600", marginBottom: "20px" }}>Payment</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>Subtotal</span>
                  <span style={{ fontSize: "14px" }}>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>Shipping</span>
                  <span style={{ fontSize: "14px", color: "#16a34a", fontWeight: "600" }}>Free</span>
                </div>
              </div>
              <div style={{ borderTop: "1px solid #e5e7eb", paddingTop: "14px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "600", fontSize: "15px" }}>Total</span>
                <span style={{ fontWeight: "800", fontSize: "20px" }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ backgroundColor: "#f9fafb", borderRadius: "8px", padding: "12px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>Your balance</span>
                  <span style={{ fontSize: "13px", color: canAfford ? "#16a34a" : "#dc2626", fontWeight: "600" }}>${balance.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#6b7280", fontSize: "13px" }}>After payment</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", color: canAfford ? "#111" : "#dc2626" }}>
                    {canAfford ? `$${(balance - total).toFixed(2)}` : "Insufficient funds"}
                  </span>
                </div>
              </div>
              {!canAfford && (
                <p style={{ color: "#dc2626", fontSize: "12px", textAlign: "center", marginBottom: "12px" }}>
                  Not enough balance. <a href="/profile" style={{ color: "#dc2626", fontWeight: "600" }}>Deposit funds →</a>
                </p>
              )}
              <button
                onClick={handlePlaceOrder}
                disabled={!canAfford}
                style={{ width: "100%", backgroundColor: canAfford ? "#111" : "#e5e7eb", color: canAfford ? "#fff" : "#9ca3af", border: "none", padding: "13px", cursor: canAfford ? "pointer" : "not-allowed", fontWeight: "600", fontSize: "14px", borderRadius: "8px" }}
              >
                Place order
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

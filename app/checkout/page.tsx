"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authFetch, getMe, createOrder, addProductToOrder, checkoutOrder } from "@/lib/api";

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

    if (items.length === 0) {
      setLoading(false);
      return;
    }

    Promise.all([
      authFetch("/product/all?limit=100"),
      getMe(),
    ])
      .then(([allProducts, me]) => {
        const inCart = allProducts.filter((p: Product) => items.some((i) => i.id === p.id));
        setProducts(inCart);
        setBalance(me.balance);
        setUserName(me.name);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, []);

  const total = products.reduce((sum, p) => {
    const item = cartItems.find((i) => i.id === p.id);
    return sum + p.price * (item?.qty || 1);
  }, 0);

  const totalItems = cartItems.reduce((sum, i) => sum + i.qty, 0);
  const canAfford = balance >= total;

  async function handlePlaceOrder() {
    setStep("placing");
    try {
      setPlacingMsg("Creating order...");
      const date = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const order = await createOrder(`Order — ${date}`);

      setPlacingMsg("Adding products...");
      for (const item of cartItems) {
        await addProductToOrder(order.id, item.id, item.qty);
      }

      setPlacingMsg("Processing payment...");
      await checkoutOrder(order.id);

      localStorage.setItem("cart", "[]");
      setStep("success");
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong");
      setStep("error");
    }
  }

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

  if (step === "placing") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: "40px", height: "40px", border: "2px solid #222", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
          <p style={{ color: "#fff", fontSize: "13px", letterSpacing: "2px", marginBottom: "8px" }}>{placingMsg}</p>
          <p style={{ color: "#333", fontSize: "11px", letterSpacing: "2px" }}>PLEASE WAIT</p>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "40px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#16a34a20", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", border: "1px solid #16a34a40" }}>
            <span style={{ color: "#16a34a", fontSize: "28px" }}>✓</span>
          </div>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>ORDER PLACED</p>
          <h1 style={{ color: "#fff", fontSize: "32px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Thank you!</h1>
          <p style={{ color: "#555", fontSize: "14px", marginBottom: "40px" }}>
            Your order has been placed and your balance has been updated.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <button
              onClick={() => router.push("/profile")}
              style={{ backgroundColor: "#fff", color: "#000", border: "none", padding: "14px 32px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
            >
              VIEW ORDERS
            </button>
            <button
              onClick={() => router.push("/products")}
              style={{ background: "none", color: "#555", border: "1px solid #222", padding: "14px 32px", cursor: "pointer", fontWeight: "600", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <div style={{ textAlign: "center", maxWidth: "400px", padding: "40px" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "#dc262620", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 32px", border: "1px solid #dc262640" }}>
            <span style={{ color: "#dc2626", fontSize: "28px" }}>✗</span>
          </div>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "12px" }}>ORDER FAILED</p>
          <h1 style={{ color: "#fff", fontSize: "28px", fontWeight: "800", letterSpacing: "-1px", marginBottom: "12px" }}>Something went wrong</h1>
          <p style={{ color: "#dc2626", fontSize: "13px", marginBottom: "40px", backgroundColor: "#dc262610", padding: "12px 16px", borderRadius: "2px" }}>
            {errorMsg}
          </p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
            <button
              onClick={() => router.push("/cart")}
              style={{ background: "none", color: "#555", border: "1px solid #222", padding: "12px 24px", cursor: "pointer", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
            >
              BACK TO CART
            </button>
            <button
              onClick={() => { setStep("review"); setErrorMsg(""); }}
              style={{ backgroundColor: "#fff", color: "#000", border: "none", padding: "12px 24px", cursor: "pointer", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px" }}
            >
              TRY AGAIN
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#080808" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#2a2a2a", fontSize: "13px", letterSpacing: "4px", marginBottom: "32px" }}>CART IS EMPTY</p>
          <a href="/products" style={{ color: "#888", fontSize: "11px", letterSpacing: "3px", textDecoration: "none", border: "1px solid #222", padding: "12px 32px" }}>
            GO SHOPPING
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#080808", color: "#fff" }}>
      <style>{`* { box-sizing: border-box; }`}</style>

      {/* Navbar */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, backgroundColor: "rgba(8,8,8,0.96)", backdropFilter: "blur(16px)", borderBottom: "1px solid #141414", padding: "0 40px", height: "60px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a href="/products" style={{ fontSize: "15px", fontWeight: "800", letterSpacing: "5px", color: "#fff", textDecoration: "none" }}>SHOP</a>
        <a href="/cart" style={{ color: "#555", fontSize: "11px", textDecoration: "none", letterSpacing: "2px" }}>← BACK TO CART</a>
      </nav>

      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "64px 40px" }}>
        <div style={{ marginBottom: "48px" }}>
          <p style={{ color: "#444", fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>CHECKOUT</p>
          <h1 style={{ fontSize: "40px", fontWeight: "800", letterSpacing: "-1px" }}>Review Order</h1>
          {userName && <p style={{ color: "#555", fontSize: "14px", marginTop: "6px" }}>Hi, {userName.split(" ")[0]}</p>}
        </div>

        <div style={{ display: "flex", gap: "40px", alignItems: "flex-start" }}>

          {/* Items list */}
          <div style={{ flex: 1 }}>
            <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "20px" }}>ITEMS ({totalItems})</p>
            {products.map((product) => {
              const item = cartItems.find((i) => i.id === product.id);
              const qty = item?.qty || 1;
              return (
                <div key={product.id} style={{ display: "flex", gap: "16px", alignItems: "center", paddingBottom: "20px", marginBottom: "20px", borderBottom: "1px solid #141414" }}>
                  <div style={{ width: "60px", height: "60px", flexShrink: 0, borderRadius: "2px", overflow: "hidden", backgroundColor: "#141414" }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: "600", fontSize: "14px", marginBottom: "4px" }}>{product.name}</p>
                    <p style={{ color: "#444", fontSize: "12px" }}>Qty: {qty} × ${product.price}</p>
                  </div>
                  <span style={{ fontWeight: "700", fontSize: "16px" }}>${(product.price * qty).toFixed(2)}</span>
                </div>
              );
            })}
          </div>

          {/* Summary & payment */}
          <div style={{ width: "280px", flexShrink: 0 }}>
            <div style={{ backgroundColor: "#111", padding: "28px" }}>
              <p style={{ color: "#444", fontSize: "10px", letterSpacing: "3px", marginBottom: "20px" }}>PAYMENT SUMMARY</p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555", fontSize: "13px" }}>Subtotal</span>
                  <span style={{ fontSize: "13px" }}>${total.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#555", fontSize: "13px" }}>Shipping</span>
                  <span style={{ fontSize: "13px", color: "#16a34a" }}>FREE</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "13px", letterSpacing: "2px" }}>TOTAL</span>
                <span style={{ fontWeight: "800", fontSize: "22px" }}>${total.toFixed(2)}</span>
              </div>

              {/* Balance info */}
              <div style={{ backgroundColor: "#0a0a0a", borderRadius: "2px", padding: "14px", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ color: "#444", fontSize: "12px" }}>Your balance</span>
                  <span style={{ fontSize: "12px", color: canAfford ? "#16a34a" : "#dc2626", fontWeight: "700" }}>${balance.toFixed(2)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "#444", fontSize: "12px" }}>After payment</span>
                  <span style={{ fontSize: "12px", color: canAfford ? "#fff" : "#dc2626" }}>
                    {canAfford ? `$${(balance - total).toFixed(2)}` : "Insufficient"}
                  </span>
                </div>
              </div>

              {!canAfford && (
                <p style={{ color: "#dc2626", fontSize: "11px", letterSpacing: "1px", textAlign: "center", marginBottom: "16px" }}>
                  INSUFFICIENT BALANCE
                </p>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!canAfford}
                style={{ width: "100%", backgroundColor: canAfford ? "#fff" : "#111", color: canAfford ? "#000" : "#333", border: canAfford ? "none" : "1px solid #1f1f1f", padding: "14px", cursor: canAfford ? "pointer" : "not-allowed", fontWeight: "800", fontSize: "11px", letterSpacing: "3px", borderRadius: "2px", transition: "all 0.2s" }}
              >
                PLACE ORDER
              </button>

              <a href="/cart" style={{ display: "block", textAlign: "center", color: "#444", fontSize: "11px", letterSpacing: "2px", textDecoration: "none", marginTop: "14px" }}>
                EDIT CART
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

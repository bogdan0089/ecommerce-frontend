"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getProducts, Product } from "@/lib/api";
import { cartCount, clearCart, useCart, writeCart } from "@/lib/cart";
import { Nav, NavLink, Page } from "@/components/nav";
import { Button, Card, EmptyState, LinkButton, PageLoader, PageTitle } from "@/components/ui";
import { color, radius } from "@/lib/theme";

export default function CartPage() {
  const router = useRouter();
  const cart = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProducts(100)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const lines = cart
    .map((item) => ({ item, product: products.find((p) => p.id === item.id) }))
    .filter((line): line is { item: { id: number; qty: number }; product: Product } => line.product !== undefined);

  const total = lines.reduce((sum, line) => sum + line.product.price * line.item.qty, 0);
  const totalItems = cartCount(cart);

  function updateQty(id: number, delta: number) {
    writeCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i)).filter((i) => i.qty > 0));
  }

  function removeItem(id: number) {
    writeCart(cart.filter((i) => i.id !== id));
  }

  if (loading) return <PageLoader />;

  const nav = (
    <Nav home="/products">
      <NavLink href="/products">← Back to shop</NavLink>
    </Nav>
  );

  return (
    <Page nav={nav} width="1000px">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", gap: "16px" }}>
        <PageTitle>Your cart ({totalItems})</PageTitle>
        {lines.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearCart}>
            Clear all
          </Button>
        )}
      </div>

      {lines.length === 0 ? (
        <EmptyState
          message="Your cart is empty"
          action={
            <LinkButton href="/products" size="lg">
              Continue shopping
            </LinkButton>
          }
        />
      ) : (
        <div style={{ display: "flex", gap: "32px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 420px", minWidth: 0 }}>
            {lines.map(({ item, product }) => (
              <Card key={product.id} style={{ display: "flex", gap: "16px", alignItems: "center", padding: "20px", marginBottom: "12px" }}>
                <div style={{ width: "72px", height: "72px", flexShrink: 0, overflow: "hidden", borderRadius: radius.sm, backgroundColor: color.surfaceInset }}>
                  {product.image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: "600", marginBottom: "4px", fontSize: "15px" }}>{product.name}</p>
                  <p style={{ color: color.textDim, fontSize: "13px", marginBottom: "12px" }}>${product.price} each</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", border: `1px solid ${color.border}`, borderRadius: radius.sm }}>
                      <button
                        onClick={() => updateQty(product.id, -1)}
                        aria-label="Decrease quantity"
                        style={{ background: "none", border: "none", color: color.textMuted, cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}
                      >
                        −
                      </button>
                      <span style={{ fontSize: "14px", fontWeight: "700", minWidth: "24px", textAlign: "center" }}>{item.qty}</span>
                      <button
                        onClick={() => updateQty(product.id, 1)}
                        aria-label="Increase quantity"
                        style={{ background: "none", border: "none", color: color.textMuted, cursor: "pointer", padding: "6px 12px", fontSize: "16px" }}
                      >
                        +
                      </button>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeItem(product.id)}>
                      Remove
                    </Button>
                  </div>
                </div>

                <span style={{ fontSize: "17px", fontWeight: "800" }}>${(product.price * item.qty).toFixed(2)}</span>
              </Card>
            ))}
          </div>

          <Card style={{ width: "300px", flexShrink: 0, padding: "28px" }}>
            <p style={{ fontSize: "11px", letterSpacing: "3px", textTransform: "uppercase", color: color.textDim, marginBottom: "20px" }}>
              Order summary
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: color.textDim, fontSize: "14px" }}>Items ({totalItems})</span>
                <span style={{ fontSize: "14px" }}>${total.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: color.textDim, fontSize: "14px" }}>Shipping</span>
                <span style={{ fontSize: "14px", color: color.success, fontWeight: "600" }}>Free</span>
              </div>
            </div>
            <div
              style={{
                borderTop: `1px solid ${color.borderSoft}`,
                paddingTop: "16px",
                marginBottom: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: "600", fontSize: "15px" }}>Total</span>
              <span style={{ fontWeight: "800", fontSize: "22px" }}>${total.toFixed(2)}</span>
            </div>
            <Button full size="lg" onClick={() => router.push("/checkout")}>
              Checkout
            </Button>
            <Link
              href="/products"
              style={{ display: "block", textAlign: "center", color: color.textDim, fontSize: "12px", textDecoration: "none", marginTop: "14px" }}
            >
              Continue shopping
            </Link>
          </Card>
        </div>
      )}
    </Page>
  );
}

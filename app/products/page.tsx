"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { aiSearch, Category, getCategories, getMe, getProducts, Product } from "@/lib/api";
import { useCart, writeCart } from "@/lib/cart";
import { CartButton, LogoutButton, Nav, NavLink } from "@/components/nav";
import { Button, EmptyState, Input, PageLoader } from "@/components/ui";
import { color, layout, radius } from "@/lib/theme";

const PER_PAGE = 12;
const DEFAULT_PRICE_LIMIT = 1000;

function fallbackImage(id: number) {
  return `https://picsum.photos/seed/product${id}/400/400`;
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ color: color.textDim, fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "10px" }}>
      {children}
    </p>
  );
}

export default function ProductsPage() {
  const cart = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userName, setUserName] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [priceLimit, setPriceLimit] = useState(DEFAULT_PRICE_LIMIT);
  const [maxPrice, setMaxPrice] = useState(DEFAULT_PRICE_LIMIT);
  const [page, setPage] = useState(1);

  const [quantities, setQuantities] = useState<Record<number, number>>({});

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

    Promise.all([getProducts(200), getCategories(100)])
      .then(([data, cats]) => {
        setProducts(data);
        setCategories(cats);
        const highest = data.length > 0 ? Math.max(...data.map((p) => p.price)) : DEFAULT_PRICE_LIMIT;
        const rounded = Math.max(100, Math.ceil(highest / 100) * 100);
        setPriceLimit(rounded);
        setMaxPrice(rounded);
      })
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((p) => {
      if (term && !p.name.toLowerCase().includes(term)) return false;
      if (category !== "all" && (p.category?.name ?? "other").toLowerCase() !== category) return false;
      return p.price <= maxPrice;
    });
  }, [products, search, category, maxPrice]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const filtersActive = search !== "" || category !== "all" || maxPrice < priceLimit;

  function stepQty(id: number, delta: number) {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, Math.min(10, (prev[id] ?? 1) + delta)) }));
  }

  function addToCart(product: Product) {
    const qty = quantities[product.id] ?? 1;
    const existing = cart.find((i) => i.id === product.id);
    writeCart(
      existing
        ? cart.map((i) => (i.id === product.id ? { ...i, qty: i.qty + qty } : i))
        : [...cart, { id: product.id, qty }],
    );
  }

  async function runAiSearch() {
    if (!aiQuery.trim()) return;
    setAiLoading(true);
    setAiResult("");
    try {
      setAiResult(await aiSearch(aiQuery));
    } catch {
      setAiResult("Something went wrong.");
    } finally {
      setAiLoading(false);
    }
  }

  if (loading) return <PageLoader />;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: color.bg, color: color.text }}>
      <Nav>
        {userName && <span style={{ color: color.textDim, fontSize: "11px", letterSpacing: "1px" }}>Hi, {userName.split(" ")[0]}</span>}
        {isAdmin && <NavLink href="/admin">Admin</NavLink>}
        <NavLink href="/profile">Profile</NavLink>
        <CartButton />
        <LogoutButton />
      </Nav>

      <div style={{ display: "flex", alignItems: "flex-start" }}>
        <aside
          style={{
            width: "240px",
            flexShrink: 0,
            borderRight: `1px solid ${color.borderSoft}`,
            padding: "32px 24px",
            position: "sticky",
            top: layout.navHeight,
            height: `calc(100vh - ${layout.navHeight})`,
            overflowY: "auto",
          }}
        >
          <div style={{ marginBottom: "32px" }}>
            <FilterLabel>Search</FilterLabel>
            <Input
              type="text"
              placeholder="Search by product name"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              style={{ padding: "9px 12px", fontSize: "13px" }}
            />
          </div>

          <div style={{ marginBottom: "32px" }}>
            <FilterLabel>Category</FilterLabel>
            {[{ id: 0, name: "All", value: "all" }, ...categories.map((c) => ({ id: c.id, name: c.name, value: c.name.toLowerCase() }))].map(
              (option) => {
                const active = category === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => {
                      setCategory(option.value);
                      setPage(1);
                    }}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "left",
                      background: active ? color.surfaceInset : "none",
                      border: "none",
                      color: active ? color.text : color.textDim,
                      cursor: "pointer",
                      fontSize: "13px",
                      padding: "8px 10px",
                      borderRadius: radius.sm,
                      fontWeight: active ? "700" : "400",
                    }}
                  >
                    {option.name}
                  </button>
                );
              },
            )}
          </div>

          <div style={{ marginBottom: "32px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <FilterLabel>Max price</FilterLabel>
              <span style={{ fontSize: "13px", fontWeight: "700" }}>${maxPrice}</span>
            </div>
            <input
              type="range"
              min={0}
              max={priceLimit}
              step={10}
              value={maxPrice}
              aria-label="Maximum price"
              onChange={(e) => {
                setMaxPrice(parseInt(e.target.value, 10));
                setPage(1);
              }}
              style={{ width: "100%", accentColor: color.accent, cursor: "pointer" }}
            />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "6px" }}>
              <span style={{ color: color.textFaint, fontSize: "12px" }}>$0</span>
              <span style={{ color: color.textFaint, fontSize: "12px" }}>${priceLimit}</span>
            </div>
          </div>

          {filtersActive && (
            <Button
              variant="secondary"
              size="sm"
              full
              onClick={() => {
                setSearch("");
                setCategory("all");
                setMaxPrice(priceLimit);
                setPage(1);
              }}
            >
              Clear filters
            </Button>
          )}

          <div style={{ marginTop: "32px" }}>
            <FilterLabel>AI search</FilterLabel>
            <Input
              type="text"
              placeholder="Describe what you are looking for"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runAiSearch();
              }}
              style={{ padding: "9px 12px", fontSize: "13px", marginBottom: "8px" }}
            />
            <Button size="sm" full onClick={runAiSearch} disabled={aiLoading}>
              {aiLoading ? "Searching..." : "Search with AI"}
            </Button>
            {aiResult && (
              <div
                style={{
                  marginTop: "10px",
                  backgroundColor: color.surfaceInset,
                  border: `1px solid ${color.border}`,
                  borderRadius: radius.sm,
                  padding: "10px 12px",
                  fontSize: "12px",
                  color: color.textMuted,
                  lineHeight: "1.6",
                  whiteSpace: "pre-line",
                }}
              >
                {aiResult}
              </div>
            )}
          </div>
        </aside>

        <main style={{ flex: 1, minWidth: 0, padding: "32px 32px 80px" }}>
          <p style={{ color: color.textDim, fontSize: "12px", letterSpacing: "1px", marginBottom: "24px" }}>
            {filtered.length} PRODUCTS
          </p>

          {filtered.length === 0 ? (
            <EmptyState message="No products found" />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: "16px" }}>
              {visible.map((product) => {
                const inCart = cart.find((c) => c.id === product.id);
                const qty = quantities[product.id] ?? 1;
                return (
                  <div
                    key={product.id}
                    className="surface product-card"
                    style={{ borderRadius: radius.md, overflow: "hidden" }}
                  >
                    <Link
                      href={`/products/${product.id}`}
                      style={{ display: "block", overflow: "hidden", aspectRatio: "1", backgroundColor: color.surface }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={product.image_url || fallbackImage(product.id)}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        onError={(e) => {
                          const img = e.currentTarget;
                          img.style.display = "none";
                          if (img.parentElement) img.parentElement.style.backgroundColor = product.color;
                        }}
                      />
                    </Link>

                    <div style={{ padding: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", marginBottom: "4px" }}>
                        <p style={{ fontSize: "14px", fontWeight: "600" }}>{product.name}</p>
                        <p style={{ fontSize: "15px", fontWeight: "800", flexShrink: 0 }}>${product.price}</p>
                      </div>
                      <p style={{ color: color.textFaint, fontSize: "11px", marginBottom: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                        {product.category?.name ?? "other"}
                      </p>

                      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${color.border}`, borderRadius: radius.sm }}>
                          <button
                            onClick={() => stepQty(product.id, -1)}
                            aria-label="Decrease quantity"
                            style={{ background: "none", border: "none", color: color.textMuted, cursor: "pointer", padding: "6px 10px", fontSize: "16px", lineHeight: 1 }}
                          >
                            −
                          </button>
                          <span style={{ fontSize: "13px", fontWeight: "700", minWidth: "20px", textAlign: "center" }}>{qty}</span>
                          <button
                            onClick={() => stepQty(product.id, 1)}
                            aria-label="Increase quantity"
                            style={{ background: "none", border: "none", color: color.textMuted, cursor: "pointer", padding: "6px 10px", fontSize: "16px", lineHeight: 1 }}
                          >
                            +
                          </button>
                        </div>
                        <Button
                          size="sm"
                          variant={inCart ? "secondary" : "primary"}
                          onClick={() => addToCart(product)}
                          style={{ flex: 1 }}
                        >
                          {inCart ? `In cart (${inCart.qty})` : "Add to cart"}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filtered.length > PER_PAGE && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", marginTop: "40px" }}>
              <Button variant="secondary" size="sm" onClick={() => setPage(currentPage - 1)} disabled={currentPage === 1}>
                Previous
              </Button>
              <span style={{ color: color.textDim, fontSize: "12px", letterSpacing: "1px" }}>
                PAGE {currentPage} OF {totalPages}
              </span>
              <Button size="sm" onClick={() => setPage(currentPage + 1)} disabled={currentPage === totalPages}>
                Next
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

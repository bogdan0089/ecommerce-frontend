"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Category,
  Client,
  createCategory,
  createProduct,
  deleteCategory,
  deleteProduct,
  generateProductDescription,
  getAccessToken,
  getAdminClients,
  getAdminOrders,
  getAdminProducts,
  getCategories,
  moderateProduct,
  Order,
  Product,
  updateOrderStatus,
  updateProduct,
  wsUrl,
} from "@/lib/api";
import { LogoutButton, Nav, NavLink, Page } from "@/components/nav";
import {
  Alert,
  Badge,
  Button,
  Card,
  Field,
  FieldError,
  Input,
  PageLoader,
  PageTitle,
  Select,
  StatCard,
  Tabs,
  Textarea,
  TextField,
} from "@/components/ui";
import { useFieldErrors } from "@/lib/formErrors";
import { color, radius, statusColor } from "@/lib/theme";

const TABS = ["products", "orders", "categories", "stats"] as const;
type Tab = (typeof TABS)[number];

const TAB_LABELS: Record<Tab, string> = {
  products: "Products",
  orders: "Orders",
  categories: "Categories",
  stats: "Stats",
};

type ProductFilter = "all" | "accept" | "pending" | "rejected";
const FILTERS: readonly ProductFilter[] = ["all", "accept", "pending", "rejected"];

const PRODUCT_GRID = "48px 56px minmax(0, 1fr) 100px 72px 60px 120px 190px";
const ORDER_GRID = "60px minmax(0, 1fr) 110px 120px 200px";

interface Notification {
  id: number;
  text: string;
}

interface ProductFields {
  name: string;
  price: string;
  color: string;
  image_url: string;
  quantity: string;
}

function ProductFieldsGrid({
  form,
  onChange,
  errors,
}: {
  form: ProductFields;
  onChange: (patch: Partial<ProductFields>) => void;
  errors: Record<string, string>;
}) {
  const small = { padding: "9px 12px", fontSize: "13px" };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "12px", alignItems: "start" }}>
      <TextField
        label="Name"
        name="name"
        type="text"
        value={form.name}
        onChange={(e) => onChange({ name: e.target.value })}
        required
        placeholder="Enter the product name"
        style={small}
        error={errors.name}
      />
      <TextField
        label="Image URL"
        name="image_url"
        type="url"
        value={form.image_url}
        onChange={(e) => onChange({ image_url: e.target.value })}
        placeholder="Paste a link to the image"
        style={small}
        error={errors.image_url}
      />
      <TextField
        label="Price ($)"
        name="price"
        type="number"
        value={form.price}
        onChange={(e) => onChange({ price: e.target.value })}
        required
        min="0"
        step="0.01"
        placeholder="Enter the price"
        style={small}
        error={errors.price}
      />
      <TextField
        label="Stock"
        name="quantity"
        type="number"
        value={form.quantity}
        onChange={(e) => onChange({ quantity: e.target.value })}
        min="0"
        placeholder="Enter how many are in stock"
        style={small}
        error={errors.quantity}
      />
      <Field label="Color" error={errors.color}>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="color"
            value={form.color}
            onChange={(e) => onChange({ color: e.target.value })}
            aria-label="Colour picker"
            style={{ width: "36px", height: "34px", border: `1px solid ${color.border}`, borderRadius: radius.sm, cursor: "pointer", padding: "2px", backgroundColor: color.surfaceInset }}
          />
          <Input
            name="color"
            type="text"
            value={form.color}
            onChange={(e) => onChange({ color: e.target.value })}
            placeholder="Enter a hex colour"
            style={{ ...small, flex: 1 }}
            aria-invalid={errors.color ? true : undefined}
          />
        </div>
      </Field>
    </div>
  );
}

const EMPTY_CREATE = { name: "", price: "", color: "#000000", image_url: "", description: "", quantity: "0" };

export default function AdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("products");

  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [filter, setFilter] = useState<ProductFilter>("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_CREATE);
  const [createLoading, setCreateLoading] = useState(false);
  const [genDescLoading, setGenDescLoading] = useState(false);

  const [editProductId, setEditProductId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ name: "", price: "", color: "#000000", image_url: "", quantity: "0", category_id: "" });
  const [editLoading, setEditLoading] = useState(false);

  const [catName, setCatName] = useState("");
  const [catLoading, setCatLoading] = useState(false);
  const [catError, setCatError] = useState("");

  const createFields = useFieldErrors();
  const editFields = useFieldErrors();
  const catFields = useFieldErrors();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    Promise.all([getAdminProducts(100), getAdminOrders(), getAdminClients(), getCategories()])
      .then(([p, o, c, cats]) => {
        setProducts(p);
        setOrders(o);
        setClients(c);
        setCategories(cats);
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));

    const token = getAccessToken();
    if (token) {
      const ws = new WebSocket(`${wsUrl("/ws/admin")}?token=${token}`);
      wsRef.current = ws;
      ws.onmessage = (e) => {
        const notification: Notification = { id: Date.now(), text: String(e.data) };
        setNotifications((prev) => [notification, ...prev.slice(0, 9)]);
        setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== notification.id)), 6000);
      };
    }

    return () => wsRef.current?.close();
  }, [router]);

  function reportError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong");
  }

  async function handleCreate() {
    setError("");
    setCreateLoading(true);
    try {
      await createProduct({
        name: form.name,
        price: parseFloat(form.price),
        color: form.color,
        image_url: form.image_url || null,
        description: form.description || null,
        quantity: parseInt(form.quantity, 10) || 0,
      });
      setForm(EMPTY_CREATE);
      setShowForm(false);
      setProducts(await getAdminProducts(100));
    } catch (err: unknown) {
      reportError(err);
    } finally {
      setCreateLoading(false);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err: unknown) {
      reportError(err);
    }
  }

  async function handleModerate(id: number, status: "accept" | "rejected") {
    try {
      const updated = await moderateProduct(id, status);
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updated } : p)));
    } catch (err: unknown) {
      reportError(err);
    }
  }

  async function handleOrderStatus(id: number, status: string) {
    try {
      const updated = await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, ...updated } : o)));
    } catch (err: unknown) {
      reportError(err);
    }
  }

  function startEdit(product: Product) {
    setEditProductId(product.id);
    setEditForm({
      name: product.name,
      price: String(product.price),
      color: product.color,
      image_url: product.image_url ?? "",
      quantity: String(product.quantity),
      category_id: product.category ? String(product.category.id) : "",
    });
  }

  async function handleEditSave() {
    if (editProductId === null) return;
    setEditLoading(true);
    try {
      const updated = await updateProduct(editProductId, {
        name: editForm.name,
        price: parseFloat(editForm.price),
        color: editForm.color,
        image_url: editForm.image_url || null,
        quantity: parseInt(editForm.quantity, 10) || 0,
        category_id: editForm.category_id ? parseInt(editForm.category_id, 10) : null,
      });
      setProducts((prev) => prev.map((p) => (p.id === editProductId ? { ...p, ...updated } : p)));
      setEditProductId(null);
    } catch (err: unknown) {
      reportError(err);
    } finally {
      setEditLoading(false);
    }
  }

  async function handleCreateCategory() {
    setCatError("");
    setCatLoading(true);
    try {
      const created = await createCategory(catName);
      setCategories((prev) => [...prev, created]);
      setCatName("");
    } catch (err: unknown) {
      setCatError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCatLoading(false);
    }
  }

  async function handleDeleteCategory(id: number) {
    if (!window.confirm("Delete this category?")) return;
    try {
      await deleteCategory(id);
      setCategories(await getCategories(100));
    } catch (err: unknown) {
      reportError(err);
    }
  }

  const productCounts: Record<ProductFilter, number> = {
    all: products.length,
    accept: products.filter((p) => p.status === "accept").length,
    pending: products.filter((p) => p.status === "pending").length,
    rejected: products.filter((p) => p.status === "rejected").length,
  };
  const orderCounts = {
    create: orders.filter((o) => o.status === "create").length,
    completed: orders.filter((o) => o.status === "completed").length,
    cancelled: orders.filter((o) => o.status === "cancelled").length,
  };
  const visibleProducts = filter === "all" ? products : products.filter((p) => p.status === filter);

  if (loading) return <PageLoader />;

  const nav = (
    <Nav home="/products">
      <NavLink href="/products">Storefront</NavLink>
      <LogoutButton />
    </Nav>
  );

  return (
    <Page nav={nav} width="1200px">
      {notifications.length > 0 && (
        <div style={{ position: "fixed", top: "80px", right: "24px", zIndex: 1000, display: "flex", flexDirection: "column", gap: "8px" }}>
          {notifications.map((n) => (
            <div
              key={n.id}
              style={{
                backgroundColor: color.surfaceRaised,
                border: `1px solid ${color.border}`,
                color: color.text,
                padding: "12px 18px",
                borderRadius: radius.sm,
                fontSize: "13px",
                maxWidth: "320px",
                animation: "slideIn 0.3s ease",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: radius.circle, backgroundColor: color.success, flexShrink: 0 }} />
              {n.text}
              <button
                onClick={() => setNotifications((prev) => prev.filter((x) => x.id !== n.id))}
                aria-label="Dismiss"
                style={{ background: "none", border: "none", color: color.textDim, cursor: "pointer", marginLeft: "auto", fontSize: "16px", lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: "32px" }}>
        <p style={{ color: color.textDim, fontSize: "11px", letterSpacing: "3px", marginBottom: "8px" }}>DASHBOARD</p>
        <PageTitle>Admin panel</PageTitle>
      </div>

      {error && <Alert style={{ marginBottom: "20px" }}>{error}</Alert>}

      <Tabs
        tabs={TABS}
        active={tab}
        onChange={setTab}
        labels={TAB_LABELS}
        badges={{ products: productCounts.pending, orders: orderCounts.create }}
      />

      {tab === "products" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    backgroundColor: active ? color.accent : color.surfaceRaised,
                    color: active ? color.onAccent : color.text,
                    border: `1px solid ${active ? color.accent : color.border}`,
                    padding: "16px 20px",
                    cursor: "pointer",
                    textAlign: "left",
                    borderRadius: radius.md,
                  }}
                >
                  <p style={{ fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase", marginBottom: "6px", opacity: 0.7 }}>
                    {f}
                  </p>
                  <p style={{ fontSize: "28px", fontWeight: "800", letterSpacing: "-1px" }}>{productCounts[f]}</p>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <Button
              variant={showForm ? "secondary" : "primary"}
              onClick={() => {
                setShowForm(!showForm);
                setEditProductId(null);
              }}
            >
              {showForm ? "Cancel" : "+ Add product"}
            </Button>
          </div>

          {showForm && (
            <Card style={{ padding: "24px", marginBottom: "20px" }}>
              <form noValidate onSubmit={createFields.onSubmit(handleCreate)}>
                <p style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: color.textDim, marginBottom: "16px" }}>
                  New product
                </p>

                <ProductFieldsGrid
                  form={form}
                  errors={createFields.errors}
                  onChange={(patch) => {
                    setForm((prev) => ({ ...prev, ...patch }));
                    Object.keys(patch).forEach(createFields.clear);
                  }}
                />

                <Field label="Description" style={{ marginTop: "12px" }}>
                  <Textarea
                    name="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Describe the product, or generate it below"
                    rows={3}
                    style={{ padding: "9px 12px", fontSize: "13px" }}
                  />
                </Field>

                <div style={{ marginTop: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={genDescLoading || !form.name}
                    onClick={async () => {
                      setGenDescLoading(true);
                      try {
                        const description = await generateProductDescription(form.name);
                        setForm((prev) => ({ ...prev, description }));
                      } catch {
                        setForm((prev) => ({ ...prev, description: "Failed to generate description." }));
                      } finally {
                        setGenDescLoading(false);
                      }
                    }}
                  >
                    {genDescLoading ? "Generating..." : "Generate description with AI"}
                  </Button>
                  <Button type="submit" disabled={createLoading}>
                    {createLoading ? "Creating..." : "Create"}
                  </Button>
                </div>
              </form>
            </Card>
          )}

          <Card style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "900px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: PRODUCT_GRID,
                  gap: "12px",
                  padding: "12px 16px",
                  backgroundColor: color.surface,
                  borderBottom: `1px solid ${color.borderSoft}`,
                }}
              >
                {["ID", "Img", "Name", "Price", "Color", "Stock", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ color: color.textDim, fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {h}
                  </span>
                ))}
              </div>

              {visibleProducts.length === 0 && (
                <p style={{ textAlign: "center", padding: "40px", color: color.textDim, fontSize: "14px" }}>No products</p>
              )}

              {visibleProducts.map((product) => (
                <div key={product.id}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: PRODUCT_GRID,
                      gap: "12px",
                      padding: "10px 16px",
                      borderBottom: editProductId === product.id ? "none" : `1px solid ${color.borderSoft}`,
                      alignItems: "center",
                      backgroundColor: editProductId === product.id ? color.surface : "transparent",
                    }}
                  >
                    <span style={{ color: color.textFaint, fontSize: "12px" }}>#{product.id}</span>
                    <div style={{ width: "36px", height: "36px", borderRadius: radius.sm, overflow: "hidden", backgroundColor: color.surfaceInset }}>
                      {product.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={product.image_url} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", backgroundColor: product.color }} />
                      )}
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{product.name}</span>
                    <span style={{ fontSize: "13px" }}>${product.price}</span>
                    <div style={{ width: "20px", height: "20px", borderRadius: radius.circle, backgroundColor: product.color, border: `1px solid ${color.border}` }} />
                    <span style={{ fontSize: "13px", color: product.quantity === 0 ? color.danger : color.success, fontWeight: "700" }}>
                      {product.quantity}
                    </span>
                    <Badge tint={statusColor[product.status]}>{product.status}</Badge>
                    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => (editProductId === product.id ? setEditProductId(null) : startEdit(product))}
                      >
                        {editProductId === product.id ? "Cancel" : "Edit"}
                      </Button>
                      {product.status !== "accept" && (
                        <Button size="sm" variant="success" onClick={() => handleModerate(product.id, "accept")} aria-label="Accept">
                          ✓
                        </Button>
                      )}
                      {product.status !== "rejected" && (
                        <Button size="sm" variant="warning" onClick={() => handleModerate(product.id, "rejected")} aria-label="Reject">
                          ✗
                        </Button>
                      )}
                      <Button size="sm" variant="danger" onClick={() => handleDelete(product.id)}>
                        Del
                      </Button>
                    </div>
                  </div>

                  {editProductId === product.id && (
                    <form
                      noValidate
                      onSubmit={editFields.onSubmit(handleEditSave)}
                      style={{ padding: "16px 20px", borderBottom: `1px solid ${color.borderSoft}`, backgroundColor: color.surface }}
                    >
                      <ProductFieldsGrid
                        form={editForm}
                        errors={editFields.errors}
                        onChange={(patch) => {
                          setEditForm((prev) => ({ ...prev, ...patch }));
                          Object.keys(patch).forEach(editFields.clear);
                        }}
                      />

                      <Field label="Category" style={{ marginTop: "12px", maxWidth: "300px" }}>
                        <Select
                          value={editForm.category_id}
                          onChange={(e) => setEditForm({ ...editForm, category_id: e.target.value })}
                          style={{ padding: "9px 12px", fontSize: "13px" }}
                        >
                          <option value="">— No category —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={String(cat.id)}>
                              {cat.name}
                            </option>
                          ))}
                        </Select>
                      </Field>

                      <div style={{ marginTop: "14px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <Button type="button" variant="secondary" onClick={() => setEditProductId(null)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={editLoading}>
                          {editLoading ? "Saving..." : "Save changes"}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "orders" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <StatCard label="Active" value={orderCounts.create} tint={statusColor.create} />
            <StatCard label="Completed" value={orderCounts.completed} tint={statusColor.completed} />
            <StatCard label="Cancelled" value={orderCounts.cancelled} tint={statusColor.cancelled} />
          </div>

          <Card style={{ overflowX: "auto" }}>
            <div style={{ minWidth: "760px" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: ORDER_GRID,
                  gap: "12px",
                  padding: "12px 20px",
                  backgroundColor: color.surface,
                  borderBottom: `1px solid ${color.borderSoft}`,
                }}
              >
                {["ID", "Title", "Client", "Status", "Actions"].map((h) => (
                  <span key={h} style={{ color: color.textDim, fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {h}
                  </span>
                ))}
              </div>

              {orders.length === 0 && (
                <p style={{ textAlign: "center", padding: "40px", color: color.textDim, fontSize: "14px" }}>No orders</p>
              )}

              {orders.map((order, i) => (
                <div
                  key={order.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: ORDER_GRID,
                    gap: "12px",
                    padding: "14px 20px",
                    borderBottom: i < orders.length - 1 ? `1px solid ${color.borderSoft}` : "none",
                    alignItems: "center",
                  }}
                >
                  <span style={{ color: color.textFaint, fontSize: "12px" }}>#{order.id}</span>
                  <span style={{ fontSize: "14px", fontWeight: "600", minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{order.title}</span>
                  <span style={{ color: color.textDim, fontSize: "13px" }}>Client #{order.client_id}</span>
                  <Badge tint={statusColor[order.status]}>{order.status}</Badge>
                  <div style={{ display: "flex", gap: "6px" }}>
                    {order.status === "create" && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleOrderStatus(order.id, "completed")}>
                          Complete
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleOrderStatus(order.id, "cancelled")}>
                          Cancel
                        </Button>
                      </>
                    )}
                    {order.status === "completed" && (
                      <Button size="sm" variant="danger" onClick={() => handleOrderStatus(order.id, "cancelled")}>
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === "categories" && (
        <div style={{ maxWidth: "600px" }}>
          <Card style={{ padding: "24px", marginBottom: "20px" }}>
            <form noValidate onSubmit={catFields.onSubmit(handleCreateCategory)}>
              <p style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: color.textDim, marginBottom: "14px" }}>
                New category
              </p>
              {catError && <Alert style={{ marginBottom: "12px" }}>{catError}</Alert>}
              <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                <div style={{ flex: 1 }}>
                  <Input
                    name="name"
                    type="text"
                    value={catName}
                    onChange={(e) => {
                      setCatName(e.target.value);
                      catFields.clear("name");
                    }}
                    required
                    placeholder="Enter the category name"
                    style={{ padding: "9px 12px", fontSize: "13px" }}
                    aria-invalid={catFields.errors.name ? true : undefined}
                  />
                  {catFields.errors.name && <FieldError>{catFields.errors.name}</FieldError>}
                </div>
                <Button type="submit" disabled={catLoading}>
                  {catLoading ? "Adding..." : "+ Add"}
                </Button>
              </div>
            </form>
          </Card>

          <Card style={{ overflow: "hidden" }}>
            <div style={{ padding: "12px 20px", backgroundColor: color.surface, borderBottom: `1px solid ${color.borderSoft}` }}>
              <span style={{ color: color.textDim, fontSize: "10px", fontWeight: "700", letterSpacing: "2px" }}>
                CATEGORIES ({categories.length})
              </span>
            </div>
            {categories.length === 0 ? (
              <p style={{ textAlign: "center", padding: "40px", color: color.textDim, fontSize: "14px" }}>No categories yet</p>
            ) : (
              categories.map((cat, i) => (
                <div
                  key={cat.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 20px",
                    borderBottom: i < categories.length - 1 ? `1px solid ${color.borderSoft}` : "none",
                  }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>{cat.name}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ color: color.textFaint, fontSize: "12px" }}>#{cat.id}</span>
                    <Button size="sm" variant="danger" onClick={() => handleDeleteCategory(cat.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))
            )}
          </Card>
        </div>
      )}

      {tab === "stats" && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            <StatCard label="Total products" value={products.length} />
            <StatCard label="Total orders" value={orders.length} />
            <StatCard label="Total clients" value={clients.length} />
            <StatCard
              label="Pending review"
              value={productCounts.pending}
              tint={productCounts.pending > 0 ? color.warning : undefined}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "12px", marginBottom: "24px" }}>
            {[
              {
                title: "Products by status",
                items: [
                  { label: "Accepted", value: productCounts.accept, tint: color.success },
                  { label: "Pending", value: productCounts.pending, tint: color.warning },
                  { label: "Rejected", value: productCounts.rejected, tint: color.danger },
                ],
              },
              {
                title: "Orders by status",
                items: [
                  { label: "Active", value: orderCounts.create, tint: color.warning },
                  { label: "Completed", value: orderCounts.completed, tint: color.success },
                  { label: "Cancelled", value: orderCounts.cancelled, tint: color.danger },
                ],
              },
              {
                title: "Clients by role",
                items: [
                  { label: "Client", value: clients.filter((c) => (c.role ?? "client") === "client").length, tint: color.textMuted },
                  { label: "Moderator", value: clients.filter((c) => c.role === "moderator").length, tint: color.info },
                  { label: "Superadmin", value: clients.filter((c) => c.role === "superadmin").length, tint: color.violet },
                ],
              },
            ].map((card) => (
              <Card key={card.title} style={{ padding: "20px 24px" }}>
                <p style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: color.textDim, marginBottom: "16px" }}>
                  {card.title}
                </p>
                {card.items.map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: `1px solid ${color.borderSoft}` }}>
                    <span style={{ color: color.textDim, fontSize: "13px" }}>{item.label}</span>
                    <span style={{ color: item.tint, fontSize: "18px", fontWeight: "800" }}>{item.value}</span>
                  </div>
                ))}
              </Card>
            ))}
          </div>

          <Card style={{ padding: "24px", overflowX: "auto" }}>
            <p style={{ fontSize: "10px", letterSpacing: "2px", textTransform: "uppercase", color: color.textDim, marginBottom: "16px" }}>
              Recent clients
            </p>
            <div style={{ minWidth: "620px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) minmax(0, 1fr) 100px 110px", gap: "12px", padding: "8px 0 12px", borderBottom: `1px solid ${color.borderSoft}` }}>
                {["ID", "Name", "Email", "Balance", "Role"].map((h) => (
                  <span key={h} style={{ color: color.textDim, fontSize: "10px", fontWeight: "700", letterSpacing: "2px", textTransform: "uppercase" }}>
                    {h}
                  </span>
                ))}
              </div>
              {clients.slice(0, 10).map((c) => (
                <div key={c.id} style={{ display: "grid", gridTemplateColumns: "56px minmax(0, 1fr) minmax(0, 1fr) 100px 110px", gap: "12px", padding: "12px 0", borderBottom: `1px solid ${color.borderSoft}`, alignItems: "center" }}>
                  <span style={{ color: color.textFaint, fontSize: "12px" }}>#{c.id}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600", overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
                  <span style={{ color: color.textDim, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis" }}>{c.email}</span>
                  <span style={{ fontSize: "13px", fontWeight: "600" }}>${c.balance.toFixed(2)}</span>
                  <span style={{ color: color.textDim, fontSize: "12px", textTransform: "capitalize" }}>{c.role ?? "client"}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}

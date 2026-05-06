const API_URL = "https://bohdan-shop.duckdns.org/api";


export interface Product {
  id: number;
  name: string;
  price: number;
  color: string;
  status: string;
  image_url?: string | null;
  description?: string | null;
  quantity: number;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  age: number;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Client {
  id: number;
  name: string;
  email: string;
  age: number;
  balance: number;
  role?: string;
}

export interface Transaction {
  id: number;
  amount: number;
  type: "deposit" | "withdraw" | "purchase" | "refund";
  description: string | null;
  client_fk: number;
}

export interface ClientStats {
  client_id: number;
  total_orders: number;
  total_spent: number;
  balance: number;
}

export interface Order {
  id: number;
  title: string;
  client_id: number;
  status: string;
}

export interface ProductCreate {
  name: string;
  price: number;
  color: string;
  image_url?: string | null;
  description?: string | null;
}

export async function registerClient(data: RegisterData) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Registration error");
  }
  return res.json();
}

export async function loginClient(data: LoginData): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);
  const res = await fetch(`${API_URL}/auth/client_login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formData.toString(),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Login error");
  }
  return res.json();
}

export async function forgotPassword(email: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/forgot_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error");
  }
}

export async function resetPassword(reset_token: string, new_password: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/reset_password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reset_token, new_password }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Error");
  }
}

export async function verifyEmail(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/verify/${token}`);
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Verification failed");
  }
}

export function saveTokens(access: string, refresh: string) {
  localStorage.setItem("access_token", access);
  localStorage.setItem("refresh_token", refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem("access_token");
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export async function getMe(): Promise<Client> {
  return authFetch("/client/me");
}

export async function getMyStats(): Promise<ClientStats> {
  return authFetch("/client/me/stats");
}

export async function depositBalance(clientId: number, amount: number): Promise<Client> {
  return authFetch(`/client/${clientId}/deposit`, {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getMyTransactions(limit = 20, offset = 0): Promise<Transaction[]> {
  return authFetch(`/transaction/me/transactions?limit=${limit}&offset=${offset}`);
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  return authFetch("/auth/change_password", {
    method: "POST",
    body: JSON.stringify({ old_password, new_password }),
  });
}

export async function createPaymentIntent(amount: number): Promise<{ client_secret: string }> {
  return authFetch("/payment/create", {
    method: "POST",
    body: JSON.stringify({ amount }),
  });
}

export async function getProduct(id: number): Promise<Product> {
  return authFetch(`/product/${id}`);
}

export async function createProduct(data: ProductCreate): Promise<Product> {
  return authFetch("/product/", { method: "POST", body: JSON.stringify(data) });
}

export async function deleteProduct(id: number): Promise<Product> {
  return authFetch(`/product/${id}`, { method: "DELETE" });
}

export async function moderateProduct(id: number, status: "accept" | "rejected"): Promise<Product> {
  return authFetch(`/product/${id}/moderate`, { method: "PATCH", body: JSON.stringify({ status }) });
}

export async function getAdminOrders(limit = 100, offset = 0): Promise<Order[]> {
  return authFetch(`/order/get_orders?limit=${limit}&offset=${offset}`);
}

export async function getAdminClients(limit = 100, offset = 0): Promise<Client[]> {
  return authFetch(`/client/get_clients?limit=${limit}&offset=${offset}`);
}

export async function updateOrderStatus(orderId: number, status: string): Promise<Order> {
  return authFetch(`/order/${orderId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
}

export async function createOrder(title: string): Promise<Order> {
  return authFetch("/order/create_orders", { method: "POST", body: JSON.stringify({ title }) });
}

export async function addProductToOrder(orderId: number, productId: number, quantity: number): Promise<Order> {
  return authFetch(`/order/${orderId}/products/${productId}?quantity=${quantity}`, { method: "POST" });
}

export async function checkoutOrder(orderId: number): Promise<Order> {
  return authFetch(`/order/${orderId}/checkout`, { method: "POST" });
}

export interface Category {
  id: number;
  name: string;
}

export interface OrderProduct {
  id: number;
  name: string;
  price: number;
  color: string;
  quantity: number;
}

export interface OrderWithProducts {
  id: number;
  title: string;
  status: string;
  client_id: number;
  products: OrderProduct[];
}

export async function updateClient(clientId: number, data: { name: string; age: number; address?: string }): Promise<Client> {
  return authFetch(`/client/${clientId}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function deleteClient(clientId: number): Promise<void> {
  return authFetch(`/client/${clientId}`, { method: "DELETE" });
}

export async function getOrderWithProducts(orderId: number): Promise<OrderWithProducts> {
  return authFetch(`/order/order_with_products/${orderId}`);
}

export async function deleteProductFromOrder(orderId: number, productId: number): Promise<Order> {
  return authFetch(`/order/${orderId}/order/${productId}/product`, { method: "DELETE" });
}

export async function getCategories(limit = 50, offset = 0): Promise<Category[]> {
  return authFetch(`/category/admin?limit=${limit}&offset=${offset}`);
}

export async function createCategory(name: string): Promise<Category> {
  return authFetch("/category/create", { method: "POST", body: JSON.stringify({ name }) });
}

export async function updateProduct(id: number, data: { name?: string; price?: number; color?: string; image_url?: string | null; quantity?: number }): Promise<Product> {
  return authFetch(`/product/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function getAiRecommendations(): Promise<string> {
  return authFetch("/ai/recommendations");
}

export async function aiSearch(q: string): Promise<string> {
  return authFetch(`/ai/search?q=${encodeURIComponent(q)}`);
}

export async function aiChat(message: string): Promise<string> {
  return authFetch("/ai/chat", { method: "POST", body: JSON.stringify({ message }) });
}

export async function generateProductDescription(product_name: string): Promise<string> {
  return authFetch("/ai/generate-description", { method: "POST", body: JSON.stringify({ product_name }) });
}

export async function authFetch(path: string, options: RequestInit = {}) {
  const token = getAccessToken();
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.detail || "Request error");
  }
  return res.json();
}

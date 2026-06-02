const API = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: any = { ...options.headers, 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// Nomenclature API (1C-style products)
export async function searchProducts(q: string) {
  return request(`/nomenclature/products/search?q=${encodeURIComponent(q)}`);
}
export async function getLowStockProducts() {
  return request('/nomenclature/products/low-stock');
}
export async function getProductCategories() {
  return request('/nomenclature/products/categories');
}
export async function getProductBatches(productId: number) {
  return request(`/nomenclature/products/${productId}/batches`);
}
export async function getProductStock(productId: number) {
  return request(`/nomenclature/products/${productId}/stock`);
}
export async function getProductPriceHistory(productId: number) {
  return request(`/nomenclature/products/${productId}/price-history`);
}
export async function createProduct(data: any) {
  return request('/nomenclature/products', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateProduct(id: number, data: any) {
  return request(`/nomenclature/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export async function archiveProduct(id: number) {
  return request(`/nomenclature/products/${id}/archive`, { method: 'PATCH' });
}

// Supplier API
export async function getSuppliers() {
  return request('/nomenclature/suppliers');
}
export async function createSupplier(data: any) {
  return request('/nomenclature/suppliers', { method: 'POST', body: JSON.stringify(data) });
}
export async function updateSupplier(id: number, data: any) {
  return request(`/nomenclature/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
}
export async function getSupplierReceipts(id: number) {
  return request(`/nomenclature/suppliers/${id}/receipts`);
}

// Receipt API (Приём товара)
export async function getReceipts() {
  return request('/nomenclature/receipts');
}
export async function createReceipt(data: any) {
  return request('/nomenclature/receipts', { method: 'POST', body: JSON.stringify(data) });
}

// Issue API (Расход/Списание)
export async function getIssues() {
  return request('/nomenclature/issues');
}
export async function createIssue(data: any) {
  return request('/nomenclature/issues', { method: 'POST', body: JSON.stringify(data) });
}

// Transfer API (Перемещение)
export async function getTransfers() {
  return request('/nomenclature/transfers');
}
export async function createTransfer(data: any) {
  return request('/nomenclature/transfers', { method: 'POST', body: JSON.stringify(data) });
}

// Expiry alerts API
export async function scanExpiry() {
  return request('/nomenclature/expiry/scan', { method: 'POST' });
}
export async function getExpiryAlerts(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/nomenclature/expiry/alerts${params}`);
}
export async function getExpiringSoon() {
  return request('/nomenclature/expiry/expiring');
}
export async function getExpired() {
  return request('/nomenclature/expiry/expired');
}
export async function resolveExpiryAlert(id: number) {
  return request(`/nomenclature/expiry/alerts/${id}/resolve`, { method: 'PATCH' });
}

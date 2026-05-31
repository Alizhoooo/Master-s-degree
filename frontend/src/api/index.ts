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

export async function login(email: string, password: string) {
  const data = await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  localStorage.setItem('token', data.access_token);
  return data;
}

export async function register(email: string, password: string, fullName: string, role: string) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName, role }),
  });
}

export async function getProfile() {
  return request('/auth/profile');
}

export async function getProducts() {
  return request('/inventory');
}

export async function getPriority() {
  return request('/inventory/priority');
}

export async function reserveByPriority() {
  return request('/inventory/reserve', { method: 'POST' });
}

export async function adjustStock(productId: number, userId: number, change: number, reason: string) {
  return request('/inventory/adjust', {
    method: 'POST',
    body: JSON.stringify({ productId, userId, change, reason }),
  });
}

export async function getStockAlerts() {
  return request('/inventory/alerts');
}

export async function getInventoryLogs() {
  return request('/inventory/logs');
}

async function uploadFile(url: string, file: File): Promise<any> {
  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${url}`, { method: 'POST', headers, body: formData });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Upload failed');
  return data;
}

export async function importCustomersCsv(file: File) {
  return uploadFile('/crm/customers/import', file);
}

export async function importProductsCsv(file: File) {
  return uploadFile('/inventory/import', file);
}

export async function getCustomers() {
  return request('/crm/customers');
}

export async function getCustomer(id: number) {
  return request(`/crm/customers/${id}`);
}

export async function createCustomer(data: any) {
  return request('/crm/customers', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateCustomer(id: number, data: any) {
  return request(`/crm/customers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function addContactLog(customerId: number, note: string) {
  return request(`/crm/customers/${customerId}/contact-log`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  });
}

export async function getComplaints() {
  return request('/crm/complaints');
}

export async function createComplaint(data: any) {
  return request('/crm/complaints', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateComplaintStatus(id: number, status: string) {
  return request(`/crm/complaints/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function getOrders(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/orders${params}`);
}

export async function getOrder(id: number) {
  return request(`/orders/${id}`);
}

export async function createOrder(data: any) {
  return request('/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateOrderStatus(id: number, status: string) {
  return request(`/orders/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function cancelOrder(id: number) {
  return request(`/orders/${id}/cancel`, { method: 'POST' });
}

export async function bulkUpdateOrderStatus(ids: number[], status: string) {
  return request('/orders/bulk-status', {
    method: 'POST',
    body: JSON.stringify({ ids, status }),
  });
}

export async function getPickList(id: number) {
  return request(`/orders/${id}/pick-list`);
}

export async function getOrderTimeline(id: number) {
  return request(`/orders/${id}/timeline`);
}

export async function downloadInvoice(id: number) {
  const token = getToken();
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}/orders/${id}/invoice`, { headers });
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `invoice-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function getDashboard(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/reports/dashboard${params}`);
}

export async function getReports(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/reports${params}`);
}

async function downloadBlob(url: string, filename: string, type: string) {
  const token = getToken();
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(url, { headers });
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objUrl);
}

export async function exportCsv(filters?: Record<string, string>) {
  const token = getToken();
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}/reports/export/csv${params}`, { headers });
  return res.text();
}

export async function exportExcel(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  await downloadBlob(`${API}/reports/export/excel${params}`, 'report.xlsx', 'xlsx');
}

export async function exportPdf(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  await downloadBlob(`${API}/reports/export/pdf${params}`, 'report.pdf', 'pdf');
}

export async function getForecast() {
  return request('/ai/forecast');
}

export async function getAnomalies() {
  return request('/ai/anomalies');
}

export async function getUsers() {
  return request('/admin/users');
}

export async function createUser(data: any) {
  return request('/admin/users', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateUserRole(id: number, role: string) {
  return request(`/admin/users/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

export async function getConfig(key: string) {
  return request(`/admin/config/${key}`);
}

export async function setConfig(key: string, value: string) {
  return request('/admin/config', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
}

export async function getSystemLogs() {
  return request('/admin/logs');
}

const API = import.meta.env.VITE_API_URL || '/api/v1';

function getToken(): string | null {
  return localStorage.getItem('token');
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  let token = getToken();
  const headers: any = { ...options.headers, 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API}${path}`, { ...options, headers });

  if (res.status === 401 && token) {
    try {
      const { refreshTokenIfNeeded } = await import('../store/AuthContext');
      const newToken = await refreshTokenIfNeeded();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API}${path}`, { ...options, headers });
      }
    } catch { /* refresh failed, proceed with original error */ }
  }

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
  const tk = data.accessToken || data.access_token || data.token;
  if (tk) {
    localStorage.setItem('token', tk);
  }
  return data;
}

export async function loginVerifyTotp(userId: number, token: string) {
  const data = await request('/auth/login/verify-totp', {
    method: 'POST',
    body: JSON.stringify({ userId, token }),
  });
  const tk = data.accessToken || data.access_token || data.token;
  if (tk) {
    localStorage.setItem('token', tk);
  }
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

export async function refreshAccessToken() {
  const data = await request('/auth/refresh', { method: 'POST' }).catch(() => ({}));
  const tk = data.accessToken || data.access_token || data.token;
  if (tk) {
    localStorage.setItem('token', tk);
  }
  return data;
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    localStorage.removeItem('token');
  }
}

export async function logoutAll() {
  try {
    await request('/auth/logout-all', { method: 'POST' });
  } finally {
    localStorage.removeItem('token');
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request('/auth/change-password', {
    method: 'PATCH',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

export async function setupTotp() {
  return request('/auth/2fa/setup', { method: 'POST' });
}

export async function verifyTotpSetup(token: string) {
  return request('/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}

export async function disableTotp(password: string) {
  return request('/auth/2fa/disable', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function forgotPassword(email: string) {
  return request('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string) {
  return request('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });
}

export async function listSessions() {
  return request('/auth/sessions');
}

export async function revokeSession(id: number) {
  return request(`/auth/sessions/${id}/revoke`, { method: 'POST' });
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

export async function getErpSummary() {
  return request('/reports/dashboard/erp-summary');
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

export async function listAccounts() { return request('/accounting/accounts'); }
export async function getAccount(id: number) { return request(`/accounting/accounts/${id}`); }
export async function createAccount(data: any) { return request('/accounting/accounts', { method: 'POST', body: JSON.stringify(data) }); }
export async function updateAccount(id: number, data: any) { return request(`/accounting/accounts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }); }
export async function deleteAccount(id: number) { return request(`/accounting/accounts/${id}`, { method: 'DELETE' }); }
export async function seedStandardPlan() { return request('/accounting/accounts/seed', { method: 'POST' }); }
export async function listEntries(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/accounting/entries${params}`);
}
export async function createEntry(data: any) { return request('/accounting/entries', { method: 'POST', body: JSON.stringify(data) }); }
export async function getTurnover(periodFrom: string, periodTo: string) {
  return request(`/accounting/turnover?periodFrom=${periodFrom}&periodTo=${periodTo}`);
}
export async function getTrialBalance(period: string) {
  return request(`/accounting/trial-balance?period=${period}`);
}

export async function listCashRegisters() { return request('/cash/registers'); }
export async function createCashRegister(data: any) { return request('/cash/registers', { method: 'POST', body: JSON.stringify(data) }); }
export async function listCashOrders(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/cash/orders${params}`);
}
export async function createCashOrder(data: any) { return request('/cash/orders', { method: 'POST', body: JSON.stringify(data) }); }
export async function getCashBalance(id: number) { return request(`/cash/registers/${id}/balance`); }

export async function listBankAccounts() { return request('/bank/accounts'); }
export async function createBankAccount(data: any) { return request('/bank/accounts', { method: 'POST', body: JSON.stringify(data) }); }
export async function listBankOrders(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/bank/orders${params}`);
}
export async function createBankOrder(data: any) { return request('/bank/orders', { method: 'POST', body: JSON.stringify(data) }); }
export async function confirmBankOrder(id: number) { return request(`/bank/orders/${id}/confirm`, { method: 'PATCH' }); }

export async function listWarehouses() { return request('/warehouse'); }
export async function createWarehouse(data: any) { return request('/warehouse', { method: 'POST', body: JSON.stringify(data) }); }
export async function getWarehouseStock(id: number) { return request(`/warehouse/${id}/stock`); }
export async function transferStock(data: any) { return request('/warehouse/transfer', { method: 'POST', body: JSON.stringify(data) }); }
export async function listBatches(productId?: number) {
  return request(`/warehouse/batches/list${productId ? '?productId=' + productId : ''}`);
}
export async function createBatch(data: any) { return request('/warehouse/batches', { method: 'POST', body: JSON.stringify(data) }); }
export async function listMovements(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/warehouse/movements/list${params}`);
}

export async function listWorkshops() { return request('/production/workshops'); }
export async function createWorkshop(data: any) { return request('/production/workshops', { method: 'POST', body: JSON.stringify(data) }); }
export async function listTechCards() { return request('/production/tech-cards'); }
export async function createTechCard(data: any) { return request('/production/tech-cards', { method: 'POST', body: JSON.stringify(data) }); }
export async function listProductionOrders(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/production/orders${params}`);
}
export async function createProductionOrder(data: any) { return request('/production/orders', { method: 'POST', body: JSON.stringify(data) }); }
export async function startProductionOrder(id: number) { return request(`/production/orders/${id}/start`, { method: 'PATCH' }); }
export async function completeProductionOrder(id: number) { return request(`/production/orders/${id}/complete`, { method: 'PATCH' }); }

export async function listEmployees(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/hr/employees${params}`);
}
export async function createEmployee(data: any) { return request('/hr/employees', { method: 'POST', body: JSON.stringify(data) }); }
export async function fireEmployee(id: number, fireDate: string) { return request(`/hr/employees/${id}/fire`, { method: 'PATCH', body: JSON.stringify({ fireDate }) }); }
export async function listTimesheets(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/hr/timesheets${params}`);
}
export async function upsertTimesheet(data: any) { return request('/hr/timesheets', { method: 'POST', body: JSON.stringify(data) }); }
export async function listPayroll(period?: string) {
  return request(`/hr/payroll${period ? '?period=' + period : ''}`);
}
export async function calculatePayroll(period: string) { return request('/hr/payroll/calculate', { method: 'POST', body: JSON.stringify({ period }) }); }
export async function payPayroll(id: number) { return request(`/hr/payroll/${id}/pay`, { method: 'PATCH' }); }

export async function listDocuments(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/documents${params}`);
}
export async function getDocument(id: number) { return request(`/documents/${id}`); }
export async function createDocument(data: any) { return request('/documents', { method: 'POST', body: JSON.stringify(data) }); }
export async function postDocument(id: number) { return request(`/documents/${id}/post`, { method: 'PATCH' }); }
export async function unpostDocument(id: number) { return request(`/documents/${id}/unpost`, { method: 'PATCH' }); }
export async function deleteDocument(id: number) { return request(`/documents/${id}`, { method: 'DELETE' }); }
export async function listDocumentApprovals(id: number) { return request(`/documents/${id}/approvals`); }
export async function requestDocumentApproval(id: number, approverId: number) { return request(`/documents/${id}/approvals`, { method: 'POST', body: JSON.stringify({ approverId }) }); }
export async function decideApproval(id: number, status: 'Approved' | 'Rejected', comment: string) {
  return request(`/documents/approvals/${id}/decide`, { method: 'PATCH', body: JSON.stringify({ status, comment }) });
}

export async function listRoles() { return request('/rbac/roles'); }
export async function createRole(data: any) { return request('/rbac/roles', { method: 'POST', body: JSON.stringify(data) }); }
export async function listPermissions() { return request('/rbac/permissions'); }
export async function seedPermissions() { return request('/rbac/seed/permissions', { method: 'POST' }); }
export async function seedSystemRoles() { return request('/rbac/seed/system-roles', { method: 'POST' }); }
export async function assignRole(userId: number, roleId: number, scope?: string) {
  return request(`/rbac/users/${userId}/roles/${roleId}`, { method: 'POST', body: JSON.stringify({ scope }) });
}
export async function getUserPermissions(userId: number) { return request(`/rbac/users/${userId}/permissions`); }
export async function getUserRoles(userId: number) { return request(`/rbac/users/${userId}/roles`); }

export async function listTasks(filters?: Record<string, string>) {
  const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
  return request(`/tasks${params}`);
}
export async function listMyTasks() { return request('/tasks/mine'); }
export async function createTask(data: any) { return request('/tasks', { method: 'POST', body: JSON.stringify(data) }); }
export async function startTask(id: number) { return request(`/tasks/${id}/start`, { method: 'PATCH' }); }
export async function completeTask(id: number) { return request(`/tasks/${id}/complete`, { method: 'PATCH' }); }
export async function cancelTask(id: number) { return request(`/tasks/${id}/cancel`, { method: 'PATCH' }); }

export async function listNotifications(unread?: boolean) {
  return request(`/notifications${unread ? '?unread=true' : ''}`);
}
export async function getUnreadCount() { return request('/notifications/unread-count'); }
export async function markNotificationRead(id: number) { return request(`/notifications/${id}/read`, { method: 'PATCH' }); }
export async function markAllNotificationsRead() { return request('/notifications/read-all', { method: 'PATCH' }); }

export async function listScheduledJobs() { return request('/scheduler/jobs'); }
export async function createScheduledJob(data: any) { return request('/scheduler/jobs', { method: 'POST', body: JSON.stringify(data) }); }
export async function runJobNow(id: number) { return request(`/scheduler/jobs/${id}/run`, { method: 'POST' }); }
export async function seedDefaultJobs() { return request('/scheduler/seed', { method: 'POST' }); }

export async function listConfigObjects(kind?: string) {
  return request(`/configurator/objects${kind ? '?kind=' + kind : ''}`);
}
export async function createConfigObject(data: any) { return request('/configurator/objects', { method: 'POST', body: JSON.stringify(data) }); }
export async function listPrintTemplates(documentType?: string) {
  return request(`/configurator/print-templates${documentType ? '?documentType=' + documentType : ''}`);
}
export async function createPrintTemplate(data: any) { return request('/configurator/print-templates', { method: 'POST', body: JSON.stringify(data) }); }
export async function exportConfig() { return request('/configurator/export'); }

export async function globalSearch(q: string) {
  return request(`/search?q=${encodeURIComponent(q)}`);
}

// ===== Printing =====

export interface PrintForm {
  id: number;
  code: string;
  name: string;
  applicableTypes: string[];
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

export async function listPrintForms(entityType?: string): Promise<PrintForm[]> {
  const path = entityType ? `/printing/forms/${entityType}` : '/printing/forms';
  return request(path);
}

export async function renderPrintForm(entityType: string, entityId: number, formCode: string): Promise<Blob> {
  let token = getToken();
  const headers: any = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res = await fetch(`${API}/printing/render/${entityType}/${entityId}/${formCode}`, { headers });

  if (res.status === 401 && token) {
    try {
      const { refreshTokenIfNeeded } = await import('../store/AuthContext');
      const newToken = await refreshTokenIfNeeded();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        res = await fetch(`${API}/printing/render/${entityType}/${entityId}/${formCode}`, { headers });
      }
    } catch {}
  }

  if (!res.ok) {
    let msg = 'Print failed';
    try {
      const data = await res.json();
      msg = data.message || msg;
    } catch {}
    const err: any = new Error(msg);
    err.response = { data: { message: msg }, status: res.status };
    throw err;
  }
  return res.blob();
}

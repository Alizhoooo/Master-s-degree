import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProducts, getPriority, getStockAlerts, getInventoryLogs,
  reserveByPriority, adjustStock,
  getDashboard, getReports, exportCsv,
  getCustomers, getCustomer, createCustomer, updateCustomer, addContactLog,
  getComplaints, createComplaint, updateComplaintStatus,
  getOrders, getOrder, createOrder, updateOrderStatus, cancelOrder, getPickList,
  getForecast, getAnomalies,
  getUsers, createUser, updateUserRole,
  getConfig, setConfig, getSystemLogs,
} from './index';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const res = await getProducts();
      return Array.isArray(res) ? res : (res.data ?? res.products ?? []);
    },
    staleTime: 30000,
  });
}

export function usePriority() {
  return useQuery({
    queryKey: ['priority'],
    queryFn: async () => {
      const res = await getPriority();
      return Array.isArray(res) ? res : (res.data ?? res.priority ?? []);
    },
    staleTime: 10000,
  });
}

export function useStockAlerts() {
  return useQuery({
    queryKey: ['stockAlerts'],
    queryFn: async () => {
      const res = await getStockAlerts();
      return Array.isArray(res) ? res : (res.data ?? res.alerts ?? []);
    },
    staleTime: 15000,
  });
}

export function useInventoryLogs() {
  return useQuery({
    queryKey: ['inventoryLogs'],
    queryFn: async () => {
      const res = await getInventoryLogs();
      return Array.isArray(res) ? res : (res.data ?? res.logs ?? []);
    },
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboard,
    staleTime: 30000,
  });
}

export function useReports(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['reports', filters],
    queryFn: () => getReports(filters),
  });
}

export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const res = await getCustomers();
      return Array.isArray(res) ? res : (res.data ?? res.customers ?? []);
    },
    staleTime: 30000,
  });
}

export function useCustomer(id: number) {
  return useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: !!id,
  });
}

export function useComplaints() {
  return useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const res = await getComplaints();
      return Array.isArray(res) ? res : (res.data ?? res.complaints ?? []);
    },
  });
}

export function useOrders(filters?: Record<string, string>) {
  return useQuery({
    queryKey: ['orders', filters],
    queryFn: () => getOrders(filters),
    staleTime: 15000,
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
  });
}

export function usePickList(id: number) {
  return useQuery({
    queryKey: ['pickList', id],
    queryFn: () => getPickList(id),
    enabled: !!id,
  });
}

export function useForecast() {
  return useQuery({
    queryKey: ['forecast'],
    queryFn: async () => {
      const res = await getForecast();
      return Array.isArray(res) ? res : (res.data ?? res.forecast ?? []);
    },
    staleTime: 60000,
  });
}

export function useAnomalies() {
  return useQuery({
    queryKey: ['anomalies'],
    queryFn: async () => {
      const res = await getAnomalies();
      return Array.isArray(res) ? res : (res.data ?? res.anomalies ?? []);
    },
    staleTime: 30000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await getUsers();
      return Array.isArray(res) ? res : (res.data ?? res.users ?? []);
    },
  });
}

export function useConfig(key: string) {
  return useQuery({
    queryKey: ['config', key],
    queryFn: () => getConfig(key),
    enabled: !!key,
  });
}

export function useSystemLogs() {
  return useQuery({
    queryKey: ['systemLogs'],
    queryFn: async () => {
      const res = await getSystemLogs();
      return Array.isArray(res) ? res : (res.data ?? res.logs ?? []);
    },
  });
}

export function useReserveByPriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: reserveByPriority,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['priority'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, userId, change, reason }: { productId: number; userId: number; change: number; reason: string }) =>
      adjustStock(productId, userId, change, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['stockAlerts'] });
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => cancelOrder(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createCustomer(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => updateCustomer(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', id] });
    },
  });
}

export function useAddContactLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ customerId, note }: { customerId: number; note: string }) => addContactLog(customerId, note),
    onSuccess: (_, { customerId }) => queryClient.invalidateQueries({ queryKey: ['customer', customerId] }),
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createComplaint(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateComplaintStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['complaints'] }),
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) => updateUserRole(id, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}

export function useSetConfig() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) => setConfig(key, value),
    onSuccess: (_, { key }) => queryClient.invalidateQueries({ queryKey: ['config', key] }),
  });
}

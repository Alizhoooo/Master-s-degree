export interface User {
  id: number
  email: string
  fullName: string
  role: string
  createdAt?: string
}

export interface Customer {
  id: number
  company: string
  contactPerson: string
  phone: string
  email: string
  tier: string
  totalOrders: number
  lastOrderDate?: string
  createdAt: string
  orders?: Order[]
  contactLogs?: ContactLog[]
  complaints?: Complaint[]
}

export interface Product {
  id: number
  sku: string
  name: string
  category: string
  unitPrice: number
  quantityOnHand: number
  quantityReserved: number
  reorderPoint: number
  available?: number
  createdAt?: string
}

export interface OrderItem {
  id: number
  orderId: number
  productId: number
  quantity: number
  unitPrice: number
  product?: Product
}

export interface Order {
  id: number
  customerId: number
  userId: number
  customer?: Customer
  user?: User
  status: string
  totalAmount: number
  costAmount: number
  deliveryAddress: string
  deadline: string
  notes?: string
  createdAt: string
  updatedAt: string
  items?: OrderItem[]
}

export interface Complaint {
  id: number
  customerId: number
  customer?: Customer
  title: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface ContactLog {
  id: number
  customerId: number
  note: string
  createdAt: string
}

export interface InventoryLog {
  id: number
  productId: number
  product?: Product
  userId: number
  change: number
  reason: string
  createdAt: string
}

export interface DashboardData {
  totalOrdersToday: number
  revenueToday: number
  pendingOrders: number
  inventoryAccuracy: number
  ordersPerDay: { date: string; count: number; revenue: number }[]
  orderStatusDistribution: { status: string; count: number }[]
  revenueTrend: { date: string; revenue: number }[]
  topProducts: { name: string; sku: string; totalQty: number; revenue: number }[]
}

export interface AiForecast {
  productId: number
  productName: string
  sku: string
  currentStock: number
  avgMonthlySales: number
  predictedDemand: number
  recommendedReorderQuantity: number
}

export interface AnomalyAlert {
  orderId: number
  customerName: string
  amount: number
  threshold?: number
  reason: string
  createdAt: string
}

export interface PriorityItem {
  orderId: number
  customerName: string
  customerTier: string
  margin: number
  hoursUntilDeadline: number
  alpha: number
  items: {
    productId: number
    productName: string
    sku: string
    requested: number
    available: number
    canFulfill: boolean
  }[]
  totalAmount: number
  deadline: string
}

export interface LoginResponse {
  access_token: string
}

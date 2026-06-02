export interface User {
  id: number;
  email: string;
  fullName: string;
  role: 'Admin' | 'Manager' | 'Warehouse' | 'User';
}

export interface Product {
  id: number;
  sku: string;
  artikul?: string;
  barcode?: string;
  name: string;
  description?: string;
  category?: string;
  type?: string;
  unit?: string;
  unitPrice: number;
  costPrice?: number;
  markup?: number;
  currency?: string;
  quantityOnHand?: number;
  quantityReserved?: number;
  reorderPoint?: number;
  minStock?: number;
  maxStock?: number;
  vatRate?: number;
  weight?: number;
  volume?: number;
  manufacturer?: string;
  country?: string;
  imageUrl?: string;
  storageLifeDays?: number;
  isActive?: boolean;
  archivedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: number;
  companyName: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  tier: 'VIP' | 'Regular' | 'Problematic' | 'New';
  totalOrders?: number;
  lastOrderDate?: string;
  createdAt: string;
}

export interface Order {
  id: number;
  number?: string;
  customerId: number;
  customer?: Customer;
  totalAmount: number;
  costAmount?: number;
  deliveryAddress?: string;
  deadline?: string;
  notes?: string;
  status: 'Pending' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  items?: OrderItem[];
}

export interface OrderItem {
  id: number;
  productId: number;
  product?: Product;
  quantity: number;
  unitPrice: number;
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  inn?: string;
  address?: string;
  bankAccount?: string;
  bankName?: string;
  bic?: string;
  category?: string;
  rating?: number;
  isActive?: boolean;
}

export interface Batch {
  id: number;
  batchNo: string;
  productId: number;
  product?: Product;
  warehouseId?: number;
  warehouse?: { id: number; name: string };
  quantity: number;
  remainingQty?: number;
  costPrice: number;
  manufacturedAt?: string;
  expiryDate?: string;
  storageLifeDays?: number;
  serialNo?: string;
  status?: string;
  notes?: string;
  createdAt: string;
}

export interface Warehouse {
  id: number;
  name: string;
  address?: string;
  isMain?: boolean;
}

export interface ExpiryAlert {
  id: number;
  batchId: number;
  batch?: Batch;
  severity: 'Critical' | 'Warning' | 'Info' | 'Expired';
  daysLeft?: number;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface Category {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  displayOrder: number;
  productCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  _id: string;
  id?: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  shortDescription?: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  category: Category | string;
  seller?: { _id: string; firstName: string; lastName: string; email: string } | string;
  images: string[];
  isFeatured: boolean;
  status: 'active' | 'draft' | 'archived' | 'out_of_stock';
  rating: number;
  numReviews: number;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  product: string | Product;
  name: string;
  price: number;
  quantity: number;
  image: string;
  seller?: { _id: string; firstName: string; lastName: string; email: string } | string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface Order {
  _id: string;
  id?: string;
  orderNumber: string;
  customer: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  paymentMethod: 'credit_card' | 'paypal' | 'stripe' | 'cash_on_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  trackingNumber?: string;
  notes?: string;
  sellerEarnings?: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardMetrics {
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    lowStockCount: number;
    totalSpent?: number;
    activeShipments?: number;
    passkeyCount?: number;
    role?: 'admin' | 'seller' | 'customer' | 'support' | 'manager' | string;
  };
  orderStatusCounts: {
    pending: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
  };
  monthlySales: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  recentOrders: Order[];
  lowStockProducts: Product[];
}

export interface Customer {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isActive: boolean;
  ordersCount: number;
  totalSpend: number;
  lastOrderDate?: string;
  vendorProfile?: {
    vendorName?: string;
    phone?: string;
    businessLocation?: string;
    taxId?: string;
    businessCategory?: string;
    description?: string;
  };
  agreementAccepted?: boolean;
  agreementAcceptedAt?: string;
  createdAt: string;
}

export interface MenuItem {
  _id: string;
  id?: string;
  name: string;
  path: string;
  icon: string;
  order: number;
  roles: string[];
  requiredPermission?: string;
  parentId?: any;
  badgeText?: string;
  isActive: boolean;
  isSystem?: boolean;
  subItems?: Array<{ label: string; path: string; id?: string }>;
}

export interface PermissionItem {
  _id: string;
  id?: string;
  code: string;
  name: string;
  module: string;
  description: string;
  isSystem?: boolean;
}

export interface RoleItem {
  _id: string;
  id?: string;
  name: string;
  label: string;
  description: string;
  permissions: string[];
  userCount?: number;
  isSystem?: boolean;
}

export interface UserPermissionItem {
  _id: string;
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  customPermissions: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface ReviewItem {
  _id: string;
  id?: string;
  product: string;
  productName: string;
  user?: string;
  userName: string;
  userEmail: string;
  rating: number;
  title?: string;
  comment: string;
  isVerifiedPurchase: boolean;
  status: 'approved' | 'pending' | 'rejected';
  helpfulCount: number;
  createdAt: string;
}

export interface AuditLogItem {
  _id: string;
  id?: string;
  userId?: string;
  userEmail: string;
  userName: string;
  userRole: string;
  action: string;
  method: string;
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  macOrDevice: string;
  statusCode: number;
  details?: any;
  createdAt: string;
}

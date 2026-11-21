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
  brand?: string;
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
  paymentMethod: 'credit_card' | 'paypal' | 'stripe' | 'cash_on_delivery' | 'khalti' | 'esewa';
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
  phone?: string;
  address?: string;
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
    documentUrl?: string;
    isApproved?: boolean;
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
  action?: 'view' | 'create' | 'edit' | 'delete' | 'export' | 'special' | string;
  roles?: string[];
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

export interface BillingItem {
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface BillingRecord {
  _id?: string;
  id?: string;
  invoiceNumber: string;
  order?: any;
  orderNumber?: string;
  customer: {
    userId?: string;
    name: string;
    email: string;
    phone?: string;
  };
  billingAddress: {
    street: string;
    city: string;
    state?: string;
    zipCode: string;
    country: string;
  };
  items: BillingItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount: number;
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: 'paid' | 'pending' | 'unpaid' | 'overdue' | 'refunded';
  issuedDate: string;
  dueDate: string;
  paidAt?: string | null;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface BillingStats {
  totalInvoices: number;
  totalBilled: number;
  totalRevenue: number;
  paidCount: number;
  pendingAmount: number;
  pendingCount: number;
  overdueAmount: number;
  overdueCount: number;
  totalTaxCollected: number;
}

export interface DiscountItem {
  _id: string;
  id?: string;
  code: string;
  description: string;
  type: 'percentage' | 'fixed_amount';
  value: number;
  minPurchaseAmount: number;
  maxDiscountAmount?: number | null;
  startDate: string;
  endDate?: string | null;
  usageLimit?: number | null;
  usedCount: number;
  isActive: boolean;
  applicableCategory?: { _id: string; name: string; slug: string } | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerItem {
  _id: string;
  id?: string;
  title: string;
  subtitle?: string;
  badgeText?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  position: 'hero_main' | 'hero_secondary' | 'top_announcement' | 'flash_sale';
  alignment: 'left' | 'center' | 'right';
  overlayOpacity: number;
  textColor?: string;
  themeColor?: string;
  scheduleType: 'always' | 'date_range' | 'recurring_daily' | 'recurring_weekly';
  startDate?: string | null;
  endDate?: string | null;
  startHour?: number;
  endHour?: number;
  activeDays?: number[];
  timezone?: string;
  priority: number;
  isActive: boolean;
  impressions: number;
  clicks: number;
  computedStatus?: 'active_now' | 'scheduled' | 'expired' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface BannerStats {
  activeNowCount: number;
  scheduledCount: number;
  totalImpressions: number;
  totalClicks: number;
  avgCtr: string;
}

import { axiosConfig } from 'shared-ui/axios/AxiosConfig';
import {
  Category,
  Product,
  Order,
  DashboardMetrics,
  Customer,
  MenuItem,
  PermissionItem,
  RoleItem,
  UserPermissionItem,
  BillingRecord,
  BillingStats,
  DiscountItem,
  BannerItem,
} from '../types/ecommerce.types';

export class EcommerceAPIService {
  // Categories
  async getCategories() {
    const res = await axiosConfig.get<{ success: boolean; data: Category[] }>('/ecommerce/categories');
    return res.data;
  }

  async getCategory(id: string) {
    const res = await axiosConfig.get<{ success: boolean; data: Category }>(`/ecommerce/categories/${id}`);
    return res.data;
  }

  async createCategory(payload: Partial<Category>) {
    const res = await axiosConfig.post<{ success: boolean; data: Category }>('/ecommerce/categories', payload);
    return res.data;
  }

  async updateCategory(id: string, payload: Partial<Category>) {
    const res = await axiosConfig.put<{ success: boolean; data: Category }>(`/ecommerce/categories/${id}`, payload);
    return res.data;
  }

  async deleteCategory(id: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages: string[] }>(`/ecommerce/categories/${id}`);
    return res.data;
  }

  // Products
  async getProducts(params?: Record<string, any>) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: {
        products: Product[];
        pagination: {
          page: number;
          limit: number;
          totalPages: number;
          totalCount: number;
        };
      };
    }>('/ecommerce/products', { params });
    return res.data;
  }

  async getProduct(id: string) {
    const res = await axiosConfig.get<{ success: boolean; data: Product }>(`/ecommerce/products/${id}`);
    return res.data;
  }

  async createProduct(payload: Partial<Product>) {
    const res = await axiosConfig.post<{ success: boolean; data: Product }>('/ecommerce/products', payload);
    return res.data;
  }

  async updateProduct(id: string, payload: Partial<Product>) {
    const res = await axiosConfig.put<{ success: boolean; data: Product }>(`/ecommerce/products/${id}`, payload);
    return res.data;
  }

  async deleteProduct(id: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages: string[] }>(`/ecommerce/products/${id}`);
    return res.data;
  }

  async updateStock(id: string, stock: number) {
    const res = await axiosConfig.patch<{ success: boolean; data: Product }>(`/ecommerce/products/${id}/stock`, { stock });
    return res.data;
  }

  // Orders
  async getOrders(params?: Record<string, any>) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: {
        orders: Order[];
        pagination: {
          page: number;
          limit: number;
          totalPages: number;
          totalCount: number;
        };
      };
    }>('/ecommerce/orders', { params });
    return res.data;
  }

  async getOrder(id: string) {
    const res = await axiosConfig.get<{ success: boolean; data: Order }>(`/ecommerce/orders/${id}`);
    return res.data;
  }

  async createOrder(payload: Partial<Order>) {
    const res = await axiosConfig.post<{ success: boolean; data: Order }>('/ecommerce/orders', payload);
    return res.data;
  }

  async updateOrderStatus(id: string, payload: { orderStatus?: string; paymentStatus?: string; trackingNumber?: string }) {
    const res = await axiosConfig.patch<{ success: boolean; data: Order }>(`/ecommerce/orders/${id}/status`, payload);
    return res.data;
  }

  // Dashboard Metrics
  async getDashboardMetrics() {
    const res = await axiosConfig.get<{ success: boolean; data: DashboardMetrics }>('/ecommerce/dashboard/overview');
    return res.data;
  }

  // Customers
  async getCustomers(params?: Record<string, any>) {
    const res = await axiosConfig.get<{ success: boolean; data: Customer[] }>('/ecommerce/customers', { params });
    return res.data;
  }

  async createCustomer(payload: { firstName: string; lastName: string; email: string; password?: string }) {
    const res = await axiosConfig.post<{ success: boolean; data: Customer; messages?: string[] }>('/ecommerce/customers', payload);
    return res.data;
  }

  async toggleCustomerStatus(id: string, isActive?: boolean) {
    const res = await axiosConfig.patch<{ success: boolean; data: Customer; messages?: string[] }>(
      `/ecommerce/customers/${id}/status`,
      { isActive }
    );
    return res.data;
  }

  async changeCustomerPassword(id: string, password: string) {
    const res = await axiosConfig.patch<{ success: boolean; messages?: string[] }>(
      `/ecommerce/customers/${id}/password`,
      { password }
    );
    return res.data;
  }

  // Dynamic Navigation Menus & RBAC
  async getUserMenus(role?: string) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: {
        menus: MenuItem[];
        userRole: string;
        effectivePermissions: string[];
      };
    }>('/ecommerce/menus', {
      params: role ? { role } : undefined,
    });
    return res.data;
  }

  async getAllMenus() {
    const res = await axiosConfig.get<{ success: boolean; data: MenuItem[] }>('/ecommerce/rbac/menus');
    return res.data;
  }

  async createMenu(payload: Partial<MenuItem>) {
    const res = await axiosConfig.post<{ success: boolean; data: MenuItem }>('/ecommerce/rbac/menus', payload);
    return res.data;
  }

  async updateMenu(id: string, payload: Partial<MenuItem>) {
    const res = await axiosConfig.put<{ success: boolean; data: MenuItem }>(`/ecommerce/rbac/menus/${id}`, payload);
    return res.data;
  }

  async deleteMenu(id: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages: string[] }>(`/ecommerce/rbac/menus/${id}`);
    return res.data;
  }

  // Roles
  async getRoles() {
    const res = await axiosConfig.get<{ success: boolean; data: RoleItem[] }>('/ecommerce/rbac/roles');
    return res.data;
  }

  async createRole(payload: { name: string; label: string; description?: string; permissions?: string[] }) {
    const res = await axiosConfig.post<{ success: boolean; data: RoleItem; messages?: string[] }>(
      '/ecommerce/rbac/roles',
      payload
    );
    return res.data;
  }

  async updateRole(roleName: string, payload: { label?: string; description?: string; permissions?: string[] }) {
    const res = await axiosConfig.put<{ success: boolean; data: RoleItem; messages?: string[] }>(
      `/ecommerce/rbac/roles/${roleName}`,
      payload
    );
    return res.data;
  }

  async updateRolePermissions(roleName: string, permissions: string[]) {
    return this.updateRole(roleName, { permissions });
  }

  async deleteRole(roleName: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages?: string[] }>(
      `/ecommerce/rbac/roles/${roleName}`
    );
    return res.data;
  }

  // Permissions
  async getPermissions() {
    const res = await axiosConfig.get<{ success: boolean; data: PermissionItem[] }>('/ecommerce/rbac/permissions');
    return res.data;
  }

  async createPermission(payload: Partial<PermissionItem>) {
    const res = await axiosConfig.post<{ success: boolean; data: PermissionItem }>('/ecommerce/rbac/permissions', payload);
    return res.data;
  }

  // User Special Permissions
  async getUsersWithPermissions() {
    const res = await axiosConfig.get<{ success: boolean; data: UserPermissionItem[] }>('/ecommerce/rbac/users');
    return res.data;
  }

  async assignUserPermissions(userId: string, customPermissions: string[]) {
    const res = await axiosConfig.post<{ success: boolean; data: UserPermissionItem }>(
      `/ecommerce/rbac/users/${userId}/permissions`,
      { customPermissions }
    );
    return res.data;
  }

  // User Role Management
  async updateUserRole(userId: string, role: string) {
    const res = await axiosConfig.patch<{ success: boolean; data: any; messages?: string[] }>(
      `/ecommerce/customers/${userId}/role`,
      { role }
    );
    return res.data;
  }

  // Customer Reviews
  async getReviews(params?: { product?: string; status?: string; limit?: number }) {
    const res = await axiosConfig.get<{ success: boolean; data: any[] }>('/ecommerce/reviews', { params });
    return res.data;
  }

  async createReview(payload: { productId: string; rating: number; comment: string; title?: string; userName?: string; userEmail?: string }) {
    const res = await axiosConfig.post<{ success: boolean; data: any; messages?: string[] }>('/ecommerce/reviews', payload);
    return res.data;
  }

  async updateReviewStatus(id: string, status: 'approved' | 'rejected' | 'pending') {
    const res = await axiosConfig.patch<{ success: boolean; data: any }>(`/ecommerce/reviews/${id}/status`, { status });
    return res.data;
  }

  async deleteReview(id: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages: string[] }>(`/ecommerce/reviews/${id}`);
    return res.data;
  }

  // User Activity Audit Logs
  async getAuditLogs(params?: { search?: string; action?: string; limit?: number }) {
    const res = await axiosConfig.get<{ success: boolean; data: any[] }>('/ecommerce/audit-logs', { params });
    return res.data;
  }

  async getMyAuditLogs(params?: { search?: string; action?: string; limit?: number }) {
    const res = await axiosConfig.get<{ success: boolean; data: any[] }>('/ecommerce/audit-logs/my-logs', { params });
    return res.data;
  }

  // Billing & Invoices
  async getBillings(params?: { search?: string; status?: string; page?: number; limit?: number }) {
    const res = await axiosConfig.get<{ success: boolean; data: { invoices: BillingRecord[]; total: number; totalPages: number } }>('/ecommerce/billing', { params });
    return res.data;
  }

  async getBillingStats() {
    const res = await axiosConfig.get<{ success: boolean; data: BillingStats }>('/ecommerce/billing/stats');
    return res.data;
  }

  async getBillingById(id: string) {
    const res = await axiosConfig.get<{ success: boolean; data: BillingRecord }>(`/ecommerce/billing/${id}`);
    return res.data;
  }

  async createBilling(data: any) {
    const res = await axiosConfig.post<{ success: boolean; data: BillingRecord; messages?: string[] }>('/ecommerce/billing', data);
    return res.data;
  }

  async updateBillingStatus(id: string, data: { paymentStatus?: string; paymentMethod?: string; notes?: string }) {
    const res = await axiosConfig.patch<{ success: boolean; data: BillingRecord; messages?: string[] }>(`/ecommerce/billing/${id}/status`, data);
    return res.data;
  }

  // Cloudinary Image Upload (defaults to HimalayaOnlineShop/Temporary staging)
  async uploadImage(
    file: File,
    folder: string = 'HimalayaOnlineShop/Temporary',
    onProgress?: (percent: number) => void
  ) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    const res = await axiosConfig.post<{
      success: boolean;
      data: { url: string; public_id: string; format: string; width: number; height: number };
      messages?: string[];
    }>('/ecommerce/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  }

  // Move image from Temporary staging to permanent destination on successful form save
  async commitImage(publicId: string, targetSubfolder: string = 'Admin/Brands') {
    const res = await axiosConfig.post<{
      success: boolean;
      data: { url: string; public_id: string; format?: string; width?: number; height?: number };
      messages?: string[];
    }>('/ecommerce/upload/commit', {
      public_id: publicId,
      targetFolder: targetSubfolder,
    });
    return res.data;
  }

  async uploadMultipleImages(
    files: File[],
    folder: string = 'HimalayaOnlineShop',
    onProgress?: (percent: number) => void
  ) {
    const formData = new FormData();
    files.forEach((f) => formData.append('files', f));
    formData.append('folder', folder);
    const res = await axiosConfig.post<{
      success: boolean;
      data: { urls: string[]; files: any[]; count: number };
      messages?: string[];
    }>('/ecommerce/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  }

  // Khalti & eSewa Self-Payment Integration
  async initiateKhalti(payload: {
    orderId: string;
    amount?: number;
    customerInfo?: { name?: string; email?: string; phone?: string };
    returnUrl?: string;
    websiteUrl?: string;
  }) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: {
        gateway: string;
        pidx: string;
        paymentUrl: string;
        orderId: string;
        orderNumber: string;
        isSimulated?: boolean;
      };
      messages?: string[];
    }>('/ecommerce/payment/khalti/initiate', payload);
    return res.data;
  }

  async verifyKhalti(payload: { pidx?: string; orderId?: string }) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: any;
      messages?: string[];
    }>('/ecommerce/payment/khalti/verify', payload);
    return res.data;
  }

  async initiateEsewa(payload: {
    orderId: string;
    amount?: number;
    taxAmount?: number;
    returnUrl?: string;
    failureUrl?: string;
  }) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: {
        gateway: string;
        gatewayUrl: string;
        formFields: Record<string, string>;
        orderId: string;
        orderNumber: string;
        totalAmount: string;
      };
      messages?: string[];
    }>('/ecommerce/payment/esewa/initiate', payload);
    return res.data;
  }

  async verifyEsewa(payload: { encodedData?: string; orderId?: string }) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: any;
      messages?: string[];
    }>('/ecommerce/payment/esewa/verify', payload);
    return res.data;
  }

  // Discount & Coupon Management
  async getDiscounts(params?: { search?: string; type?: string; status?: string; page?: number; limit?: number }) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: { discounts: DiscountItem[]; total: number; totalPages: number; page: number };
      messages?: string[];
    }>('/ecommerce/discounts', { params });
    return res.data;
  }

  async getDiscountById(id: string) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: DiscountItem;
      messages?: string[];
    }>(`/ecommerce/discounts/${id}`);
    return res.data;
  }

  async createDiscount(data: Partial<DiscountItem>) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: DiscountItem;
      messages?: string[];
    }>('/ecommerce/discounts', data);
    return res.data;
  }

  async updateDiscount(id: string, data: Partial<DiscountItem>) {
    const res = await axiosConfig.put<{
      success: boolean;
      data: DiscountItem;
      messages?: string[];
    }>(`/ecommerce/discounts/${id}`, data);
    return res.data;
  }

  async deleteDiscount(id: string) {
    const res = await axiosConfig.delete<{
      success: boolean;
      messages?: string[];
    }>(`/ecommerce/discounts/${id}`);
    return res.data;
  }

  async validateCoupon(payload: { code: string; cartTotal?: number }) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: {
        valid: boolean;
        code: string;
        type: 'percentage' | 'fixed_amount';
        value: number;
        discountAmount: number;
        description: string;
      };
      messages?: string[];
    }>('/ecommerce/discounts/validate', payload);
    return res.data;
  }

  // Hero Section & Banners Management
  async getActiveBanners(params?: { position?: string; clientTime?: string }) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: BannerItem[];
      messages?: string[];
    }>('/ecommerce/banners/active', { params });
    return res.data;
  }

  async getBanners(params?: { search?: string; position?: string; status?: string; page?: number; limit?: number }) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: {
        banners: BannerItem[];
        pagination: { page: number; limit: number; total: number; totalPages: number };
        stats: {
          activeNowCount: number;
          scheduledCount: number;
          totalImpressions: number;
          totalClicks: number;
          avgCtr: string;
        };
      };
      messages?: string[];
    }>('/ecommerce/banners', { params });
    return res.data;
  }

  async getBannerById(id: string) {
    const res = await axiosConfig.get<{
      success: boolean;
      data: BannerItem;
      messages?: string[];
    }>(`/ecommerce/banners/${id}`);
    return res.data;
  }

  async createBanner(data: Partial<BannerItem>) {
    const res = await axiosConfig.post<{
      success: boolean;
      data: BannerItem;
      messages?: string[];
    }>('/ecommerce/banners', data);
    return res.data;
  }

  async updateBanner(id: string, data: Partial<BannerItem>) {
    const res = await axiosConfig.put<{
      success: boolean;
      data: BannerItem;
      messages?: string[];
    }>(`/ecommerce/banners/${id}`, data);
    return res.data;
  }

  async deleteBanner(id: string) {
    const res = await axiosConfig.delete<{
      success: boolean;
      messages?: string[];
    }>(`/ecommerce/banners/${id}`);
    return res.data;
  }

  async recordBannerClick(id: string) {
    const res = await axiosConfig.post<{
      success: boolean;
      messages?: string[];
    }>(`/ecommerce/banners/${id}/click`);
    return res.data;
  }
}

export const ecommerceService = new EcommerceAPIService();

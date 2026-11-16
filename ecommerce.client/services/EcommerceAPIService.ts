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

  async deleteOrder(id: string) {
    const res = await axiosConfig.delete<{ success: boolean; messages: string[] }>(`/ecommerce/orders/${id}`);
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

  async updateRolePermissions(roleName: string, permissions: string[]) {
    const res = await axiosConfig.put<{ success: boolean; data: RoleItem }>(`/ecommerce/rbac/roles/${roleName}`, {
      permissions,
    });
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
}

export const ecommerceService = new EcommerceAPIService();

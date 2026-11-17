import React from 'react';
import { RouteConfig } from 'shared-ui/router/RouteRenderer.types';
import { PublicLayout } from '../components/store/PublicLayout';
import { StoreHomePage } from '../components/store/StoreHomePage';
import { CheckoutPage } from '../components/store/CheckoutPage';

// Direct component imports from dedicated feature folders
import { AuthorizedLayout } from '../components/admin/layout/AuthorizedLayout';
import DashboardOverview from '../components/admin/dashboard/DashboardOverview';
import ProductManagement from '../components/admin/products/ProductManagement';
import CategoryManagement from '../components/admin/categories/CategoryManagement';
import OrderManagement from '../components/admin/orders/OrderManagement';
import CustomerManagement from '../components/admin/customers/CustomerManagement';
import RoleManagement from '../components/admin/roles/RoleManagement';
import PermissionManagement from '../components/admin/permissions/PermissionManagement';
import MenuManagement from '../components/admin/menus/MenuManagement';
import ReviewManagement from '../components/admin/reviews/ReviewManagement';
import AuditLogManagement from '../components/admin/audit/AuditLogManagement';
import InventoryManagement from '../components/admin/inventory/InventoryManagement';
import SellerProfile from '../components/admin/profile/SellerProfile';
import UserProfile from '../components/admin/profile/UserProfile';
import SecurityManagement from '../components/admin/security/SecurityManagement';

import { LoginPage } from '../../Auth.Client/components/login/LoginPage';
import { RegisterPage } from '../../Auth.Client/components/register/RegisterPage';

export const EcommerceRoutes: RouteConfig = {
  layout: '',
  routes: [
    {
      path: '/',
      element: PublicLayout,
      children: [
        { index: true, element: StoreHomePage },
        { path: 'checkout', element: CheckoutPage },
      ],
    },
    {
      path: '/admin',
      element: AuthorizedLayout,
      children: [
        { index: true, element: DashboardOverview },
        { path: 'products', element: ProductManagement },
        { path: 'categories', element: CategoryManagement },
        { path: 'orders', element: OrderManagement },
        { path: 'customers', element: CustomerManagement },
        { path: 'reviews', element: ReviewManagement },
        { path: 'audit-logs', element: AuditLogManagement },
        { path: 'roles', element: RoleManagement },
        { path: 'permissions', element: PermissionManagement },
        { path: 'menus', element: MenuManagement },
        { path: 'inventory', element: InventoryManagement },
        { path: 'seller-profile', element: SellerProfile },
        { path: 'profile', element: UserProfile },
        { path: 'security', element: SecurityManagement },
      ],
    },
    { path: '/login', element: LoginPage },
    { path: '/register', element: RegisterPage },
  ],
};

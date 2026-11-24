import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from 'auth-client/hooks/useAuth';
import { ecommerceService } from '../services/EcommerceAPIService';

export type PermissionAction = 'read' | 'create' | 'edit' | 'update' | 'delete' | 'export' | 'manage';

export interface PermissionContextType {
  permissions: string[];
  role: string;
  isLoading: boolean;
  hasPermission: (code: string) => boolean;
  can: (action: PermissionAction, module: string) => boolean;
  canAccessPage: (path: string) => boolean;
  refreshPermissions: (overrideRole?: string) => Promise<void>;
  updateActivePermissions: (newPermissions: string[]) => void;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

// Normalizes module names (e.g. "/admin/audit-logs" -> "audit", "customer-reviews" -> "reviews")
export const normalizeModuleName = (moduleOrPath: string): string => {
  const clean = moduleOrPath
    .replace(/^\/admin\/?/, '')
    .replace(/^\//, '')
    .replace(/-logs?$/, '')
    .replace(/-profile$/, '_profile')
    .replace(/-/g, '_')
    .toLowerCase();
  
  if (clean === 'audit_log' || clean === 'audit') return 'audit';
  if (clean === 'review' || clean === 'customer_reviews') return 'reviews';
  if (
    clean === 'customer' ||
    clean === 'customers' ||
    clean === 'client' ||
    clean === 'clients' ||
    clean === 'employee' ||
    clean === 'employees' ||
    clean === 'accounts' ||
    clean.startsWith('accounts')
  ) {
    return 'customers';
  }
  if (clean === 'order') return 'orders';
  if (clean === 'product') return 'products';
  if (clean === 'category') return 'categories';
  return clean || 'dashboard';
};

export const PermissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentRole = (user?.role || 'admin').toLowerCase();

  const [permissions, setPermissions] = useState<string[]>(() => {
    // If admin default to wildcard initially, otherwise try cached
    return currentRole === 'admin' ? ['*'] : [];
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch permissions from backend RBAC service for the active role
  const refreshPermissions = useCallback(async (overrideRole?: string) => {
    const roleToFetch = (overrideRole || currentRole).toLowerCase();
    setIsLoading(true);
    try {
      const res = await ecommerceService.getUserMenus(roleToFetch);
      if (res.success && res.data) {
        let perms = res.data.effectivePermissions || [];
        // Super admin ALWAYS has wildcard full access
        if (roleToFetch === 'admin' || currentRole === 'admin') {
          perms = ['*', ...perms];
        }
        setPermissions(perms);
      }
    } catch {
      // Fallback defaults based on role if API is temporarily unreachable
      if (roleToFetch === 'admin') {
        setPermissions(['*']);
      } else if (roleToFetch === 'manager') {
        setPermissions([
          'products:read',
          'products:create',
          'products:edit',
          'categories:read',
          'categories:manage',
          'orders:read',
          'orders:update_status',
          'inventory:read',
          'inventory:adjust',
          'inventory:edit',
        ]);
      } else if (roleToFetch === 'seller') {
        setPermissions([
          'products:read',
          'products:create',
          'products:edit',
          'products:delete',
          'orders:read',
          'orders:update_status',
          'dashboard:read',
          'seller_profile:read',
          'seller_profile:edit',
        ]);
      } else if (roleToFetch === 'support') {
        setPermissions([
          'orders:read',
          'orders:update_status',
          'customers:read',
          'reviews:read',
          'reviews:edit',
        ]);
      } else {
        setPermissions(['dashboard:read', 'orders:read', 'products:read']);
      }
    } finally {
      setIsLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    refreshPermissions(currentRole);
  }, [currentRole, refreshPermissions]);

  // Synchronously update permissions locally (e.g. immediately after saving on permissions page)
  const updateActivePermissions = useCallback((newPermissions: string[]) => {
    setPermissions(newPermissions);
  }, []);

  // Direct code check
  const hasPermission = useCallback((code: string): boolean => {
    if (!code) return true;
    if (currentRole === 'admin' || permissions.includes('*')) return true;
    // Core pages accessible to all authenticated users from the start
    if (
      code === 'pages:dashboard' ||
      code === 'dashboard:view' ||
      code === 'dashboard:read' ||
      code === 'pages:profile' ||
      code === 'profile:read' ||
      code === 'profile:view' ||
      code === 'profile:manage' ||
      code.startsWith('profile:')
    ) {
      return true;
    }
    if (permissions.includes(code)) return true;
    
    // Check wildcard prefix e.g. "products:*"
    const prefix = code.split(':')[0];
    if (prefix && permissions.includes(`${prefix}:*`)) return true;

    return false;
  }, [permissions]);

  // High-level action and module checker
  const can = useCallback((action: PermissionAction, module: string): boolean => {
    if (currentRole === 'admin' || permissions.includes('*')) return true;

    const mod = normalizeModuleName(module);
    // Profile and Dashboard actions are granted to every authenticated user from the start
    if (mod === 'profile' || mod === 'dashboard') {
      return true;
    }

    if (permissions.includes(`${mod}:*`) || permissions.includes(`${mod}:manage`)) {
      return true;
    }

    const normAction = action.toLowerCase();

    // Map common action synonyms
    if (normAction === 'read' || normAction === 'view') {
      return (
        permissions.includes(`${mod}:read`) ||
        permissions.includes(`${mod}:view`) ||
        permissions.includes(`pages:${mod}`) ||
        permissions.includes(`${mod}:list`) ||
        permissions.some((p) => p.startsWith(`${mod}:`))
      );
    }

    if (normAction === 'create' || normAction === 'add') {
      return (
        permissions.includes(`${mod}:create`) ||
        permissions.includes(`${mod}:add`) ||
        permissions.includes(`${mod}:manage`)
      );
    }

    if (normAction === 'edit' || normAction === 'update') {
      return (
        permissions.includes(`${mod}:edit`) ||
        permissions.includes(`${mod}:update`) ||
        permissions.includes(`${mod}:adjust`) ||
        permissions.includes(`${mod}:update_status`) ||
        permissions.includes(`${mod}:manage`)
      );
    }

    if (normAction === 'delete') {
      return (
        permissions.includes(`${mod}:delete`) ||
        permissions.includes(`${mod}:cancel`) ||
        permissions.includes(`${mod}:revoke`) ||
        permissions.includes(`${mod}:manage`)
      );
    }

    if (normAction === 'export') {
      return (
        permissions.includes(`${mod}:export`) ||
        permissions.includes(`${mod}:download`) ||
        permissions.includes(`${mod}:manage`)
      );
    }

    return permissions.includes(`${mod}:${normAction}`);
  }, [permissions]);

  // Route access verification
  const canAccessPage = useCallback((path: string): boolean => {
    if (currentRole === 'admin' || permissions.includes('*')) return true;

    const cleanPath = path.toLowerCase().replace(/\/$/, '');

    // Dashboard, Profile, and Security pages are fundamental account pages granted to all logged-in users from the start
    if (
      cleanPath === '' ||
      cleanPath === '/' ||
      cleanPath === '/admin' ||
      cleanPath === '/admin/dashboard' ||
      cleanPath === '/admin/profile' ||
      cleanPath.startsWith('/admin/profile') ||
      cleanPath === '/profile' ||
      cleanPath.startsWith('/profile') ||
      cleanPath === '/admin/security' ||
      cleanPath === '/admin/billing' ||
      cleanPath.startsWith('/admin/billing')
    ) {
      return true;
    }

    const mod = normalizeModuleName(path);
    if (mod === 'dashboard' || mod === 'profile') {
      return true;
    }

    return (
      permissions.includes(`pages:${mod}`) ||
      permissions.includes(`${mod}:read`) ||
      permissions.includes(`${mod}:view`) ||
      permissions.some((p) => p.startsWith(`${mod}:`))
    );
  }, [permissions]);

  return (
    <PermissionContext.Provider
      value={{
        permissions,
        role: currentRole,
        isLoading,
        hasPermission,
        can,
        canAccessPage,
        refreshPermissions,
        updateActivePermissions,
      }}
    >
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// Convenient PermissionGate component for declaratively guarding UI blocks
export const PermissionGate: React.FC<{
  permission?: string;
  action?: PermissionAction;
  module?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}> = ({ permission, action, module, fallback = null, children }) => {
  const { hasPermission, can } = usePermissions();

  let isAllowed = true;
  if (permission) {
    isAllowed = hasPermission(permission);
  } else if (action && module) {
    isAllowed = can(action, module);
  }

  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

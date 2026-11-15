import { MenuItem, PermissionItem } from '../../../types/ecommerce.types';

export interface MenuManagementProps {
  onMenuSelect?: (menu: MenuItem) => void;
}

export interface MenuFormData {
  name: string;
  path: string;
  icon: string;
  order: number;
  parentId: string | null;
  roles: string[];
  requiredPermission: string;
  isActive: boolean;
}

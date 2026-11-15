import { RoleItem, PermissionItem } from '../../../types/ecommerce.types';

export interface RoleManagementProps {
  onRoleSelect?: (role: RoleItem) => void;
}

export interface RoleCardProps {
  role: RoleItem;
  onEditPermissions: (role: RoleItem) => void;
}

export interface EditRolePermissionsModalProps {
  isOpen: boolean;
  role: RoleItem | null;
  permissions: PermissionItem[];
  selectedPermissions: string[];
  onTogglePermission: (code: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

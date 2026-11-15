import { PermissionItem, UserPermissionItem } from '../../../types/ecommerce.types';

export interface PermissionManagementProps {
  onPermissionSelect?: (permission: PermissionItem) => void;
}

export interface NewPermissionFormData {
  name: string;
  code: string;
  module: string;
  description: string;
}

export interface AssignUserPermissionModalProps {
  isOpen: boolean;
  user: UserPermissionItem | null;
  permissions: PermissionItem[];
  selectedPermissions: string[];
  onTogglePermission: (code: string) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

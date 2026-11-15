import { AuditLogItem } from '../../../types/ecommerce.types';

export interface AuditLogManagementProps {
  onLogSelect?: (log: AuditLogItem) => void;
}

export interface AuditLogFilterState {
  action: string;
  search: string;
}

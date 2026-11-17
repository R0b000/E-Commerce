import React from 'react';
import { Role } from 'auth-client/config/appConfig';
import { AutoCompleteSelect } from 'shared-components';

export interface RoleOption {
  key: Role;
  label: string;
  defaultPage: string;
}

export const ROLE_OPTIONS: RoleOption[] = [
  { key: 'admin', label: 'Super Admin', defaultPage: '/admin' },
  { key: 'manager', label: 'DepartMent Head', defaultPage: '/admin/inventory' },
  { key: 'support', label: 'HR', defaultPage: '/admin/customers' },
  { key: 'customer', label: 'Staff', defaultPage: '/admin' },
  { key: 'seller', label: 'Marketplace Seller', defaultPage: '/admin' },
];

interface RoleSwitcherSelectProps {
  currentRole: Role | string;
  onRoleSelect: (role: Role, defaultPage: string) => void;
  className?: string;
  showLabel?: boolean;
}

export const RoleSwitcherSelect: React.FC<RoleSwitcherSelectProps> = ({
  currentRole,
  onRoleSelect,
  className = '',
  showLabel = true,
}) => {
  const options = ROLE_OPTIONS.map((r) => ({
    value: r.key,
    label: r.label,
    defaultPage: r.defaultPage,
  }));

  const handleChange = (selectedVal: any) => {
    const roleOpt = ROLE_OPTIONS.find((r) => r.key === selectedVal) || ROLE_OPTIONS[0];
    onRoleSelect(roleOpt.key, roleOpt.defaultPage);
  };

  return (
    <AutoCompleteSelect
      options={options}
      value={currentRole}
      onChange={handleChange}
      label={showLabel ? 'Current role' : undefined}
      showLabel={showLabel}
      className={className}
      theme="amber"
    />
  );
};

export default RoleSwitcherSelect;
